use std::time::Instant;

use salvo::async_trait;
use sea_orm::DatabaseConnection;

use crate::tasks::Task;

use super::{
    upsert_01_biodata_mahasiswa_and_mahasiswa_to_individual_and_student::SyncBiodataMahasiswaToAcademicStudentMasterStudent,
    upsert_02_biodata_dosen_and_dosen_to_individual_lecturer::SyncBiodataDosenToAcademicLecturerMasterLecturer,
    upsert_03_periode_perkuliahan_to_academic_campaign_transaction_activities::SyncPeriodePerkuliahanToAcademicTransactionActivities,
    upsert_04_skala_nilai_prodi_to_academic_campaign_transaction_grades::SyncSkalaNilaiProdiToAcademicTransactionGrades,
    upsert_05_matakuliah_to_academic_course_master_course::SyncMatakuliahToAcademicCourseMasterCourse,
    upsert_06_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details::SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails,
    upsert_07_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings::SyncRencanaEvaluasiToCourseEvaluationPlannings,
    upsert_08_rencana_pembelajaran_to_academic_course_master_course_learn_plannings::SyncRencanaPembelajaranToCourseLearnPlannings,
    upsert_09_kelas_kuliah_to_academic_campaign_transaction_class_code::SyncKelasKuliahToAcademicCampaignTransactionClassCode,
    upsert_10_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code::SyncKartuRencanaStudiMahasiswaToAcademicCampaignTransactionClassCode,
    upsert_11_kelas_kuliah_to_academic_campaign_transaction_teaches::SyncKelasKuliahToAcademicTransactionTeaches,
    upsert_12_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches::SyncKartuRencanaStudiMahasiswaToAcademicTransactionTeaches,
    upsert_13_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches::SyncNilaiPerkuliahanKelasToTransactionTeaches,
    upsert_14_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers::SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer,
    upsert_15_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations::SyncKomponenEvaluasiKelasToTeachEvaluations,
    upsert_16_perkuliahan_mahasiswa_to_academic_student_campaign_activities::SyncPerkuliahanMahasiswaToAcademicStudentActivities,
    upsert_17_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions::SyncNilaiTransferPendidikanMahasiswaToConvertions,
    upsert_18_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities::SyncKartuRencanaStudiMahasiswaToDetailActivities,
    upsert_19_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities::SyncPesertaKelasKuliahToDetailActivities,
    upsert_20_detail_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities::SyncNilaiPerkuliahanKelasToDetailActivities,
    upsert_21_biodata_mahasiswa_to_contact_details::SyncBiodataMahasiswaToContactDetails,
    upsert_22_biodata_dosen_to_contact_details::SyncBiodataDosenToContactDetails,
};

// Configuration constants
const TASK_NAME: &str = "SyncAllMasterData";

/// Pass this argument to abort the whole run on the first failing sub-task.
/// By default every sub-task is executed and failures are reported at the end.
const ARG_FAIL_FAST: &str = "--fail-fast";

/// Pass `--start-from <N|task_name>` to skip earlier steps and start execution from a specific task.
const ARG_START_FROM: &str = "--start-from";

/// Pass `--only <N|task_name>` to run only a single specified step.
const ARG_ONLY: &str = "--only";

/// Runs all 22 master downstream synchronization tasks sequentially.
pub struct SyncAllMasterData;

pub type SyncUpsertAllMasterData = SyncAllMasterData;

impl SyncAllMasterData {
    /// Ordered list of sub-tasks (steps 01 through 22).
    /// Execution order strictly follows relational dependencies.
    pub fn sub_tasks() -> Vec<Box<dyn Task>> {
        vec![
            Box::new(SyncBiodataMahasiswaToAcademicStudentMasterStudent),
            Box::new(SyncBiodataDosenToAcademicLecturerMasterLecturer),
            Box::new(SyncPeriodePerkuliahanToAcademicTransactionActivities),
            Box::new(SyncSkalaNilaiProdiToAcademicTransactionGrades),
            Box::new(SyncMatakuliahToAcademicCourseMasterCourse),
            Box::new(SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails),
            Box::new(SyncRencanaEvaluasiToCourseEvaluationPlannings),
            Box::new(SyncRencanaPembelajaranToCourseLearnPlannings),
            Box::new(SyncKelasKuliahToAcademicCampaignTransactionClassCode),
            Box::new(SyncKartuRencanaStudiMahasiswaToAcademicCampaignTransactionClassCode),
            Box::new(SyncKelasKuliahToAcademicTransactionTeaches),
            Box::new(SyncKartuRencanaStudiMahasiswaToAcademicTransactionTeaches),
            Box::new(SyncNilaiPerkuliahanKelasToTransactionTeaches),
            Box::new(SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer),
            Box::new(SyncKomponenEvaluasiKelasToTeachEvaluations),
            Box::new(SyncPerkuliahanMahasiswaToAcademicStudentActivities),
            Box::new(SyncNilaiTransferPendidikanMahasiswaToConvertions),
            Box::new(SyncKartuRencanaStudiMahasiswaToDetailActivities),
            Box::new(SyncPesertaKelasKuliahToDetailActivities),
            Box::new(SyncNilaiPerkuliahanKelasToDetailActivities),
            Box::new(SyncBiodataMahasiswaToContactDetails),
            Box::new(SyncBiodataDosenToContactDetails),
        ]
    }

    fn matches_step(task_idx: usize, task_name: &str, query: &str) -> bool {
        let q = query.trim().to_lowercase();
        if let Ok(num) = q.parse::<usize>()
            && num == task_idx {
                return true;
            }
        let step_str = format!("{:02}", task_idx);
        if q == step_str {
            return true;
        }
        task_name.to_lowercase().contains(&q)
    }
}

#[async_trait]
impl Task for SyncAllMasterData {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Sequentially run all downstream master synchronization tasks (01 to 22)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let fail_fast = args.iter().any(|a| a == ARG_FAIL_FAST);

        // Find --start-from value if specified
        let start_from_val = args
            .windows(2)
            .find(|w| w[0] == ARG_START_FROM)
            .map(|w| w[1].clone());

        // Find --only value if specified
        let only_val = args
            .windows(2)
            .find(|w| w[0] == ARG_ONLY)
            .map(|w| w[1].clone());

        // Sub-tasks do not use the orchestrator flags.
        let mut sub_args: Vec<String> = Vec::new();
        let mut skip_next = false;
        for arg in args {
            if skip_next {
                skip_next = false;
                continue;
            }
            if arg == ARG_FAIL_FAST {
                continue;
            }
            if arg == ARG_START_FROM || arg == ARG_ONLY {
                skip_next = true;
                continue;
            }
            sub_args.push(arg.clone());
        }

        let all_tasks = Self::sub_tasks();
        let total_all = all_tasks.len();

        // Determine the execution slice
        let tasks_to_run: Vec<(usize, Box<dyn Task>)> = if let Some(ref target) = only_val {
            let matched: Vec<(usize, Box<dyn Task>)> = all_tasks
                .into_iter()
                .enumerate()
                .filter(|(idx, task)| Self::matches_step(idx + 1, task.name(), target))
                .map(|(idx, task)| (idx + 1, task))
                .collect();

            if matched.is_empty() {
                return Err(format!("No sub-task matched --only query: '{target}'").into());
            }
            matched
        } else if let Some(ref target) = start_from_val {
            let matched_idx = all_tasks
                .iter()
                .enumerate()
                .find(|(idx, task)| Self::matches_step(idx + 1, task.name(), target))
                .map(|(idx, _)| idx);

            match matched_idx {
                Some(start_idx) => all_tasks
                    .into_iter()
                    .enumerate()
                    .skip(start_idx)
                    .map(|(idx, task)| (idx + 1, task))
                    .collect(),
                None => {
                    return Err(format!("No sub-task matched --start-from query: '{target}'").into());
                }
            }
        } else {
            all_tasks
                .into_iter()
                .enumerate()
                .map(|(idx, task)| (idx + 1, task))
                .collect()
        };

        let count_to_run = tasks_to_run.len();
        let overall_start = Instant::now();

        println!(
            "🚀 Starting {} task: {}/{} sub-tasks to run (fail_fast={})",
            TASK_NAME, count_to_run, total_all, fail_fast
        );

        let mut succeeded: Vec<String> = Vec::new();
        let mut failed: Vec<(String, String)> = Vec::new();

        for (seq_num, (step_num, task)) in tasks_to_run.into_iter().enumerate() {
            let run_step = seq_num + 1;
            let task_name = task.name().to_string();
            println!("\n==================================================");
            println!(
                "▶️  [{:02}/{:02}] (Step {:02}) Running {}",
                run_step, count_to_run, step_num, task_name
            );
            println!("==================================================");

            let start = Instant::now();
            match task.run(db, &sub_args).await {
                Ok(()) => {
                    println!(
                        "✅ [{:02}/{:02}] (Step {:02}) {} finished in {:.2?}",
                        run_step, count_to_run, step_num, task_name, start.elapsed()
                    );
                    succeeded.push(task_name);
                }
                Err(e) => {
                    let message = e.to_string();
                    eprintln!(
                        "❌ [{:02}/{:02}] (Step {:02}) {} failed after {:.2?}: {}",
                        run_step, count_to_run, step_num, task_name, start.elapsed(), message
                    );
                    failed.push((task_name.clone(), message.clone()));

                    if fail_fast {
                        return Err(format!(
                            "{} aborted at [{:02}/{:02}] (Step {:02}) {}: {}",
                            TASK_NAME, run_step, count_to_run, step_num, task_name, message
                        )
                        .into());
                    }
                }
            }
        }

        println!("\n==================================================");
        println!(
            "🏁 {} finished in {:.2?}: {} succeeded, {} failed (of {} scheduled)",
            TASK_NAME,
            overall_start.elapsed(),
            succeeded.len(),
            failed.len(),
            count_to_run
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
