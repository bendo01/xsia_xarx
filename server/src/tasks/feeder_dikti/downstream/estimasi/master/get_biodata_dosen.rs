use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::biodata_dosen as biodata_dosen;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateBiodataDosen";
const API_ACTION: &str = "DetailBiodataDosen";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "nidn ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32, de_opt_iso_tanggal};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_dosen: Option<String>,
    pub nama_dosen: Option<String>,
    pub tempat_lahir: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir: Option<chrono::NaiveDate>,
    pub jenis_kelamin: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub id_status_aktif: Option<String>,
    pub nama_status_aktif: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_ibu_kandung: Option<String>,
    pub nik: Option<String>,
    pub nip: Option<String>,
    pub npwp: Option<String>,
    pub id_jenis_sdm: Option<String>,
    pub nama_jenis_sdm: Option<String>,
    pub no_sk_cpns: Option<String>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub tanggal_sk_cpns: Option<chrono::NaiveDate>,
    pub no_sk_pengangkatan: Option<String>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub mulai_sk_pengangkatan: Option<chrono::NaiveDate>,
    pub id_lembaga_pengangkatan: Option<String>,
    pub nama_lembaga_pengangkatan: Option<String>,
    pub id_pangkat_golongan: Option<String>,
    pub nama_pangkat_golongan: Option<String>,
    pub id_sumber_gaji: Option<String>,
    pub nama_sumber_gaji: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    pub rt: Option<String>,
    pub rw: Option<String>,
    pub ds_kel: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub telepon: Option<String>,
    pub handphone: Option<String>,
    pub email: Option<String>,
    pub status_pernikahan: Option<String>,
    pub nama_suami_istri: Option<String>,
    pub nip_suami_istri: Option<String>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub tanggal_mulai_pns: Option<chrono::NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pekerjaan_suami_istri: Option<i32>,
    pub nama_pekerjaan_suami_istri: Option<String>,
}

pub struct EstimateBiodataDosen;

impl EstimateBiodataDosen {
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


    /// Upsert a single biodata dosen record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_dosen` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that id_dosen exists (it's the unique key)
        let id_dosen_str = record
            .id_dosen
            .clone()
            .ok_or_else(|| "Missing id_dosen".into())?;

        let id_dosen = uuid::Uuid::parse_str(&id_dosen_str)
            .map_err(|e| format!("Invalid UUID for id_dosen: {}", e)))?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = biodata_dosen::Entity::find()
            .filter(biodata_dosen::Column::DeletedAt.is_null())
            .filter(biodata_dosen::Column::IdDosen.eq(id_dosen.into())
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: biodata_dosen::ActiveModel = existing_record.into_active_model();

            active.nama_dosen = Set(record.nama_dosen.clone());
            active.tempat_lahir = Set(record.tempat_lahir.clone());
            active.tanggal_lahir = Set(record.tanggal_lahir);
            active.jenis_kelamin = Set(record.jenis_kelamin.clone());
            active.id_agama = Set(record.id_agama.map(|v| v.to_string()));
            active.nama_agama = Set(record.nama_agama.clone());
            active.id_status_aktif = Set(record.id_status_aktif.clone());
            active.nama_status_aktif = Set(record.nama_status_aktif.clone());
            active.nidn = Set(record.nidn.clone());
            active.nama_ibu_kandung = Set(record.nama_ibu_kandung.clone());
            active.nik = Set(record.nik.clone());
            active.nip = Set(record.nip.clone());
            active.npwp = Set(record.npwp.clone());
            active.id_jenis_sdm = Set(record.id_jenis_sdm.clone());
            active.nama_jenis_sdm = Set(record.nama_jenis_sdm.clone());
            active.no_sk_cpns = Set(record.no_sk_cpns.clone());
            active.tanggal_sk_cpns = Set(record.tanggal_sk_cpns);
            active.no_sk_pengangkatan = Set(record.no_sk_pengangkatan.clone());
            active.mulai_sk_pengangkatan = Set(record.mulai_sk_pengangkatan.map(|d| d.to_string()));
            active.id_lembaga_pengangkatan = Set(record.id_lembaga_pengangkatan.clone());
            active.nama_lembaga_pengangkatan = Set(record.nama_lembaga_pengangkatan.clone());
            active.id_pangkat_golongan = Set(record.id_pangkat_golongan.clone());
            active.nama_pangkat_golongan = Set(record.nama_pangkat_golongan.clone());
            active.id_sumber_gaji = Set(record.id_sumber_gaji.clone());
            active.nama_sumber_gaji = Set(record.nama_sumber_gaji.clone());
            active.jalan = Set(record.jalan.clone());
            active.dusun = Set(record.dusun.clone());
            active.rt = Set(record.rt.clone());
            active.rw = Set(record.rw.clone());
            active.ds_kel = Set(record.ds_kel.clone());
            active.kode_pos = Set(record.kode_pos.clone());
            active.id_wilayah = Set(record.id_wilayah.clone());
            active.nama_wilayah = Set(record.nama_wilayah.clone());
            active.telepon = Set(record.telepon.clone());
            active.handphone = Set(record.handphone.clone());
            active.email = Set(record.email.clone());
            active.status_pernikahan = Set(record.status_pernikahan.clone());
            active.nama_suami_istri = Set(record.nama_suami_istri.clone());
            active.nip_suami_istri = Set(record.nip_suami_istri.clone());
            active.tanggal_mulai_pns = Set(record.tanggal_mulai_pns);
            active.id_pekerjaan_suami_istri = Set(record.id_pekerjaan_suami_istri);
            active.nama_pekerjaan_suami_istri = Set(record.nama_pekerjaan_suami_istri.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = biodata_dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen.to_string())),
                nama_dosen: Set(record.nama_dosen.clone()),
                tempat_lahir: Set(record.tempat_lahir.clone()),
                tanggal_lahir: Set(record.tanggal_lahir),
                jenis_kelamin: Set(record.jenis_kelamin.clone()),
                id_agama: Set(record.id_agama.map(|v| v.to_string())),
                nama_agama: Set(record.nama_agama.clone()),
                id_status_aktif: Set(record.id_status_aktif.clone()),
                nama_status_aktif: Set(record.nama_status_aktif.clone()),
                nidn: Set(record.nidn.clone()),
                nama_ibu_kandung: Set(record.nama_ibu_kandung.clone()),
                nik: Set(record.nik.clone()),
                nip: Set(record.nip.clone()),
                npwp: Set(record.npwp.clone()),
                id_jenis_sdm: Set(record.id_jenis_sdm.clone()),
                nama_jenis_sdm: Set(record.nama_jenis_sdm.clone()),
                no_sk_cpns: Set(record.no_sk_cpns.clone()),
                tanggal_sk_cpns: Set(record.tanggal_sk_cpns),
                no_sk_pengangkatan: Set(record.no_sk_pengangkatan.clone()),
                mulai_sk_pengangkatan: Set(record.mulai_sk_pengangkatan.map(|d| d.to_string())),
                id_lembaga_pengangkatan: Set(record.id_lembaga_pengangkatan.clone()),
                nama_lembaga_pengangkatan: Set(record.nama_lembaga_pengangkatan.clone()),
                id_pangkat_golongan: Set(record.id_pangkat_golongan.clone()),
                nama_pangkat_golongan: Set(record.nama_pangkat_golongan.clone()),
                id_sumber_gaji: Set(record.id_sumber_gaji.clone()),
                nama_sumber_gaji: Set(record.nama_sumber_gaji.clone()),
                jalan: Set(record.jalan.clone()),
                dusun: Set(record.dusun.clone()),
                rt: Set(record.rt.clone()),
                rw: Set(record.rw.clone()),
                ds_kel: Set(record.ds_kel.clone()),
                kode_pos: Set(record.kode_pos.clone()),
                id_wilayah: Set(record.id_wilayah.clone()),
                nama_wilayah: Set(record.nama_wilayah.clone()),
                telepon: Set(record.telepon.clone()),
                handphone: Set(record.handphone.clone()),
                email: Set(record.email.clone()),
                status_pernikahan: Set(record.status_pernikahan.clone()),
                nama_suami_istri: Set(record.nama_suami_istri.clone()),
                nip_suami_istri: Set(record.nip_suami_istri.clone()),
                tanggal_mulai_pns: Set(record.tanggal_mulai_pns),
                id_pekerjaan_suami_istri: Set(record.id_pekerjaan_suami_istri),
                nama_pekerjaan_suami_istri: Set(record.nama_pekerjaan_suami_istri.clone()),
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
impl Task for EstimateBiodataDosen {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process DetailBiodataDosen data from Feeder Dikti"
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
