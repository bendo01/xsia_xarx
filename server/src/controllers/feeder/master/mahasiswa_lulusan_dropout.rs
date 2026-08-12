use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::mahasiswa_lulusan_dropout::{
    CreateMahasiswaLulusanDropoutRequest, MahasiswaLulusanDropoutQuery, MahasiswaLulusanDropoutResponse, PaginatedMahasiswaLulusanDropoutResponse,
    UpdateMahasiswaLulusanDropoutRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::mahasiswa_lulusan_dropout as entity_mod;

#[endpoint(tags("Feeder - Master - MahasiswaLulusanDropout"), status_codes(200, 500))]
pub async fn list_mahasiswa_lulusan_dropout(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedMahasiswaLulusanDropoutResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: MahasiswaLulusanDropoutQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| MahasiswaLulusanDropoutResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            tgl_masuk_sp: item.tgl_masuk_sp,
            tgl_create: item.tgl_create,
            tgl_keluar: item.tgl_keluar,
            tanggal_keluar: item.tanggal_keluar,
            id_jenis_keluar: item.id_jenis_keluar.clone(),
            nama_jenis_keluar: item.nama_jenis_keluar.clone(),
            id_periode_keluar: item.id_periode_keluar.clone(),
            keterangan: item.keterangan,
            nomor_sk_yudisium: item.nomor_sk_yudisium,
            tanggal_sk_yudisium: item.tanggal_sk_yudisium,
            ipk: item.ipk,
            nomor_ijazah: item.nomor_ijazah,
            asal_ijazah: item.asal_ijazah.clone(),
            no_sertifikat_profesi: item.no_sertifikat_profesi,
            tanggal_terbit_ijazah: item.tanggal_terbit_ijazah,
            jalur_skripsi: item.jalur_skripsi,
            judul_skripsi: item.judul_skripsi,
            bulan_awal_bimbingan: item.bulan_awal_bimbingan,
            bulan_akhir_bimbingan: item.bulan_akhir_bimbingan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            skhun: item.skhun,
            no_peserta_ujian: item.no_peserta_ujian,
            sks_diakui: item.sks_diakui,
            id_jns_daftar: item.id_jns_daftar,
            nm_jns_daftar: item.nm_jns_daftar,
            id_jalur_masuk: item.id_jalur_masuk,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk_kuliah: item.biaya_masuk_kuliah,
            id_minat_bidang: item.id_minat_bidang,
            bidang_mayor: item.bidang_mayor,
            bidang_minor: item.bidang_minor,
            a_pindah_mhs_asing: item.a_pindah_mhs_asing,
            id_pt_asal: item.id_pt_asal,
            id_prodi_asal: item.id_prodi_asal,
            nm_pt_asal: item.nm_pt_asal,
            nm_prodi_asal: item.nm_prodi_asal,
            namapt: item.namapt,
            id_jur: item.id_jur,
            nm_smt: item.nm_smt,
            status_sync: item.status_sync,

    }).collect();

    Ok(Json(PaginatedMahasiswaLulusanDropoutResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - MahasiswaLulusanDropout"), status_codes(200, 400, 404, 500))]
pub async fn get_mahasiswa_lulusan_dropout(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MahasiswaLulusanDropoutResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("MahasiswaLulusanDropout not found"))?;

    Ok(Json(MahasiswaLulusanDropoutResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            tgl_masuk_sp: item.tgl_masuk_sp,
            tgl_create: item.tgl_create,
            tgl_keluar: item.tgl_keluar,
            tanggal_keluar: item.tanggal_keluar,
            id_jenis_keluar: item.id_jenis_keluar.clone(),
            nama_jenis_keluar: item.nama_jenis_keluar.clone(),
            id_periode_keluar: item.id_periode_keluar.clone(),
            keterangan: item.keterangan,
            nomor_sk_yudisium: item.nomor_sk_yudisium,
            tanggal_sk_yudisium: item.tanggal_sk_yudisium,
            ipk: item.ipk,
            nomor_ijazah: item.nomor_ijazah,
            asal_ijazah: item.asal_ijazah.clone(),
            no_sertifikat_profesi: item.no_sertifikat_profesi,
            tanggal_terbit_ijazah: item.tanggal_terbit_ijazah,
            jalur_skripsi: item.jalur_skripsi,
            judul_skripsi: item.judul_skripsi,
            bulan_awal_bimbingan: item.bulan_awal_bimbingan,
            bulan_akhir_bimbingan: item.bulan_akhir_bimbingan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            skhun: item.skhun,
            no_peserta_ujian: item.no_peserta_ujian,
            sks_diakui: item.sks_diakui,
            id_jns_daftar: item.id_jns_daftar,
            nm_jns_daftar: item.nm_jns_daftar,
            id_jalur_masuk: item.id_jalur_masuk,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk_kuliah: item.biaya_masuk_kuliah,
            id_minat_bidang: item.id_minat_bidang,
            bidang_mayor: item.bidang_mayor,
            bidang_minor: item.bidang_minor,
            a_pindah_mhs_asing: item.a_pindah_mhs_asing,
            id_pt_asal: item.id_pt_asal,
            id_prodi_asal: item.id_prodi_asal,
            nm_pt_asal: item.nm_pt_asal,
            nm_prodi_asal: item.nm_prodi_asal,
            namapt: item.namapt,
            id_jur: item.id_jur,
            nm_smt: item.nm_smt,
            status_sync: item.status_sync,

    }))
}#[endpoint(tags("Feeder - Master - MahasiswaLulusanDropout"), status_codes(200, 400, 500))]
pub async fn create_mahasiswa_lulusan_dropout(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MahasiswaLulusanDropoutResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateMahasiswaLulusanDropoutRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        id_mahasiswa: Set(payload.id_mahasiswa),
        id_perguruan_tinggi: Set(payload.id_perguruan_tinggi),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        nim: Set(payload.nim),
        nama_mahasiswa: Set(payload.nama_mahasiswa),
        angkatan: Set(payload.angkatan),
        tgl_masuk_sp: Set(payload.tgl_masuk_sp),
        tgl_create: Set(payload.tgl_create),
        tgl_keluar: Set(payload.tgl_keluar),
        tanggal_keluar: Set(payload.tanggal_keluar),
        id_jenis_keluar: Set(payload.id_jenis_keluar),
        nama_jenis_keluar: Set(payload.nama_jenis_keluar),
        id_periode_keluar: Set(payload.id_periode_keluar),
        keterangan: Set(payload.keterangan),
        nomor_sk_yudisium: Set(payload.nomor_sk_yudisium),
        tanggal_sk_yudisium: Set(payload.tanggal_sk_yudisium),
        ipk: Set(payload.ipk),
        nomor_ijazah: Set(payload.nomor_ijazah),
        asal_ijazah: Set(payload.asal_ijazah),
        no_sertifikat_profesi: Set(payload.no_sertifikat_profesi),
        tanggal_terbit_ijazah: Set(payload.tanggal_terbit_ijazah),
        jalur_skripsi: Set(payload.jalur_skripsi),
        judul_skripsi: Set(payload.judul_skripsi),
        bulan_awal_bimbingan: Set(payload.bulan_awal_bimbingan),
        bulan_akhir_bimbingan: Set(payload.bulan_akhir_bimbingan),
        id_dosen: Set(payload.id_dosen),
        nidn: Set(payload.nidn),
        nuptk: Set(payload.nuptk),
        nama_dosen: Set(payload.nama_dosen),
        pembimbing_ke: Set(payload.pembimbing_ke),
        skhun: Set(payload.skhun),
        no_peserta_ujian: Set(payload.no_peserta_ujian),
        sks_diakui: Set(payload.sks_diakui),
        id_jns_daftar: Set(payload.id_jns_daftar),
        nm_jns_daftar: Set(payload.nm_jns_daftar),
        id_jalur_masuk: Set(payload.id_jalur_masuk),
        id_pembiayaan: Set(payload.id_pembiayaan),
        biaya_masuk_kuliah: Set(payload.biaya_masuk_kuliah),
        id_minat_bidang: Set(payload.id_minat_bidang),
        bidang_mayor: Set(payload.bidang_mayor),
        bidang_minor: Set(payload.bidang_minor),
        a_pindah_mhs_asing: Set(payload.a_pindah_mhs_asing),
        id_pt_asal: Set(payload.id_pt_asal),
        id_prodi_asal: Set(payload.id_prodi_asal),
        nm_pt_asal: Set(payload.nm_pt_asal),
        nm_prodi_asal: Set(payload.nm_prodi_asal),
        namapt: Set(payload.namapt),
        id_jur: Set(payload.id_jur),
        nm_smt: Set(payload.nm_smt),
        status_sync: Set(payload.status_sync),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MahasiswaLulusanDropoutResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            tgl_masuk_sp: item.tgl_masuk_sp,
            tgl_create: item.tgl_create,
            tgl_keluar: item.tgl_keluar,
            tanggal_keluar: item.tanggal_keluar,
            id_jenis_keluar: item.id_jenis_keluar.clone(),
            nama_jenis_keluar: item.nama_jenis_keluar.clone(),
            id_periode_keluar: item.id_periode_keluar.clone(),
            keterangan: item.keterangan,
            nomor_sk_yudisium: item.nomor_sk_yudisium,
            tanggal_sk_yudisium: item.tanggal_sk_yudisium,
            ipk: item.ipk,
            nomor_ijazah: item.nomor_ijazah,
            asal_ijazah: item.asal_ijazah.clone(),
            no_sertifikat_profesi: item.no_sertifikat_profesi,
            tanggal_terbit_ijazah: item.tanggal_terbit_ijazah,
            jalur_skripsi: item.jalur_skripsi,
            judul_skripsi: item.judul_skripsi,
            bulan_awal_bimbingan: item.bulan_awal_bimbingan,
            bulan_akhir_bimbingan: item.bulan_akhir_bimbingan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            skhun: item.skhun,
            no_peserta_ujian: item.no_peserta_ujian,
            sks_diakui: item.sks_diakui,
            id_jns_daftar: item.id_jns_daftar,
            nm_jns_daftar: item.nm_jns_daftar,
            id_jalur_masuk: item.id_jalur_masuk,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk_kuliah: item.biaya_masuk_kuliah,
            id_minat_bidang: item.id_minat_bidang,
            bidang_mayor: item.bidang_mayor,
            bidang_minor: item.bidang_minor,
            a_pindah_mhs_asing: item.a_pindah_mhs_asing,
            id_pt_asal: item.id_pt_asal,
            id_prodi_asal: item.id_prodi_asal,
            nm_pt_asal: item.nm_pt_asal,
            nm_prodi_asal: item.nm_prodi_asal,
            namapt: item.namapt,
            id_jur: item.id_jur,
            nm_smt: item.nm_smt,
            status_sync: item.status_sync,

        }))
}

#[endpoint(tags("Feeder - Master - MahasiswaLulusanDropout"), status_codes(200, 400, 404, 500))]
pub async fn update_mahasiswa_lulusan_dropout(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MahasiswaLulusanDropoutResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateMahasiswaLulusanDropoutRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("MahasiswaLulusanDropout not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
            active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
        }
    if let Some(id_mahasiswa) = payload.id_mahasiswa {
            active_model.id_mahasiswa = Set(Some(id_mahasiswa));
        }
    if let Some(id_perguruan_tinggi) = payload.id_perguruan_tinggi {
            active_model.id_perguruan_tinggi = Set(Some(id_perguruan_tinggi));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(nim) = payload.nim {
            active_model.nim = Set(Some(nim));
        }
    if let Some(nama_mahasiswa) = payload.nama_mahasiswa {
            active_model.nama_mahasiswa = Set(Some(nama_mahasiswa));
        }
    if let Some(angkatan) = payload.angkatan {
            active_model.angkatan = Set(Some(angkatan));
        }
    if let Some(tgl_masuk_sp) = payload.tgl_masuk_sp {
            active_model.tgl_masuk_sp = Set(Some(tgl_masuk_sp));
        }
    if let Some(tgl_create) = payload.tgl_create {
            active_model.tgl_create = Set(Some(tgl_create));
        }
    if let Some(tgl_keluar) = payload.tgl_keluar {
            active_model.tgl_keluar = Set(Some(tgl_keluar));
        }
    if let Some(tanggal_keluar) = payload.tanggal_keluar {
            active_model.tanggal_keluar = Set(Some(tanggal_keluar));
        }
    if let Some(id_jenis_keluar) = payload.id_jenis_keluar {
            active_model.id_jenis_keluar = Set(id_jenis_keluar);
        }
    if let Some(nama_jenis_keluar) = payload.nama_jenis_keluar {
            active_model.nama_jenis_keluar = Set(nama_jenis_keluar);
        }
    if let Some(id_periode_keluar) = payload.id_periode_keluar {
            active_model.id_periode_keluar = Set(id_periode_keluar);
        }
    if let Some(keterangan) = payload.keterangan {
            active_model.keterangan = Set(Some(keterangan));
        }
    if let Some(nomor_sk_yudisium) = payload.nomor_sk_yudisium {
            active_model.nomor_sk_yudisium = Set(Some(nomor_sk_yudisium));
        }
    if let Some(tanggal_sk_yudisium) = payload.tanggal_sk_yudisium {
            active_model.tanggal_sk_yudisium = Set(Some(tanggal_sk_yudisium));
        }
    if let Some(ipk) = payload.ipk {
            active_model.ipk = Set(Some(ipk));
        }
    if let Some(nomor_ijazah) = payload.nomor_ijazah {
            active_model.nomor_ijazah = Set(Some(nomor_ijazah));
        }
    if let Some(asal_ijazah) = payload.asal_ijazah {
            active_model.asal_ijazah = Set(asal_ijazah);
        }
    if let Some(no_sertifikat_profesi) = payload.no_sertifikat_profesi {
            active_model.no_sertifikat_profesi = Set(Some(no_sertifikat_profesi));
        }
    if let Some(tanggal_terbit_ijazah) = payload.tanggal_terbit_ijazah {
            active_model.tanggal_terbit_ijazah = Set(Some(tanggal_terbit_ijazah));
        }
    if let Some(jalur_skripsi) = payload.jalur_skripsi {
            active_model.jalur_skripsi = Set(Some(jalur_skripsi));
        }
    if let Some(judul_skripsi) = payload.judul_skripsi {
            active_model.judul_skripsi = Set(Some(judul_skripsi));
        }
    if let Some(bulan_awal_bimbingan) = payload.bulan_awal_bimbingan {
            active_model.bulan_awal_bimbingan = Set(Some(bulan_awal_bimbingan));
        }
    if let Some(bulan_akhir_bimbingan) = payload.bulan_akhir_bimbingan {
            active_model.bulan_akhir_bimbingan = Set(Some(bulan_akhir_bimbingan));
        }
    if let Some(id_dosen) = payload.id_dosen {
            active_model.id_dosen = Set(Some(id_dosen));
        }
    if let Some(nidn) = payload.nidn {
            active_model.nidn = Set(Some(nidn));
        }
    if let Some(nuptk) = payload.nuptk {
            active_model.nuptk = Set(Some(nuptk));
        }
    if let Some(nama_dosen) = payload.nama_dosen {
            active_model.nama_dosen = Set(Some(nama_dosen));
        }
    if let Some(pembimbing_ke) = payload.pembimbing_ke {
            active_model.pembimbing_ke = Set(Some(pembimbing_ke));
        }
    if let Some(skhun) = payload.skhun {
            active_model.skhun = Set(Some(skhun));
        }
    if let Some(no_peserta_ujian) = payload.no_peserta_ujian {
            active_model.no_peserta_ujian = Set(Some(no_peserta_ujian));
        }
    if let Some(sks_diakui) = payload.sks_diakui {
            active_model.sks_diakui = Set(Some(sks_diakui));
        }
    if let Some(id_jns_daftar) = payload.id_jns_daftar {
            active_model.id_jns_daftar = Set(Some(id_jns_daftar));
        }
    if let Some(nm_jns_daftar) = payload.nm_jns_daftar {
            active_model.nm_jns_daftar = Set(Some(nm_jns_daftar));
        }
    if let Some(id_jalur_masuk) = payload.id_jalur_masuk {
            active_model.id_jalur_masuk = Set(Some(id_jalur_masuk));
        }
    if let Some(id_pembiayaan) = payload.id_pembiayaan {
            active_model.id_pembiayaan = Set(Some(id_pembiayaan));
        }
    if let Some(biaya_masuk_kuliah) = payload.biaya_masuk_kuliah {
            active_model.biaya_masuk_kuliah = Set(Some(biaya_masuk_kuliah));
        }
    if let Some(id_minat_bidang) = payload.id_minat_bidang {
            active_model.id_minat_bidang = Set(Some(id_minat_bidang));
        }
    if let Some(bidang_mayor) = payload.bidang_mayor {
            active_model.bidang_mayor = Set(Some(bidang_mayor));
        }
    if let Some(bidang_minor) = payload.bidang_minor {
            active_model.bidang_minor = Set(Some(bidang_minor));
        }
    if let Some(a_pindah_mhs_asing) = payload.a_pindah_mhs_asing {
            active_model.a_pindah_mhs_asing = Set(Some(a_pindah_mhs_asing));
        }
    if let Some(id_pt_asal) = payload.id_pt_asal {
            active_model.id_pt_asal = Set(Some(id_pt_asal));
        }
    if let Some(id_prodi_asal) = payload.id_prodi_asal {
            active_model.id_prodi_asal = Set(Some(id_prodi_asal));
        }
    if let Some(nm_pt_asal) = payload.nm_pt_asal {
            active_model.nm_pt_asal = Set(Some(nm_pt_asal));
        }
    if let Some(nm_prodi_asal) = payload.nm_prodi_asal {
            active_model.nm_prodi_asal = Set(Some(nm_prodi_asal));
        }
    if let Some(namapt) = payload.namapt {
            active_model.namapt = Set(Some(namapt));
        }
    if let Some(id_jur) = payload.id_jur {
            active_model.id_jur = Set(Some(id_jur));
        }
    if let Some(nm_smt) = payload.nm_smt {
            active_model.nm_smt = Set(Some(nm_smt));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MahasiswaLulusanDropoutResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            tgl_masuk_sp: item.tgl_masuk_sp,
            tgl_create: item.tgl_create,
            tgl_keluar: item.tgl_keluar,
            tanggal_keluar: item.tanggal_keluar,
            id_jenis_keluar: item.id_jenis_keluar.clone(),
            nama_jenis_keluar: item.nama_jenis_keluar.clone(),
            id_periode_keluar: item.id_periode_keluar.clone(),
            keterangan: item.keterangan,
            nomor_sk_yudisium: item.nomor_sk_yudisium,
            tanggal_sk_yudisium: item.tanggal_sk_yudisium,
            ipk: item.ipk,
            nomor_ijazah: item.nomor_ijazah,
            asal_ijazah: item.asal_ijazah.clone(),
            no_sertifikat_profesi: item.no_sertifikat_profesi,
            tanggal_terbit_ijazah: item.tanggal_terbit_ijazah,
            jalur_skripsi: item.jalur_skripsi,
            judul_skripsi: item.judul_skripsi,
            bulan_awal_bimbingan: item.bulan_awal_bimbingan,
            bulan_akhir_bimbingan: item.bulan_akhir_bimbingan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            skhun: item.skhun,
            no_peserta_ujian: item.no_peserta_ujian,
            sks_diakui: item.sks_diakui,
            id_jns_daftar: item.id_jns_daftar,
            nm_jns_daftar: item.nm_jns_daftar,
            id_jalur_masuk: item.id_jalur_masuk,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk_kuliah: item.biaya_masuk_kuliah,
            id_minat_bidang: item.id_minat_bidang,
            bidang_mayor: item.bidang_mayor,
            bidang_minor: item.bidang_minor,
            a_pindah_mhs_asing: item.a_pindah_mhs_asing,
            id_pt_asal: item.id_pt_asal,
            id_prodi_asal: item.id_prodi_asal,
            nm_pt_asal: item.nm_pt_asal,
            nm_prodi_asal: item.nm_prodi_asal,
            namapt: item.namapt,
            id_jur: item.id_jur,
            nm_smt: item.nm_smt,
            status_sync: item.status_sync,

        }))
}
#[endpoint(tags("Feeder - Master - MahasiswaLulusanDropout"), status_codes(200, 400, 404, 500))]
pub async fn delete_mahasiswa_lulusan_dropout(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("MahasiswaLulusanDropout not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "MahasiswaLulusanDropout deleted successfully".to_string(),
        }))
}
