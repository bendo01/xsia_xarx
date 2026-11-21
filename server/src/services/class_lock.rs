//! The teaching-class lock (`teaches.is_lock`).
//!
//! The study program locks a class to freeze it: no more enrollment or drops, no grade, component
//! or attendance changes, no edits to the class itself. The flag used to be stored but never
//! checked, so only the new web app honoured it. Checking it here covers every client.
//!
//! Administrators bypass the lock (they can unlock it anyway); everyone else is refused with 409.
//! A lecturer *finalising* grades (`is_lock: true` on a student's course row) is not a content
//! change and stays allowed, see `detail_activities::update`.

use salvo::prelude::*;
use sea_orm::{ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::models::academic::campaign::transaction::teaches;
use crate::models::academic::student::campaign::detail_activities;
use crate::services::auth::data_scope::DataScope;

const LOCKED_BRIEF: &str = "Class is locked";

/// Does a lock stop this caller? (Pure, so the rule is unit-tested.)
pub fn lock_blocks(scope: &DataScope, is_lock: Option<bool>) -> bool {
    is_lock.unwrap_or(false) && !matches!(scope, DataScope::All)
}

fn internal(e: sea_orm::DbErr) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

pub fn locked_error() -> StatusError {
    StatusError::conflict().brief(LOCKED_BRIEF)
}

/// Refuses (409) when the class is locked. `None` (a course row without a class) is fine.
pub async fn ensure_teach_open<C: ConnectionTrait>(db: &C, scope: &DataScope, teach_id: Option<Uuid>) -> Result<(), StatusError> {
    let Some(teach_id) = teach_id else { return Ok(()) };
    let teach = teaches::Entity::find_by_id(teach_id)
        .filter(teaches::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?;
    match teach {
        Some(t) if lock_blocks(scope, t.is_lock) => Err(locked_error()),
        _ => Ok(()),
    }
}

/// Same, for a student's course row (its class is the row's `teach_id`).
pub async fn ensure_detail_activity_open<C: ConnectionTrait>(db: &C, scope: &DataScope, detail_activity_id: Uuid) -> Result<(), StatusError> {
    let row = detail_activities::Entity::find_by_id(detail_activity_id)
        .filter(detail_activities::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?;
    ensure_teach_open(db, scope, row.and_then(|r| r.teach_id)).await
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;

    #[test]
    fn an_open_class_blocks_nobody() {
        for scope in [DataScope::All, DataScope::Units(HashSet::new()), DataScope::Student(Uuid::nil()), DataScope::Lecturer(Uuid::nil())] {
            assert!(!lock_blocks(&scope, Some(false)));
            assert!(!lock_blocks(&scope, None));
        }
    }

    #[test]
    fn a_locked_class_blocks_everyone_but_administrators() {
        assert!(!lock_blocks(&DataScope::All, Some(true)));
        assert!(lock_blocks(&DataScope::Units(HashSet::new()), Some(true)));
        assert!(lock_blocks(&DataScope::Student(Uuid::nil()), Some(true)));
        assert!(lock_blocks(&DataScope::Lecturer(Uuid::nil()), Some(true)));
    }

    #[test]
    fn the_refusal_is_a_conflict() {
        assert_eq!(locked_error().code, StatusCode::CONFLICT);
    }
}
