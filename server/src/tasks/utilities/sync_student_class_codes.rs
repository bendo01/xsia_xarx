use chrono::{Local, NaiveDate};
use salvo::async_trait;
use sea_orm::sea_query::Expr;
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, ExprTrait, FromQueryResult, JoinType, QueryFilter, QuerySelect,
    RelationDef, TransactionTrait,
};
use std::collections::HashMap;
use uuid::Uuid;

use crate::models::academic::campaign::transaction::activities as Activity;
use crate::models::academic::campaign::transaction::class_codes as ClassCode;
use crate::models::academic::campaign::transaction::teaches as Teach;
use crate::models::academic::student::campaign::detail_activities as DetailActivity;
use crate::models::academic::student::campaign::student_activities as StudentActivity;
use crate::models::academic::student::master::students as Student;
use crate::tasks::Task;

/// Keeps `IN (...)` lists well under Postgres' bind parameter limit.
const CHUNK_SIZE: usize = 1000;

pub struct SyncStudentClassCodesTask;

/// How many of a student's courses in one semester (student activity) use one class code.
#[derive(Debug, FromQueryResult)]
struct SemesterClassCode {
    student_id: Uuid,
    student_activity_id: Uuid,
    campaign_activity_id: Uuid,
    start_date: Option<NaiveDate>,
    class_code_id: Uuid,
    class_code_activity_id: Uuid,
    class_code: Option<i32>,
    course_count: i64,
}

/// Counts teach-linked detail activities per (student, semester, class code), skipping
/// soft-deleted rows and the nil class code.
async fn load_semester_class_codes(db: &DatabaseConnection) -> Result<Vec<SemesterClassCode>, sea_orm::DbErr> {
    let to_student_activity: RelationDef = DetailActivity::Entity::belongs_to(StudentActivity::Entity)
        .from(DetailActivity::Column::ActivityId)
        .to(StudentActivity::Column::Id)
        .into();
    let to_campaign_activity: RelationDef = StudentActivity::Entity::belongs_to(Activity::Entity)
        .from(StudentActivity::Column::UnitActivityId)
        .to(Activity::Column::Id)
        .into();
    let to_teach: RelationDef = DetailActivity::Entity::belongs_to(Teach::Entity)
        .from(DetailActivity::Column::TeachId)
        .to(Teach::Column::Id)
        .into();
    let to_class_code: RelationDef = Teach::Entity::belongs_to(ClassCode::Entity)
        .from(Teach::Column::ClassCodeId)
        .to(ClassCode::Column::Id)
        .into();

    DetailActivity::Entity::find()
        .select_only()
        .column_as(StudentActivity::Column::StudentId, "student_id")
        .column_as(StudentActivity::Column::Id, "student_activity_id")
        .column_as(Activity::Column::Id, "campaign_activity_id")
        .column_as(Activity::Column::StartDate, "start_date")
        .column_as(Teach::Column::ClassCodeId, "class_code_id")
        .column_as(ClassCode::Column::ActivityId, "class_code_activity_id")
        .column_as(ClassCode::Column::Code, "class_code")
        .column_as(Expr::col((DetailActivity::Entity, DetailActivity::Column::Id)).count(), "course_count")
        .join(JoinType::InnerJoin, to_student_activity)
        .join(JoinType::InnerJoin, to_campaign_activity)
        .join(JoinType::InnerJoin, to_teach)
        .join(JoinType::InnerJoin, to_class_code)
        .filter(DetailActivity::Column::DeletedAt.is_null())
        .filter(StudentActivity::Column::DeletedAt.is_null())
        .filter(Teach::Column::DeletedAt.is_null())
        .filter(ClassCode::Column::DeletedAt.is_null())
        .filter(Teach::Column::ClassCodeId.ne(Uuid::nil()))
        .group_by(StudentActivity::Column::StudentId)
        .group_by(StudentActivity::Column::Id)
        .group_by(Activity::Column::Id)
        .group_by(Activity::Column::StartDate)
        .group_by(Teach::Column::ClassCodeId)
        .group_by(ClassCode::Column::ActivityId)
        .group_by(ClassCode::Column::Code)
        .into_model::<SemesterClassCode>()
        .all(db)
        .await
}

/// Picks one class code per student: take the student's latest semester (student activity,
/// ordered by its campaign activity start date, undated semesters last) that has teach-linked
/// detail activities, then the class code used by most of that semester's courses. Ties prefer
/// a class code belonging to that same campaign activity, then the lowest class code number.
fn pick_class_codes(rows: Vec<SemesterClassCode>) -> HashMap<Uuid, Uuid> {
    let mut by_student: HashMap<Uuid, Vec<SemesterClassCode>> = HashMap::new();
    for row in rows {
        by_student.entry(row.student_id).or_default().push(row);
    }

    by_student
        .into_iter()
        .filter_map(|(student_id, rows)| {
            let latest = rows.iter().map(|r| (r.start_date, r.student_activity_id)).max()?.1;
            rows.iter()
                .filter(|r| r.student_activity_id == latest)
                .min_by_key(|r| {
                    (
                        std::cmp::Reverse(r.course_count),
                        r.class_code_activity_id != r.campaign_activity_id,
                        r.class_code.is_none(),
                        r.class_code,
                        r.class_code_id,
                    )
                })
                .map(|r| (student_id, r.class_code_id))
        })
        .collect()
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

        let candidates = pick_class_codes(load_semester_class_codes(db).await?);

        let student_ids: Vec<Uuid> = candidates.keys().copied().collect();
        let mut current: Vec<(Uuid, Uuid)> = Vec::with_capacity(student_ids.len());
        for chunk in student_ids.chunks(CHUNK_SIZE) {
            current.extend(
                Student::Entity::find()
                    .select_only()
                    .column(Student::Column::Id)
                    .column(Student::Column::ClassCodeId)
                    .filter(Student::Column::Id.is_in(chunk.to_vec()))
                    .filter(Student::Column::DeletedAt.is_null())
                    .into_tuple::<(Uuid, Uuid)>()
                    .all(db)
                    .await?,
            );
        }

        let (mut unchanged, mut filled, mut replaced) = (0usize, 0usize, 0usize);
        let mut changes: HashMap<Uuid, Vec<Uuid>> = HashMap::new();
        for (student_id, class_code_id) in &current {
            let target = candidates[student_id];
            if *class_code_id == target {
                unchanged += 1;
                continue;
            }
            if class_code_id.is_nil() {
                filled += 1;
            } else {
                replaced += 1;
            }
            changes.entry(target).or_default().push(*student_id);
        }

        println!("    Students with teach data: {}", current.len());
        println!("    Already correct:          {}", unchanged);
        println!("    Empty -> set:             {}", filled);
        println!("    Existing -> replaced:     {}", replaced);

        if dry_run {
            println!("==> Dry run, no changes written.");
            return Ok(());
        }

        let now = Local::now().naive_local();
        let mut updated = 0u64;
        let txn = db.begin().await?;
        for (class_code_id, student_ids) in &changes {
            for chunk in student_ids.chunks(CHUNK_SIZE) {
                updated += Student::Entity::update_many()
                    .col_expr(Student::Column::ClassCodeId, Expr::value(*class_code_id))
                    .col_expr(Student::Column::UpdatedAt, Expr::value(now))
                    .filter(Student::Column::Id.is_in(chunk.to_vec()))
                    .filter(Student::Column::DeletedAt.is_null())
                    .exec(&txn)
                    .await?
                    .rows_affected;
            }
        }
        txn.commit().await?;

        println!("==> Student Class Code Sync Completed!");
        println!("    Updated: {}", updated);

        Ok(())
    }
}
