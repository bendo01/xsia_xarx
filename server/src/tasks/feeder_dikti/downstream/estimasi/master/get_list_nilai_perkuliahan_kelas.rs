use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::nilai_perkuliahan_kelas as nilai_perkuliahan_kelas;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateListNilaiPerkuliahanKelas";
const API_ACTION: &str = "GetListNilaiPerkuliahanKelas";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "kode_mata_kuliah ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{de_date_dmy, de_opt_date_dmy, de_opt_f32, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_matkul: Uuid,
    pub kode_mata_kuliah: String,
    pub nama_mata_kuliah: String,
    pub id_kelas_kuliah: Uuid,
    pub nama_kelas_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_mahasiswa_krs: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_mahasiswa_dapat_nilai: Option<i32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_tm: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_prak: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_prak_lap: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_sim: Option<f32>,
    pub bahasan_case: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub a_selenggara_pditt: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub a_pengguna_pditt: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub kuota_pditt: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_mulai_koas: Option<Date>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_selesai_koas: Option<Date>,
    pub id_mou: Option<Uuid>,
    pub id_kls_pditt: Option<Uuid>,
    pub id_sms: Uuid,
    pub id_smt: String,
    #[serde(deserialize_with = "de_date_dmy")]
    pub tgl_create: Date,
    #[serde(deserialize_with = "de_opt_i32")]
    pub lingkup_kelas: Option<i32>,
    pub mode_kuliah: Option<String>,
    pub nm_smt: String,
    pub nama_prodi: String,
    pub status_sync: String,
}

pub struct EstimateListNilaiPerkuliahanKelas;

impl EstimateListNilaiPerkuliahanKelas {
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
            let current_total = active.total_data.as_ref().and_then(|x| *x).unwrap_or(0);
            active.total_data = Set(Some(current_total + processed_count));
            active.last_offset = Set(Some(offset + limit));
            active.updated_at = Set(Some(Local::now().naive_local()));

            active.update(&txn).await?;
        }

        txn.commit().await?;
        Ok(())
    }


    /// Upsert a single nilai_perkuliahan_kelas record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_kelas_kuliah` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // id_kelas_kuliah is required (not Option in ModelInput)
        let id_kelas_kuliah = record.id_kelas_kuliah;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = nilai_perkuliahan_kelas::Entity::find()
            .filter(nilai_perkuliahan_kelas::Column::DeletedAt.is_null())
            .filter(nilai_perkuliahan_kelas::Column::IdKelasKuliah.eq(id_kelas_kuliah))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: nilai_perkuliahan_kelas::ActiveModel =
                existing_record.into_active_model();

            active.id_matkul = Set(Some(record.id_matkul));
            active.kode_mata_kuliah = Set(Some(record.kode_mata_kuliah.clone()));
            active.nama_mata_kuliah = Set(Some(record.nama_mata_kuliah.clone()));
            active.nama_kelas_kuliah = Set(record.nama_kelas_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.jumlah_mahasiswa_krs = Set(record.jumlah_mahasiswa_krs);
            active.jumlah_mahasiswa_dapat_nilai = Set(record.jumlah_mahasiswa_dapat_nilai);
            active.sks_tm = Set(record.sks_tm);
            active.sks_prak = Set(record.sks_prak);
            active.sks_prak_lap = Set(record.sks_prak_lap);
            active.sks_sim = Set(record.sks_sim);
            active.bahasan_case = Set(record.bahasan_case.clone());
            active.a_selenggara_pditt = Set(record.a_selenggara_pditt);
            active.a_pengguna_pditt = Set(record.a_pengguna_pditt);
            active.kuota_pditt = Set(record.kuota_pditt);
            active.tgl_mulai_koas = Set(record.tgl_mulai_koas);
            active.tgl_selesai_koas = Set(record.tgl_selesai_koas);
            active.id_mou = Set(record.id_mou);
            active.id_kls_pditt = Set(record.id_kls_pditt);
            active.id_sms = Set(Some(record.id_sms));
            active.id_smt = Set(Some(record.id_smt.clone()));
            active.tgl_create = Set(Some(record.tgl_create));
            active.lingkup_kelas = Set(record.lingkup_kelas);
            active.mode_kuliah = Set(record.mode_kuliah.clone());
            active.nm_smt = Set(Some(record.nm_smt.clone()));
            active.nama_prodi = Set(Some(record.nama_prodi.clone()));
            active.status_sync = Set(Some(record.status_sync.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = nilai_perkuliahan_kelas::ActiveModel {
                id: Set(pk_id),
                id_kelas_kuliah: Set(Some(id_kelas_kuliah)),
                id_matkul: Set(Some(record.id_matkul)),
                kode_mata_kuliah: Set(Some(record.kode_mata_kuliah.clone())),
                nama_mata_kuliah: Set(Some(record.nama_mata_kuliah.clone())),
                nama_kelas_kuliah: Set(record.nama_kelas_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                jumlah_mahasiswa_krs: Set(record.jumlah_mahasiswa_krs),
                jumlah_mahasiswa_dapat_nilai: Set(record.jumlah_mahasiswa_dapat_nilai),
                sks_tm: Set(record.sks_tm),
                sks_prak: Set(record.sks_prak),
                sks_prak_lap: Set(record.sks_prak_lap),
                sks_sim: Set(record.sks_sim),
                bahasan_case: Set(record.bahasan_case.clone()),
                a_selenggara_pditt: Set(record.a_selenggara_pditt),
                a_pengguna_pditt: Set(record.a_pengguna_pditt),
                kuota_pditt: Set(record.kuota_pditt),
                tgl_mulai_koas: Set(record.tgl_mulai_koas),
                tgl_selesai_koas: Set(record.tgl_selesai_koas),
                id_mou: Set(record.id_mou),
                id_kls_pditt: Set(record.id_kls_pditt),
                id_sms: Set(Some(record.id_sms)),
                id_smt: Set(Some(record.id_smt.clone())),
                tgl_create: Set(Some(record.tgl_create)),
                lingkup_kelas: Set(record.lingkup_kelas),
                mode_kuliah: Set(record.mode_kuliah.clone()),
                nm_smt: Set(Some(record.nm_smt.clone())),
                nama_prodi: Set(Some(record.nama_prodi.clone())),
                status_sync: Set(Some(record.status_sync.clone())),
                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                created_by: Set(None),
                updated_by: Set(None),
                deleted_at: Set(None),
            };

            new_record.insert(txn).await?;
            "INSERTED"
        };

        // Commit transaction

        Ok(action.to_string())
    }


    async fn process_batch(
        db: &DatabaseConnection,
        records: &[ModelInput],
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

        let response = RequestData::get::<ModelInput>(
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
impl Task for EstimateListNilaiPerkuliahanKelas {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetListNilaiPerkuliahanKelas data from Feeder Dikti"
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
