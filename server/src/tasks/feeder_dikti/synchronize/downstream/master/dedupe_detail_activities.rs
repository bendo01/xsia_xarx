use sea_orm::{ConnectionTrait, DatabaseConnection, DbBackend, DbErr, Statement};

/// Keeps one live detail activity per (activity_id, course_id) and soft-deletes the rest.
///
/// The row to keep is the one holding a real mark or grade; when several (or none) do, the
/// newest one wins. Rows with live evaluation components are never removed.
/// Returns the number of rows soft-deleted.
pub async fn soft_delete_duplicate_detail_activities(db: &DatabaseConnection) -> Result<u64, DbErr> {
    let sql = r#"
        WITH ranked AS (
            SELECT d.id,
                   ROW_NUMBER() OVER (
                       PARTITION BY d.activity_id, d.course_id
                       ORDER BY (COALESCE(d.mark, 0) > 0
                                 OR EXISTS (SELECT 1 FROM academic_campaign_transaction.grades g WHERE g.id = d.grade_id)) DESC,
                                d.created_at DESC NULLS LAST,
                                d.id DESC
                   ) AS rk
            FROM academic_student_campaign.detail_activities d
            WHERE d.deleted_at IS NULL
        )
        UPDATE academic_student_campaign.detail_activities t
        SET deleted_at = NOW(), updated_at = NOW()
        FROM ranked r
        WHERE t.id = r.id
          AND r.rk > 1
          AND NOT EXISTS (
              SELECT 1 FROM academic_student_campaign.detail_activity_evaluation_components c
              WHERE c.detail_activity_id = t.id AND c.deleted_at IS NULL
          )
    "#;

    let res = db
        .execute_raw(Statement::from_string(DbBackend::Postgres, sql))
        .await?;
    Ok(res.rows_affected())
}
