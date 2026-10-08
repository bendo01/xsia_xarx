use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, QuerySelect, TransactionTrait};

use crate::models::auth::role;
use crate::models::institution::master::staffes;
use crate::services::auth::staff_role::{STAFF_ROLEABLE_TYPE, StaffRoleOutcome, sync_staff_role};
use crate::tasks::Task;

pub struct SyncStaffRolesTask;

#[async_trait]
impl Task for SyncStaffRolesTask {
    fn name(&self) -> &str {
        "sync:staff-roles"
    }

    fn description(&self) -> &str {
        "Gives every current staff appointment with a position type and a user account a role, and revokes the rest (--dry-run to preview)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let dry_run = args.iter().any(|a| a == "--dry-run" || a == "-n");
        println!("==> Synchronizing staff roles{}...", if dry_run { " (dry run)" } else { "" });

        // Active staff, plus deleted staff that still own a role (those roles must be revoked)
        let role_owner_ids: Vec<uuid::Uuid> = role::Entity::find()
            .select_only()
            .column(role::Column::RoleableId)
            .filter(role::Column::RoleableType.eq(STAFF_ROLEABLE_TYPE))
            .filter(role::Column::DeletedAt.is_null())
            .into_tuple::<Option<uuid::Uuid>>()
            .all(db)
            .await?
            .into_iter()
            .flatten()
            .collect();

        let staff_list = staffes::Entity::find()
            .filter(
                Condition::any()
                    .add(staffes::Column::DeletedAt.is_null())
                    .add(staffes::Column::Id.is_in(role_owner_ids)),
            )
            .all(db)
            .await?;

        let pb = ProgressBar::new(staff_list.len() as u64);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("[{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%) {msg}")
                .unwrap_or_else(|_| ProgressStyle::default_bar())
                .progress_chars("#>-"),
        );

        let txn = db.begin().await?;
        let (mut created, mut updated, mut unchanged, mut revoked, mut skipped) = (0, 0, 0, 0, 0);

        for staff in &staff_list {
            let label = staff.name.clone().or_else(|| staff.code.clone()).unwrap_or_else(|| staff.id.to_string());
            pb.set_message(label.clone());
            match sync_staff_role(&txn, staff, None).await? {
                StaffRoleOutcome::Created => {
                    pb.println(format!("  [CREATED]   {}", label));
                    created += 1;
                }
                StaffRoleOutcome::Updated => {
                    pb.println(format!("  [UPDATED]   {}", label));
                    updated += 1;
                }
                StaffRoleOutcome::Revoked => {
                    pb.println(format!("  [REVOKED]   {}", label));
                    revoked += 1;
                }
                StaffRoleOutcome::Unchanged => unchanged += 1,
                StaffRoleOutcome::Skipped => skipped += 1,
            }
            pb.inc(1);
        }

        if dry_run {
            txn.rollback().await?;
        } else {
            pb.set_message("committing...");
            txn.commit().await?;
        }
        pb.finish_with_message("done");

        println!("\n==> Staff role sync {}!", if dry_run { "preview finished (nothing written)" } else { "completed" });
        println!("    Staff checked: {}", staff_list.len());
        println!("    Created:       {}", created);
        println!("    Updated:       {}", updated);
        println!("    Unchanged:     {}", unchanged);
        println!("    Revoked:       {}", revoked);
        println!("    Skipped:       {} (no user, no position type, or term ended)", skipped);

        Ok(())
    }
}
