use salvo::async_trait;
use sea_orm::{ConnectionTrait, DatabaseConnection, FromQueryResult, Statement, TransactionTrait};

use crate::tasks::Task;

pub struct SyncStudentClassCodesTask;

/// Picks one class code per student: take the student's latest semester (student activity,
/// ordered by its campaign activity start date) that has teach-linked detail activities, then
/// the class code used by most of that semester's courses. Ties prefer a class code belonging
/// to that same campaign activity, then the lowest class code number.
const CANDIDATES_CTE: &str = r#"
WITH per_semester AS (
    SELECT sa.student_id,
           sa.id AS student_activity_id,
           a.id AS campaign_activity_id,
           a.start_date,
           t.class_code_id,
           COUNT(*) AS course_count
    FROM academic_student_campaign.detail_activities da
    JOIN academic_student_campaign.student_activities sa
         ON sa.id = da.activity_id AND sa.deleted_at IS NULL
    JOIN academic_campaign_transaction.activities a
         ON a.id = sa.unit_activity_id
    JOIN academic_campaign_transaction.teaches t
         ON t.id = da.teach_id AND t.deleted_at IS NULL
    JOIN academic_campaign_transaction.class_codes cc
         ON cc.id = t.class_code_id AND cc.deleted_at IS NULL
    WHERE da.deleted_at IS NULL
      AND t.class_code_id <> '00000000-0000-0000-0000-000000000000'
    GROUP BY sa.student_id, sa.id, a.id, a.start_date, t.class_code_id
),
latest_semester AS (
    SELECT DISTINCT ON (student_id) student_id, student_activity_id, campaign_activity_id
    FROM per_semester
    ORDER BY student_id, start_date DESC, student_activity_id DESC
),
candidates AS (
    SELECT DISTINCT ON (ps.student_id) ps.student_id, ps.class_code_id
    FROM per_semester ps
    JOIN latest_semester ls ON ls.student_activity_id = ps.student_activity_id
    JOIN academic_campaign_transaction.class_codes cc ON cc.id = ps.class_code_id
    ORDER BY ps.student_id,
             ps.course_count DESC,
             (cc.activity_id = ls.campaign_activity_id) DESC,
             cc.code ASC,
             cc.id ASC
)
"#;

#[derive(Debug, FromQueryResult)]
struct Summary {
    candidates: i64,
    unchanged: i64,
    filled: i64,
    replaced: i64,
}

#[async_trait]
impl Task for SyncStudentClassCodesTask {
    fn name(&self) -> &str {
        "utility:sync-student-class-codes"
    }

    fn description(&self) -> &str {
        "Sets students.class_code_id from their latest semester's detail activities -> teaches (--dry-run to preview)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let dry_run = args.iter().any(|a| a == "--dry-run" || a == "-n");
        println!("==> Starting Student Class Code Synchronization{}...", if dry_run { " (dry run)" } else { "" });

        let summary_sql = format!(
            r#"{CANDIDATES_CTE}
            SELECT COUNT(*) AS candidates,
                   COUNT(*) FILTER (WHERE s.class_code_id = c.class_code_id) AS unchanged,
                   COUNT(*) FILTER (WHERE s.class_code_id <> c.class_code_id
                                      AND s.class_code_id = '00000000-0000-0000-0000-000000000000') AS filled,
                   COUNT(*) FILTER (WHERE s.class_code_id <> c.class_code_id
                                      AND s.class_code_id <> '00000000-0000-0000-0000-000000000000') AS replaced
            FROM candidates c
            JOIN academic_student_master.students s ON s.id = c.student_id AND s.deleted_at IS NULL"#
        );
        let summary = Summary::find_by_statement(Statement::from_string(db.get_database_backend(), summary_sql))
            .one(db)
            .await?
            .ok_or("summary query returned no rows")?;

        println!("    Students with teach data: {}", summary.candidates);
        println!("    Already correct:          {}", summary.unchanged);
        println!("    Empty -> set:             {}", summary.filled);
        println!("    Existing -> replaced:     {}", summary.replaced);

        if dry_run {
            println!("==> Dry run, no changes written.");
            return Ok(());
        }

        let update_sql = format!(
            r#"{CANDIDATES_CTE}
            UPDATE academic_student_master.students s
            SET class_code_id = c.class_code_id,
                updated_at = NOW()
            FROM candidates c
            WHERE s.id = c.student_id
              AND s.deleted_at IS NULL
              AND s.class_code_id IS DISTINCT FROM c.class_code_id"#
        );
        let txn = db.begin().await?;
        let result = txn
            .execute_raw(Statement::from_string(db.get_database_backend(), update_sql))
            .await?;
        txn.commit().await?;

        println!("==> Student Class Code Sync Completed!");
        println!("    Updated: {}", result.rows_affected());

        Ok(())
    }
}
