use chrono::{Local, NaiveDate, NaiveDateTime};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::penugasan_dosen as penugasan_dosen;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateDetailPenugasanDosen";
const API_ACTION: &str = "GetDetailPenugasanDosen";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "id_registrasi_dosen ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32, de_opt_iso_tanggal};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputDetailPenugasanDosen {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_surat_tugas: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub mulai_surat_tugas: Option<NaiveDate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputListPenugasanDosen {
    pub id_registrasi_dosen: Option<Uuid>,
    #[serde(rename = "jk")]
    pub jenis_kelamin: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_surat_tugas: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub mulai_surat_tugas: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub tgl_ptk_keluar: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_stat_pegawai: Option<i32>,
    pub id_jns_keluar: Option<String>,
    pub id_ikatan_kerja: Option<String>,
    #[serde(rename = "a_sp_homebase")]
    pub apakah_homebase: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputListPenugasanSemuaDosen {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub nuptk: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_prodi: Option<Uuid>,
    #[serde(rename = "program_studi")]
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_surat_tugas: Option<NaiveDate>,
    pub apakah_homebase: Option<String>,
}

pub struct EstimateDetailPenugasanDosen;

impl EstimateDetailPenugasanDosen {
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


    async fn upsert_record(
        ctx: &AppContext,
        record: &ModelInputDetailPenugasanDosen,
    ) -> Result<String> {
        // Validate that id_registrasi_dosen exists (it's the unique key)
        let id_registrasi_dosen = record
            .id_registrasi_dosen
            .ok_or_else(|| "Missing id_registrasi_dosen".into())?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = penugasan_dosen::Entity::find()
            .filter(penugasan_dosen::Column::DeletedAt.is_null())
            .filter(penugasan_dosen::Column::IdRegistrasiDosen.eq(id_registrasi_dosen))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: penugasan_dosen::ActiveModel = existing_record.into_active_model();

            active.id_tahun_ajaran = Set(record.id_tahun_ajaran.clone());
            active.nama_tahun_ajaran = Set(record.nama_tahun_ajaran.clone());
            active.id_perguruan_tinggi = Set(record.id_perguruan_tinggi);
            active.nama_perguruan_tinggi = Set(record.nama_perguruan_tinggi.clone());
            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.id_dosen = Set(record.id_dosen);
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.nomor_surat_tugas = Set(record.nomor_surat_tugas.clone());
            active.tanggal_surat_tugas = Set(record
                .tanggal_surat_tugas
                .map(|d| d.format("%d-%m-%Y").to_string()));
            active.mulai_surat_tugas = Set(record
                .mulai_surat_tugas
                .map(|d| d.format("%d-%m-%Y").to_string()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = penugasan_dosen::ActiveModel {
                id: Set(pk_id),
                id_registrasi_dosen: Set(Some(id_registrasi_dosen)),
                id_tahun_ajaran: Set(record.id_tahun_ajaran.clone()),
                nama_tahun_ajaran: Set(record.nama_tahun_ajaran.clone()),
                id_perguruan_tinggi: Set(record.id_perguruan_tinggi),
                nama_perguruan_tinggi: Set(record.nama_perguruan_tinggi.clone()),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                id_dosen: Set(record.id_dosen),
                nama_dosen: Set(record.nama_dosen.clone()),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                nomor_surat_tugas: Set(record.nomor_surat_tugas.clone()),
                tanggal_surat_tugas: Set(record
                    .tanggal_surat_tugas
                    .map(|d| d.format("%d-%m-%Y").to_string())),
                mulai_surat_tugas: Set(record
                    .mulai_surat_tugas
                    .map(|d| d.format("%d-%m-%Y").to_string())),
                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                created_by: Set(None),
                updated_by: Set(None),
                deleted_at: Set(None),
                jenis_kelamin: Set(None),
                tgl_create: Set(None),
                tgl_ptk_keluar: Set(None),
                id_stat_pegawai: Set(None),
                id_jns_keluar: Set(None),
                id_ikatan_kerja: Set(None),
                apakah_homebase: Set(None),
            };

            new_record.insert(txn).await?;
            "INSERTED"
        };

        // Commit transaction

        Ok(action.to_string())
    }


    async fn process_batch(
        db: &DatabaseConnection,
        records: &[ModelInputDetailPenugasanDosen],
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

        let response = RequestData::get::<ModelInputDetailPenugasanDosen>(
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
impl Task for EstimateDetailPenugasanDosen {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetDetailPenugasanDosen data from Feeder Dikti"
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
