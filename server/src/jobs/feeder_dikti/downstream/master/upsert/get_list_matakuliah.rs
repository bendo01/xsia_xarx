use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::matakuliah as matakuliah;

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

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInputListMatakuliah>,
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputListMatakuliah) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
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

}
