use std::time::Instant;

use salvo::async_trait;
use sea_orm::DatabaseConnection;

use crate::tasks::Task;

use super::{
    get_03_profil_pt::EstimateGetProfilPT, get_04_prodi::EstimateGetProdi,
    get_05_list_dosen::EstimateListDosen, get_06_biodata_dosen::EstimateBiodataDosen,
    get_07_riwayat_pangkat_dosen::EstimateRiwayatPangkatDosen,
    get_08_riwayat_fungsional_dosen::EstimateRiwayatFungsionalDosen,
    get_09_riwayat_pendidikan_dosen::EstimateRiwayatPendidikanDosen,
    get_10_riwayat_penelitian_dosen::EstimateRiwayatPenelitianDosen,
    get_11_riwayat_sertifikasi_dosen::EstimateRiwayatSertifikasiDosen,
    get_12_list_penugasan_dosen::EstimateListPenugasanDosen,
    get_13_list_penugasan_semua_dosen::EstimateListPenugasanSemuaDosen,
    get_14_detail_penugasan_dosen::EstimateDetailPenugasanDosen,
    get_15_list_matakuliah::EstimateListMatakuliah,
    get_16_detail_matakuliah::EstimateDetailMatakuliah,
    get_17_list_kurikulum::EstimateListKurikulum,
    get_18_detail_kurikulum::EstimateDetailKurikulum,
    get_19_matkul_kurikulum::EstimateMatkulKurikulum,
    get_20_list_skala_nilai_prodi::EstimateListSkalaNilaiProdi,
    get_21_biodata_mahasiswa::EstimateBiodataMahasiswa,
    get_22_list_riwayat_pendidikan_mahasiswa::EstimateListRiwayatPendidikanMahasiswa,
    get_23_list_mahasiswa::EstimateListMahasiswa,
    get_24_detail_periode_perkuliahan::EstimateDetailPeriodePerkuliahan,
    get_25_list_periode_perkuliahan::EstimateListPeriodePerkuliahan,
    get_26_list_kelas_kuliah::EstimateListKelasKuliah,
    get_27_detail_kelas_kuliah::EstimateDetailKelasKuliah,
    get_28_aktifitas_mengajar_dosen::EstimateAktifitasMengajarDosen,
    get_29_dosen_pengajar_kelas_kuliah::EstimateGetDosenPengajarKelasKuliah,
    get_30_peserta_kelas_kuliah::EstimatePesertaKelasKuliah,
    get_31_list_nilai_perkuliahan_kelas::EstimateListNilaiPerkuliahanKelas,
    get_32_detail_nilai_perkuliahan_kelas::EstimateDetailNilaiPerkuliahanKelas,
    get_33_list_perkuliahan_mahasiswa::EstimateListPerkuliahanMahasiswa,
    get_34_krs_mahasiswa::EstimateKRSMahasiswa,
    get_35_detail_perkuliahan_mahasiswa::EstimateDetailPerkuliahanMahasiswa,
    get_36_transkrip_mahasiswa::EstimateTranskripMahasiswa,
    get_37_riwayat_nilai_mahasiswa::EstimateRiwayatNilaiMahasiswa,
    get_38_list_nilai_transfer_pendidikan_mahasiswa::EstimateListNilaiTransferPendidikanMahasiswa,
    get_39_list_komponen_evaluasi_kelas::EstimateListKomponenEvaluasiKelas,
    get_40_list_rencana_pembelajaran::EstimateListRencanaPembelajaran,
    get_41_list_rencana_evaluasi::EstimateListRencanaEvaluasi,
    get_42_list_mahasiswa_lulus_do::EstimateListMahasiswaLulusDO,
    get_43_detail_mahasiswa_lulus_do::EstimateDetailMahasiswaLulusDO,
};

// Configuration constants
const TASK_NAME: &str = "EstimateGetAllMasterData";

/// Pass this argument to abort the whole run on the first failing sub-task.
/// By default every sub-task is executed and failures are reported at the end.
const ARG_FAIL_FAST: &str = "--fail-fast";

/// Runs every master estimasi task sequentially
/// (excluding `get_01_all_pt` and `get_02_all_prodi`).
pub struct EstimateGetAllMasterData;

impl EstimateGetAllMasterData {
    /// Ordered list of sub-tasks. Order matters: they are executed one by one.
    fn sub_tasks() -> Vec<Box<dyn Task>> {
        vec![
            Box::new(EstimateGetProfilPT),
            Box::new(EstimateGetProdi),
            Box::new(EstimateListDosen),
            Box::new(EstimateBiodataDosen),
            Box::new(EstimateRiwayatPangkatDosen),
            Box::new(EstimateRiwayatFungsionalDosen),
            Box::new(EstimateRiwayatPendidikanDosen),
            Box::new(EstimateRiwayatPenelitianDosen),
            Box::new(EstimateRiwayatSertifikasiDosen),
            Box::new(EstimateListPenugasanDosen),
            Box::new(EstimateListPenugasanSemuaDosen),
            Box::new(EstimateDetailPenugasanDosen),
            Box::new(EstimateListMatakuliah),
            Box::new(EstimateDetailMatakuliah),
            Box::new(EstimateListKurikulum),
            Box::new(EstimateDetailKurikulum),
            Box::new(EstimateMatkulKurikulum),
            Box::new(EstimateListSkalaNilaiProdi),
            Box::new(EstimateBiodataMahasiswa),
            Box::new(EstimateListRiwayatPendidikanMahasiswa),
            Box::new(EstimateListMahasiswa),
            Box::new(EstimateDetailPeriodePerkuliahan),
            Box::new(EstimateListPeriodePerkuliahan),
            Box::new(EstimateListKelasKuliah),
            Box::new(EstimateDetailKelasKuliah),
            Box::new(EstimateAktifitasMengajarDosen),
            Box::new(EstimateGetDosenPengajarKelasKuliah),
            Box::new(EstimatePesertaKelasKuliah),
            Box::new(EstimateListNilaiPerkuliahanKelas),
            Box::new(EstimateDetailNilaiPerkuliahanKelas),
            Box::new(EstimateListPerkuliahanMahasiswa),
            Box::new(EstimateKRSMahasiswa),
            Box::new(EstimateDetailPerkuliahanMahasiswa),
            Box::new(EstimateTranskripMahasiswa),
            Box::new(EstimateRiwayatNilaiMahasiswa),
            Box::new(EstimateListNilaiTransferPendidikanMahasiswa),
            Box::new(EstimateListKomponenEvaluasiKelas),
            Box::new(EstimateListRencanaPembelajaran),
            Box::new(EstimateListRencanaEvaluasi),
            Box::new(EstimateListMahasiswaLulusDO),
            Box::new(EstimateDetailMahasiswaLulusDO),
        ]
    }
}

#[async_trait]
impl Task for EstimateGetAllMasterData {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Sequentially run all master estimasi tasks (except GetAllPT & GetAllProdi)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let fail_fast = args.iter().any(|a| a == ARG_FAIL_FAST);
        // Sub-tasks do not use the orchestrator flags.
        let sub_args: Vec<String> = args
            .iter()
            .filter(|a| a.as_str() != ARG_FAIL_FAST)
            .cloned()
            .collect();

        let tasks = Self::sub_tasks();
        let total = tasks.len();
        let overall_start = Instant::now();

        println!(
            "🚀 Starting {} task: {} sub-tasks (fail_fast={})",
            TASK_NAME, total, fail_fast
        );

        let mut succeeded: Vec<String> = Vec::new();
        let mut failed: Vec<(String, String)> = Vec::new();

        for (index, task) in tasks.iter().enumerate() {
            let step = index + 1;
            let task_name = task.name().to_string();
            println!("\n==================================================");
            println!("▶️  [{}/{}] Running {}", step, total, task_name);
            println!("==================================================");

            let start = Instant::now();
            match task.run(db, &sub_args).await {
                Ok(()) => {
                    println!(
                        "✅ [{}/{}] {} finished in {:.2?}",
                        step, total, task_name, start.elapsed()
                    );
                    succeeded.push(task_name);
                }
                Err(e) => {
                    let message = e.to_string();
                    eprintln!(
                        "❌ [{}/{}] {} failed after {:.2?}: {}",
                        step, total, task_name, start.elapsed(), message
                    );
                    failed.push((task_name.clone(), message.clone()));

                    if fail_fast {
                        return Err(format!(
                            "{} aborted at [{}/{}] {}: {}",
                            TASK_NAME, step, total, task_name, message
                        )
                        .into());
                    }
                }
            }
        }

        println!("\n==================================================");
        println!(
            "🏁 {} finished in {:.2?}: {} succeeded, {} failed (of {})",
            TASK_NAME,
            overall_start.elapsed(),
            succeeded.len(),
            failed.len(),
            total
        );
        for (name, message) in &failed {
            eprintln!("   ❌ {}: {}", name, message);
        }
        println!("==================================================");

        if failed.is_empty() {
            Ok(())
        } else {
            Err(format!(
                "{} completed with {} failed sub-task(s): {}",
                TASK_NAME,
                failed.len(),
                failed
                    .iter()
                    .map(|(name, _)| name.as_str())
                    .collect::<Vec<_>>()
                    .join(", ")
            )
            .into())
        }
    }
}
