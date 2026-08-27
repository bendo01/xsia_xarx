use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::peserta_kelas_kuliah as peserta_kelas_kuliah;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub angkatan: Option<String>,
    pub status_sync: Option<String>,
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_kelas_kuliah = record
            .id_kelas_kuliah
            .ok_or_else(|| "id_kelas_kuliah is required for upsert".into())?;

        let id_registrasi_mahasiswa = record.id_registrasi_mahasiswa.ok_or_else(|| {
            "id_registrasi_mahasiswa is required for upsert".into()
        })?;

        let sync_time = Local::now().naive_local();

        let existing = peserta_kelas_kuliah::Entity::find()
            .filter(peserta_kelas_kuliah::Column::DeletedAt.is_null())
            .filter(peserta_kelas_kuliah::Column::IdKelasKuliah.eq(id_kelas_kuliah))
            .filter(peserta_kelas_kuliah::Column::IdRegistrasiMahasiswa.eq(id_registrasi_mahasiswa))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: peserta_kelas_kuliah::ActiveModel = existing_record.into_active_model();

            active.nama_kelas_kuliah = Set(record.nama_kelas_kuliah.clone());
            active.id_mahasiswa = Set(record.id_mahasiswa);
            active.nim = Set(record.nim.clone());
            active.nama_mahasiswa = Set(record.nama_mahasiswa.clone());
            active.id_matkul = Set(record.id_matkul);
            active.kode_mata_kuliah = Set(record.kode_mata_kuliah.clone());
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.angkatan = Set(record.angkatan.clone());
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = peserta_kelas_kuliah::ActiveModel {
                id: Set(pk_id),
                id_kelas_kuliah: Set(Some(id_kelas_kuliah)),
                nama_kelas_kuliah: Set(record.nama_kelas_kuliah.clone()),
                id_registrasi_mahasiswa: Set(Some(id_registrasi_mahasiswa)),
                id_mahasiswa: Set(record.id_mahasiswa),
                nim: Set(record.nim.clone()),
                nama_mahasiswa: Set(record.nama_mahasiswa.clone()),
                id_matkul: Set(record.id_matkul),
                kode_mata_kuliah: Set(record.kode_mata_kuliah.clone()),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                angkatan: Set(record.angkatan.clone()),
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


        Ok(action.to_string())
    }

}
