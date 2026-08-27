use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::kelas_kuliah as kelas_kuliah;

use crate::library::deserialization::{de_opt_date_dmy, de_opt_f32, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputDetailKelasKuliah {
    pub id_kelas_kuliah: Uuid,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mk: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_tm: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_prak: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_prak_lap: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_sim: Option<f32>,
    pub nama_kelas_kuliah: Option<String>,
    pub bahasan: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_akhir_efektif: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub kapasitas: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_tutup_daftar: Option<NaiveDate>,
    pub prodi_penyelenggara: Option<String>,
    pub perguruan_tinggi_penyelenggara: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputListKelasKuliah {
    pub id_kelas_kuliah: Uuid,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub nama_kelas_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks: Option<f32>,
    pub id_dosen: Option<String>,
    pub nama_dosen: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_mahasiswa: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub apa_untuk_pditt: Option<i32>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInputDetailKelasKuliah>,
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputDetailKelasKuliah) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_kelas_kuliah = record.id_kelas_kuliah;

        let sync_time = Local::now().naive_local();

        let existing = kelas_kuliah::Entity::find()
            .filter(kelas_kuliah::Column::DeletedAt.is_null())
            .filter(kelas_kuliah::Column::IdKelasKuliah.eq(id_kelas_kuliah))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: kelas_kuliah::ActiveModel = existing_record.into_active_model();

            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.id_semester = Set(record.id_semester.clone());
            active.nama_semester = Set(record.nama_semester.clone());
            active.id_matkul = Set(record.id_matkul);
            active.kode_mata_kuliah = Set(record.kode_mata_kuliah.clone());
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.nama_kelas_kuliah = Set(record.nama_kelas_kuliah.clone());
            active.sks_mk = Set(record.sks_mk);
            active.sks_tm = Set(record.sks_tm);
            active.sks_prak = Set(record.sks_prak);
            active.sks_prak_lap = Set(record.sks_prak_lap);
            active.sks_sim = Set(record.sks_sim);
            active.bahasan = Set(record.bahasan.clone());
            active.tanggal_mulai_efektif = Set(record.tanggal_mulai_efektif);
            active.tanggal_akhir_efektif = Set(record.tanggal_akhir_efektif);
            active.kapasitas = Set(record.kapasitas);
            active.tanggal_tutup_daftar = Set(record.tanggal_tutup_daftar);
            active.prodi_penyelenggara = Set(record.prodi_penyelenggara.clone());
            active.perguruan_tinggi_penyelenggara =
                Set(record.perguruan_tinggi_penyelenggara.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = kelas_kuliah::ActiveModel {
                id: Set(pk_id),
                id_kelas_kuliah: Set(id_kelas_kuliah),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                id_semester: Set(record.id_semester.clone()),
                nama_semester: Set(record.nama_semester.clone()),
                id_matkul: Set(record.id_matkul),
                kode_mata_kuliah: Set(record.kode_mata_kuliah.clone()),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                nama_kelas_kuliah: Set(record.nama_kelas_kuliah.clone()),
                sks_mk: Set(record.sks_mk),
                sks_tm: Set(record.sks_tm),
                sks_prak: Set(record.sks_prak),
                sks_prak_lap: Set(record.sks_prak_lap),
                sks_sim: Set(record.sks_sim),
                bahasan: Set(record.bahasan.clone()),
                tanggal_mulai_efektif: Set(record.tanggal_mulai_efektif),
                tanggal_akhir_efektif: Set(record.tanggal_akhir_efektif),
                kapasitas: Set(record.kapasitas),
                tanggal_tutup_daftar: Set(record.tanggal_tutup_daftar),
                prodi_penyelenggara: Set(record.prodi_penyelenggara.clone()),
                perguruan_tinggi_penyelenggara: Set(record.perguruan_tinggi_penyelenggara.clone()),
                sks: Set(None),
                id_dosen: Set(None),
                nama_dosen: Set(None),
                jumlah_mahasiswa: Set(None),
                apa_untuk_pditt: Set(None),
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
