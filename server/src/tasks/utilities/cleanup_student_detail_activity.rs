use chrono::Local;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityName, EntityTrait, ExprTrait,
    IntoActiveModel, QueryFilter, QueryOrder, TransactionTrait,
};
use std::collections::HashMap;
use std::time::Duration;
use uuid::Uuid;

use sea_orm::sea_query::{Expr, Query};
use sea_orm::QuerySelect;

use crate::models::academic::course::master::courses as Course;
use crate::models::academic::student::campaign::detail_activities as DetailActivity;
use crate::tasks::Task;

/// Nil UUID sentinel used as a "no value" placeholder in many FK columns.
const NIL_UUID: &str = "00000000-0000-0000-0000-000000000000";

/// A lightweight projection used to decide which duplicate to keep.
#[derive(Debug, Clone)]
struct DetailRow {
    id: Uuid,
    mark: Option<f64>,
    grade_id: Option<Uuid>,
    feeder_id: Option<Uuid>,
    updated_at: Option<chrono::NaiveDateTime>,
}

impl DetailRow {
    /// Returns `true` when this row carries meaningful grade/mark data.
    fn has_mark_or_grade(&self) -> bool {
        let mark_ok = self.mark.map_or(false, |m| m > 0.0);
        let grade_ok = self.grade_id.map_or(false, |g| {
            g != Uuid::nil() && g.to_string() != NIL_UUID
        });
        mark_ok || grade_ok
    }

    /// Returns `true` when this row has a real (non-nil, non-null) feeder_id.
    fn has_valid_feeder(&self) -> bool {
        self.feeder_id
            .map_or(false, |f| f != Uuid::nil() && f.to_string() != NIL_UUID)
    }
}

/// Builds a determinate progress bar for row-by-row work.
fn progress_bar(len: u64, msg: &'static str) -> ProgressBar {
    let pb = ProgressBar::new(len);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("    {msg} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%) ETA {eta}")
            .unwrap_or_else(|_| ProgressStyle::default_bar())
            .progress_chars("#>-"),
    );
    pb.set_message(msg);
    pb
}

/// Builds a spinner for long-running queries whose size is unknown upfront.
fn spinner(msg: &'static str) -> ProgressBar {
    let pb = ProgressBar::new_spinner();
    pb.set_style(
        ProgressStyle::default_spinner()
            .template("    {spinner:.cyan} {msg} [{elapsed_precise}]")
            .unwrap_or_else(|_| ProgressStyle::default_spinner()),
    );
    pb.set_message(msg);
    pb.enable_steady_tick(Duration::from_millis(100));
    pb
}

// ─── Task struct ─────────────────────────────────────────────────────────────

pub struct CleanupStudentDetailActivityTask;

#[async_trait]
impl Task for CleanupStudentDetailActivityTask {
    fn name(&self) -> &str {
        "utility:cleanup-student-detail-activity"
    }

    fn description(&self) -> &str {
        "Soft-deletes duplicate detail_activity records (same activity_id + course_id) \
         keeping the row with the best mark/grade data, and also soft-deletes rows \
         whose course_id is orphaned (no matching course in academic_course_master.courses), \
         including rows that have a mark. Use --dry-run to preview without committing changes."
    }

    async fn run(
        &self,
        db: &DatabaseConnection,
        args: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        let dry_run = args.contains(&"--dry-run".to_string());

        if dry_run {
            println!("==> [DRY-RUN] No changes will be written to the database.");
        }
        println!("==> Starting CleanupStudentDetailActivity task...");
        println!();

        // ── Phase 1: Duplicate cleanup ─────────────────────────────────────
        let dup_deleted = cleanup_duplicates(db, dry_run).await?;

        // ── Phase 2: Orphaned course_id cleanup ───────────────────────────
        let orphan_deleted = cleanup_orphaned_courses(db, dry_run).await?;

        // ── Summary ───────────────────────────────────────────────────────
        println!();
        println!("==> Task complete.");
        println!(
            "    Duplicates soft-deleted : {}",
            dup_deleted
        );
        println!(
            "    Orphaned  soft-deleted  : {}",
            orphan_deleted
        );
        if dry_run {
            println!("    [DRY-RUN] No rows were actually modified.");
        }

        Ok(())
    }
}

// ─── Phase 1: Duplicate cleanup ──────────────────────────────────────────────

/// Finds all active rows where (activity_id, course_id) has more than one
/// record, then soft-deletes the inferior duplicates.
///
/// Selection priority (highest wins, ties broken by newest `updated_at`):
///   1. Has mark > 0  **or**  has a non-nil grade_id
///   2. Has a valid (non-nil) feeder_id
///   3. Newest `updated_at`
async fn cleanup_duplicates(
    db: &DatabaseConnection,
    dry_run: bool,
) -> Result<u64, Box<dyn std::error::Error>> {
    println!("── Phase 1: Duplicate (activity_id, course_id) cleanup ──────────────");

    // Native SeaORM query builder with GROUP BY and HAVING COUNT(*) > 1
    let sp = spinner("Scanning for duplicate groups…");
    let pairs: Vec<(Uuid, Uuid)> = DetailActivity::Entity::find()
        .select_only()
        .column(DetailActivity::Column::ActivityId)
        .column(DetailActivity::Column::CourseId)
        .filter(DetailActivity::Column::DeletedAt.is_null())
        .group_by(DetailActivity::Column::ActivityId)
        .group_by(DetailActivity::Column::CourseId)
        .having(Expr::col(DetailActivity::Column::Id).count().gt(1))
        .into_tuple::<(Uuid, Uuid)>()
        .all(db)
        .await?;
    sp.finish_and_clear();

    let dup_pair_count = pairs.len();
    println!("    Duplicate groups found   : {}", dup_pair_count);

    if dup_pair_count == 0 {
        println!("    Nothing to clean up.");
        return Ok(0);
    }

    let activity_ids: Vec<Uuid> = pairs.iter().map(|(a, _)| *a).collect::<std::collections::HashSet<_>>().into_iter().collect();
    
    // Fetch all active detail records for these duplicate groups
    let sp = spinner("Loading duplicate rows…");
    let all_dup_models = DetailActivity::Entity::find()
        .filter(DetailActivity::Column::ActivityId.is_in(activity_ids))
        .filter(DetailActivity::Column::DeletedAt.is_null())
        .order_by_asc(DetailActivity::Column::ActivityId)
        .order_by_asc(DetailActivity::Column::CourseId)
        .order_by_asc(DetailActivity::Column::CreatedAt)
        .all(db)
        .await?;
    sp.finish_and_clear();

    // Group in memory and determine rows to delete...
    let mut groups: HashMap<(Uuid, Uuid), Vec<DetailRow>> = HashMap::new();
    for m in all_dup_models {
        let key = (m.activity_id, m.course_id);
        if pairs.iter().any(|p| p == &key) {
            groups.entry(key).or_default().push(DetailRow {
                id:          m.id,
                mark:        m.mark,
                grade_id:    m.grade_id,
                feeder_id:   m.feeder_id,
                updated_at:  m.updated_at,
            });
        }
    }

    let mut to_delete: Vec<Uuid> = Vec::new();
    for (_, mut rows) in groups {
        if rows.len() <= 1 {
            continue;
        }

        rows.sort_by(|a, b| {
            b.has_mark_or_grade()
                .cmp(&a.has_mark_or_grade())
                .then(b.has_valid_feeder().cmp(&a.has_valid_feeder()))
                .then(b.updated_at.cmp(&a.updated_at))
        });

        for row in rows.into_iter().skip(1) {
            to_delete.push(row.id);
        }
    }

    println!("    Rows to soft-delete      : {}", to_delete.len());

    if to_delete.is_empty() || dry_run {
        if dry_run && !to_delete.is_empty() {
            println!("    [DRY-RUN] Would soft-delete {} duplicate rows.", to_delete.len());
        }
        return Ok(0);
    }

    // Batch deletion logic remains the same...
    let now = Local::now().naive_local();
    let pb = progress_bar(to_delete.len() as u64, "Deleting duplicates");

    let chunk_size = 200;
    let mut deleted_count: u64 = 0;

    for chunk in to_delete.chunks(chunk_size) {
        let txn = db.begin().await?;
        for &id in chunk {
            if let Some(m) = DetailActivity::Entity::find_by_id(id)
                .filter(DetailActivity::Column::DeletedAt.is_null())
                .one(&txn)
                .await? 
            {
                let mut active = m.into_active_model();
                active.deleted_at = Set(Some(now));
                active.updated_at = Set(Some(now));
                active.update(&txn).await?;
                deleted_count += 1;
            }
            pb.inc(1);
        }
        txn.commit().await?;
    }

    pb.finish_with_message("Done");
    println!("    Deleted (duplicates)     : {}", deleted_count);

    Ok(deleted_count)
}

// ─── Phase 2: Orphaned course_id cleanup ─────────────────────────────────────

/// Soft-deletes active `detail_activities` rows whose `course_id` does not
/// exist (or is deleted) in `academic_course_master.courses`.
///
/// Rows are removed whether or not they carry a mark; the number of marked
/// rows is reported so the loss of grade data is visible.
async fn cleanup_orphaned_courses(
    db: &DatabaseConnection,
    dry_run: bool,
) -> Result<u64, Box<dyn std::error::Error>> {
    println!();
    println!("── Phase 2: Orphaned course_id cleanup ──────────────────────────────");

    // Construct a native NOT EXISTS subquery using SeaQuery
    let subquery = Query::select()
        .expr(Expr::val(1))
        .from(Course::Entity.table_ref())
        .and_where(
            Expr::col((Course::Entity, Course::Column::Id))
                .equals((DetailActivity::Entity, DetailActivity::Column::CourseId)),
        )
        .and_where(Expr::col((Course::Entity, Course::Column::DeletedAt)).is_null())
        .to_owned();

    // Query active detail activities where the course doesn't exist
    let sp = spinner("Scanning for orphaned rows…");
    let all_orphans = DetailActivity::Entity::find()
        .filter(DetailActivity::Column::DeletedAt.is_null())
        .filter(Expr::not_exists(subquery))
        .all(db)
        .await?;
    sp.finish_and_clear();

    let total_orphaned = all_orphans.len();
    println!("    Total orphaned rows found : {}", total_orphaned);

    if total_orphaned == 0 {
        println!("    Nothing to clean up.");
        return Ok(0);
    }

    let with_mark = all_orphans
        .iter()
        .filter(|m| m.mark.map_or(false, |val| val > 0.0))
        .count();
    let to_delete_ids: Vec<Uuid> = all_orphans.into_iter().map(|m| m.id).collect();

    println!("    Rows with mark > 0       : {}", with_mark);
    println!("    Rows to soft-delete      : {}", to_delete_ids.len());

    if with_mark > 0 {
        println!(
            "    ⚠  {} of these rows carry mark data and will be soft-deleted too.",
            with_mark
        );
    }

    if to_delete_ids.is_empty() || dry_run {
        if dry_run && !to_delete_ids.is_empty() {
            println!(
                "    [DRY-RUN] Would soft-delete {} orphaned rows.",
                to_delete_ids.len()
            );
        }
        return Ok(0);
    }

    let now = Local::now().naive_local();
    let pb = progress_bar(to_delete_ids.len() as u64, "Deleting orphans");

    let chunk_size = 200;
    let mut deleted_count: u64 = 0;

    for chunk in to_delete_ids.chunks(chunk_size) {
        let txn = db.begin().await?;
        for &id in chunk {
            if let Some(m) = DetailActivity::Entity::find_by_id(id)
                .filter(DetailActivity::Column::DeletedAt.is_null())
                .one(&txn)
                .await? 
            {
                let mut active = m.into_active_model();
                active.deleted_at = Set(Some(now));
                active.updated_at = Set(Some(now));
                active.update(&txn).await?;
                deleted_count += 1;
            }
            pb.inc(1);
        }
        txn.commit().await?;
    }

    pb.finish_with_message("Done");
    println!("    Deleted (orphaned)       : {}", deleted_count);

    Ok(deleted_count)
}
