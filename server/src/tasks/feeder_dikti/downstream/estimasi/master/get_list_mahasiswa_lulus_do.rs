use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::mahasiswa_lulusan_dropout as mahasiswa_lulusan_dropout;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateListMahasiswaLulusDO";
const API_ACTION: &str = "GetListMahasiswaLulusDO";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "id_registrasi_mahasiswa ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{
    de_opt_date_dmy,
    de_opt_f32,
    // de_opt_i32, // <-- use i32 version
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputDetailMahasiswaLulusDO {
    pub id_registrasi_mahasiswa: Uuid,
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_mahasiswa: Uuid,
    pub nim: String,
    pub nama_mahasiswa: String,
    pub angkatan: String,
    pub id_jenis_keluar: String,
    pub nama_jenis_keluar: String,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_keluar: Option<NaiveDate>,
    pub keterangan: Option<String>,
    pub nomor_sk_yudisium: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_sk_yudisium: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ipk: Option<f32>,
    pub nomor_ijazah: Option<String>,
    pub jalur_skripsi: Option<String>,
    pub judul_skripsi: Option<String>,
    pub no_sertifikat_profesi: Option<String>,
    pub bulan_awal_bimbingan: Option<String>,
    pub bulan_akhir_bimbingan: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub pembimbing_ke: Option<i32>,
    pub asal_ijazah: String,
    pub id_periode_keluar: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputListMahasiswaLulusDO {
    pub id_registrasi_mahasiswa: Uuid,
    pub id_mahasiswa: Uuid,
    pub id_perguruan_tinggi: Uuid,
    pub id_prodi: Uuid,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_masuk_sp: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_keluar: Option<NaiveDate>,
    pub skhun: Option<String>,
    pub no_peserta_ujian: Option<String>,
    pub no_seri_ijazah: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<NaiveDate>,
    pub sks_diakui: Option<String>,
    pub jalur_skripsi: Option<String>,
    pub judul_skripsi: Option<String>,
    pub bln_awal_bimbingan: Option<String>,
    pub bln_akhir_bimbingan: Option<String>,
    pub sk_yudisium: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_sk_yudisium: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ipk: Option<f32>,
    pub sert_prof: Option<String>,
    pub a_pindah_mhs_asing: Option<String>,
    pub id_pt_asal: Option<Uuid>,
    pub id_prodi_asal: Option<Uuid>,
    pub nm_pt_asal: Option<String>,
    pub nm_prodi_asal: Option<String>,
    pub id_jns_daftar: String,
    pub id_jns_keluar: String,
    pub id_jalur_masuk: String,
    pub id_pembiayaan: Option<String>,
    pub id_minat_bidang: Option<String>,
    pub bidang_mayor: Option<String>,
    pub bidang_minor: Option<String>,
    pub biaya_masuk_kuliah: String,
    pub namapt: String,
    pub id_jur: String,
    pub nm_jns_daftar: String,
    pub nm_smt: String,
    pub nim: String,
    pub nama_mahasiswa: String,
    pub nama_program_studi: String,
    pub angkatan: String,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_keluar: Option<NaiveDate>,
    pub id_periode_keluar: String,
    pub keterangan: Option<String>,
    pub no_sertifikat_profesi: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_terbit_ijazah: Option<NaiveDate>,
    pub status_sync: String,
    pub nama_jenis_keluar: String,
}

pub struct EstimateListMahasiswaLulusDO;

impl EstimateListMahasiswaLulusDO {
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


    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputListMahasiswaLulusDO) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_registrasi_mahasiswa = record.id_registrasi_mahasiswa;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = mahasiswa_lulusan_dropout::Entity::find()
            .filter(mahasiswa_lulusan_dropout::Column::DeletedAt.is_null())
            .filter(
                mahasiswa_lulusan_dropout::Column::IdRegistrasiMahasiswa
                    .eq(id_registrasi_mahasiswa),
            )
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: mahasiswa_lulusan_dropout::ActiveModel =
                existing_record.into_active_model();

            active.id_mahasiswa = Set(Some(record.id_mahasiswa));
            active.id_perguruan_tinggi = Set(Some(record.id_perguruan_tinggi));
            active.id_prodi = Set(Some(record.id_prodi));
            active.tgl_masuk_sp = Set(record.tgl_masuk_sp);
            active.tgl_keluar = Set(record.tgl_keluar);
            active.skhun = Set(record.skhun.clone());
            active.no_peserta_ujian = Set(record.no_peserta_ujian.clone());
            active.sks_diakui = Set(record.sks_diakui.clone());
            active.jalur_skripsi = Set(record.jalur_skripsi.clone());
            active.judul_skripsi = Set(record.judul_skripsi.clone());
            active.bulan_awal_bimbingan = Set(record.bln_awal_bimbingan.clone());
            active.bulan_akhir_bimbingan = Set(record.bln_akhir_bimbingan.clone());
            active.nomor_sk_yudisium = Set(record.sk_yudisium.clone());
            active.tanggal_sk_yudisium = Set(record.tgl_sk_yudisium);
            active.ipk = Set(record.ipk);
            active.no_sertifikat_profesi = Set(record.sert_prof.clone());
            active.a_pindah_mhs_asing = Set(record.a_pindah_mhs_asing.clone());
            active.id_pt_asal = Set(record.id_pt_asal);
            active.id_prodi_asal = Set(record.id_prodi_asal);
            active.nm_pt_asal = Set(record.nm_pt_asal.clone());
            active.nm_prodi_asal = Set(record.nm_prodi_asal.clone());
            active.id_jns_daftar = Set(Some(record.id_jns_daftar.clone()));
            active.id_jenis_keluar = Set(record.id_jns_keluar.clone());
            active.id_jalur_masuk = Set(Some(record.id_jalur_masuk.clone()));
            active.id_pembiayaan = Set(record.id_pembiayaan.clone());
            active.id_minat_bidang = Set(record.id_minat_bidang.clone());
            active.bidang_mayor = Set(record.bidang_mayor.clone());
            active.bidang_minor = Set(record.bidang_minor.clone());
            active.biaya_masuk_kuliah = Set(Some(record.biaya_masuk_kuliah.clone()));
            active.namapt = Set(Some(record.namapt.clone()));
            active.id_jur = Set(Some(record.id_jur.clone()));
            active.nm_jns_daftar = Set(Some(record.nm_jns_daftar.clone()));
            active.nm_smt = Set(Some(record.nm_smt.clone()));
            active.nim = Set(Some(record.nim.clone()));
            active.nama_mahasiswa = Set(Some(record.nama_mahasiswa.clone()));
            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.angkatan = Set(Some(record.angkatan.clone()));
            active.tanggal_keluar = Set(record.tanggal_keluar);
            active.id_periode_keluar = Set(record.id_periode_keluar.clone());
            active.keterangan = Set(record.keterangan.clone());
            active.nomor_ijazah = Set(record.no_seri_ijazah.clone());
            active.tanggal_terbit_ijazah = Set(record.tanggal_terbit_ijazah);
            active.status_sync = Set(Some(record.status_sync.clone()));
            active.nama_jenis_keluar = Set(record.nama_jenis_keluar.clone());
            active.tgl_create = Set(record.tgl_create);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = mahasiswa_lulusan_dropout::ActiveModel {
                id: Set(pk_id),
                id_registrasi_mahasiswa: Set(Some(id_registrasi_mahasiswa)),
                id_mahasiswa: Set(Some(record.id_mahasiswa)),
                id_perguruan_tinggi: Set(Some(record.id_perguruan_tinggi)),
                id_prodi: Set(Some(record.id_prodi)),
                tgl_masuk_sp: Set(record.tgl_masuk_sp),
                tgl_keluar: Set(record.tgl_keluar),
                skhun: Set(record.skhun.clone()),
                no_peserta_ujian: Set(record.no_peserta_ujian.clone()),
                sks_diakui: Set(record.sks_diakui.clone()),
                jalur_skripsi: Set(record.jalur_skripsi.clone()),
                judul_skripsi: Set(record.judul_skripsi.clone()),
                bulan_awal_bimbingan: Set(record.bln_awal_bimbingan.clone()),
                bulan_akhir_bimbingan: Set(record.bln_akhir_bimbingan.clone()),
                nomor_sk_yudisium: Set(record.sk_yudisium.clone()),
                tanggal_sk_yudisium: Set(record.tgl_sk_yudisium),
                ipk: Set(record.ipk),
                no_sertifikat_profesi: Set(record.sert_prof.clone()),
                a_pindah_mhs_asing: Set(record.a_pindah_mhs_asing.clone()),
                id_pt_asal: Set(record.id_pt_asal),
                id_prodi_asal: Set(record.id_prodi_asal),
                nm_pt_asal: Set(record.nm_pt_asal.clone()),
                nm_prodi_asal: Set(record.nm_prodi_asal.clone()),
                id_jns_daftar: Set(Some(record.id_jns_daftar.clone())),
                id_jenis_keluar: Set(record.id_jns_keluar.clone()),
                id_jalur_masuk: Set(Some(record.id_jalur_masuk.clone())),
                id_pembiayaan: Set(record.id_pembiayaan.clone()),
                id_minat_bidang: Set(record.id_minat_bidang.clone()),
                bidang_mayor: Set(record.bidang_mayor.clone()),
                bidang_minor: Set(record.bidang_minor.clone()),
                biaya_masuk_kuliah: Set(Some(record.biaya_masuk_kuliah.clone())),
                namapt: Set(Some(record.namapt.clone())),
                id_jur: Set(Some(record.id_jur.clone())),
                nm_jns_daftar: Set(Some(record.nm_jns_daftar.clone())),
                nm_smt: Set(Some(record.nm_smt.clone())),
                nim: Set(Some(record.nim.clone())),
                nama_mahasiswa: Set(Some(record.nama_mahasiswa.clone())),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                angkatan: Set(Some(record.angkatan.clone())),
                tanggal_keluar: Set(record.tanggal_keluar),
                id_periode_keluar: Set(record.id_periode_keluar.clone()),
                keterangan: Set(record.keterangan.clone()),
                nomor_ijazah: Set(record.no_seri_ijazah.clone()),
                tanggal_terbit_ijazah: Set(record.tanggal_terbit_ijazah),
                status_sync: Set(Some(record.status_sync.clone())),
                nama_jenis_keluar: Set(record.nama_jenis_keluar.clone()),
                tgl_create: Set(record.tgl_create),
                asal_ijazah: Set(String::new()), // Not in List model, set default
                id_dosen: Set(None),
                nidn: Set(None),
                nuptk: Set(None),
                nama_dosen: Set(None),
                pembimbing_ke: Set(None),
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
        records: &[ModelInputListMahasiswaLulusDO],
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

        let response = RequestData::get::<ModelInputListMahasiswaLulusDO>(
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
impl Task for EstimateListMahasiswaLulusDO {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetListMahasiswaLulusDO data from Feeder Dikti"
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
