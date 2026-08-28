use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait,
    IntoActiveModel, QueryFilter, QueryOrder, QuerySelect, TransactionTrait, Condition
};
use uuid::Uuid;

use crate::tasks::Task;

use crate::models::feeder::master::detail_nilai_perkuliahan_kelas as FeederDetailNilai;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::academic::campaign::transaction::teaches as AcademicTeach;
use crate::models::academic::student::master::students as AcademicStudent;
use crate::models::academic::campaign::transaction::grades as AcademicGrade;
use crate::models::academic::student::campaign::student_activities as AcademicStudentActivity;
use crate::models::academic::student::campaign::detail_activities as AcademicDetailActivity;

pub struct SyncNilaiPerkuliahanKelasToDetailActivities;

#[async_trait]
impl Task for SyncNilaiPerkuliahanKelasToDetailActivities {
    fn name(&self) -> &str {
        "SyncNilaiPerkuliahanKelasToDetailActivities"
    }

    fn description(&self) -> &str {
        "Upsert detail_nilai_perkuliahan_kelas to academic_student_campaign.detail_activities"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        use indicatif::{ProgressBar, ProgressStyle};
        use sea_orm::PaginatorTrait;

        let show_progress = args.iter().any(|arg| arg == "true" || arg == "--progress");

        let total_records = if show_progress {
            FeederDetailNilai::Entity::find().count(db).await?
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

        let mut offset = 0;
        let limit = 1000;
        
        loop {
            let records = FeederDetailNilai::Entity::find()
                .order_by_asc(FeederDetailNilai::Column::Id)
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
                
                // search data teach
                let teach_opt = if let Some(id_kelas_kuliah) = record.id_kelas_kuliah {
                    AcademicTeach::Entity::find()
                        .filter(AcademicTeach::Column::FeederId.eq(id_kelas_kuliah))
                        .one(&txn)
                        .await?
                } else {
                    None
                };
                
                // search data student
                let student_opt = {
                    let mut condition = Condition::any();
                    let mut has_condition = false;

                    if let Some(id_m) = record.id_mahasiswa {
                        condition = condition.add(AcademicStudent::Column::IdMahasiswa.eq(id_m));
                        has_condition = true;
                    }
                    if let Some(id_rm) = record.id_registrasi_mahasiswa {
                        condition = condition.add(AcademicStudent::Column::IdRegistrasiMahasiswa.eq(id_rm));
                        has_condition = true;
                    }
                    
                    if has_condition {
                        AcademicStudent::Entity::find().filter(condition).one(&txn).await?
                    } else {
                        None
                    }
                };
                
                // search data grade
                let grade_opt = if let (Some(nilai_huruf), Some(student)) = (&record.nilai_huruf, &student_opt) {
                    AcademicGrade::Entity::find()
                        .filter(AcademicGrade::Column::Name.eq(nilai_huruf))
                        .filter(AcademicGrade::Column::UnitId.eq(student.unit_id))
                        .one(&txn)
                        .await?
                } else {
                    None
                };
                
                // search data student_activity
                let student_activity_opt = if let (Some(teach), Some(student)) = (&teach_opt, &student_opt) {
                    if let Some(activity_id) = teach.activity_id {
                        AcademicStudentActivity::Entity::find()
                            .filter(AcademicStudentActivity::Column::UnitActivityId.eq(activity_id))
                            .filter(AcademicStudentActivity::Column::StudentId.eq(student.id))
                            .one(&txn)
                            .await?
                    } else {
                        None
                    }
                } else {
                    None
                };
                
                if let (Some(student_activity), Some(course), Some(teach)) = (&student_activity_opt, &course_opt, &teach_opt) {
                    // search data detail_activities
                    let detail_activity_opt = AcademicDetailActivity::Entity::find()
                        .filter(AcademicDetailActivity::Column::ActivityId.eq(student_activity.id))
                        .filter(AcademicDetailActivity::Column::CourseId.eq(course.id))
                        .filter(AcademicDetailActivity::Column::TeachId.eq(teach.id))
                        .one(&txn)
                        .await?;
                        
                    let grade_id = grade_opt.map(|g| g.id);
                    let mark = record.nilai_angka.map(|v| v as f64);
                    
                    if let Some(detail_activity) = detail_activity_opt {
                        let mut active_model: AcademicDetailActivity::ActiveModel = detail_activity.into_active_model();
                        active_model.feeder_id = Set(Some(record.id));
                        active_model.feeder_grade_id = Set(Some(record.id));
                        active_model.mark = Set(mark);
                        active_model.grade_id = Set(grade_id);
                        active_model.is_lock = Set(Some(true));
                        active_model.updated_at = Set(Some(chrono::Local::now().naive_local()));
                        
                        active_model.update(&txn).await?;
                    } else {
                        let new_detail = AcademicDetailActivity::ActiveModel {
                            id: Set(Uuid::new_v4()),
                            activity_id: Set(student_activity.id),
                            course_id: Set(course.id),
                            teach_id: Set(Some(teach.id)),
                            feeder_id: Set(Some(record.id)),
                            feeder_grade_id: Set(Some(record.id)),
                            mark: Set(mark),
                            grade_id: Set(grade_id),
                            is_lock: Set(Some(true)),
                            created_at: Set(Some(chrono::Local::now().naive_local())),
                            updated_at: Set(Some(chrono::Local::now().naive_local())),
                            ..Default::default()
                        };
                        new_detail.insert(&txn).await?;
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
