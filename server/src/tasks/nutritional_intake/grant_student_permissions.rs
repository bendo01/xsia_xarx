use chrono::Utc;
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    QueryOrder, Set, TransactionTrait,
};
use uuid::Uuid;

use crate::models::auth::{permission, permission_position_type};
use crate::models::institution::reference::position_type;
use crate::tasks::Task;

const STUDENT_POSITION_TYPE: &str = "Mahasiswa";

/// Route names a student needs to keep a food diary.
/// `intake_log` is scoped to the caller's own individual by the controller;
/// the rest is read-only lookup data.
const STUDENT_ROUTES: &[&str] = &[
    "person.nutritional_intake.intake_log.index",
    "person.nutritional_intake.intake_log.show",
    "person.nutritional_intake.intake_log.store",
    "person.nutritional_intake.intake_log.update",
    "person.nutritional_intake.intake_log.delete",
    "person.nutritional_intake.intake_log.recalculate",
    "person.nutritional_intake.intake_log_item.index",
    "person.nutritional_intake.intake_log_item.show",
    "person.nutritional_intake.food.index",
    "person.nutritional_intake.food.show",
    "person.nutritional_intake.food.option_select",
    "person.nutritional_intake.nutrient.index",
];

pub struct GrantStudentPermissionsTask;

#[async_trait]
impl Task for GrantStudentPermissionsTask {
    fn name(&self) -> &str {
        "nutritional-intake:grant-student-permissions"
    }

    fn description(&self) -> &str {
        "Lets the Mahasiswa position type record its own nutritional intake logs (--dry-run to preview). Idempotent."
    }

    async fn run(
        &self,
        db: &DatabaseConnection,
        args: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        let dry_run = args.iter().any(|a| a == "--dry-run" || a == "-n");
        let now = Utc::now().naive_utc();

        let student = position_type::Entity::find()
            .filter(position_type::Column::Name.eq(STUDENT_POSITION_TYPE))
            .filter(position_type::Column::DeletedAt.is_null())
            .one(db)
            .await?
            .ok_or_else(|| format!("position type '{STUDENT_POSITION_TYPE}' not found"))?;

        let txn = db.begin().await?;
        let (mut created_perm, mut created_grant, mut restored, mut unchanged) = (0, 0, 0, 0);

        for name in STUDENT_ROUTES {
            let permission_id = match permission::Entity::find()
                .filter(permission::Column::Name.eq(*name))
                .filter(permission::Column::DeletedAt.is_null())
                .order_by_asc(permission::Column::CreatedAt)
                .one(&txn)
                .await?
            {
                Some(p) => p.id,
                None => {
                    // `utility:generate-permission-from-route` keeps rows it finds by name
                    created_perm += 1;
                    let id = Uuid::new_v4();
                    permission::ActiveModel {
                        id: Set(id),
                        name: Set((*name).to_string()),
                        uri: Set(None),
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
                    id
                }
            };

            let grant = permission_position_type::Entity::find()
                .filter(permission_position_type::Column::PermissionId.eq(permission_id))
                .filter(permission_position_type::Column::PositionTypeId.eq(student.id))
                .one(&txn)
                .await?;

            match grant {
                Some(g) if g.deleted_at.is_none() => unchanged += 1,
                Some(g) => {
                    restored += 1;
                    let mut active = g.into_active_model();
                    active.deleted_at = Set(None);
                    active.updated_at = Set(now);
                    active.update(&txn).await?;
                }
                None => {
                    created_grant += 1;
                    permission_position_type::ActiveModel {
                        id: Set(Uuid::new_v4()),
                        permission_id: Set(permission_id),
                        position_type_id: Set(student.id),
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
        println!(
            "{}Mahasiswa grants: {created_grant} created, {restored} restored, {unchanged} unchanged; {created_perm} permission rows created",
            if dry_run { "[dry run, nothing written] " } else { "" }
        );
        Ok(())
    }
}
