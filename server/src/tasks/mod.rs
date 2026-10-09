use salvo::async_trait;
use sea_orm::DatabaseConnection;

pub mod example;
pub mod feeder_dikti;
pub mod route_list;
pub mod sync_permissions;
pub mod utilities;

#[async_trait]
pub trait Task: Send + Sync {
    /// The name of the task
    fn name(&self) -> &str;
    
    /// Description of the task
    fn description(&self) -> &str;
    
    /// Execute the task
    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>>;
}

pub fn get_tasks() -> Vec<Box<dyn Task>> {
    vec![
        Box::new(example::ExampleTask),
        Box::new(sync_permissions::SyncPermissionsTask),
        Box::new(route_list::RouteListTask),
        Box::new(utilities::generate_permission_from_route::GeneratePermissionFromRouteTask),
        Box::new(utilities::generate_permission_from_client::GeneratePermissionFromClientTask),
        Box::new(utilities::hash_password::HashPasswordTask),
        Box::new(utilities::sync_staff_roles::SyncStaffRolesTask),
        Box::new(utilities::sync_student_roles::SyncStudentRolesTask),
        // Feeder Dikti Downstream Master Synchronization Tasks
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_00_all::SyncAllMasterData),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_01_biodata_mahasiswa_and_mahasiswa_to_individual_and_student::SyncBiodataMahasiswaToAcademicStudentMasterStudent),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_02_biodata_dosen_and_dosen_to_individual_lecturer::SyncBiodataDosenToAcademicLecturerMasterLecturer),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_03_periode_perkuliahan_to_academic_campaign_transaction_activities::SyncPeriodePerkuliahanToAcademicTransactionActivities),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_04_skala_nilai_prodi_to_academic_campaign_transaction_grades::SyncSkalaNilaiProdiToAcademicTransactionGrades),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_05_matakuliah_to_academic_course_master_course::SyncMatakuliahToAcademicCourseMasterCourse),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_06_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details::SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_07_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings::SyncRencanaEvaluasiToCourseEvaluationPlannings),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_08_rencana_pembelajaran_to_academic_course_master_course_learn_plannings::SyncRencanaPembelajaranToCourseLearnPlannings),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_09_kelas_kuliah_to_academic_campaign_transaction_class_code::SyncKelasKuliahToAcademicCampaignTransactionClassCode),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_10_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code::SyncKartuRencanaStudiMahasiswaToAcademicCampaignTransactionClassCode),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_11_kelas_kuliah_to_academic_campaign_transaction_teaches::SyncKelasKuliahToAcademicTransactionTeaches),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_12_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches::SyncKartuRencanaStudiMahasiswaToAcademicTransactionTeaches),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_13_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches::SyncNilaiPerkuliahanKelasToTransactionTeaches),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_14_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers::SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_15_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations::SyncKomponenEvaluasiKelasToTeachEvaluations),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_16_perkuliahan_mahasiswa_to_academic_student_campaign_activities::SyncPerkuliahanMahasiswaToAcademicStudentActivities),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_17_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions::SyncNilaiTransferPendidikanMahasiswaToConvertions),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_18_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities::SyncKartuRencanaStudiMahasiswaToDetailActivities),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_19_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities::SyncPesertaKelasKuliahToDetailActivities),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_20_detail_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities::SyncNilaiPerkuliahanKelasToDetailActivities),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_21_biodata_mahasiswa_to_contact_details::SyncBiodataMahasiswaToContactDetails),
        Box::new(feeder_dikti::synchronize::downstream::master::upsert_22_biodata_dosen_to_contact_details::SyncBiodataDosenToContactDetails),
        Box::new(feeder_dikti::downstream::estimasi::master::get_28_aktifitas_mengajar_dosen::EstimateAktifitasMengajarDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_02_all_prodi::EstimateGetAllProdi),
        Box::new(feeder_dikti::downstream::estimasi::master::get_01_all_pt::EstimateGetAllPT),
        Box::new(feeder_dikti::downstream::estimasi::master::get_06_biodata_dosen::EstimateBiodataDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_21_biodata_mahasiswa::EstimateBiodataMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_27_detail_kelas_kuliah::EstimateDetailKelasKuliah),
        Box::new(feeder_dikti::downstream::estimasi::master::get_18_detail_kurikulum::EstimateDetailKurikulum),
        Box::new(feeder_dikti::downstream::estimasi::master::get_43_detail_mahasiswa_lulus_do::EstimateDetailMahasiswaLulusDO),
        Box::new(feeder_dikti::downstream::estimasi::master::get_16_detail_matakuliah::EstimateDetailMatakuliah),
        Box::new(feeder_dikti::downstream::estimasi::master::get_32_detail_nilai_perkuliahan_kelas::EstimateDetailNilaiPerkuliahanKelas),
        Box::new(feeder_dikti::downstream::estimasi::master::get_14_detail_penugasan_dosen::EstimateDetailPenugasanDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_24_detail_periode_perkuliahan::EstimateDetailPeriodePerkuliahan),
        Box::new(feeder_dikti::downstream::estimasi::master::get_35_detail_perkuliahan_mahasiswa::EstimateDetailPerkuliahanMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_29_dosen_pengajar_kelas_kuliah::EstimateGetDosenPengajarKelasKuliah),
        Box::new(feeder_dikti::downstream::estimasi::master::get_34_krs_mahasiswa::EstimateKRSMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_05_list_dosen::EstimateListDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_26_list_kelas_kuliah::EstimateListKelasKuliah),
        Box::new(feeder_dikti::downstream::estimasi::master::get_39_list_komponen_evaluasi_kelas::EstimateListKomponenEvaluasiKelas),
        Box::new(feeder_dikti::downstream::estimasi::master::get_17_list_kurikulum::EstimateListKurikulum),
        Box::new(feeder_dikti::downstream::estimasi::master::get_23_list_mahasiswa::EstimateListMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_42_list_mahasiswa_lulus_do::EstimateListMahasiswaLulusDO),
        Box::new(feeder_dikti::downstream::estimasi::master::get_15_list_matakuliah::EstimateListMatakuliah),
        Box::new(feeder_dikti::downstream::estimasi::master::get_31_list_nilai_perkuliahan_kelas::EstimateListNilaiPerkuliahanKelas),
        Box::new(feeder_dikti::downstream::estimasi::master::get_38_list_nilai_transfer_pendidikan_mahasiswa::EstimateListNilaiTransferPendidikanMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_12_list_penugasan_dosen::EstimateListPenugasanDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_13_list_penugasan_semua_dosen::EstimateListPenugasanSemuaDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_25_list_periode_perkuliahan::EstimateListPeriodePerkuliahan),
        Box::new(feeder_dikti::downstream::estimasi::master::get_33_list_perkuliahan_mahasiswa::EstimateListPerkuliahanMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_41_list_rencana_evaluasi::EstimateListRencanaEvaluasi),
        Box::new(feeder_dikti::downstream::estimasi::master::get_40_list_rencana_pembelajaran::EstimateListRencanaPembelajaran),
        Box::new(feeder_dikti::downstream::estimasi::master::get_22_list_riwayat_pendidikan_mahasiswa::EstimateListRiwayatPendidikanMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_20_list_skala_nilai_prodi::EstimateListSkalaNilaiProdi),
        Box::new(feeder_dikti::downstream::estimasi::master::get_19_matkul_kurikulum::EstimateMatkulKurikulum),
        Box::new(feeder_dikti::downstream::estimasi::master::get_30_peserta_kelas_kuliah::EstimatePesertaKelasKuliah),
        Box::new(feeder_dikti::downstream::estimasi::master::get_04_prodi::EstimateGetProdi),
        Box::new(feeder_dikti::downstream::estimasi::master::get_03_profil_pt::EstimateGetProfilPT),
        Box::new(feeder_dikti::downstream::estimasi::master::get_08_riwayat_fungsional_dosen::EstimateRiwayatFungsionalDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_37_riwayat_nilai_mahasiswa::EstimateRiwayatNilaiMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_07_riwayat_pangkat_dosen::EstimateRiwayatPangkatDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_09_riwayat_pendidikan_dosen::EstimateRiwayatPendidikanDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_10_riwayat_penelitian_dosen::EstimateRiwayatPenelitianDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_11_riwayat_sertifikasi_dosen::EstimateRiwayatSertifikasiDosen),
        Box::new(feeder_dikti::downstream::estimasi::master::get_36_transkrip_mahasiswa::EstimateTranskripMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::master::get_all_data::EstimateGetAllMasterData),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_agama::EstimateGetAgama),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_alat_transportasi::EstimateGetAlatTransportasi),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_ikatan_kerja_sdm::EstimateGetIkatanKerjaSdm),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jab_fung::EstimateGetJabfung),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jalur_masuk::EstimateGetJalurMasuk),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_aktifitas_mahasiswa::EstimateGetJenisAktifitasMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_evaluasi::EstimateGetJenisEvaluasi),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_keluar::EstimateGetJenisKeluar),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_pendaftaran::EstimateGetJenisPendaftaran),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_prestasi::EstimateGetJenisPrestasi),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_sertifikasi::EstimateGetJenisSertifikasi),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_sms::EstimateGetJenisSMS),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_substansi::EstimateGetJenisSubstansi),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenis_tinggal::EstimateGetJenisTinggal),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_jenjang_pendidikan::EstimateGetJenjangPendidikan),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_kategori_kegiatan::EstimateGetKategoriKegiatan),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_lembaga_pengangkat::EstimateGetLembagaPengangkat),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_level_wilayah::EstimateGetLevelWilayah),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_negara::EstimateGetNegara),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_pangkat_golongan::EstimateGetPangkatGolongan),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_pekerjaan::EstimateGetPekerjaan),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_pembiayaan::EstimateGetPembiayaan),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_penghasilan::EstimateGetPenghasilan),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_semester::EstimateGetSemester),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_status_keaktifan_pegawai::EstimateGetStatusKeaktifanPegawai),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_status_kepegawaian::EstimateGetStatusKepegawaian),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_status_mahasiswa::EstimateGetStatusMahasiswa),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_tahun_ajaran::EstimateGetTahunAjaran),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_tingkat_prestasi::EstimateGetTingkatPrestasi),
        Box::new(feeder_dikti::downstream::estimasi::reference::get_wilayah::EstimateGetWilayah),
    ]
}

pub async fn run_task(name: Option<String>, args: &[String], db: &DatabaseConnection) -> Result<(), Box<dyn std::error::Error>> {
    let tasks = get_tasks();
    
    if let Some(task_name) = name {
        for task in &tasks {
            if task.name() == task_name 
                || task.name().replace(':', "_") == task_name 
                || task.name().replace('_', ":") == task_name 
                || (task.name() == "SyncAllMasterData" && (task_name == "SyncUpsertAllMasterData" || task_name == "upsert_00_all" || task_name == "sync_all_master_data"))
            {
                println!("Running task: {}", task.name());
                return task.run(db, args).await;
            }
        }
        println!("Task '{}' not found. Available tasks:", task_name);
        for task in &tasks {
            println!("  {:<20} {}", task.name(), task.description());
        }
    } else {
        println!("Available tasks:");
        for task in &tasks {
            println!("  {:<20} {}", task.name(), task.description());
        }
    }
    
    Ok(())
}
