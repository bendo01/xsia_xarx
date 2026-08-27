use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::biodata_mahasiswa as biodata_mahasiswa;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateBiodataMahasiswa";
const API_ACTION: &str = "GetBiodataMahasiswa";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "nik ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{
    de_opt_boolish,
    de_opt_date_dmy,
    de_opt_i32, // <-- use i32 version
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub nama_mahasiswa: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub tempat_lahir: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir: Option<chrono::NaiveDate>,
    pub id_mahasiswa: Option<uuid::Uuid>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub nik: Option<String>,
    pub nisn: Option<String>,
    pub npwp: Option<String>,
    pub id_negara: Option<String>,
    pub kewarganegaraan: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub rt: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub rw: Option<i32>,
    pub kelurahan: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub id_jenis_tinggal: Option<String>,
    pub nama_jenis_tinggal: Option<String>,
    pub id_alat_transportasi: Option<String>,
    pub nama_alat_transportasi: Option<String>,
    pub telepon: Option<String>,
    pub handphone: Option<String>,
    pub email: Option<String>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub penerima_kps: Option<bool>,
    pub nomor_kps: Option<String>,
    pub nik_ayah: Option<String>,
    pub nama_ayah: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir_ayah: Option<chrono::NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pendidikan_ayah: Option<i32>,
    pub nama_pendidikan_ayah: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pekerjaan_ayah: Option<i32>,
    pub nama_pekerjaan_ayah: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_penghasilan_ayah: Option<i32>,
    pub nama_penghasilan_ayah: Option<String>,
    pub nik_ibu: Option<String>,
    pub nama_ibu_kandung: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir_ibu: Option<chrono::NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pendidikan_ibu: Option<i32>,
    pub nama_pendidikan_ibu: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pekerjaan_ibu: Option<i32>,
    pub nama_pekerjaan_ibu: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_penghasilan_ibu: Option<i32>,
    pub nama_penghasilan_ibu: Option<String>,
    pub nama_wali: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir_wali: Option<chrono::NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pendidikan_wali: Option<i32>,
    pub nama_pendidikan_wali: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pekerjaan_wali: Option<i32>,
    pub nama_pekerjaan_wali: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_penghasilan_wali: Option<i32>,
    pub nama_penghasilan_wali: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_kebutuhan_khusus_mahasiswa: Option<i32>,
    pub nama_kebutuhan_khusus_mahasiswa: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_kebutuhan_khusus_ayah: Option<i32>,
    pub nama_kebutuhan_khusus_ayah: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_kebutuhan_khusus_ibu: Option<i32>,
    pub nama_kebutuhan_khusus_ibu: Option<String>,
    pub status_sync: Option<String>,
}

pub struct EstimateBiodataMahasiswa;

impl EstimateBiodataMahasiswa {
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
            let current_total = record.total_data.unwrap_or(0);
            let mut active: FeederAkumulasiEstimasi::ActiveModel = record.into_active_model();
            active.total_data = Set(Some(current_total + processed_count));
            active.last_offset = Set(Some(offset + limit));
            active.updated_at = Set(Some(Local::now().naive_local()));

            active.update(&txn).await?;
        }

        txn.commit().await?;
        Ok(())
    }


    /// Upsert a single biodata mahasiswa record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_mahasiswa` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that id_mahasiswa exists (it's the unique key)
        let id_mahasiswa = record
            .id_mahasiswa
            .ok_or("Missing id_mahasiswa")?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = biodata_mahasiswa::Entity::find()
            .filter(biodata_mahasiswa::Column::DeletedAt.is_null())
            .filter(biodata_mahasiswa::Column::IdMahasiswa.eq(id_mahasiswa))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: biodata_mahasiswa::ActiveModel = existing_record.into_active_model();

            active.nama_mahasiswa = Set(record.nama_mahasiswa.clone());
            active.jenis_kelamin = Set(record.jenis_kelamin.clone());
            active.tempat_lahir = Set(record.tempat_lahir.clone());
            active.tanggal_lahir = Set(record.tanggal_lahir);
            active.id_agama = Set(record.id_agama);
            active.nama_agama = Set(record.nama_agama.clone());
            active.nik = Set(record.nik.clone());
            active.nisn = Set(record.nisn.clone());
            active.npwp = Set(record.npwp.clone());
            active.id_negara = Set(record.id_negara.clone());
            active.kewarganegaraan = Set(record.kewarganegaraan.clone());
            active.jalan = Set(record.jalan.clone());
            active.dusun = Set(record.dusun.clone());
            active.rt = Set(record.rt);
            active.rw = Set(record.rw);
            active.kelurahan = Set(record.kelurahan.clone());
            active.kode_pos = Set(record.kode_pos.clone());
            active.id_wilayah = Set(record.id_wilayah.clone());
            active.nama_wilayah = Set(record.nama_wilayah.clone());
            active.id_jenis_tinggal = Set(record.id_jenis_tinggal.clone());
            active.nama_jenis_tinggal = Set(record.nama_jenis_tinggal.clone());
            active.id_alat_transportasi = Set(record.id_alat_transportasi.clone());
            active.nama_alat_transportasi = Set(record.nama_alat_transportasi.clone());
            active.telepon = Set(record.telepon.clone());
            active.handphone = Set(record.handphone.clone());
            active.email = Set(record.email.clone());
            active.penerima_kps = Set(record.penerima_kps);
            active.nomor_kps = Set(record.nomor_kps.clone());
            active.nik_ayah = Set(record.nik_ayah.clone());
            active.nama_ayah = Set(record.nama_ayah.clone());
            active.tanggal_lahir_ayah = Set(record.tanggal_lahir_ayah);
            active.id_pendidikan_ayah = Set(record.id_pendidikan_ayah);
            active.nama_pendidikan_ayah = Set(record.nama_pendidikan_ayah.clone());
            active.id_pekerjaan_ayah = Set(record.id_pekerjaan_ayah);
            active.nama_pekerjaan_ayah = Set(record.nama_pekerjaan_ayah.clone());
            active.id_penghasilan_ayah = Set(record.id_penghasilan_ayah);
            active.nama_penghasilan_ayah = Set(record.nama_penghasilan_ayah.clone());
            active.nik_ibu = Set(record.nik_ibu.clone());
            active.nama_ibu_kandung = Set(record.nama_ibu_kandung.clone());
            active.tanggal_lahir_ibu = Set(record.tanggal_lahir_ibu);
            active.id_pendidikan_ibu = Set(record.id_pendidikan_ibu);
            active.nama_pendidikan_ibu = Set(record.nama_pendidikan_ibu.clone());
            active.id_pekerjaan_ibu = Set(record.id_pekerjaan_ibu);
            active.nama_pekerjaan_ibu = Set(record.nama_pekerjaan_ibu.clone());
            active.id_penghasilan_ibu = Set(record.id_penghasilan_ibu);
            active.nama_penghasilan_ibu = Set(record.nama_penghasilan_ibu.clone());
            active.nama_wali = Set(record.nama_wali.clone());
            active.tanggal_lahir_wali = Set(record.tanggal_lahir_wali);
            active.id_pendidikan_wali = Set(record.id_pendidikan_wali);
            active.nama_pendidikan_wali = Set(record.nama_pendidikan_wali.clone());
            active.id_pekerjaan_wali = Set(record.id_pekerjaan_wali);
            active.nama_pekerjaan_wali = Set(record.nama_pekerjaan_wali.clone());
            active.id_penghasilan_wali = Set(record.id_penghasilan_wali);
            active.nama_penghasilan_wali = Set(record.nama_penghasilan_wali.clone());
            active.id_kebutuhan_khusus_mahasiswa = Set(record.id_kebutuhan_khusus_mahasiswa);
            active.nama_kebutuhan_khusus_mahasiswa =
                Set(record.nama_kebutuhan_khusus_mahasiswa.clone());
            active.id_kebutuhan_khusus_ayah = Set(record.id_kebutuhan_khusus_ayah);
            active.nama_kebutuhan_khusus_ayah = Set(record.nama_kebutuhan_khusus_ayah.clone());
            active.id_kebutuhan_khusus_ibu = Set(record.id_kebutuhan_khusus_ibu);
            active.nama_kebutuhan_khusus_ibu = Set(record.nama_kebutuhan_khusus_ibu.clone());
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = biodata_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_mahasiswa: Set(Some(id_mahasiswa)),
                nama_mahasiswa: Set(record.nama_mahasiswa.clone()),
                jenis_kelamin: Set(record.jenis_kelamin.clone()),
                tempat_lahir: Set(record.tempat_lahir.clone()),
                tanggal_lahir: Set(record.tanggal_lahir),
                id_agama: Set(record.id_agama),
                nama_agama: Set(record.nama_agama.clone()),
                nik: Set(record.nik.clone()),
                nisn: Set(record.nisn.clone()),
                npwp: Set(record.npwp.clone()),
                id_negara: Set(record.id_negara.clone()),
                kewarganegaraan: Set(record.kewarganegaraan.clone()),
                jalan: Set(record.jalan.clone()),
                dusun: Set(record.dusun.clone()),
                rt: Set(record.rt),
                rw: Set(record.rw),
                kelurahan: Set(record.kelurahan.clone()),
                kode_pos: Set(record.kode_pos.clone()),
                id_wilayah: Set(record.id_wilayah.clone()),
                nama_wilayah: Set(record.nama_wilayah.clone()),
                id_jenis_tinggal: Set(record.id_jenis_tinggal.clone()),
                nama_jenis_tinggal: Set(record.nama_jenis_tinggal.clone()),
                id_alat_transportasi: Set(record.id_alat_transportasi.clone()),
                nama_alat_transportasi: Set(record.nama_alat_transportasi.clone()),
                telepon: Set(record.telepon.clone()),
                handphone: Set(record.handphone.clone()),
                email: Set(record.email.clone()),
                penerima_kps: Set(record.penerima_kps),
                nomor_kps: Set(record.nomor_kps.clone()),
                nik_ayah: Set(record.nik_ayah.clone()),
                nama_ayah: Set(record.nama_ayah.clone()),
                tanggal_lahir_ayah: Set(record.tanggal_lahir_ayah),
                id_pendidikan_ayah: Set(record.id_pendidikan_ayah),
                nama_pendidikan_ayah: Set(record.nama_pendidikan_ayah.clone()),
                id_pekerjaan_ayah: Set(record.id_pekerjaan_ayah),
                nama_pekerjaan_ayah: Set(record.nama_pekerjaan_ayah.clone()),
                id_penghasilan_ayah: Set(record.id_penghasilan_ayah),
                nama_penghasilan_ayah: Set(record.nama_penghasilan_ayah.clone()),
                nik_ibu: Set(record.nik_ibu.clone()),
                nama_ibu_kandung: Set(record.nama_ibu_kandung.clone()),
                tanggal_lahir_ibu: Set(record.tanggal_lahir_ibu),
                id_pendidikan_ibu: Set(record.id_pendidikan_ibu),
                nama_pendidikan_ibu: Set(record.nama_pendidikan_ibu.clone()),
                id_pekerjaan_ibu: Set(record.id_pekerjaan_ibu),
                nama_pekerjaan_ibu: Set(record.nama_pekerjaan_ibu.clone()),
                id_penghasilan_ibu: Set(record.id_penghasilan_ibu),
                nama_penghasilan_ibu: Set(record.nama_penghasilan_ibu.clone()),
                nama_wali: Set(record.nama_wali.clone()),
                tanggal_lahir_wali: Set(record.tanggal_lahir_wali),
                id_pendidikan_wali: Set(record.id_pendidikan_wali),
                nama_pendidikan_wali: Set(record.nama_pendidikan_wali.clone()),
                id_pekerjaan_wali: Set(record.id_pekerjaan_wali),
                nama_pekerjaan_wali: Set(record.nama_pekerjaan_wali.clone()),
                id_penghasilan_wali: Set(record.id_penghasilan_wali),
                nama_penghasilan_wali: Set(record.nama_penghasilan_wali.clone()),
                id_kebutuhan_khusus_mahasiswa: Set(record.id_kebutuhan_khusus_mahasiswa),
                nama_kebutuhan_khusus_mahasiswa: Set(record
                    .nama_kebutuhan_khusus_mahasiswa
                    .clone()),
                id_kebutuhan_khusus_ayah: Set(record.id_kebutuhan_khusus_ayah),
                nama_kebutuhan_khusus_ayah: Set(record.nama_kebutuhan_khusus_ayah.clone()),
                id_kebutuhan_khusus_ibu: Set(record.id_kebutuhan_khusus_ibu),
                nama_kebutuhan_khusus_ibu: Set(record.nama_kebutuhan_khusus_ibu.clone()),
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
impl Task for EstimateBiodataMahasiswa {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetBiodataMahasiswa data from Feeder Dikti"
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
