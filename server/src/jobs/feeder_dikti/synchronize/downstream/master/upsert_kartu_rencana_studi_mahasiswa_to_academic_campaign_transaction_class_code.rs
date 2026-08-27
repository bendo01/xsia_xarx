use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait, TryIntoModel,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::academic::campaign::transaction::activities as AcademicCampaignTransactionActivity;
use crate::models::academic::campaign::transaction::class_codes::{
    self, ActiveModel,
};
use crate::models::academic::general::reference::academic_years as AcademicGeneralReferenceAcademicYear;
use crate::models::feeder::master::kartu_rencana_studi_mahasiswa;
use crate::models::institution::master::institutions as InstitutionMasterInstitution;
use crate::models::institution::master::units as InstitutionMasterUnit;

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct WorkerArgs {
    pub record: kartu_rencana_studi_mahasiswa::Model,
}




async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

        let record = args.record;
        
        // 1. Get Unit by feeder_id = kartu.id_prodi
        let unit = if let Some(id_prodi) = record.id_prodi {
            InstitutionMasterUnit::Entity::find()
                .filter(InstitutionMasterUnit::Column::FeederId.eq(id_prodi))
                .one(db)
                .await
                .map_err(|e| e.into())?
        } else {
            None
        };

        let unit = match unit {
            Some(u) => u,
            None => {
                println!(
                    "❌ Unit not found for KMRS (id_prodi: {:?}). Skipping.",
                    record.id_prodi
                );
                return Ok(());
            }
        };

        // Load Institution for unit (needed for name generation)
        let institution = unit
            .find_related(InstitutionMasterInstitution::Entity)
            .one(db)
            .await
            .map_err(|e| e.into())?;

        let institution_code = match institution {
            Some(inst) => inst.code,
            None => {
                println!(
                    "❌ Institution not found for Unit {:?}. Using default code.",
                    unit.id
                );
                "UNKNOWN".to_string()
            }
        };

        // 2. Get AcademicYear by feeder_id = kartu.id_periode
        let academic_year = if let Some(id_periode) = &record.id_periode {
            AcademicGeneralReferenceAcademicYear::Entity::find()
                .filter(AcademicGeneralReferenceAcademicYear::Column::FeederName.eq(id_periode))
                .one(db)
                .await
                .map_err(|e| e.into())?
        } else {
            None
        };
        // NOTE: Prompt says "academic_year.feeder_id = record.id_periode".
        // BUT looking at academic_years model, there IS NO `feeder_id` column. There IS `feeder_name`.
        // `kartu.id_periode` (e.g. "20231") often maps to `feeder_name` or `code` or `name` in academic years.
        // Let's assume `feeder_name` based on common patterns or `name`.
        // Wait, looking at `academic_years.rs` model:
        // `pub feeder_name: String,`
        // `pub code: i32,`
        // `pub year: i32,`
        // The prompt says "get academic_year (@file...) where academic_year.feeder_id = kartu_rencana_studi_mahasiswa.id_periode"
        // But `academic_years` doesn't have `feeder_id`. It has `feeder_name`.
        // I will use `feeder_name` because `id_periode` in feeder is string like "20231".

        let academic_year = match academic_year {
            Some(ay) => ay,
            None => {
                // Fallback: try finding by name if feeder_name fails?
                // Or maybe the user meant `name`?
                // Given strict instructions, if I can't find `feeder_id` on model, I should look for closets match.
                // `feeder_name` is the most likely candidate for a string "ID" from feeder.
                println!(
                    "❌ AcademicYear not found for KMRS (id_periode: {:?}). Skipping.",
                    record.id_periode
                );
                return Ok(());
            }
        };

        // 3. Get UnitActivity where unit_id = unit.id AND academic_year_id = academic_year.id
        let unit_activity = AcademicCampaignTransactionActivity::Entity::find()
            .filter(AcademicCampaignTransactionActivity::Column::UnitId.eq(unit.id))
            .filter(
                AcademicCampaignTransactionActivity::Column::AcademicYearId.eq(academic_year.id),
            )
            .one(db)
            .await
            .map_err(|e| e.into())?;

        let unit_activity = match unit_activity {
            Some(ua) => ua,
            None => {
                println!(
                    "❌ Activity not found for Unit {:?} and AY {:?}. Skipping.",
                    unit.id, academic_year.id
                );
                return Ok(());
            }
        };

        // 4. Get ClassCode where unit_activity_id = unit_activity.id
        // Filter by `alphabet_code` as well to identify the specific class.
        let class_name_from_feeder = record.nama_kelas_kuliah.clone().unwrap_or_default();

        // Note: The prompt says "get class_code whre class_code.unit_activity_id = unit_activity.id"
        // Then upsert. Implies we need to find if it exists.
        // We will assume `alphabet_code` is the unique key per activity for this sync.

        let existing_class = class_codes::Entity::find()
            .filter(class_codes::Column::ActivityId.eq(unit_activity.id))
            .filter(class_codes::Column::AlphabetCode.eq(&class_name_from_feeder))
            .one(db)
            .await
            .map_err(|e| e.into())?;

        let mut active_model = if let Some(existing) = existing_class {
            existing.into_active_model()
        } else {
            let id = ();
            ActiveModel {
                id: Set(id),
                ..Default::default()
            }
        };

        // 5. Upsert Class Code
        // - alphabet_code: kartu.nama_kelas_kuliah
        active_model.alphabet_code = Set(Some(class_name_from_feeder.clone()));

        // - name: "KelasKuliah" space unit.institution.code space unit.code space academic_year.feeder_name space kartu.nama_kelas_kuliah
        let generated_name = format!(
            "KelasKuliah {} {} {} {}",
            institution_code, unit.code, academic_year.feeder_name, class_name_from_feeder
        );
        active_model.name = Set(generated_name.clone());

        // - activity_id: unit_activity.id
        active_model.activity_id = Set(unit_activity.id);

        // - start_effective_date: academic_year.start_date
        active_model.start_effective_date = Set(academic_year.start_date);

        // - end_effective_date: academic_year.end_date
        active_model.end_effective_date = Set(academic_year.end_date);

        // - unit_id = unit.id
        active_model.unit_id = Set(unit.id);

        // - capacity = 40
        active_model.capacity = Set(40);

        match active_model.save(db).await {
            Ok(_) => {
                println!("✅ Upserted ClassCode: {}", generated_name);
                Ok(())
            }
            Err(e) => {
                let msg = e.to_string();
                if msg.contains("RecordNotUpdated")
                    || msg.contains("None of the records are updated")
                {
                    println!(
                        "ℹ️ Skipped ClassCode Update (No Changes): {}",
                        generated_name
                    );
                    return Ok(());
                }
                Err(e.into())
            }
        }
    
}