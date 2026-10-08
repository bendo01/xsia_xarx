use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DbErr, EntityTrait, IntoActiveModel, QueryFilter,
    QueryOrder, Set,
    sea_query::Expr,
};
use uuid::Uuid;

use crate::models::auth::{role, user};
use crate::models::institution::master::{employees, staffes};
use crate::models::institution::reference::position_type;

/// `roles.roleable_type` value for roles owned by a staff appointment
pub const STAFF_ROLEABLE_TYPE: &str = "App\\Models\\Institution\\Master\\Staff";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StaffRoleOutcome {
    Created,
    Updated,
    Unchanged,
    Revoked,
    /// No role is wanted and none existed (no user, no position type, appointment ended or deleted)
    Skipped,
}

/// Makes the staff's role match the appointment: a staff record whose employee has a user account,
/// a position type and a current term (no end_date, or end_date today or later) owns exactly one role
/// with that position type. Otherwise its roles are soft-deleted.
pub async fn sync_staff_role<C: ConnectionTrait>(
    db: &C,
    staff: &staffes::Model,
    actor: Option<Uuid>,
) -> Result<StaffRoleOutcome, DbErr> {
    let now = Utc::now().naive_utc();
    let today = now.date();

    let existing_roles = role::Entity::find()
        .filter(role::Column::RoleableType.eq(STAFF_ROLEABLE_TYPE))
        .filter(role::Column::RoleableId.eq(staff.id))
        .filter(role::Column::DeletedAt.is_null())
        .order_by_asc(role::Column::CreatedAt)
        .all(db)
        .await?;

    let is_current = staff.deleted_at.is_none() && staff.end_date.is_none_or(|end| end >= today);

    let position_type = match staff.position_type_id.filter(|_| is_current) {
        Some(position_type_id) => position_type::Entity::find_by_id(position_type_id)
            .filter(position_type::Column::DeletedAt.is_null())
            .one(db)
            .await?,
        None => None,
    };

    let owner = match position_type {
        Some(_) => find_staff_user(db, staff.employee_id).await?,
        None => None,
    };

    let (Some(position_type), Some(owner)) = (position_type, owner) else {
        return if revoke_roles(db, &existing_roles, actor).await? {
            Ok(StaffRoleOutcome::Revoked)
        } else {
            Ok(StaffRoleOutcome::Skipped)
        };
    };

    let mut roles = existing_roles.into_iter();
    let outcome = match roles.next() {
        Some(current) => {
            let position_changed = current.position_type_id != Some(position_type.id);
            if position_changed || current.user_id != Some(owner.id) {
                let mut active_model = current.into_active_model();
                if position_changed {
                    active_model.name = Set(position_type.name.clone());
                    active_model.position_type_id = Set(Some(position_type.id));
                }
                active_model.user_id = Set(Some(owner.id));
                active_model.updated_at = Set(now);
                active_model.updated_by = Set(actor);
                active_model.update(db).await?;
                StaffRoleOutcome::Updated
            } else {
                StaffRoleOutcome::Unchanged
            }
        }
        None => {
            role::ActiveModel {
                id: Set(Uuid::new_v4()),
                name: Set(position_type.name.clone()),
                user_id: Set(Some(owner.id)),
                position_type_id: Set(Some(position_type.id)),
                roleable_id: Set(Some(staff.id)),
                roleable_type: Set(Some(STAFF_ROLEABLE_TYPE.to_string())),
                created_at: Set(now),
                updated_at: Set(now),
                deleted_at: Set(None),
                sync_at: Set(None),
                created_by: Set(actor),
                updated_by: Set(actor),
            }
            .insert(db)
            .await?;
            StaffRoleOutcome::Created
        }
    };

    // One role per appointment: drop duplicates left by older imports
    let duplicates: Vec<role::Model> = roles.collect();
    if revoke_roles(db, &duplicates, actor).await? && outcome == StaffRoleOutcome::Unchanged {
        return Ok(StaffRoleOutcome::Updated);
    }

    Ok(outcome)
}

/// Oldest active user account of the staff's employee
async fn find_staff_user<C: ConnectionTrait>(db: &C, employee_id: Uuid) -> Result<Option<user::Model>, DbErr> {
    let Some(employee) = employees::Entity::find_by_id(employee_id)
        .filter(employees::Column::DeletedAt.is_null())
        .one(db)
        .await?
    else {
        return Ok(None);
    };

    user::Entity::find()
        .filter(user::Column::IndividualId.eq(employee.individual_id))
        .filter(user::Column::DeletedAt.is_null())
        .order_by_asc(user::Column::CreatedAt)
        .one(db)
        .await
}

/// Soft-deletes the roles and unsets them as anyone's active role. Returns whether anything changed.
async fn revoke_roles<C: ConnectionTrait>(db: &C, roles: &[role::Model], actor: Option<Uuid>) -> Result<bool, DbErr> {
    if roles.is_empty() {
        return Ok(false);
    }
    let now = Utc::now().naive_utc();
    let ids: Vec<Uuid> = roles.iter().map(|r| r.id).collect();

    role::Entity::update_many()
        .col_expr(role::Column::DeletedAt, Expr::value(now))
        .col_expr(role::Column::UpdatedAt, Expr::value(now))
        .col_expr(role::Column::UpdatedBy, Expr::value(actor))
        .filter(role::Column::Id.is_in(ids.clone()))
        .exec(db)
        .await?;

    user::Entity::update_many()
        .col_expr(user::Column::CurrentRoleId, Expr::value(Option::<Uuid>::None))
        .filter(user::Column::CurrentRoleId.is_in(ids))
        .exec(db)
        .await?;

    Ok(true)
}
