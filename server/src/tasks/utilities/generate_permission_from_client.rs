use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::path::PathBuf;
use std::process::Command;

use chrono::Utc;
use salvo::http::Method;
use salvo::prelude::*;
use salvo::routing::PathState;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
    TransactionTrait, sea_query::Expr,
};
use serde::Deserialize;
use uuid::{Uuid, uuid};

use crate::middleware::rbac::ADMINISTRATOR_POSITION_TYPE_ID;
use crate::models::auth::{permission, permission_position_type};
use crate::tasks::Task;

/// Client area folder (client/src/routes/<area>) -> position types whose users work in that area.
/// Mirrors `normalizeRoleName` in client/src/lib/authStore.ts. Administrator is absent: it bypasses RBAC.
const AREA_POSITION_TYPES: &[(&str, &[(Uuid, &str)])] = &[
    (
        "student",
        &[(uuid!("5917531e-8e5d-4258-b2e7-0c5489fd63ff"), "Mahasiswa")],
    ),
    (
        "candidate",
        &[
            (
                uuid!("6ca078ac-fb8d-41af-a6b0-781277de1c48"),
                "Kandidat Mahasiswa",
            ),
            (uuid!("7955f330-3b26-4d38-b6ec-49dc4d320f16"), "Panitia PMB"),
            (
                uuid!("019c51cb-e19b-7f34-9f62-81579a0e891c"),
                "Anggota Lembaga Penerimaan Mahasiswa Baru",
            ),
            (
                uuid!("019c51ca-0e63-787d-9b1a-0296ebff739f"),
                "Ketua Lembaga Penerimaan Mahasiswa Baru",
            ),
        ],
    ),
    (
        "lecturer",
        &[
            (uuid!("c6d210f8-79f7-4a5d-912a-76f2ea441fc2"), "Dosen"),
            (
                uuid!("4731c07d-1c2c-43bf-adb3-308a3b6f8be0"),
                "Dosen Pembimbing Akademik",
            ),
        ],
    ),
    (
        "course-department",
        &[
            (
                uuid!("b3ad82b8-520b-4b77-8cca-b487bf77a91c"),
                "Kepala Program Studi",
            ),
            (
                uuid!("948b725e-675d-4497-acfd-67f11430d04a"),
                "Sekertaris Program Studi",
            ),
            (
                uuid!("72f230bc-0bb2-40ee-810c-dfa2a1e94503"),
                "Staff Program Studi",
            ),
        ],
    ),
    (
        "rectorat",
        &[
            (uuid!("e34401db-84ec-450b-bdba-6b9640fc3ae8"), "Rektor"),
            (
                uuid!("5d2ad780-d6fe-4638-bffa-e541ff6266fe"),
                "Wakil Rektor I Akademik",
            ),
            (
                uuid!("56213ba4-a787-4af2-ac41-8e20af88dd5f"),
                "Wakil Rektor II Keuangan",
            ),
            (
                uuid!("c2b6243d-baf2-4b06-b6ed-f164c8f94361"),
                "Wakil Rektor III Kemahasiswaan",
            ),
            (
                uuid!("46dac70b-b161-46d0-861c-7c663764655e"),
                "Sekertaris Rektor",
            ),
            (uuid!("fad3e789-ff39-4a9a-b8f9-ea5040114729"), "Dekan"),
            (
                uuid!("c524a5fe-f2d7-4763-9201-1494a21ae3cb"),
                "Wakil Dekan 1 Akademik",
            ),
            (
                uuid!("898a7b11-4ed2-4853-8f9b-b8e33009eb9e"),
                "Wakil Dekan 2 Keuangan",
            ),
            (
                uuid!("1692d7a7-6a1a-49df-b241-c950ba100aa3"),
                "Wakil Dekan 3 Kemahasiswaan",
            ),
            (
                uuid!("e7e8c2b9-4e40-4a89-a6c3-587b17515454"),
                "Tata Usaha Fakultas",
            ),
            (
                uuid!("7feb6942-1bc9-46ce-a257-4f7363b9b3b4"),
                "Ketua Yayasan",
            ),
            (
                uuid!("909a05e0-46fc-4b91-b35e-817bd97a1c0d"),
                "Wakil Ketua Yayasan",
            ),
            (
                uuid!("b3000c11-caf2-4a16-82d4-1907442bd089"),
                "Kepala Biro Administrasi Akademik dan Kemahasiswaan",
            ),
            (
                uuid!("4c121c70-0e97-41af-a0f1-d2ad0ac963ac"),
                "Staff Biro Administrasi Akademik dan Kemahasiswaan",
            ),
            (
                uuid!("b92fb48d-53c6-4219-a826-432bdae23ae5"),
                "Kepala Biro Administrasi Umum",
            ),
            (
                uuid!("911e30fd-9fdd-4898-b499-547bc4cbad28"),
                "Staff Biro Administrasi Umum",
            ),
            (
                uuid!("555f528f-aaeb-4275-8b66-23b0ce893bc5"),
                "Kepala Biro Administrasi Keuangan",
            ),
            (
                uuid!("55ac61de-488c-4be1-a159-0302e6c6e946"),
                "Staff Administrasi Keuangan",
            ),
            (uuid!("ffe850e7-5a54-412a-8bdf-1940fc958f08"), "Kepala PDPT"),
            (
                uuid!("d7208431-ba92-4c75-855c-3f8ab651646f"),
                "Kepala Pengembangan Teknologi Informasi",
            ),
            (
                uuid!("5a528d44-0e91-42a2-9836-0a38648c9246"),
                "Staff Pengembangan Teknologi Informasi",
            ),
        ],
    ),
];

/// Areas every signed-in user passes through (root layout, /, /404, login pages)
const SHARED_AREAS: &[&str] = &["_shared", "authentification"];

#[derive(Deserialize)]
struct ApiUsage {
    areas: BTreeMap<String, AreaUsage>,
}

#[derive(Deserialize)]
struct AreaUsage {
    requests: Vec<ClientRequest>,
    #[serde(default)]
    unresolved: Vec<serde::de::IgnoredAny>,
}

#[derive(Deserialize)]
struct ClientRequest {
    method: String,
    path: String,
    sources: Vec<String>,
}

enum RouteLookup {
    /// No server route answers this method + path
    NotFound,
    /// Routed, but the route has no name and therefore no RBAC check
    Unguarded,
    Named(&'static str),
}

/// Resolve a client call the same way a live request is routed: detect the route in the real router, then run
/// only its hoops so `RouteName` records the name ("{}" placeholders become a UUID; handlers never execute).
async fn lookup_route(router: &Router, method: &str, path: &str) -> RouteLookup {
    let Ok(method) = Method::from_bytes(method.as_bytes()) else {
        return RouteLookup::NotFound;
    };
    let Ok(uri) = format!(
        "http://localhost/api/v1/{}",
        path.replace("{}", &Uuid::nil().to_string())
    )
    .parse() else {
        return RouteLookup::NotFound;
    };
    let mut req = Request::new();
    *req.method_mut() = method;
    *req.uri_mut() = uri;
    let mut path_state = PathState::from_owned_path(req.uri().path().to_owned());
    let Some(matched) = router.detect(&mut req, &mut path_state).await else {
        return RouteLookup::NotFound;
    };
    // RbacGuard stops the chain right after RouteName because no database is in the depot
    let mut depot = Depot::new();
    let mut res = Response::new();
    FlowCtrl::new(matched.hoops)
        .call_next(&mut req, &mut depot, &mut res)
        .await;
    match depot.get::<&'static str>("route_name") {
        Ok(name) => RouteLookup::Named(name),
        Err(_) => RouteLookup::Unguarded,
    }
}

fn load_usage(args: &[String]) -> Result<ApiUsage, Box<dyn std::error::Error>> {
    let flag = |name: &str| {
        args.iter()
            .position(|a| a == name)
            .and_then(|i| args.get(i + 1))
            .cloned()
    };
    let json = if let Some(input) = flag("--input") {
        println!("==> Reading client API usage from {}", input);
        std::fs::read_to_string(input)?
    } else {
        let client_dir = PathBuf::from(flag("--client").unwrap_or_else(|| "../client".to_string()));
        let script = client_dir.join("scripts/extract-api-usage.mjs");
        println!("==> Tracing client API usage with {}", script.display());
        let output = Command::new("node")
            .arg(&script)
            .current_dir(&client_dir)
            .output()?;
        if !output.status.success() {
            return Err(format!(
                "extract-api-usage.mjs failed: {}",
                String::from_utf8_lossy(&output.stderr)
            )
            .into());
        }
        String::from_utf8(output.stdout)?
    };
    Ok(serde_json::from_str(&json)?)
}

pub struct GeneratePermissionFromClientTask;

#[async_trait]
impl Task for GeneratePermissionFromClientTask {
    fn name(&self) -> &str {
        "generate:permission-from-client"
    }

    fn description(&self) -> &str {
        "Grants each position type the permissions its client area (client/src/routes/<area>) requests \
         (--dry-run to preview, --prune to revoke grants the client no longer needs, --area <name> to limit to one area, \
         --input <json> / --client <dir>)"
    }

    async fn run(
        &self,
        db: &DatabaseConnection,
        args: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        let dry_run = args.iter().any(|a| a == "--dry-run" || a == "-n");
        let prune = args.iter().any(|a| a == "--prune");
        let only_area = args
            .iter()
            .position(|a| a == "--area")
            .and_then(|i| args.get(i + 1))
            .map(String::as_str);
        if let Some(area) = only_area
            && !AREA_POSITION_TYPES.iter().any(|(a, _)| *a == area)
        {
            return Err(format!("unknown --area {}", area).into());
        }
        let usage = load_usage(args)?;

        let router = Router::with_path("api/v1").append(&mut crate::controllers::api_routers());

        // Route names each area needs
        let mut area_names: BTreeMap<&str, BTreeSet<&'static str>> = BTreeMap::new();
        let mut unmatched: BTreeSet<String> = BTreeSet::new();
        for (area, area_usage) in &usage.areas {
            if only_area.is_some_and(|only| only != area && !SHARED_AREAS.contains(&area.as_str())) {
                continue;
            }
            if !area_usage.unresolved.is_empty() && area != "administrator" {
                println!(
                    "  [WARN]      {}: {} fetch call(s) could not be traced, see extract-api-usage.mjs output",
                    area,
                    area_usage.unresolved.len()
                );
            }
            let names = area_names.entry(area.as_str()).or_default();
            for req in &area_usage.requests {
                match lookup_route(&router, &req.method, &req.path).await {
                    RouteLookup::Named(name) => {
                        names.insert(name);
                    }
                    RouteLookup::Unguarded => {}
                    RouteLookup::NotFound if area != "administrator" => {
                        unmatched.insert(format!(
                            "{} {} ({})",
                            req.method,
                            req.path,
                            req.sources.first().map(String::as_str).unwrap_or("?")
                        ));
                    }
                    RouteLookup::NotFound => {}
                }
            }
        }

        let shared: BTreeSet<&'static str> = SHARED_AREAS
            .iter()
            .filter_map(|a| area_names.get(a))
            .flatten()
            .copied()
            .collect();

        // Position type -> required permission names
        let mut wanted: BTreeMap<Uuid, (&str, BTreeSet<&'static str>)> = BTreeMap::new();
        for (area, position_types) in AREA_POSITION_TYPES {
            if only_area.is_some_and(|only| only != *area) {
                continue;
            }
            let names: BTreeSet<&'static str> = area_names
                .get(area)
                .into_iter()
                .flatten()
                .chain(&shared)
                .copied()
                .collect();
            println!(
                "  [AREA]      {:<18} {} permission(s) -> {} position type(s)",
                area,
                names.len(),
                position_types.len()
            );
            for (id, label) in *position_types {
                debug_assert_ne!(*id, ADMINISTRATOR_POSITION_TYPE_ID);
                wanted
                    .entry(*id)
                    .or_insert_with(|| (label, BTreeSet::new()))
                    .1
                    .extend(names.iter().copied());
            }
        }

        let now = Utc::now().naive_utc();
        let txn = db.begin().await?;

        let permissions: HashMap<String, Uuid> = permission::Entity::find()
            .filter(permission::Column::DeletedAt.is_null())
            .all(&txn)
            .await?
            .into_iter()
            .map(|p| (p.name, p.id))
            .collect();
        let permission_names: HashMap<Uuid, &str> = permissions
            .iter()
            .map(|(n, id)| (*id, n.as_str()))
            .collect();

        let position_type_ids: Vec<Uuid> = wanted.keys().copied().collect();
        let existing = permission_position_type::Entity::find()
            .filter(permission_position_type::Column::PositionTypeId.is_in(position_type_ids))
            .filter(permission_position_type::Column::DeletedAt.is_null())
            .all(&txn)
            .await?;
        let mut granted: HashMap<(Uuid, Uuid), Uuid> = HashMap::new();
        for row in existing {
            granted.insert((row.position_type_id, row.permission_id), row.id);
        }

        let mut missing_permissions: BTreeSet<&str> = BTreeSet::new();
        let mut created_count = 0;
        let mut kept_count = 0;
        let mut revoke: Vec<Uuid> = Vec::new();

        for (position_type_id, (label, names)) in &wanted {
            let mut created_here = 0;
            let mut wanted_ids: HashSet<Uuid> = HashSet::new();
            for name in names {
                let Some(permission_id) = permissions.get(*name) else {
                    missing_permissions.insert(name);
                    continue;
                };
                wanted_ids.insert(*permission_id);
                if granted.contains_key(&(*position_type_id, *permission_id)) {
                    kept_count += 1;
                    continue;
                }
                created_here += 1;
                if !dry_run {
                    permission_position_type::ActiveModel {
                        id: Set(Uuid::new_v4()),
                        permission_id: Set(*permission_id),
                        position_type_id: Set(*position_type_id),
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
            created_count += created_here;

            let mut extra: Vec<&str> = Vec::new();
            for ((pt, permission_id), row_id) in &granted {
                if pt == position_type_id && !wanted_ids.contains(permission_id) {
                    extra.push(permission_names.get(permission_id).copied().unwrap_or("?"));
                    if prune {
                        revoke.push(*row_id);
                    }
                }
            }
            extra.sort_unstable();
            println!(
                "  [GRANT]     {:<52} +{:<4} {} unused by client{}",
                label,
                created_here,
                extra.len(),
                if prune && !extra.is_empty() {
                    " (revoked)"
                } else {
                    ""
                }
            );
        }

        if prune && !dry_run {
            for chunk in revoke.chunks(100) {
                permission_position_type::Entity::update_many()
                    .col_expr(
                        permission_position_type::Column::DeletedAt,
                        Expr::value(now),
                    )
                    .col_expr(
                        permission_position_type::Column::UpdatedAt,
                        Expr::value(now),
                    )
                    .filter(permission_position_type::Column::Id.is_in(chunk.to_vec()))
                    .exec(&txn)
                    .await?;
            }
        }

        for name in &missing_permissions {
            println!(
                "  [MISSING]   {} has no auth.permissions row; run generate:permission-from-route first",
                name
            );
        }
        for call in &unmatched {
            println!("  [NO ROUTE]  {}", call);
        }

        if dry_run {
            txn.rollback().await?;
        } else {
            txn.commit().await?;
        }

        println!(
            "\n==> Client permission generation {}!",
            if dry_run {
                "preview finished (nothing written)"
            } else {
                "completed"
            }
        );
        println!("    Position types:    {}", wanted.len());
        println!("    Grants created:    {}", created_count);
        println!("    Grants kept:       {}", kept_count);
        println!(
            "    Grants revoked:    {}",
            if prune { revoke.len() } else { 0 }
        );
        println!("    Missing perms:     {}", missing_permissions.len());
        println!("    Unmatched calls:   {}", unmatched.len());

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::middleware::rbac::NamedRouterExt;

    #[handler]
    async fn noop() {}

    fn router() -> Router {
        Router::with_path("api/v1").push(
            Router::with_path("things")
                .push(Router::with_path("options").post_named("test.things.option_select", noop))
                .push(Router::with_path("{id}").get_named("test.things.show", noop))
                .push(Router::with_path("open").get(noop)),
        )
    }

    #[tokio::test]
    async fn resolves_route_names_like_a_live_request() {
        let router = router();
        assert!(matches!(
            lookup_route(&router, "POST", "things/options").await,
            RouteLookup::Named("test.things.option_select")
        ));
        assert!(matches!(
            lookup_route(&router, "GET", "things/{}").await,
            RouteLookup::Named("test.things.show")
        ));
        assert!(matches!(
            lookup_route(&router, "DELETE", "things/{}").await,
            RouteLookup::NotFound
        ));
        assert!(matches!(
            lookup_route(&router, "GET", "missing").await,
            RouteLookup::NotFound
        ));
    }
}
