use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::riwayat_pendidikan_mahasiswa as riwayat_pendidikan_mahasiswa;

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

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInput>,
}

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;
        let mut success_count = 0;
        let mut error_count = 0;

        for (index, record) in args.records.iter().enumerate() {
            match Self::upsert_record(&txn, record).await {
                Ok(_action) => {
                    success_count += 1;
                }
                Err(e) => {
                    error_count += 1;
                    eprintln!("  ❌ Record {}/{}: Failed - error: {}", index + 1, args.records.len(), e);
                }
            }
        }

        if error_count > 0 {
            eprintln!("⚠️ Batch completed with {} successes and {} errors", success_count, error_count);
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
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
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

}
