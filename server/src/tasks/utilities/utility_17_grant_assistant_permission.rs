use std::collections::HashSet;

use chrono::Utc;
use salvo::async_trait;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set, TransactionTrait};
use uuid::{Uuid, uuid};

use crate::library::permissions::get_system_permissions;
use crate::middleware::rbac::{INSTITUTION_WIDE_POSITION_TYPE_IDS, UNIT_SCOPED_POSITION_TYPE_IDS};
use crate::models::auth::{permission, permission_position_type};
use crate::tasks::Task;

/// The route that answers questions about a student's data
const PERMISSION_NAME: &str = "ai.assistant.ask";

/// Position types of students and lecturers (same ids as `AREA_POSITION_TYPES` in
/// `utility_12_generate_permission_from_client.rs`). Staff and leadership positions come from the lists in `rbac.rs`,
/// the same lists `student_scope` uses to decide whom they may see. Administrator bypasses RBAC and needs no grant.
const STUDENT_AND_LECTURER_POSITION_TYPES: &[(Uuid, &str)] = &[
    (uuid!("5917531e-8e5d-4258-b2e7-0c5489fd63ff"), "Mahasiswa"),
    (uuid!("c6d210f8-79f7-4a5d-912a-76f2ea441fc2"), "Dosen"),
    (uuid!("4731c07d-1c2c-43bf-adb3-308a3b6f8be0"), "Dosen Pembimbing Akademik"),
];

pub struct GrantAssistantPermissionTask;

#[async_trait]
impl Task for GrantAssistantPermissionTask {
    fn name(&self) -> &str {
        "utility:grant-assistant-permission"
    }

    fn description(&self) -> &str {
        "Creates ai.assistant.ask if missing and grants it to students, lecturers, institution-wide staff and program heads; what each may see is still decided per student by the assistant (--dry-run to preview, --revoke to take it back)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let dry_run = args.iter().any(|a| a == "--dry-run" || a == "-n");
        let revoke = args.iter().any(|a| a == "--revoke");

        let now = Utc::now().naive_utc();
        let existing_permission = permission::Entity::find()
            .filter(permission::Column::Name.eq(PERMISSION_NAME))
            .filter(permission::Column::DeletedAt.is_null())
            .one(db)
            .await?;
        // Created here from its definition, so this task does not need a full `utility:sync-permissions` first
        let permission_row = match existing_permission {
            Some(row) => row,
            None if revoke => {
                println!("==> {PERMISSION_NAME} does not exist, nothing to revoke");
                return Ok(());
            }
            None => {
                let definition = get_system_permissions()
                    .into_iter()
                    .find(|d| d.name == PERMISSION_NAME)
                    .ok_or_else(|| format!("{PERMISSION_NAME} is not in library/permissions.rs"))?;
                println!("  [CREATE]    permission {} -> {}", definition.name, definition.uri);
                if dry_run {
                    // Nothing to attach grants to yet; report what would be granted and stop
                    println!("==> dry run: would then grant it to {} position type(s)", STUDENT_AND_LECTURER_POSITION_TYPES.len()
                        + INSTITUTION_WIDE_POSITION_TYPE_IDS.len() + UNIT_SCOPED_POSITION_TYPE_IDS.len());
                    return Ok(());
                }
                permission::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    name: Set(definition.name.to_string()),
                    uri: Set(Some(definition.uri.to_string())),
                    is_open: Set(definition.is_open),
                    created_at: Set(now),
                    updated_at: Set(now),
                    deleted_at: Set(None),
                    sync_at: Set(Some(now)),
                    created_by: Set(None),
                    updated_by: Set(None),
                }
                .insert(db)
                .await?
            }
        };

        let mut targets: Vec<Uuid> = STUDENT_AND_LECTURER_POSITION_TYPES.iter().map(|(id, _)| *id).collect();
        targets.extend_from_slice(INSTITUTION_WIDE_POSITION_TYPE_IDS);
        targets.extend_from_slice(UNIT_SCOPED_POSITION_TYPE_IDS);

        let txn = db.begin().await?;
        let existing = permission_position_type::Entity::find()
            .filter(permission_position_type::Column::PermissionId.eq(permission_row.id))
            .filter(permission_position_type::Column::DeletedAt.is_null())
            .all(&txn)
            .await?;
        let granted: HashSet<Uuid> = existing.iter().map(|row| row.position_type_id).collect();

        println!(
            "==> {} {PERMISSION_NAME} for {} position type(s){}",
            if revoke { "Revoking" } else { "Granting" },
            targets.len(),
            if dry_run { " (dry run)" } else { "" }
        );
        let (mut changed, mut unchanged) = (0, 0);
        if revoke {
            for row in existing.into_iter().filter(|row| targets.contains(&row.position_type_id)) {
                changed += 1;
                println!("  [REVOKE]    {}", row.position_type_id);
                if !dry_run {
                    let mut active: permission_position_type::ActiveModel = row.into();
                    active.deleted_at = Set(Some(now));
                    active.updated_at = Set(now);
                    active.update(&txn).await?;
                }
            }
        } else {
            for position_type_id in targets {
                if granted.contains(&position_type_id) {
                    unchanged += 1;
                    continue;
                }
                changed += 1;
                println!("  [GRANT]     {position_type_id}");
                if !dry_run {
                    permission_position_type::ActiveModel {
                        id: Set(Uuid::new_v4()),
                        permission_id: Set(permission_row.id),
                        position_type_id: Set(position_type_id),
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

        if dry_run {
            txn.rollback().await?;
        } else {
            txn.commit().await?;
        }
        println!("==> {changed} changed, {unchanged} already in place");
        Ok(())
    }
}
