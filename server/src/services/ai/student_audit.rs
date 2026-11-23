//! The audit trail of the student-data assistant (`ai.assistant_audits`): who asked about whom and which categories
//! were read. It never holds the question or the data.

use sea_orm::{ConnectionTrait, DbBackend, DbErr, Statement};
use uuid::Uuid;

/// One attempt to read a student's data
pub struct Entry<'a> {
    pub user_id: Option<Uuid>,
    pub role_id: Uuid,
    pub position_type_id: Option<Uuid>,
    pub student_id: Option<Uuid>,
    pub conversation_id: Option<Uuid>,
    /// `allowed`, `denied` or `error`
    pub outcome: &'a str,
    /// Categories actually read: `profile`, `academic`, `finance`, `sensitive`
    pub categories: &'a [&'a str],
    /// Categories asked for but withheld by the caller's scope
    pub withheld: &'a [&'a str],
}

/// Writes the row. Generic over the connection so a test can write inside a transaction and roll it back
pub async fn record(db: &impl ConnectionTrait, entry: &Entry<'_>) -> Result<(), DbErr> {
    db.execute_raw(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "INSERT INTO ai.assistant_audits (user_id, role_id, position_type_id, student_id, conversation_id, outcome, categories, withheld) \
         VALUES ($1, $2, $3, $4, $5, $6, array_remove(string_to_array($7, ','), ''), array_remove(string_to_array($8, ','), ''))",
        [
            entry.user_id.into(),
            entry.role_id.into(),
            entry.position_type_id.into(),
            entry.student_id.into(),
            entry.conversation_id.into(),
            entry.outcome.into(),
            entry.categories.join(",").into(),
            entry.withheld.join(",").into(),
        ],
    ))
    .await
    .map(|_| ())
}
