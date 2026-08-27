use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::matakuliah as matakuliah;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateListMatakuliah";
const API_ACTION: &str = "GetListMataKuliah";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "kode_mata_kuliah ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{
    de_opt_boolish,
    // de_opt_i32, // <-- use i32 version
    de_opt_date_dmy,
    de_opt_f32,
    de_opt_iso_datetime,
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputDetailMatakuliah {
    pub id_matkul: Uuid,
    pub kode_mata_kuliah: String,
    pub nama_mata_kuliah: String,
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_jenis_mata_kuliah: Option<String>,
    pub id_kelompok_mata_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_tatap_muka: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_praktek: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_praktek_lapangan: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_simulasi: Option<f32>,
    pub metode_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_sap: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_silabus: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_bahan_ajar: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_acara_praktek: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_diktat: Option<bool>,
    #[serde(deserialize_with = "de_opt_iso_datetime")]
    pub tanggal_mulai_efektif: Option<NaiveDateTime>,
    #[serde(deserialize_with = "de_opt_iso_datetime")]
    pub tanggal_selesai_efektif: Option<NaiveDateTime>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputListMatakuliah {
    pub id_jenj_didik: Option<String>,
    #[serde(deserialize_with = "de_opt_iso_datetime")]
    pub tgl_create: Option<NaiveDateTime>,
    pub id_matkul: Uuid,
    pub jns_mk: Option<String>,
    pub kel_mk: Option<String>,
    pub kode_mata_kuliah: String,
    pub nama_mata_kuliah: String,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_jenis_mata_kuliah: Option<String>,
    pub id_kelompok_mata_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_tatap_muka: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_praktek: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_praktek_lapangan: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_simulasi: Option<f32>,
    pub metode_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_sap: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_silabus: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_bahan_ajar: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_acara_praktek: Option<bool>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub ada_diktat: Option<bool>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_selesai_efektif: Option<NaiveDate>,
    pub nama_kelompok_mata_kuliah: Option<String>,
    pub nama_jenis_mata_kuliah: Option<String>,
    pub status_sync: Option<String>,
}

pub struct EstimateListMatakuliah;

impl EstimateListMatakuliah {
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


    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputListMatakuliah) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_matkul = record.id_matkul;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = matakuliah::Entity::find()
            .filter(matakuliah::Column::DeletedAt.is_null())
            .filter(matakuliah::Column::IdMatkul.eq(id_matkul))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: matakuliah::ActiveModel = existing_record.into_active_model();

            active.kode_mata_kuliah = Set(Some(record.kode_mata_kuliah.clone()));
            active.nama_mata_kuliah = Set(Some(record.nama_mata_kuliah.clone()));
            active.id_prodi = Set(Some(record.id_prodi));
            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.id_jenis_mata_kuliah = Set(record.id_jenis_mata_kuliah.clone());
            active.nama_jenis_mata_kuliah = Set(record.nama_jenis_mata_kuliah.clone());
            active.id_kelompok_mata_kuliah = Set(record.id_kelompok_mata_kuliah.clone());
            active.nama_kelompok_mata_kuliah = Set(record.nama_kelompok_mata_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.sks_tatap_muka = Set(record.sks_tatap_muka);
            active.sks_praktek = Set(record.sks_praktek);
            active.sks_praktek_lapangan = Set(record.sks_praktek_lapangan);
            active.sks_simulasi = Set(record.sks_simulasi);
            active.metode_kuliah = Set(record.metode_kuliah.clone());
            active.ada_sap = Set(record.ada_sap);
            active.ada_silabus = Set(record.ada_silabus);
            active.ada_bahan_ajar = Set(record.ada_bahan_ajar);
            active.ada_acara_praktek = Set(record.ada_acara_praktek);
            active.ada_diktat = Set(record.ada_diktat);
            active.tanggal_mulai_efektif = Set(record
                .tanggal_mulai_efektif
                .map(|d| d.and_hms_opt(0, 0, 0).unwrap()));
            active.tanggal_selesai_efektif = Set(record
                .tanggal_selesai_efektif
                .map(|d| d.and_hms_opt(0, 0, 0).unwrap()));
            active.id_jenj_didik = Set(record.id_jenj_didik.clone());
            active.tgl_create = Set(record.tgl_create);
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = matakuliah::ActiveModel {
                id: Set(pk_id),
                id_matkul: Set(Some(id_matkul)),
                kode_mata_kuliah: Set(Some(record.kode_mata_kuliah.clone())),
                nama_mata_kuliah: Set(Some(record.nama_mata_kuliah.clone())),
                id_prodi: Set(Some(record.id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_jenis_mata_kuliah: Set(record.id_jenis_mata_kuliah.clone()),
                nama_jenis_mata_kuliah: Set(record.nama_jenis_mata_kuliah.clone()),
                id_kelompok_mata_kuliah: Set(record.id_kelompok_mata_kuliah.clone()),
                nama_kelompok_mata_kuliah: Set(record.nama_kelompok_mata_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                sks_tatap_muka: Set(record.sks_tatap_muka),
                sks_praktek: Set(record.sks_praktek),
                sks_praktek_lapangan: Set(record.sks_praktek_lapangan),
                sks_simulasi: Set(record.sks_simulasi),
                metode_kuliah: Set(record.metode_kuliah.clone()),
                ada_sap: Set(record.ada_sap),
                ada_silabus: Set(record.ada_silabus),
                ada_bahan_ajar: Set(record.ada_bahan_ajar),
                ada_acara_praktek: Set(record.ada_acara_praktek),
                ada_diktat: Set(record.ada_diktat),
                tanggal_mulai_efektif: Set(record
                    .tanggal_mulai_efektif
                    .map(|d| d.and_hms_opt(0, 0, 0).unwrap())),
                tanggal_selesai_efektif: Set(record
                    .tanggal_selesai_efektif
                    .map(|d| d.and_hms_opt(0, 0, 0).unwrap())),
                id_jenj_didik: Set(record.id_jenj_didik.clone()),
                tgl_create: Set(record.tgl_create),
                status_sync: Set(record.status_sync.clone()),
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
        records: &[ModelInputListMatakuliah],
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

        let response = RequestData::get::<ModelInputListMatakuliah>(
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
impl Task for EstimateListMatakuliah {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetListMataKuliah data from Feeder Dikti"
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
