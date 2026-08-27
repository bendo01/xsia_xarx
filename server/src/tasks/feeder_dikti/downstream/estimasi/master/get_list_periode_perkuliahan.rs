use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::periode_perkuliahan as periode_perkuliahan;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateListPeriodePerkuliahan";
const API_ACTION: &str = "GetListPeriodePerkuliahan";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "id_semester DESC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32};

/// Model for GetListPeriodePerkuliahan API response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputListPeriodePerkuliahan {
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_semester: String,
    pub nama_semester: String,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub calon_ikut_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub calon_lulus_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub daftar_sbg_mhs: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub pst_undur_diri: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jml_mgu_kul: Option<i32>,
    pub metode_kul: Option<String>,
    pub metode_kul_eks: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub last_update: Option<NaiveDate>,
    pub status_sync: String,
}

/// Model for GetDetailPeriodePerkuliahan API response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputDetailPeriodePerkuliahan {
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_semester: String,
    pub nama_semester: String,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_pendaftar_ikut_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_pendaftar_lulus_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_daftar_ulang: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_mengundurkan_diri: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_minggu_pertemuan: Option<i32>,
    pub status_sync: String,
}

pub struct EstimateListPeriodePerkuliahan;

impl EstimateListPeriodePerkuliahan {
    fn get_institution_id() -> Result<Uuid, Box<dyn std::error::Error + Send + Sync>> {
        if let Ok(id_str) = std::env::var("CURRENT_INSTITUTION_ID") {
            if let Ok(id) = Uuid::parse_str(&id_str) {
                return Ok(id);
            }
        }
        Err("CURRENT_INSTITUTION_ID is not set or invalid".into())
    }

    async fn find_progress_record(
        db: &DatabaseConnection,
        institution_id: Uuid,
    ) -> Result<Option<FeederAkumulasiEstimasi::Model>, Box<dyn std::error::Error + Send + Sync>> {
        FeederAkumulasiEstimasi::Entity::find()
            .filter(FeederAkumulasiEstimasi::Column::DeletedAt.is_null())
            .filter(FeederAkumulasiEstimasi::Column::InstitutionId.eq(institution_id))
            .filter(FeederAkumulasiEstimasi::Column::Name.eq(TASK_NAME))
            .one(db)
            .await
            .map_err(|e| e.into())
    }

    async fn initialize_progress_record(
        db: &DatabaseConnection,
        institution_id: Uuid,
        existing_record: Option<FeederAkumulasiEstimasi::Model>,
    ) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;

        let limit = match existing_record {
            Some(record) => {
                let limit = record.total_data_per_request.unwrap_or(DEFAULT_LIMIT);
                let mut active: FeederAkumulasiEstimasi::ActiveModel = record.into_active_model();
                active.last_offset = Set(Some(0));
                active.total_data = Set(Some(0));
                active.updated_at = Set(Some(Local::now().naive_local()));

                active.update(&txn).await?;
                println!("Reset existing {} progress record", TASK_NAME);
                limit
            }
            None => {
                let pk_id = Uuid::new_v4();
                let now = Local::now().naive_local();

                let new_record = FeederAkumulasiEstimasi::ActiveModel {
                    id: Set(pk_id),
                    institution_id: Set(institution_id),
                    name: Set(TASK_NAME.to_string()),
                    total_data_per_request: Set(Some(DEFAULT_LIMIT)),
                    last_offset: Set(Some(0)),
                    total_data: Set(Some(0)),
                    created_at: Set(Some(now)),
                    updated_at: Set(Some(now)),
                    deleted_at: Set(None),
                    sync_at: Set(Some(now)),
                    created_by: Set(None),
                    updated_by: Set(None),
                };

                new_record.insert(&txn).await?;
                println!(
                    "Created new {} progress record for institution {}",
                    TASK_NAME, institution_id
                );
                DEFAULT_LIMIT
            }
        };

        txn.commit().await?;
        Ok(limit)
    }

    async fn update_progress(
        db: &DatabaseConnection,
        institution_id: Uuid,
        offset: i32,
        limit: i32,
        processed_count: i32,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;

        let record = FeederAkumulasiEstimasi::Entity::find()
            .filter(FeederAkumulasiEstimasi::Column::DeletedAt.is_null())
            .filter(FeederAkumulasiEstimasi::Column::InstitutionId.eq(institution_id))
            .filter(FeederAkumulasiEstimasi::Column::Name.eq(TASK_NAME))
            .one(&txn)
            .await?;

        if let Some(record) = record {
            let mut active: FeederAkumulasiEstimasi::ActiveModel = record.into_active_model();
            let current_total = active.total_data.as_ref().copied().unwrap_or(0);
            active.total_data = Set(Some(current_total + processed_count));
            active.last_offset = Set(Some(offset + limit));
            active.updated_at = Set(Some(Local::now().naive_local()));

            active.update(&txn).await?;
        }

        txn.commit().await?;
        Ok(())
    }


    /// Upsert a single periode perkuliahan record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_prodi` and `id_semester` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputListPeriodePerkuliahan) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists by unique constraint (id_prodi + id_semester)
        let existing = periode_perkuliahan::Entity::find()
            .filter(periode_perkuliahan::Column::DeletedAt.is_null())
            .filter(periode_perkuliahan::Column::IdProdi.eq(record.id_prodi))
            .filter(periode_perkuliahan::Column::IdSemester.eq(&record.id_semester))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: periode_perkuliahan::ActiveModel = existing_record.into_active_model();

            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.nama_semester = Set(Some(record.nama_semester.clone()));
            active.jumlah_target_mahasiswa_baru = Set(record.jumlah_target_mahasiswa_baru);
            active.tanggal_awal_perkuliahan = Set(record.tanggal_awal_perkuliahan);
            active.tanggal_akhir_perkuliahan = Set(record.tanggal_akhir_perkuliahan);

            // Map GetListPeriodePerkuliahan fields to database columns
            active.jumlah_pendaftar_ikut_seleksi = Set(record.calon_ikut_seleksi);
            active.jumlah_pendaftar_lulus_seleksi = Set(record.calon_lulus_seleksi);
            active.jumlah_daftar_ulang = Set(record.daftar_sbg_mhs);
            active.jumlah_mengundurkan_diri = Set(record.pst_undur_diri);
            active.jumlah_minggu_pertemuan = Set(record.jml_mgu_kul);

            active.metode_kul = Set(record.metode_kul.clone());
            active.metode_kul_eks = Set(record.metode_kul_eks.clone());
            active.tgl_create = Set(record.tgl_create);
            active.last_update = Set(record.last_update);
            active.status_sync = Set(Some(record.status_sync.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;

            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = periode_perkuliahan::ActiveModel {
                id: Set(pk_id),
                id_prodi: Set(Some(record.id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_semester: Set(Some(record.id_semester.clone())),
                nama_semester: Set(Some(record.nama_semester.clone())),
                jumlah_target_mahasiswa_baru: Set(record.jumlah_target_mahasiswa_baru),
                tanggal_awal_perkuliahan: Set(record.tanggal_awal_perkuliahan),
                tanggal_akhir_perkuliahan: Set(record.tanggal_akhir_perkuliahan),

                // Map GetListPeriodePerkuliahan fields to database columns
                jumlah_pendaftar_ikut_seleksi: Set(record.calon_ikut_seleksi),
                jumlah_pendaftar_lulus_seleksi: Set(record.calon_lulus_seleksi),
                jumlah_daftar_ulang: Set(record.daftar_sbg_mhs),
                jumlah_mengundurkan_diri: Set(record.pst_undur_diri),
                jumlah_minggu_pertemuan: Set(record.jml_mgu_kul),

                metode_kul: Set(record.metode_kul.clone()),
                metode_kul_eks: Set(record.metode_kul_eks.clone()),
                tgl_create: Set(record.tgl_create),
                last_update: Set(record.last_update),
                status_sync: Set(Some(record.status_sync.clone())),
                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                ..Default::default()
            };

            new_record.insert(txn).await?;

            "INSERTED"
        };

        // Commit transaction

        Ok(action.to_string())
    }


    async fn process_batch(
        db: &DatabaseConnection,
        records: &[ModelInputListPeriodePerkuliahan],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;
        let mut success_count = 0;
        let mut error_count = 0;

        for (index, record) in records.iter().enumerate() {
            match Self::upsert_record(&txn, record).await {
                Ok(_action) => {
                    success_count += 1;
                }
                Err(e) => {
                    error_count += 1;
                    eprintln!("  ❌ Record {}/{}: Failed - error: {}", index + 1, records.len(), e);
                }
            }
        }

        if error_count > 0 {
            eprintln!("⚠️ Batch completed with {} successes and {} errors", success_count, error_count);
        }

        txn.commit().await?;
        Ok(())
    }

    async fn fetch_and_process_page(
        db: &DatabaseConnection,
        _institution_id: Uuid,
        limit: i32,
        offset: i32,
    ) -> Result<usize, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔄 Fetching data for offset={}, limit={}", offset, limit);

        let response = RequestData::get::<ModelInputListPeriodePerkuliahan>(
            InputRequestData {
                act: API_ACTION.to_string(),
                filter: if DEFAULT_FILTER.is_empty() { None } else { Some(DEFAULT_FILTER.to_string()) },
                order: if DEFAULT_ORDER.is_empty() { None } else { Some(DEFAULT_ORDER.to_string()) },
                limit: Some(limit),
                offset: Some(offset),
            },
        )
        .await?;

        if let Some(error_desc) = &response.error_desc && !error_desc.is_empty() {
            return Err(format!(
                "API error (code: {}): {}",
                response.error_code, error_desc
            ).into());
        }

        let records = response.data.unwrap_or_default();
        let count = records.len();

        if count == 0 {
            println!("📭 No records found at offset={}", offset);
            return Ok(0);
        }

        println!("📦 Fetched {} records at offset={}", count, offset);
        Self::process_batch(db, &records).await?;
        println!("✅ Processed batch for offset={}", offset);

        Ok(count)
    }

    async fn process_paginated_data(
        db: &DatabaseConnection,
        institution_id: Uuid,
        limit: i32,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut offset = 0;
        let mut total_processed = 0;
        let mut page_number = 1;

        loop {
            println!("📄 Page {}: offset={}, limit={}", page_number, offset, limit);
            let count = Self::fetch_and_process_page(db, institution_id, limit, offset).await?;

            if count == 0 {
                println!(
                    "✅ Pagination completed at offset={}, total processed: {}",
                    offset, total_processed
                );
                break;
            }

            Self::update_progress(db, institution_id, offset, limit, count as i32).await?;

            total_processed += count;
            offset += limit;
            page_number += 1;

            if (count as i32) < limit {
                println!(
                    "✅ Last page reached (fetched {} < limit {}), total: {}",
                    count, limit, total_processed
                );
                break;
            }
        }

        println!(
            "🎉 Completed processing {} records across {} pages",
            total_processed, page_number
        );
        Ok(())
    }
}

#[async_trait]
impl Task for EstimateListPeriodePerkuliahan {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetListPeriodePerkuliahan data from Feeder Dikti"
    }

    async fn run(&self, db: &DatabaseConnection, _args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("Starting {} task", TASK_NAME);

        let institution_id = Self::get_institution_id()
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        let existing_record = Self::find_progress_record(db, institution_id)
            .await
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        let limit = Self::initialize_progress_record(db, institution_id, existing_record)
            .await
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        Self::process_paginated_data(db, institution_id, limit)
            .await
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        println!("✅ {} task completed successfully", TASK_NAME);
        Ok(())
    }
}
