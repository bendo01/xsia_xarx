use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::transkrip_mahasiswa as transkrip_mahasiswa;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateTranskripMahasiswa";
const API_ACTION: &str = "GetTranskripMahasiswa";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "kode_mata_kuliah ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::de_opt_f32;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_nilai_transfer: Option<String>,
    pub id_konversi_aktivitas: Option<String>,
    pub smt_diambil: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_indeks: Option<f32>,
}

pub struct EstimateTranskripMahasiswa;

impl EstimateTranskripMahasiswa {
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


    /// Upsert a single transkrip mahasiswa record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same unique combination exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// The unique combination can be:
    /// 1. id_nilai_transfer (for transfer credits)
    /// 2. id_konversi_aktivitas (for converted activities)
    /// 3. id_registrasi_mahasiswa + id_matkul + smt_diambil (for regular courses)
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

        // Build query to find existing record by unique combination
        let mut query = transkrip_mahasiswa::Entity::find()
            .filter(transkrip_mahasiswa::Column::DeletedAt.is_null());

        // Priority 1: Check by id_nilai_transfer (transfer credits)
        if let Some(ref id_transfer) = record.id_nilai_transfer {
            if !id_transfer.is_empty() {
                query = query
                    .filter(transkrip_mahasiswa::Column::IdNilaiTransfer.eq(id_transfer.clone()));
            }
        }
        // Priority 2: Check by id_konversi_aktivitas (converted activities)
        else if let Some(ref id_konversi) = record.id_konversi_aktivitas {
            if !id_konversi.is_empty() {
                query = query.filter(
                    transkrip_mahasiswa::Column::IdKonversiAktivitas.eq(id_konversi.clone()),
                );
            }
        }
        // Priority 3: Check by regular combination
        else {
            if let Some(id_reg) = record.id_registrasi_mahasiswa {
                query = query.filter(transkrip_mahasiswa::Column::IdRegistrasiMahasiswa.eq(id_reg));
            }

            if let Some(id_matkul) = record.id_matkul {
                query = query.filter(transkrip_mahasiswa::Column::IdMatkul.eq(id_matkul));
            }

            if let Some(ref smt) = record.smt_diambil {
                query = query.filter(transkrip_mahasiswa::Column::SmtDiambil.eq(smt.clone()));
            }

            if let Some(ref id_kelas_kuliah) = record.id_kelas_kuliah {
                query =
                    query.filter(transkrip_mahasiswa::Column::IdKelasKuliah.eq(*id_kelas_kuliah));
            }
        }

        let existing = query.one(txn).await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: transkrip_mahasiswa::ActiveModel = existing_record.into_active_model();

            active.id_registrasi_mahasiswa = Set(record.id_registrasi_mahasiswa);
            active.id_matkul = Set(record.id_matkul);
            active.id_kelas_kuliah = Set(record.id_kelas_kuliah);
            active.id_nilai_transfer = Set(record.id_nilai_transfer.clone());
            active.id_konversi_aktivitas = Set(record.id_konversi_aktivitas.clone());
            active.smt_diambil = Set(record.smt_diambil.clone());
            active.kode_mata_kuliah = Set(record.kode_mata_kuliah.clone());
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.nilai_angka = Set(record.nilai_angka);
            active.nilai_huruf = Set(record.nilai_huruf.clone());
            active.nilai_indeks = Set(record.nilai_indeks);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = transkrip_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_registrasi_mahasiswa: Set(record.id_registrasi_mahasiswa),
                id_matkul: Set(record.id_matkul),
                id_kelas_kuliah: Set(record.id_kelas_kuliah),
                id_nilai_transfer: Set(record.id_nilai_transfer.clone()),
                id_konversi_aktivitas: Set(record.id_konversi_aktivitas.clone()),
                smt_diambil: Set(record.smt_diambil.clone()),
                kode_mata_kuliah: Set(record.kode_mata_kuliah.clone()),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                nilai_angka: Set(record.nilai_angka),
                nilai_huruf: Set(record.nilai_huruf.clone()),
                nilai_indeks: Set(record.nilai_indeks),
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
impl Task for EstimateTranskripMahasiswa {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetTranskripMahasiswa data from Feeder Dikti"
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
