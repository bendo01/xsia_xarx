use chrono::Utc;
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    QueryFilter, Set,
};
use uuid::Uuid;

use super::Task;
use crate::library::permissions::get_system_permissions;
use crate::models::auth::permission as entity_mod;

pub struct SyncPermissionsTask;

#[async_trait]
impl Task for SyncPermissionsTask {
    fn name(&self) -> &str {
        "sync_permissions"
    }

    fn description(&self) -> &str {
        "Synchronizes all predefined route permissions into the auth.permissions table"
    }

    async fn run(&self, db: &DatabaseConnection, _args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("==> Starting Permission Synchronization...");
        let definitions = get_system_permissions();
        let now = Utc::now().naive_utc();
        let mut created_count = 0;
        let mut updated_count = 0;
        let mut unchanged_count = 0;

        for def in &definitions {
            let existing = entity_mod::Entity::find()
                .filter(entity_mod::Column::Name.eq(def.name))
                .filter(entity_mod::Column::DeletedAt.is_null())
                .one(db)
                .await?;

            if let Some(item) = existing {
                let mut active_model = item.into_active_model();
                let mut needs_update = false;

                if active_model.uri.as_ref() != &Some(def.uri.to_string()) {
                    active_model.uri = Set(Some(def.uri.to_string()));
                    needs_update = true;
                }

                if active_model.is_open.as_ref() != &def.is_open {
                    active_model.is_open = Set(def.is_open);
                    needs_update = true;
                }

                if needs_update {
                    active_model.updated_at = Set(now);
                    active_model.sync_at = Set(Some(now));
                    active_model.update(db).await?;
                    println!("  [UPDATED]   {} -> {}", def.name, def.uri);
                    updated_count += 1;
                } else {
                    unchanged_count += 1;
                }
            } else {
                let active_model = entity_mod::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    name: Set(def.name.to_string()),
                    uri: Set(Some(def.uri.to_string())),
                    is_open: Set(def.is_open),
                    created_at: Set(now),
                    updated_at: Set(now),
                    deleted_at: Set(None),
                    sync_at: Set(Some(now)),
                    created_by: Set(None),
                    updated_by: Set(None),
                };

                active_model.insert(db).await?;
                println!("  [CREATED]   {} -> {}", def.name, def.uri);
                created_count += 1;
            }
        }

        println!("==> Permission Sync Completed!");
        println!(
            "    Total: {}, Created: {}, Updated: {}, Unchanged: {}",
            definitions.len(),
            created_count,
            updated_count,
            unchanged_count
        );

        Ok(())
    }
}
