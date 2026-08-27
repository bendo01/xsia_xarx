use chrono::{Local, NaiveDate, NaiveDateTime};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::riwayat_pendidikan_mahasiswa as riwayat_pendidikan_mahasiswa;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateListRiwayatPendidikanMahasiswa";
const API_ACTION: &str = "GetListRiwayatPendidikanMahasiswa";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "nim ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    // UUIDs
    pub id_registrasi_mahasiswa: Uuid,
    pub id_mahasiswa: Uuid,
    pub id_perguruan_tinggi: Uuid,
    pub id_prodi: Uuid,

    // Identifiers / names
    pub nim: String,
    pub nama_mahasiswa: String,
    pub nama_perguruan_tinggi: String,
    pub nama_program_studi: String,
    pub nama_jenis_daftar: Option<String>,
    pub keterangan_keluar: Option<String>,
    pub nama_program_studi_asal: Option<String>,
    pub nama_perguruan_tinggi_asal: Option<String>,
    pub nama_periode_masuk: String,
    pub nm_bidang_minat: Option<String>,
    pub nama_pembiayaan_awal: Option<String>,
    pub nama_ibu_kandung: String,
    pub status_sync: String,

    // Numeric codes (accept number | numeric string | null)
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_jenis_daftar: Option<i32>,

    #[serde(deserialize_with = "de_opt_i32")]
    pub id_jalur_daftar: Option<i32>,

    // Period codes often come as strings in source; treat as numeric code if you prefer
    // #[serde(deserialize_with = "de_opt_i32")]
    // pub id_periode_masuk: Option<i32>,
    pub id_periode_masuk: Option<String>,

    #[serde(deserialize_with = "de_opt_i32")]
    pub id_jenis_keluar: Option<i32>,

    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pembiayaan: Option<i32>,

    // #[serde(deserialize_with = "de_opt_i32")]
    // pub id_periode_keluar: Option<i32>,
    pub id_periode_keluar: Option<String>,

    // Optional UUIDs (may be null)
    pub id_perguruan_tinggi_asal: Option<Uuid>,
    pub id_prodi_asal: Option<Uuid>,

    // Other enums/flags stored as short strings in source
    pub jenis_kelamin: String,

    // Credits recognized: string digits or null in source → numeric here
    #[serde(deserialize_with = "de_opt_i32")]
    pub sks_diakui: Option<i32>,

    // Money/amount (source may send "0" or numbers). If values can exceed i32, consider adding a de_opt_i64 helper and switching to i64.
    #[serde(deserialize_with = "de_opt_i32")]
    pub biaya_masuk: Option<i32>,

    // Optional fields that look like categorical codes
    pub id_bidang_minat: Option<String>, // keep as String if it’s alphanumeric

    // Dates (accept dd-MM-yyyy, then fallback yyyy-MM-dd), or null/empty
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_daftar: Option<NaiveDate>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_keluar: Option<NaiveDate>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub last_update: Option<NaiveDate>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<NaiveDate>,
}

pub struct EstimateListRiwayatPendidikanMahasiswa;

impl EstimateListRiwayatPendidikanMahasiswa {
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


    /// Upsert a single riwayat_pendidikan_mahasiswa record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_registrasi_mahasiswa` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Start transaction
        let sync_time = Local::now().naive_local();

        // Build query to find existing record by id_registrasi_mahasiswa
        let existing = riwayat_pendidikan_mahasiswa::Entity::find()
            .filter(riwayat_pendidikan_mahasiswa::Column::DeletedAt.is_null())
            .filter(
                riwayat_pendidikan_mahasiswa::Column::IdRegistrasiMahasiswa
                    .eq(record.id_registrasi_mahasiswa),
            )
            .filter(
                riwayat_pendidikan_mahasiswa::Column::IdPerguruanTinggi
                    .eq(record.id_perguruan_tinggi),
            )
            .filter(riwayat_pendidikan_mahasiswa::Column::IdProdi.eq(record.id_prodi))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: riwayat_pendidikan_mahasiswa::ActiveModel =
                existing_record.into_active_model();

            active.id_registrasi_mahasiswa = Set(record.id_registrasi_mahasiswa);
            active.id_mahasiswa = Set(record.id_mahasiswa);
            active.id_perguruan_tinggi = Set(record.id_perguruan_tinggi);
            active.id_prodi = Set(record.id_prodi);
            active.nim = Set(record.nim.clone());
            active.nama_mahasiswa = Set(record.nama_mahasiswa.clone());
            active.nama_perguruan_tinggi = Set(record.nama_perguruan_tinggi.clone());
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.nama_jenis_daftar = Set(record.nama_jenis_daftar.clone());
            active.keterangan_keluar = Set(record.keterangan_keluar.clone());
            active.nama_program_studi_asal = Set(record.nama_program_studi_asal.clone());
            active.nama_perguruan_tinggi_asal = Set(record.nama_perguruan_tinggi_asal.clone());
            active.nama_periode_masuk = Set(record.nama_periode_masuk.clone());
            active.nm_bidang_minat = Set(record.nm_bidang_minat.clone());
            active.nama_pembiayaan_awal = Set(record.nama_pembiayaan_awal.clone());
            active.nama_ibu_kandung = Set(record.nama_ibu_kandung.clone());
            active.status_sync = Set(record.status_sync.clone());
            active.id_jenis_daftar = Set(record.id_jenis_daftar);
            active.id_jalur_daftar = Set(record.id_jalur_daftar);
            active.id_periode_masuk = Set(record.id_periode_masuk.clone());
            active.id_jenis_keluar = Set(record.id_jenis_keluar);
            active.id_pembiayaan = Set(record.id_pembiayaan);
            active.id_periode_keluar = Set(record.id_periode_keluar.clone());
            active.id_perguruan_tinggi_asal = Set(record.id_perguruan_tinggi_asal);
            active.id_prodi_asal = Set(record.id_prodi_asal);
            active.jenis_kelamin = Set(record.jenis_kelamin.clone());
            active.sks_diakui = Set(record.sks_diakui.map(|x| x as f32));
            active.biaya_masuk = Set(record.biaya_masuk);
            active.id_bidang_minat = Set(record.id_bidang_minat.clone());
            active.tanggal_daftar = Set(record.tanggal_daftar);
            active.tanggal_keluar = Set(record.tanggal_keluar);
            active.last_update = Set(record.last_update);
            active.tgl_create = Set(record.tgl_create);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = riwayat_pendidikan_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_registrasi_mahasiswa: Set(record.id_registrasi_mahasiswa),
                id_mahasiswa: Set(record.id_mahasiswa),
                id_perguruan_tinggi: Set(record.id_perguruan_tinggi),
                id_prodi: Set(record.id_prodi),
                nim: Set(record.nim.clone()),
                nama_mahasiswa: Set(record.nama_mahasiswa.clone()),
                nama_perguruan_tinggi: Set(record.nama_perguruan_tinggi.clone()),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                nama_jenis_daftar: Set(record.nama_jenis_daftar.clone()),
                keterangan_keluar: Set(record.keterangan_keluar.clone()),
                nama_program_studi_asal: Set(record.nama_program_studi_asal.clone()),
                nama_perguruan_tinggi_asal: Set(record.nama_perguruan_tinggi_asal.clone()),
                nama_periode_masuk: Set(record.nama_periode_masuk.clone()),
                nm_bidang_minat: Set(record.nm_bidang_minat.clone()),
                nama_pembiayaan_awal: Set(record.nama_pembiayaan_awal.clone()),
                nama_ibu_kandung: Set(record.nama_ibu_kandung.clone()),
                status_sync: Set(record.status_sync.clone()),
                id_jenis_daftar: Set(record.id_jenis_daftar),
                id_jalur_daftar: Set(record.id_jalur_daftar),
                id_periode_masuk: Set(record.id_periode_masuk.clone()),
                id_jenis_keluar: Set(record.id_jenis_keluar),
                id_pembiayaan: Set(record.id_pembiayaan),
                id_periode_keluar: Set(record.id_periode_keluar.clone()),
                id_perguruan_tinggi_asal: Set(record.id_perguruan_tinggi_asal),
                id_prodi_asal: Set(record.id_prodi_asal),
                jenis_kelamin: Set(record.jenis_kelamin.clone()),
                sks_diakui: Set(record.sks_diakui.map(|x| x as f32)),
                biaya_masuk: Set(record.biaya_masuk),
                id_bidang_minat: Set(record.id_bidang_minat.clone()),
                tanggal_daftar: Set(record.tanggal_daftar),
                tanggal_keluar: Set(record.tanggal_keluar),
                last_update: Set(record.last_update),
                tgl_create: Set(record.tgl_create),
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
impl Task for EstimateListRiwayatPendidikanMahasiswa {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetListRiwayatPendidikanMahasiswa data from Feeder Dikti"
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
