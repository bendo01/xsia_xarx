use salvo::prelude::*;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::middleware::auth::auth_user_id;
use crate::middleware::rbac::is_administrator;
use crate::models::auth::{role, user};

/// Who may see which intake logs.
///
/// * `None`: the active role is an administrator, so every log is visible.
/// * `Some(individual_id)`: anyone else (e.g. a student) only sees their own logs.
///
/// `RbacGuard` stores the active role in the depot, so this must only be used on routes
/// registered with `*_named`.
pub async fn owner_scope(
    depot: &Depot,
    db: &DatabaseConnection,
) -> Result<Option<Uuid>, StatusError> {
    if let Ok(active_role) = depot.get::<role::Model>("active_role")
        && is_administrator(active_role)
    {
        return Ok(None);
    }

    let user_id = auth_user_id(depot)
        .ok_or_else(|| StatusError::unauthorized().brief("Missing authenticated user"))?;
    let current_user = user::Entity::find_by_id(user_id)
        .filter(user::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::unauthorized().brief("User not found"))?;

    if current_user.individual_id.is_nil() {
        return Err(StatusError::forbidden().brief("User is not linked to an individual"));
    }
    Ok(Some(current_user.individual_id))
}
