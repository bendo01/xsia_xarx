use salvo::async_trait;
use sea_orm::{ConnectionTrait, DatabaseConnection, DbBackend, Statement};
use std::fs::File;
use std::io::{BufWriter, Write};

use crate::tasks::Task;

const DEFAULT_OUTPUT: &str = "sks_mismatch_report.csv";

/// Student activities whose Feeder SKS (`sks_semester`) differs from the sum of their live
/// detail activity credits. Activities with a Feeder SKS of 0 are skipped (the API and PDFs
/// fall back to the detail sum for those).
const MISMATCH_SQL: &str = r#"
WITH s AS (
    SELECT d.activity_id,
           SUM(d.credit) AS detail_sks,
           COUNT(*) AS course_count,
           STRING_AGG(c.code || '(' || COALESCE(d.credit::text, '?') || ')', ', ' ORDER BY c.code) AS courses
    FROM academic_student_campaign.detail_activities d
    LEFT JOIN academic_course_master.courses c ON c.id = d.course_id
    WHERE d.deleted_at IS NULL
    GROUP BY d.activity_id
)
SELECT st.code AS nim,
       st.name AS student,
       sa.name AS activity,
       sa.total_credit AS feeder_sks,
       s.detail_sks AS detail_sks,
       s.detail_sks - sa.total_credit AS diff,
       s.course_count AS course_count,
       s.courses AS courses
FROM academic_student_campaign.student_activities sa
JOIN s ON s.activity_id = sa.id
JOIN academic_student_master.students st ON st.id = sa.student_id
WHERE sa.deleted_at IS NULL
  AND sa.total_credit > 0
  AND s.detail_sks <> sa.total_credit
ORDER BY ABS(s.detail_sks - sa.total_credit) DESC, st.code, sa.name
"#;

pub struct SksMismatchReportTask;

fn csv_field(value: &str) -> String {
    if value.contains([',', '"', '\n', '\r']) {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_string()
    }
}

#[async_trait]
impl Task for SksMismatchReportTask {
    fn name(&self) -> &str {
        "report:sks-mismatch"
    }

    fn description(&self) -> &str {
        "Exports student activities whose Feeder SKS differs from the sum of detail activity credits to CSV [output path]"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let output = args.first().map(String::as_str).unwrap_or(DEFAULT_OUTPUT);

        let rows = db
            .query_all_raw(Statement::from_string(DbBackend::Postgres, MISMATCH_SQL))
            .await?;

        let mut writer = BufWriter::new(File::create(output)?);
        writeln!(writer, "nim,student,activity,feeder_sks,detail_sks,diff,course_count,courses")?;

        for row in &rows {
            let nim: String = row.try_get("", "nim").unwrap_or_default();
            let student: String = row.try_get("", "student").unwrap_or_default();
            let activity: String = row.try_get("", "activity").unwrap_or_default();
            let feeder_sks: f64 = row.try_get("", "feeder_sks").unwrap_or(0.0);
            let detail_sks: f64 = row.try_get("", "detail_sks").unwrap_or(0.0);
            let diff: f64 = row.try_get("", "diff").unwrap_or(0.0);
            let course_count: i64 = row.try_get("", "course_count").unwrap_or(0);
            let courses: String = row.try_get("", "courses").unwrap_or_default();

            writeln!(
                writer,
                "{},{},{},{},{},{},{},{}",
                csv_field(&nim),
                csv_field(&student),
                csv_field(&activity),
                feeder_sks,
                detail_sks,
                diff,
                course_count,
                csv_field(&courses),
            )?;
        }
        writer.flush()?;

        println!("SKS mismatch report: {} activities written to {}", rows.len(), output);
        Ok(())
    }
}
