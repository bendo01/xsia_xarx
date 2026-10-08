use std::collections::{HashMap, HashSet};

use chrono::Utc;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    QueryOrder, Set, TransactionTrait,
    sea_query::Expr,
};
use uuid::Uuid;

use crate::library::routes::get_system_routes;
use crate::middleware::rbac::registered_route_names;
use crate::models::auth::{permission, permission_position_type, permission_role};
use crate::tasks::Task;

pub struct GeneratePermissionFromRouteTask;

fn progress_bar(len: u64, prefix: &'static str) -> ProgressBar {
    let pb = ProgressBar::new(len);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{prefix:>8} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%) {msg}")
            .unwrap_or_else(|_| ProgressStyle::default_bar())
            .progress_chars("#>-"),
    );
    pb.set_prefix(prefix);
    pb
}

#[async_trait]
impl Task for GeneratePermissionFromRouteTask {
    fn name(&self) -> &str {
        "generate:permission-from-route"
    }

    fn description(&self) -> &str {
        "Upserts every named controller route into auth.permissions and deletes permissions no route uses (--dry-run to preview)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let dry_run = args.iter().any(|a| a == "--dry-run" || a == "-n");
        println!("==> Generating permissions from controller routes{}...", if dry_run { " (dry run)" } else { "" });

        // Building the routers registers every route name passed to `named()`
        let _ = crate::controllers::api_routers();
        let route_names = registered_route_names();
        if route_names.is_empty() {
            return Err("No named routes found; refusing to continue because every permission would be deleted".into());
        }

        // Route name -> uri, taken from the static route list (first entry wins, e.g. the collection path)
        let mut uris: HashMap<&str, String> = HashMap::new();
        for route in get_system_routes() {
            uris.entry(route.name).or_insert_with(|| route.url.trim_start_matches('/').to_string());
        }

        let now = Utc::now().naive_utc();
        let txn = db.begin().await?;

        let existing = permission::Entity::find()
            .filter(permission::Column::DeletedAt.is_null())
            .order_by_asc(permission::Column::CreatedAt)
            .all(&txn)
            .await?;

        // Keep the oldest row per name; later duplicates are treated as stale
        let mut by_name: HashMap<String, permission::Model> = HashMap::new();
        let mut stale: Vec<permission::Model> = Vec::new();
        for item in existing {
            if by_name.contains_key(&item.name) {
                stale.push(item);
            } else {
                by_name.insert(item.name.clone(), item);
            }
        }

        let mut created_count = 0;
        let mut updated_count = 0;
        let mut unchanged_count = 0;

        let pb = progress_bar(route_names.len() as u64, "Upsert");
        for name in &route_names {
            pb.set_message(name.to_string());
            pb.inc(1);
            let uri = uris.get(name).cloned();
            match by_name.remove(*name) {
                Some(item) => {
                    if uri.is_some() && item.uri != uri {
                        pb.println(format!("  [UPDATED]   {} -> {}", name, uri.as_deref().unwrap_or_default()));
                        updated_count += 1;
                        if !dry_run {
                            let mut active_model = item.into_active_model();
                            active_model.uri = Set(uri);
                            active_model.updated_at = Set(now);
                            active_model.sync_at = Set(Some(now));
                            active_model.update(&txn).await?;
                        }
                    } else {
                        unchanged_count += 1;
                    }
                }
                None => {
                    pb.println(format!("  [CREATED]   {}", name));
                    created_count += 1;
                    if !dry_run {
                        permission::ActiveModel {
                            id: Set(Uuid::new_v4()),
                            name: Set(name.to_string()),
                            uri: Set(uri),
                            is_open: Set(false),
                            created_at: Set(now),
                            updated_at: Set(now),
                            deleted_at: Set(None),
                            sync_at: Set(Some(now)),
                            created_by: Set(None),
                            updated_by: Set(None),
                        }
                        .insert(&txn)
                        .await?;
                    }
                }
            }
        }
        pb.finish_with_message("done");

        // Whatever is left matches no controller route. Wildcards ("*", "x.*") are grants, not routes, so keep them.
        stale.extend(by_name.into_values().filter(|p| !p.name.contains('*')));
        stale.sort_by(|a, b| a.name.cmp(&b.name));
        let stale_ids: Vec<Uuid> = stale.iter().map(|p| p.id).collect::<HashSet<_>>().into_iter().collect();
        let pb = progress_bar(stale_ids.len() as u64, "Delete");
        for item in &stale {
            pb.println(format!("  [DELETED]   {}", item.name));
        }

        let mut unlinked_count = 0;
        if !dry_run {
            for chunk in stale_ids.chunks(100) {
                permission::Entity::update_many()
                    .col_expr(permission::Column::DeletedAt, Expr::value(now))
                    .col_expr(permission::Column::UpdatedAt, Expr::value(now))
                    .filter(permission::Column::Id.is_in(chunk.to_vec()))
                    .exec(&txn)
                    .await?;

                // Soft-delete the role / position type grants so they can't come back with a restored permission
                unlinked_count += permission_role::Entity::update_many()
                    .col_expr(permission_role::Column::DeletedAt, Expr::value(now))
                    .col_expr(permission_role::Column::UpdatedAt, Expr::value(now))
                    .filter(permission_role::Column::PermissionId.is_in(chunk.to_vec()))
                    .filter(permission_role::Column::DeletedAt.is_null())
                    .exec(&txn)
                    .await?
                    .rows_affected;
                unlinked_count += permission_position_type::Entity::update_many()
                    .col_expr(permission_position_type::Column::DeletedAt, Expr::value(now))
                    .col_expr(permission_position_type::Column::UpdatedAt, Expr::value(now))
                    .filter(permission_position_type::Column::PermissionId.is_in(chunk.to_vec()))
                    .filter(permission_position_type::Column::DeletedAt.is_null())
                    .exec(&txn)
                    .await?
                    .rows_affected;
                pb.inc(chunk.len() as u64);
            }
            pb.set_message("committing...");
            txn.commit().await?;
        } else {
            pb.set_position(stale_ids.len() as u64);
            txn.rollback().await?;
        }
        pb.finish_with_message("done");

        println!("\n==> Permission generation {}!", if dry_run { "preview finished (nothing written)" } else { "completed" });
        println!("    Controller routes: {}", route_names.len());
        println!("    Created:           {}", created_count);
        println!("    Updated:           {}", updated_count);
        println!("    Unchanged:         {}", unchanged_count);
        println!("    Deleted:           {}", stale_ids.len());
        if !dry_run {
            println!("    Grants removed:    {}", unlinked_count);
        }

        Ok(())
    }
}
