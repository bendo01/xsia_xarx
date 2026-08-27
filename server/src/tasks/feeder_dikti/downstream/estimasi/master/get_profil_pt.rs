use chrono::{Local, NaiveDate, NaiveDateTime};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::profil_perguruan_tinggi as profil_perguruan_tinggi;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateGetProfilPT";
const API_ACTION: &str = "GetProfilPT";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "";
const DEFAULT_FILTER: &str = "";

/// Feeder model for GetAllPT endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetAllPTResponse {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub nama_singkat: Option<String>,
}

/// Feeder model for GetProfilPT endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetProfilPTResponse {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub telepon: Option<String>,
    pub faximile: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    pub rt_rw: Option<String>,
    pub kelurahan: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub lintang_bujur: Option<String>,
    pub bank: Option<String>,
    pub unit_cabang: Option<String>,
    pub nomor_rekening: Option<String>,
    pub mbs: Option<String>,
    pub luas_tanah_milik: Option<String>,
    pub luas_tanah_bukan_milik: Option<String>,
    pub sk_pendirian: Option<String>,
    pub tanggal_sk_pendirian: Option<String>, // Keep as String for now, parse later if needed
    pub id_status_milik: Option<String>,
    pub nama_status_milik: Option<String>,
    pub status_perguruan_tinggi: Option<String>,
    pub sk_izin_operasional: Option<String>,
    pub tanggal_izin_operasional: Option<String>,
}

pub struct EstimateGetProfilPT;

impl EstimateGetProfilPT {
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


    fn parse_date(date_str: Option<&String>) -> Option<NaiveDateTime> {
        date_str.and_then(|s| {
            // Try parsing ISO 8601 format first
            if let Ok(dt) = NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%.fZ") {
                return Some(dt);
            }
            // Try parsing YYYY-MM-DD format
            if let Ok(d) = chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d") {
                return Some(d.and_hms_opt(0, 0, 0).unwrap());
            }
            None
        })
    }

    async fn upsert_record(txn: &DatabaseTransaction, record: &GetProfilPTResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_perguruan_tinggi = record
            .id_perguruan_tinggi
            .ok_or_else(|| "id_perguruan_tinggi is missing".into())?;

        let sync_time = Local::now().naive_local();

        let existing = profil_perguruan_tinggi::Entity::find()
            .filter(profil_perguruan_tinggi::Column::DeletedAt.is_null())
            .filter(profil_perguruan_tinggi::Column::IdPerguruanTinggi.eq(id_perguruan_tinggi))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: profil_perguruan_tinggi::ActiveModel =
                existing_record.into_active_model();

            active.kode_perguruan_tinggi = Set(record.kode_perguruan_tinggi.clone());
            active.nama_perguruan_tinggi = Set(record.nama_perguruan_tinggi.clone());
            active.telepon = Set(record.telepon.clone());
            active.faximile = Set(record.faximile.clone());
            active.email = Set(record.email.clone());
            active.website = Set(record.website.clone());
            active.jalan = Set(record.jalan.clone());
            active.dusun = Set(record.dusun.clone());
            active.rt_rw = Set(record.rt_rw.clone());
            active.kelurahan = Set(record.kelurahan.clone());
            active.kode_pos = Set(record.kode_pos.clone());
            active.id_wilayah = Set(record.id_wilayah.clone());
            active.nama_wilayah = Set(record.nama_wilayah.clone());
            active.lintang_bujur = Set(record.lintang_bujur.clone());
            active.bank = Set(record.bank.clone());
            active.unit_cabang = Set(record.unit_cabang.clone());
            active.nomor_rekening = Set(record.nomor_rekening.clone());
            active.mbs = Set(record.mbs.clone());
            active.luas_tanah_milik = Set(record.luas_tanah_milik.clone());
            active.luas_tanah_bukan_milik = Set(record.luas_tanah_bukan_milik.clone());
            active.sk_pendirian = Set(record.sk_pendirian.clone());
            active.tanggal_sk_pendirian =
                Set(Self::parse_date(record.tanggal_sk_pendirian.as_ref()));
            active.id_status_milik = Set(record.id_status_milik.clone());
            active.nama_status_milik = Set(record.nama_status_milik.clone());
            active.status_perguruan_tinggi = Set(record.status_perguruan_tinggi.clone());
            active.sk_izin_operasional = Set(record.sk_izin_operasional.clone());
            active.tanggal_izin_operasional =
                Set(Self::parse_date(record.tanggal_izin_operasional.as_ref()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = profil_perguruan_tinggi::ActiveModel {
                id: Set(pk_id),
                id_perguruan_tinggi: Set(Some(id_perguruan_tinggi)),
                kode_perguruan_tinggi: Set(record.kode_perguruan_tinggi.clone()),
                nama_perguruan_tinggi: Set(record.nama_perguruan_tinggi.clone()),
                telepon: Set(record.telepon.clone()),
                faximile: Set(record.faximile.clone()),
                email: Set(record.email.clone()),
                website: Set(record.website.clone()),
                jalan: Set(record.jalan.clone()),
                dusun: Set(record.dusun.clone()),
                rt_rw: Set(record.rt_rw.clone()),
                kelurahan: Set(record.kelurahan.clone()),
                kode_pos: Set(record.kode_pos.clone()),
                id_wilayah: Set(record.id_wilayah.clone()),
                nama_wilayah: Set(record.nama_wilayah.clone()),
                lintang_bujur: Set(record.lintang_bujur.clone()),
                bank: Set(record.bank.clone()),
                unit_cabang: Set(record.unit_cabang.clone()),
                nomor_rekening: Set(record.nomor_rekening.clone()),
                mbs: Set(record.mbs.clone()),
                luas_tanah_milik: Set(record.luas_tanah_milik.clone()),
                luas_tanah_bukan_milik: Set(record.luas_tanah_bukan_milik.clone()),
                sk_pendirian: Set(record.sk_pendirian.clone()),
                tanggal_sk_pendirian: Set(Self::parse_date(record.tanggal_sk_pendirian.as_ref())),
                id_status_milik: Set(record.id_status_milik.clone()),
                nama_status_milik: Set(record.nama_status_milik.clone()),
                status_perguruan_tinggi: Set(record.status_perguruan_tinggi.clone()),
                sk_izin_operasional: Set(record.sk_izin_operasional.clone()),
                tanggal_izin_operasional: Set(Self::parse_date(
                    record.tanggal_izin_operasional.as_ref(),
                )),
                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                created_by: Set(None),
                updated_by: Set(None),
                deleted_at: Set(None),
                ..Default::default()
            };

            new_record.insert(txn).await?;
            "INSERTED"
        };


        Ok(action.to_string())
    }


    async fn process_batch(
        db: &DatabaseConnection,
        records: &[GetProfilPTResponse],
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

        let response = RequestData::get::<GetProfilPTResponse>(
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
impl Task for EstimateGetProfilPT {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetProfilPT data from Feeder Dikti"
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
