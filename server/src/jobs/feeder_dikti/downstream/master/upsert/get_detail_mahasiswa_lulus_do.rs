use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{Local, NaiveDate};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::mahasiswa_lulusan_dropout as mahasiswa_lulusan_dropout;

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

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInputDetailMahasiswaLulusDO>,
}

pub async fn handle_job(
    args: WorkerArgs,
    db: Data<DatabaseConnection>,
) -> Result<(), std::io::Error> {
    Worker::perform(&db, args).await.map_err(|e| std::io::Error::other(e.to_string()))
}

pub async fn start_worker(
    redis_url: String,
    db: DatabaseConnection,
) -> Result<Monitor, std::io::Error> {
    let conn = apalis_redis::connect(redis_url)
        .await
        .map_err(|e| std::io::Error::other(e.to_string()))?;
    let storage: RedisStorage<WorkerArgs> = RedisStorage::new(conn);

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_detail_mahasiswa_lulus_do")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputDetailMahasiswaLulusDO) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
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

            active.id_prodi = Set(Some(record.id_prodi));
            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.id_mahasiswa = Set(Some(record.id_mahasiswa));
            active.nim = Set(Some(record.nim.clone()));
            active.nama_mahasiswa = Set(Some(record.nama_mahasiswa.clone()));
            active.angkatan = Set(Some(record.angkatan.clone()));
            active.id_jenis_keluar = Set(record.id_jenis_keluar.clone());
            active.nama_jenis_keluar = Set(record.nama_jenis_keluar.clone());
            active.tanggal_keluar = Set(record.tanggal_keluar);
            active.keterangan = Set(record.keterangan.clone());
            active.nomor_sk_yudisium = Set(record.nomor_sk_yudisium.clone());
            active.tanggal_sk_yudisium = Set(record.tanggal_sk_yudisium);
            active.ipk = Set(record.ipk);
            active.nomor_ijazah = Set(record.nomor_ijazah.clone());
            active.jalur_skripsi = Set(record.jalur_skripsi.clone());
            active.judul_skripsi = Set(record.judul_skripsi.clone());
            active.no_sertifikat_profesi = Set(record.no_sertifikat_profesi.clone());
            active.bulan_awal_bimbingan = Set(record.bulan_awal_bimbingan.clone());
            active.bulan_akhir_bimbingan = Set(record.bulan_akhir_bimbingan.clone());
            active.id_dosen = Set(record.id_dosen);
            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.pembimbing_ke = Set(record.pembimbing_ke);
            active.asal_ijazah = Set(record.asal_ijazah.clone());
            active.id_periode_keluar = Set(record.id_periode_keluar.clone());
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
                id_prodi: Set(Some(record.id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_mahasiswa: Set(Some(record.id_mahasiswa)),
                nim: Set(Some(record.nim.clone())),
                nama_mahasiswa: Set(Some(record.nama_mahasiswa.clone())),
                angkatan: Set(Some(record.angkatan.clone())),
                id_jenis_keluar: Set(record.id_jenis_keluar.clone()),
                nama_jenis_keluar: Set(record.nama_jenis_keluar.clone()),
                tanggal_keluar: Set(record.tanggal_keluar),
                keterangan: Set(record.keterangan.clone()),
                nomor_sk_yudisium: Set(record.nomor_sk_yudisium.clone()),
                tanggal_sk_yudisium: Set(record.tanggal_sk_yudisium),
                ipk: Set(record.ipk),
                nomor_ijazah: Set(record.nomor_ijazah.clone()),
                jalur_skripsi: Set(record.jalur_skripsi.clone()),
                judul_skripsi: Set(record.judul_skripsi.clone()),
                no_sertifikat_profesi: Set(record.no_sertifikat_profesi.clone()),
                bulan_awal_bimbingan: Set(record.bulan_awal_bimbingan.clone()),
                bulan_akhir_bimbingan: Set(record.bulan_akhir_bimbingan.clone()),
                id_dosen: Set(record.id_dosen),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_dosen: Set(record.nama_dosen.clone()),
                pembimbing_ke: Set(record.pembimbing_ke),
                asal_ijazah: Set(record.asal_ijazah.clone()),
                id_periode_keluar: Set(record.id_periode_keluar.clone()),
                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                created_by: Set(None),
                updated_by: Set(None),
                deleted_at: Set(None),
                id_perguruan_tinggi: Set(None),
                tgl_masuk_sp: Set(None),
                tgl_create: Set(None),
                tgl_keluar: Set(None),
                skhun: Set(None),
                no_peserta_ujian: Set(None),
                sks_diakui: Set(None),
                id_jns_daftar: Set(None),
                nm_jns_daftar: Set(None),
                id_jalur_masuk: Set(None),
                id_pembiayaan: Set(None),
                biaya_masuk_kuliah: Set(None),
                id_minat_bidang: Set(None),
                bidang_mayor: Set(None),
                bidang_minor: Set(None),
                a_pindah_mhs_asing: Set(None),
                id_pt_asal: Set(None),
                id_prodi_asal: Set(None),
                nm_pt_asal: Set(None),
                nm_prodi_asal: Set(None),
                namapt: Set(None),
                id_jur: Set(None),
                nm_smt: Set(None),
                status_sync: Set(None),
                tanggal_terbit_ijazah: Set(None),
            };

            new_record.insert(txn).await?;
            "INSERTED"
        };

        // Commit transaction

        Ok(action.to_string())
    }

}
