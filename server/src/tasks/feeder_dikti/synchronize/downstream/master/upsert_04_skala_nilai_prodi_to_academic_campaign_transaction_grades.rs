use std::collections::HashMap;
use std::time::Duration;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    TransactionTrait,
};
use uuid::Uuid;

use crate::tasks::Task;

use crate::models::feeder::master::skala_nilai_program_studi as FeederSkalaNilai;
use crate::models::academic::campaign::transaction::grades as AcademicGrade;
use crate::models::institution::master::units as InstitutionUnit;

pub struct SyncSkalaNilaiProdiToAcademicTransactionGrades;

struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_grade(
    txn: &DatabaseTransaction,
    record: &FeederSkalaNilai::Model,
    unit: &InstitutionUnit::Model,
) -> Result<(AcademicGrade::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let alphabet_code = record.nilai_huruf.as_deref().unwrap_or("-");

    let existing = AcademicGrade::Entity::find()
        .filter(AcademicGrade::Column::UnitId.eq(unit.id))
        .filter(AcademicGrade::Column::AlphabetCode.eq(alphabet_code))
        .one(txn)
        .await?;

    let name = record.nilai_huruf.clone().unwrap_or_else(|| "-".to_string());
    let grade = record.nilai_indeks.map(|v| v as f64).unwrap_or(0.0);
    let minimum = record.bobot_minimum.map(|v| v as f64).unwrap_or(0.0);
    let maximum = record.bobot_maksimum.map(|v| v as f64).unwrap_or(0.0);
    let start_date = record.tanggal_mulai_efektif;
    let end_date = record.tanggal_akhir_efektif;

    if let Some(g) = existing {
        let mut active = g.into_active_model();
        active.alphabet_code = Set(Some(alphabet_code.to_string()));
        active.name = Set(name);
        active.grade = Set(grade);
        active.minimum = Set(minimum);
        active.maximum = Set(maximum);
        active.start_date = Set(start_date);
        active.end_date = Set(end_date);
        active.feeder_id = Set(Some(record.id));
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_grade = AcademicGrade::ActiveModel {
            id: Set(Uuid::new_v4()),
            unit_id: Set(unit.id),
            code: Set(Some(0)),
            alphabet_code: Set(Some(alphabet_code.to_string())),
            name: Set(name),
            grade: Set(grade),
            minimum: Set(minimum),
            maximum: Set(maximum),
            start_date: Set(start_date),
            end_date: Set(end_date),
            feeder_id: Set(Some(record.id)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_grade.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncSkalaNilaiProdiToAcademicTransactionGrades {
    fn name(&self) -> &str {
        "SyncSkalaNilaiProdiToAcademicTransactionGrades"
    }

    fn description(&self) -> &str {
        "Upsert skala_nilai_program_studi to academic_campaign_transaction.grades"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        // 1. Preload units
        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_feeder_id = HashMap::new();
        for u in units {
            if let Some(fid) = u.feeder_id {
                units_by_feeder_id.insert(fid, u);
            }
        }

        let cache = ReferenceCache {
            units_by_feeder_id,
        };

        // 2. Setup Progress Bar
        let pb = if show_progress {
            let bar = ProgressBar::new_spinner();
            bar.set_style(
                ProgressStyle::default_spinner()
                    .template("{spinner:.green} [{elapsed_precise}] {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_spinner()),
            );
            bar.enable_steady_tick(Duration::from_millis(100));
            bar.set_message("Counting feeder skala_nilai_program_studi records...");

            let total_records = FeederSkalaNilai::Entity::find().count(db).await?;

            bar.set_length(total_records);
            bar.set_position(0);
            bar.set_style(
                ProgressStyle::default_bar()
                    .template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_bar())
                    .progress_chars("#>-"),
            );
            bar.set_message("");
            Some(bar)
        } else {
            None
        };

        let mut inserted: u64 = 0;
        let mut updated: u64 = 0;
        let mut skipped: u64 = 0;
        let mut errors: u64 = 0;

        let mut offset = 0;
        let limit = 1000;

        loop {
            let records = FeederSkalaNilai::Entity::find()
                .order_by_asc(FeederSkalaNilai::Column::Id)
                .offset(offset)
                .limit(limit)
                .all(db)
                .await?;

            if records.is_empty() {
                break;
            }

            for record in records {
                let unit = match record.id_prodi.and_then(|id_p| cache.units_by_feeder_id.get(&id_p)) {
                    Some(u) => u,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to begin transaction: {e}");
                        errors += 1;
                        continue;
                    }
                };

                match upsert_grade(&txn, &record, unit).await {
                    Ok((_g, action)) => {
                        match action {
                            UpsertAction::Inserted => inserted += 1,
                            UpsertAction::Updated => updated += 1,
                        }
                        if let Err(e) = txn.commit().await {
                            eprintln!("Failed to commit transaction: {e}");
                            errors += 1;
                        }
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error upserting grade for unit {:?}, letter {:?}: {e}", unit.code, record.nilai_huruf);
                        errors += 1;
                    }
                }

                if let Some(ref pb) = pb {
                    pb.set_message(format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}"));
                    pb.inc(1);
                }
            }

            offset += limit;
        }

        let summary = format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}");
        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }

        Ok(())
    }
}
