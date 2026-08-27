use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::prelude::Decimal;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait, TryIntoModel,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::course::{
        master::{
            course_evaluation_plannings as AcademicCourseMasterCourseEvaluationPlanning,
            courses as AcademicCourseMasterCourse,
        },
        reference::evaluation_types as AcademicCourseReferenceEvaluationType,
    },
    feeder::master::rencana_evaluasi as FeederMasterRencanaEvaluasi,
};

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct WorkerArgs {
    pub record: FeederMasterRencanaEvaluasi::Model,
}




async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

                let r = args.record;

        // Find Course
        let course_feeder_id = if let Some(fid) = r.id_matkul {
            fid
        } else {
            return Ok(());
        };

        let course = match AcademicCourseMasterCourse::Entity::find()
            .filter(AcademicCourseMasterCourse::Column::FeederCourseId.eq(course_feeder_id))
            .one(db)
            .await?
        {
            Some(c) => c,
            None => return Ok(()),
        };

        // Find Evaluation Type
        let id_jenis_evaluasi_int = if let Some(s) = &r.id_jenis_evaluasi {
            s.parse::<i32>().ok()
        } else {
            None
        };

        let id_jenis_evaluasi_int = match id_jenis_evaluasi_int {
            Some(i) => i,
            None => return Ok(()),
        };

        let evaluation_type = match AcademicCourseReferenceEvaluationType::Entity::find()
            .filter(AcademicCourseReferenceEvaluationType::Column::Code.eq(id_jenis_evaluasi_int))
            .one(db)
            .await?
        {
            Some(et) => et,
            None => return Ok(()),
        };

        // Prepare Data
        let name = if let Some(ref nama) = r.nama_evaluasi {
            if nama.trim().is_empty() {
                evaluation_type.name.clone()
            } else {
                nama.clone()
            }
        } else {
            evaluation_type.name.clone()
        };

        let percentage = r
            .bobot_evaluasi
            .as_ref()
            .and_then(|b| b.parse::<f32>().ok());
        let code = r.nomor_urut.as_ref().and_then(|n| n.parse::<i32>().ok());

        // Check if exists
        let active_model = if let Some(c) = code {
            let existing = AcademicCourseMasterCourseEvaluationPlanning::Entity::find()
                .filter(
                    AcademicCourseMasterCourseEvaluationPlanning::Column::CourseId.eq(course.id),
                )
                .filter(AcademicCourseMasterCourseEvaluationPlanning::Column::Code.eq(c))
                .one(db)
                .await?;

            if let Some(model) = existing {
                model.into_active_model()
            } else {
                AcademicCourseMasterCourseEvaluationPlanning::ActiveModel {
                    id: ActiveValue::Set(Uuid::new_v4()),
                    ..Default::default()
                }
            }
        } else {
            AcademicCourseMasterCourseEvaluationPlanning::ActiveModel {
                id: ActiveValue::Set(Uuid::new_v4()),
                ..Default::default()
            }
        };

        let mut active_model = active_model;
        active_model.course_id = ActiveValue::Set(course.id);
        active_model.evaluation_type_id = ActiveValue::Set(evaluation_type.id);
        active_model.name = ActiveValue::Set(name);
        active_model.percentage = ActiveValue::Set(percentage);
        active_model.code = ActiveValue::Set(code);

        active_model.decription_indonesian =
            ActiveValue::Set(r.deskripsi_indonesia.clone().unwrap_or_default());
        active_model.decription_english = ActiveValue::Set(r.deskrips_inggris.clone());

        // sync_at logic
        if let Some(status) = &r.status_sync {
            if status.to_lowercase() == "sudah sync" {
                active_model.sync_at = ActiveValue::Set(Some(chrono::Utc::now().naive_utc()));
            }
        }

        active_model.save(db).await?;

        Ok(())
    
}