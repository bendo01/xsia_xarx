use std::collections::{HashMap, HashSet};
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

use crate::models::feeder::master::kelas_kuliah as FeederKelasKuliah;
use crate::models::academic::campaign::transaction::class_codes as AcademicClassCode;
use crate::models::academic::campaign::transaction::activities as AcademicActivity;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::institution::master::institutions as Institution;
use crate::models::academic::general::reference::academic_years as AcademicYear;

pub struct SyncKelasKuliahToAcademicCampaignTransactionClassCode;

struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_class_code(
    txn: &DatabaseTransaction,
    nama_kelas_kuliah: &str,
    activity: &AcademicActivity::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicClassCode::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let existing = AcademicClassCode::Entity::find()
        .filter(AcademicClassCode::Column::ActivityId.eq(activity.id))
        .filter(AcademicClassCode::Column::AlphabetCode.eq(nama_kelas_kuliah))
        .one(txn)
        .await?;

    let class_name = format!(
        "KelasKuliah {} {} {} {}",
        institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
        unit.code.as_deref().unwrap_or(""),
        academic_year.feeder_name,
        nama_kelas_kuliah
    );

    if let Some(cc) = existing {
        let mut active = cc.into_active_model();
        active.unit_id = Set(Some(unit.id));
        active.name = Set(class_name);
        active.capacity = Set(Some(40));
        active.start_effective_date = Set(academic_year.start_date);
        active.end_effective_date = Set(academic_year.end_date);
        active.updated_at = Set(Some(now));
        active.sync_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_cc = AcademicClassCode::ActiveModel {
            id: Set(Uuid::new_v4()),
            activity_id: Set(activity.id),
            alphabet_code: Set(Some(nama_kelas_kuliah.to_string())),
            name: Set(class_name),
            capacity: Set(Some(40)),
            start_effective_date: Set(academic_year.start_date),
            end_effective_date: Set(academic_year.end_date),
            unit_id: Set(Some(unit.id)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_cc.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncKelasKuliahToAcademicCampaignTransactionClassCode {
    fn name(&self) -> &str {
        "SyncKelasKuliahToAcademicCampaignTransactionClassCode"
    }

    fn description(&self) -> &str {
        "Upsert kelas_kuliah to academic_campaign_transaction.class_codes"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        // 1. Preload reference caches
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

        let years = AcademicYear::Entity::find().all(db).await?;
        let mut years_by_feeder_name = HashMap::new();
        for y in years {
            if !y.feeder_name.is_empty() {
                years_by_feeder_name.insert(y.feeder_name.clone(), y);
            }
        }

        let activities = AcademicActivity::Entity::find().all(db).await?;
        let mut activities_by_unit_and_year = HashMap::new();
        for a in activities {
            activities_by_unit_and_year.insert((a.unit_id, a.academic_year_id), a);
        }

        let cache = ReferenceCache {
            units_by_feeder_id,
            institutions_by_id,
            years_by_feeder_name,
            activities_by_unit_and_year,
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
            bar.set_message("Counting feeder kelas_kuliah records...");

            let total_records = FeederKelasKuliah::Entity::find().count(db).await?;

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

        let mut processed_codes: HashSet<(Uuid, String)> = HashSet::new();

        let mut offset = 0;
        let limit = 1000;

        loop {
            let records = FeederKelasKuliah::Entity::find()
                .order_by_asc(FeederKelasKuliah::Column::IdKelasKuliah)
                .offset(offset)
                .limit(limit)
                .all(db)
                .await?;

            if records.is_empty() {
                break;
            }

            for record in records {
                let nama_kelas = match record.nama_kelas_kuliah.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
                    Some(n) => n,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

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

                let activity = match cache.activities_by_unit_and_year.get(&(unit.id, academic_year.id)) {
                    Some(a) => a,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let key = (activity.id, nama_kelas.to_string());
                if processed_codes.contains(&key) {
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                }
                processed_codes.insert(key);

                let institution = cache.institutions_by_id.get(&unit.institution_id);

                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to begin transaction: {e}");
                        errors += 1;
                        continue;
                    }
                };

                match upsert_class_code(&txn, nama_kelas, activity, unit, institution, academic_year).await {
                    Ok((_cc, action)) => {
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
                        eprintln!("Error upserting class code {:?}: {e}", nama_kelas);
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
