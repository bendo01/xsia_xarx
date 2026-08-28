use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection,
    EntityTrait, QueryFilter,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub async fn handle_job(
    args: WorkerArgs,
    db: Data<DatabaseConnection>,
) -> Result<(), std::io::Error> {
    Worker::perform(&db, args).await.map_err(|e| std::io::Error::other(e.to_string()))
}

pub async fn start_worker(
    redis_url: String,
    db: DatabaseConnection,
) -> Result<Monitor, std::io::Error> {
    let conn = apalis_redis::connect(redis_url)
        .await
        .map_err(|e| std::io::Error::other(e.to_string()))?;
    let storage: RedisStorage<WorkerArgs> = RedisStorage::new(conn);

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_periode_perkuliahan_to_academic_campaign_transaction_activities")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::academic::campaign::transaction::activities as AcademicCampaignTransactionActivity;
use crate::models::academic::general::reference::academic_years as AcademicGeneralReferenceAcademicYear;
use crate::models::feeder::master::periode_perkuliahan as FeederMasterPeriodePerkuliahan;
use crate::models::institution::master::institutions as InstitutionMasterInstitution;
use crate::models::institution::master::units as InstitutionMasterUnit;

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Serialize, Deserialize)]
pub struct WorkerArgs {
    pub model: FeederMasterPeriodePerkuliahan::Model,
}




async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

        let data = args.model;
        
        println!("Processing Periode Perkuliahan: {}", data.id);

        // 1. Resolve Unit (Program Studi) and Institution
        let (unit_id, unit_code, institution_code) = if let Some(id_prodi) = data.id_prodi {
            match InstitutionMasterUnit::Entity::find()
                .filter(InstitutionMasterUnit::Column::FeederId.eq(id_prodi))
                .find_also_related(InstitutionMasterInstitution::Entity)
                .one(db)
                .await
                ?
            {
                Some((unit, Some(institution))) => (unit.id, unit.code, institution.code.unwrap_or_else(|| "UNKNOWN".to_string())),
                Some((unit, None)) => {
                    tracing::warn!(
                        "Institution not found for Unit: {}. Using default code.",
                        unit.name.as_deref().unwrap_or("")
                    );
                    (unit.id, unit.code, "UNKNOWN".to_string())
                }
                None => {
                    tracing::warn!(
                        "Unit (Prodi) not found for feeder_id: {:?}. Skipping.",
                        id_prodi
                    );
                    return Ok(());
                }
            }
        } else {
            tracing::warn!("Periode Perkuliahan {} has no id_prodi. Skipping.", data.id);
            return Ok(());
        };

        // 2. Resolve Academic Year
        // Mapping `data.id_semester` (e.g. "20231") to AcademicYear
        // Based on previous analysis, `feeder_name` in AcademicYears might store this code.
        let academic_year_id = if let Some(id_semester) = &data.id_semester {
            match AcademicGeneralReferenceAcademicYear::Entity::find()
                .filter(AcademicGeneralReferenceAcademicYear::Column::FeederName.eq(id_semester))
                .one(db)
                .await
                ?
            {
                Some(ay) => ay.id,
                None => {
                    tracing::warn!(
                        "Academic Year not found for feeder_name: {}. Skipping.",
                        id_semester
                    );
                    return Ok(());
                }
            }
        } else {
            // Fallback or skip?
            tracing::warn!(
                "Periode Perkuliahan {} has no id_semester. Skipping.",
                data.id
            );
            return Ok(());
        };

        // 3. Upsert Activity
        // Check if exists by (academic_year_id AND unit_id)
        let existing = AcademicCampaignTransactionActivity::Entity::find()
            .filter(
                AcademicCampaignTransactionActivity::Column::AcademicYearId.eq(academic_year_id),
            )
            .filter(AcademicCampaignTransactionActivity::Column::UnitId.eq(unit_id))
            .one(db)
            .await
            ?;

        if let Some(model) = existing {
            let mut active_model: AcademicCampaignTransactionActivity::ActiveModel = model.into();

            // Map Fields for Update
            if active_model.feeder_id.as_ref().is_none() {
                active_model.feeder_id = Set(Some(data.id));
            }
            active_model.name = Set(format!(
                "Aktifitas {} {} {}",
                institution_code,
                unit_code.as_deref().unwrap_or(""),
                data.id_semester.clone().unwrap_or_default()
            ));
            active_model.unit_id = Set(unit_id);
            active_model.academic_year_id = Set(academic_year_id);
            active_model.week_quantity = Set(data.jumlah_minggu_pertemuan);
            active_model.student_target = Set(data.jumlah_target_mahasiswa_baru.unwrap_or(0));
            active_model.candidate_number = Set(data.jumlah_pendaftar_ikut_seleksi.unwrap_or(0));
            active_model.candidate_pass = Set(data.jumlah_pendaftar_lulus_seleksi.unwrap_or(0));
            active_model.became_student = Set(data.jumlah_daftar_ulang.unwrap_or(0));
            active_model.transfer_student = Set(0);
            active_model.total_class_member = Set(Some(40));
            active_model.start_date = Set(data.tanggal_awal_perkuliahan);
            active_model.end_date = Set(data.tanggal_akhir_perkuliahan);
            active_model.start_transaction = Set(data.tanggal_awal_perkuliahan);
            active_model.end_transaction = Set(data.tanggal_akhir_perkuliahan);
            active_model.is_active = Set(Some(false));
            active_model.sync_at = Set(Some(chrono::Utc::now().naive_utc()));
            active_model.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

            match active_model.update(db).await {
                Ok(m) => {
                    println!("✅ Updated Activity: {} (FeederID: {})", m.name, data.id);
                }
                Err(sea_orm::DbErr::RecordNotUpdated) => {
                    tracing::warn!(
                        "❌ Activity not updated (no changes or not found): {} (FeederID: {})",
                        data.id,
                        data.id
                    );
                }
                Err(e) => {
                    tracing::error!("Failed to update Activity: {}", e);
                    return Err(Box::new(e));
                }
            }
        } else {
            let mut active_model = AcademicCampaignTransactionActivity::ActiveModel {
                id: Set(Uuid::new_v4()),
                created_at: Set(Some(chrono::Utc::now().naive_utc())),
                updated_at: Set(Some(chrono::Utc::now().naive_utc())),
                ..Default::default()
            };

            active_model.feeder_id = Set(Some(data.id));

            // Map Fields for Insert
            active_model.name = Set(format!(
                "Aktifitas {} {} {}",
                institution_code,
                unit_code.as_deref().unwrap_or(""),
                data.id_semester.clone().unwrap_or_default()
            ));
            active_model.unit_id = Set(unit_id);
            active_model.academic_year_id = Set(academic_year_id);
            active_model.week_quantity = Set(data.jumlah_minggu_pertemuan);
            active_model.student_target = Set(data.jumlah_target_mahasiswa_baru.unwrap_or(0));
            active_model.candidate_number = Set(data.jumlah_pendaftar_ikut_seleksi.unwrap_or(0));
            active_model.candidate_pass = Set(data.jumlah_pendaftar_lulus_seleksi.unwrap_or(0));
            active_model.became_student = Set(data.jumlah_daftar_ulang.unwrap_or(0));
            active_model.transfer_student = Set(0);
            active_model.total_class_member = Set(Some(40));
            active_model.start_date = Set(data.tanggal_awal_perkuliahan);
            active_model.end_date = Set(data.tanggal_akhir_perkuliahan);
            active_model.start_transaction = Set(data.tanggal_awal_perkuliahan);
            active_model.end_transaction = Set(data.tanggal_akhir_perkuliahan);
            active_model.is_active = Set(Some(false));
            active_model.sync_at = Set(Some(chrono::Utc::now().naive_utc()));

            match active_model.insert(db).await {
                Ok(m) => {
                    println!("✅ Inserted Activity: {} (FeederID: {})", m.name, data.id);
                }
                Err(e) => {
                    tracing::error!("Failed to insert Activity: {}", e);
                    return Err(Box::new(e));
                }
            }
        }

        Ok(())
    
}