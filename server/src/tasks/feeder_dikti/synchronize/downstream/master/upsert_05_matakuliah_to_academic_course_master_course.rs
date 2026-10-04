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

use crate::models::feeder::master::matakuliah as FeederMatakuliah;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::academic::course::reference::varieties as AcademicCourseVariety;
use crate::models::academic::course::reference::groups as AcademicCourseGroup;
use crate::models::institution::master::units as InstitutionUnit;

pub struct SyncMatakuliahToAcademicCourseMasterCourse;

struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    varieties_by_alphabet_code: HashMap<String, AcademicCourseVariety::Model>,
    varieties_by_name: HashMap<String, AcademicCourseVariety::Model>,
    groups_by_alphabet_code: HashMap<String, AcademicCourseGroup::Model>,
    groups_by_name: HashMap<String, AcademicCourseGroup::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_course(
    txn: &DatabaseTransaction,
    record: &FeederMatakuliah::Model,
    unit: &InstitutionUnit::Model,
    cache: &ReferenceCache,
) -> Result<(AcademicCourse::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();

    let mut existing: Option<AcademicCourse::Model> = None;

    if let Some(id_m) = record.id_matkul {
        existing = AcademicCourse::Entity::find()
            .filter(AcademicCourse::Column::FeederCourseId.eq(id_m))
            .one(txn)
            .await?;
    }

    if existing.is_none() {
        if let Some(ref code) = record.kode_mata_kuliah {
            let trimmed = code.trim();
            if !trimmed.is_empty() {
                existing = AcademicCourse::Entity::find()
                    .filter(AcademicCourse::Column::Code.eq(trimmed))
                    .filter(AcademicCourse::Column::UnitId.eq(unit.id))
                    .one(txn)
                    .await?;
            }
        }
    }

    let code = record.kode_mata_kuliah.clone().unwrap_or_default();
    let name = record.nama_mata_kuliah.clone().unwrap_or_default();
    let method = record.metode_kuliah.clone();
    let total_credit = record.sks_mata_kuliah.map(|v| v as f64).unwrap_or(0.0);
    let lecture_credit = record.sks_tatap_muka.map(|v| v as f64).unwrap_or(0.0);
    let practice_credit = record.sks_praktek.map(|v| v as f64).unwrap_or(0.0);
    let field_credit = record.sks_praktek_lapangan.map(|v| v as f64).unwrap_or(0.0);
    let sim_credit = record.sks_simulasi.map(|v| v as f64).unwrap_or(0.0);
    let has_unit = record.ada_sap.unwrap_or(false);
    let has_syllabus = record.ada_silabus.unwrap_or(false);
    let has_material = record.ada_bahan_ajar.unwrap_or(false);
    let has_practice = record.ada_acara_praktek.unwrap_or(false);
    let has_dictation = record.ada_diktat.unwrap_or(false);
    let start_date = record.tanggal_mulai_efektif.map(|dt| dt.date());
    let end_date = record.tanggal_selesai_efektif.map(|dt| dt.date());

    // Dynamic resolution for variety_id
    let variety_id = record
        .id_jenis_mata_kuliah
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .and_then(|code| cache.varieties_by_alphabet_code.get(&code.to_uppercase()))
        .or_else(|| {
            record
                .nama_jenis_mata_kuliah
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .and_then(|name| cache.varieties_by_name.get(&name.to_lowercase()))
        })
        .map(|v| v.id)
        .unwrap_or(Uuid::nil());

    // Dynamic resolution for group_id
    let group_id = record
        .id_kelompok_mata_kuliah
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .and_then(|code| cache.groups_by_alphabet_code.get(&code.to_uppercase()))
        .or_else(|| {
            record
                .nama_kelompok_mata_kuliah
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .and_then(|name| cache.groups_by_name.get(&name.to_lowercase()))
        })
        .map(|g| g.id)
        .or(Some(Uuid::nil()));

    if let Some(course) = existing {
        let mut active = course.into_active_model();
        active.code = Set(code);
        active.name = Set(name);
        active.implementation_method = Set(method);
        active.total_credit = Set(total_credit);
        active.lecture_credit = Set(lecture_credit);
        active.practice_credit = Set(practice_credit);
        active.field_practice_credit = Set(field_credit);
        active.simulation_credit = Set(sim_credit);
        active.has_unit = Set(has_unit);
        active.has_syllabus = Set(has_syllabus);
        active.has_material = Set(has_material);
        active.has_practice = Set(has_practice);
        active.has_dictation = Set(has_dictation);
        active.feeder_course_id = Set(record.id_matkul);
        active.unit_id = Set(unit.id);
        active.start_date = Set(start_date);
        active.end_date = Set(end_date);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        if variety_id != Uuid::nil() {
            active.variety_id = Set(variety_id);
        }
        if let Some(gid) = group_id {
            if gid != Uuid::nil() {
                active.group_id = Set(Some(gid));
            }
        }

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_course = AcademicCourse::ActiveModel {
            id: Set(Uuid::new_v4()),
            code: Set(code),
            name: Set(name),
            implementation_method: Set(method),
            total_credit: Set(total_credit),
            lecture_credit: Set(lecture_credit),
            practice_credit: Set(practice_credit),
            field_practice_credit: Set(field_credit),
            simulation_credit: Set(sim_credit),
            has_unit: Set(has_unit),
            has_syllabus: Set(has_syllabus),
            has_material: Set(has_material),
            has_practice: Set(has_practice),
            has_dictation: Set(has_dictation),
            feeder_course_id: Set(record.id_matkul),
            variety_id: Set(variety_id),
            group_id: Set(group_id),
            competence_id: Set(Some(Uuid::nil())),
            unit_id: Set(unit.id),
            start_date: Set(start_date),
            end_date: Set(end_date),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_course.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncMatakuliahToAcademicCourseMasterCourse {
    fn name(&self) -> &str {
        "SyncMatakuliahToAcademicCourseMasterCourse"
    }

    fn description(&self) -> &str {
        "Upsert matakuliah to academic_course_master.courses"
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

        // 2. Preload varieties
        let varieties = AcademicCourseVariety::Entity::find().all(db).await?;
        let mut varieties_by_alphabet_code = HashMap::new();
        let mut varieties_by_name = HashMap::new();
        for v in varieties {
            if let Some(ref code) = v.alphabet_code {
                let trimmed = code.trim().to_uppercase();
                if !trimmed.is_empty() {
                    varieties_by_alphabet_code.insert(trimmed, v.clone());
                }
            }
            let trimmed_name = v.name.trim().to_lowercase();
            if !trimmed_name.is_empty() {
                varieties_by_name.insert(trimmed_name, v);
            }
        }

        // 3. Preload groups
        let groups = AcademicCourseGroup::Entity::find().all(db).await?;
        let mut groups_by_alphabet_code = HashMap::new();
        let mut groups_by_name = HashMap::new();
        for g in groups {
            if let Some(ref code) = g.alphabet_code {
                let trimmed = code.trim().to_uppercase();
                if !trimmed.is_empty() {
                    groups_by_alphabet_code.insert(trimmed, g.clone());
                }
            }
            let trimmed_name = g.name.trim().to_lowercase();
            if !trimmed_name.is_empty() {
                groups_by_name.insert(trimmed_name, g);
            }
        }

        let cache = ReferenceCache {
            units_by_feeder_id,
            varieties_by_alphabet_code,
            varieties_by_name,
            groups_by_alphabet_code,
            groups_by_name,
        };

        // 4. Setup Progress Bar
        let pb = if show_progress {
            let bar = ProgressBar::new_spinner();
            bar.set_style(
                ProgressStyle::default_spinner()
                    .template("{spinner:.green} [{elapsed_precise}] {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_spinner()),
            );
            bar.enable_steady_tick(Duration::from_millis(100));
            bar.set_message("Counting feeder matakuliah records...");

            let total_records = FeederMatakuliah::Entity::find().count(db).await?;

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
            let records = FeederMatakuliah::Entity::find()
                .order_by_asc(FeederMatakuliah::Column::Id)
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

                match upsert_course(&txn, &record, unit, &cache).await {
                    Ok((_c, action)) => {
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
                        eprintln!("Error upserting course {:?}: {e}", record.kode_mata_kuliah);
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
