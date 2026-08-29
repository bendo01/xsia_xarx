use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait,
    IntoActiveModel, QueryFilter, QueryOrder, QuerySelect, TransactionTrait, Condition
};
use uuid::Uuid;
use std::fs::OpenOptions;
use std::io::Write;
use chrono::Local;

use crate::tasks::Task;

use crate::models::feeder::master::aktifitas_mengajar_dosen as FeederAktifitas;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::academic::lecturer::master::lecturers as AcademicLecturer;
use crate::models::academic::general::reference::academic_years as AcademicYear;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::academic::campaign::transaction::activities as AcademicActivity;
use crate::models::academic::campaign::transaction::class_codes as AcademicClassCode;
use crate::models::academic::campaign::transaction::teaches as AcademicTeach;
use crate::models::academic::campaign::transaction::teach_lecturers as AcademicTeachLecturer;

pub struct SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer;

#[async_trait]
impl Task for SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer {
    fn name(&self) -> &str {
        "SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer"
    }

    fn description(&self) -> &str {
        "Upsert aktifitas_mengajar_dosen to academic_campaign_transaction.teach_lecturers"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        use indicatif::{ProgressBar, ProgressStyle};
        use sea_orm::PaginatorTrait;

        let show_progress = args.iter().any(|arg| arg == "true" || arg == "--progress");

        let total_records = if show_progress {
            FeederAktifitas::Entity::find().count(db).await?
        } else {
            0
        };

        let pb = if show_progress {
            let bar = ProgressBar::new(total_records);
            bar.set_style(ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({eta})")
                .unwrap_or_else(|_| ProgressStyle::default_bar())
                .progress_chars("#>-"));
            Some(bar)
        } else {
            None
        };

        // Create log file
        let log_dir = "logs";
        std::fs::create_dir_all(log_dir)?;
        let log_file_path = format!("{}/teach_not_found_{}.log", log_dir, Local::now().format("%Y%m%d_%H%M%S"));
        let mut log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file_path)?;

        let mut offset = 0;
        let limit = 1000;
        
        loop {
            let records = FeederAktifitas::Entity::find()
                .order_by_asc(FeederAktifitas::Column::Id)
                .offset(offset)
                .limit(limit)
                .all(db)
                .await?;
                
            if records.is_empty() {
                break;
            }
            
            for record in records {
                let txn = db.begin().await?;
                
                // search data course
                let course_opt = if let Some(id_matkul) = record.id_matkul {
                    AcademicCourse::Entity::find()
                        .filter(AcademicCourse::Column::FeederCourseId.eq(id_matkul))
                        .one(&txn)
                        .await?
                } else {
                    None
                };

                // search data lecturer
                let lecturer_opt = {
                    let mut condition = Condition::any();
                    let mut has_condition = false;

                    if let Some(id_dosen) = record.id_dosen {
                        condition = condition.add(AcademicLecturer::Column::IdDosen.eq(id_dosen));
                        has_condition = true;
                    }
                    if let Some(id_reg_dosen) = record.id_registrasi_dosen {
                        condition = condition.add(AcademicLecturer::Column::IdRegistrasiDosen.eq(id_reg_dosen));
                        has_condition = true;
                    }
                    
                    if has_condition {
                        AcademicLecturer::Entity::find().filter(condition).one(&txn).await?
                    } else {
                        None
                    }
                };

                // search data academic_year
                let academic_year_opt = if let Some(id_periode) = &record.id_periode {
                    AcademicYear::Entity::find()
                        .filter(AcademicYear::Column::FeederName.eq(id_periode))
                        .one(&txn)
                        .await?
                } else {
                    None
                };

                // search data unit
                let unit_opt = if let Some(id_prodi) = record.id_prodi {
                    InstitutionUnit::Entity::find()
                        .filter(InstitutionUnit::Column::FeederId.eq(id_prodi))
                        .one(&txn)
                        .await?
                } else {
                    None
                };

                // search data unit_activity
                let unit_activity_opt = if let (Some(unit), Some(academic_year)) = (&unit_opt, &academic_year_opt) {
                    AcademicActivity::Entity::find()
                        .filter(AcademicActivity::Column::UnitId.eq(unit.id))
                        .filter(AcademicActivity::Column::AcademicYearId.eq(academic_year.id))
                        .one(&txn)
                        .await?
                } else {
                    None
                };

                // search data class_code
                let class_code_opt = if let (Some(nama_kelas_kuliah), Some(unit)) = (&record.nama_kelas_kuliah, &unit_opt) {
                    AcademicClassCode::Entity::find()
                        .filter(AcademicClassCode::Column::AlphabetCode.eq(nama_kelas_kuliah))
                        .filter(AcademicClassCode::Column::UnitId.eq(unit.id))
                        .one(&txn)
                        .await?
                } else {
                    None
                };

                // search data teach
                let mut teach_opt = if let Some(id_kelas) = record.id_kelas {
                    AcademicTeach::Entity::find()
                        .filter(AcademicTeach::Column::FeederId.eq(id_kelas))
                        .one(&txn)
                        .await?
                } else {
                    None
                };

                if teach_opt.is_none() {
                    if let (Some(class_code), Some(course), Some(unit_activity)) = (&class_code_opt, &course_opt, &unit_activity_opt) {
                        teach_opt = AcademicTeach::Entity::find()
                            .filter(AcademicTeach::Column::ClassCodeId.eq(class_code.id))
                            .filter(AcademicTeach::Column::CourseId.eq(course.id))
                            .filter(AcademicTeach::Column::ActivityId.eq(unit_activity.id))
                            .one(&txn)
                            .await?;
                    }
                }

                if teach_opt.is_none() {
                    writeln!(log_file, "Teach not found for record ID: {}", record.id)?;
                }
                
                if let (Some(lecturer), Some(teach)) = (&lecturer_opt, &teach_opt) {
                    // check if teach_lecturer exists
                    let teach_lecturer_opt = AcademicTeachLecturer::Entity::find()
                        .filter(AcademicTeachLecturer::Column::LecturerId.eq(lecturer.id))
                        .filter(AcademicTeachLecturer::Column::TeachId.eq(teach.id))
                        .one(&txn)
                        .await?;
                    
                    let planning = record.rencana_minggu_pertemuan.unwrap_or(0);
                    let realization = record.realisasi_minggu_pertemuan.unwrap_or(0);

                    if let Some(teach_lecturer) = teach_lecturer_opt {
                        let mut active_model: AcademicTeachLecturer::ActiveModel = teach_lecturer.into_active_model();
                        active_model.feeder_id = Set(Some(record.id));
                        active_model.planning = Set(planning);
                        active_model.realization = Set(realization);
                        active_model.updated_at = Set(Some(chrono::Local::now().naive_local()));
                        
                        active_model.update(&txn).await?;
                    } else {
                        let new_teach_lecturer = AcademicTeachLecturer::ActiveModel {
                            id: Set(Uuid::new_v4()),
                            lecturer_id: Set(lecturer.id),
                            teach_id: Set(teach.id),
                            feeder_id: Set(Some(record.id)),
                            planning: Set(planning),
                            realization: Set(realization),
                            is_lecturer_home_base: Set(false),
                            created_at: Set(Some(chrono::Local::now().naive_local())),
                            updated_at: Set(Some(chrono::Local::now().naive_local())),
                            ..Default::default()
                        };
                        new_teach_lecturer.insert(&txn).await?;
                    }
                }
                
                txn.commit().await?;
                
                if let Some(ref pb) = pb {
                    pb.inc(1);
                }
            }
            
            offset += limit;
        }
        
        if let Some(pb) = pb {
            pb.finish_with_message("Sync completed");
        }
        
        Ok(())
    }
}
