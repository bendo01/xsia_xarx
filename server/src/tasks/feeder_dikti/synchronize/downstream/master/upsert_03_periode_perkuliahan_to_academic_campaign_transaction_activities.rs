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

use crate::models::feeder::master::periode_perkuliahan as FeederPeriodePerkuliahan;
use crate::models::academic::campaign::transaction::activities as AcademicActivity;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::institution::master::institutions as Institution;
use crate::models::academic::general::reference::academic_years as AcademicYear;

pub struct SyncPeriodePerkuliahanToAcademicTransactionActivities;

struct ReferenceCache {
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_activity(
    txn: &DatabaseTransaction,
    record: &FeederPeriodePerkuliahan::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicActivity::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let existing = AcademicActivity::Entity::find()
        .filter(AcademicActivity::Column::UnitId.eq(unit.id))
        .filter(AcademicActivity::Column::AcademicYearId.eq(academic_year.id))
        .one(txn)
        .await?;

    let name = format!(
        "Aktifitas {} {} {}",
        institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
        unit.code.as_deref().unwrap_or(""),
        academic_year.feeder_name
    );

    let week_quantity = record.jumlah_minggu_pertemuan.or(Some(0));
    let student_target = record.jumlah_target_mahasiswa_baru.unwrap_or(0);
    let candidate_number = record.jumlah_pendaftar_ikut_seleksi.unwrap_or(0);
    let candidate_pass = record.jumlah_pendaftar_lulus_seleksi.unwrap_or(0);
    let became_student = record.jumlah_daftar_ulang.unwrap_or(0);
    let start_date = record.tanggal_awal_perkuliahan;
    let end_date = record.tanggal_akhir_perkuliahan;

    if let Some(act) = existing {
        let mut active = act.into_active_model();
        active.name = Set(name);
        active.feeder_id = Set(Some(record.id));
        active.week_quantity = Set(week_quantity);
        active.student_target = Set(student_target);
        active.candidate_number = Set(candidate_number);
        active.candidate_pass = Set(candidate_pass);
        active.became_student = Set(became_student);
        active.start_date = Set(start_date);
        active.end_date = Set(end_date);
        active.start_transaction = Set(start_date);
        active.end_transaction = Set(end_date);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_activity = AcademicActivity::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(name),
            week_quantity: Set(week_quantity),
            student_target: Set(student_target),
            candidate_number: Set(candidate_number),
            candidate_pass: Set(candidate_pass),
            became_student: Set(became_student),
            transfer_student: Set(0),
            total_class_member: Set(Some(40)),
            start_date: Set(start_date),
            end_date: Set(end_date),
            start_transaction: Set(start_date),
            end_transaction: Set(end_date),
            unit_id: Set(unit.id),
            academic_year_id: Set(academic_year.id),
            is_active: Set(Some(false)),
            feeder_id: Set(Some(record.id)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_activity.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncPeriodePerkuliahanToAcademicTransactionActivities {
    fn name(&self) -> &str {
        "SyncPeriodePerkuliahanToAcademicTransactionActivities"
    }

    fn description(&self) -> &str {
        "Upsert periode_perkuliahan to academic_campaign_transaction.activities"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        // 1. Preload reference cache
        let years = AcademicYear::Entity::find().all(db).await?;
        let mut years_by_feeder_name = HashMap::new();
        for y in years {
            if !y.feeder_name.is_empty() {
                years_by_feeder_name.insert(y.feeder_name.clone(), y);
            }
        }

        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_feeder_id = HashMap::new();
        for u in units {
            if let Some(fid) = u.feeder_id {
                units_by_feeder_id.insert(fid, u);
            }
        }

        let institutions = Institution::Entity::find().all(db).await?;
        let mut institutions_by_id = HashMap::new();
        for i in institutions {
            institutions_by_id.insert(i.id, i);
        }

        let cache = ReferenceCache {
            years_by_feeder_name,
            units_by_feeder_id,
            institutions_by_id,
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
            bar.set_message("Counting feeder periode_perkuliahan records...");

            let total_records = FeederPeriodePerkuliahan::Entity::find().count(db).await?;

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
            let records = FeederPeriodePerkuliahan::Entity::find()
                .order_by_asc(FeederPeriodePerkuliahan::Column::Id)
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

                let academic_year = match record.id_semester.as_deref().and_then(|s| cache.years_by_feeder_name.get(s)) {
                    Some(ay) => ay,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let institution = cache.institutions_by_id.get(&unit.institution_id);

                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to begin transaction: {e}");
                        errors += 1;
                        continue;
                    }
                };

                match upsert_activity(&txn, &record, unit, institution, academic_year).await {
                    Ok((_act, action)) => {
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
                        eprintln!("Error upserting activity for unit {:?}, semester {:?}: {e}", unit.code, academic_year.feeder_name);
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
