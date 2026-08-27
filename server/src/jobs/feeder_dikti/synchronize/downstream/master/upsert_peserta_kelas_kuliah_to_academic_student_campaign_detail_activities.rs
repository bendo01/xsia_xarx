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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::{
        campaign::transaction::{
            activities as campaign_activities, teaches,
        },
        course::master::courses,
        general::reference::academic_years,
        student::{
            campaign::{
                activities as student_activities,
                detail_activities,
            },
            master::students,
        },
    },
    feeder::master::peserta_kelas_kuliah,
    institution::master::{institutions, units},
};

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkerArgs {
    pub model: peserta_kelas_kuliah::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!(
        "Processing Peserta Kelas Kuliah: Student NIM {:?} - Class {:?}",
        model.nim, model.nama_kelas_kuliah
    );

    // 1. Get Student
    let Some(id_registrasi_mahasiswa) = model.id_registrasi_mahasiswa else {
        println!("Skipping: id_registrasi_mahasiswa is missing");
        return Ok(());
    };

    let student = students::Entity::find()
        .filter(students::Column::IdRegistrasiMahasiswa.eq(id_registrasi_mahasiswa))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find student: {:?}", e);
            e.into()
        })?;

    let Some(student) = student else {
        println!(
            "Skipping: Student not found for id_registrasi_mahasiswa {}",
            id_registrasi_mahasiswa
        );
        return Ok(());
    };

    // 2. Check if exists teach
    let Some(id_kelas_kuliah) = model.id_kelas_kuliah else {
        println!("Skipping: id_kelas_kuliah is missing");
        return Ok(());
    };

    let teach = teaches::Entity::find()
        .filter(teaches::Column::FeederId.eq(id_kelas_kuliah))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find teach: {:?}", e);
            e.into()
        })?;

    let Some(teach) = teach else {
        println!(
            "Skipping: Teach not found for feeder_id (id_kelas_kuliah) {}",
            id_kelas_kuliah
        );
        return Ok(());
    };

    // 3. Get Unit Activity
    let unit_activity = campaign_activities::Entity::find_by_id(teach.activity_id)
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find unit activity: {:?}", e);
            e.into()
        })?;

    let Some(unit_activity) = unit_activity else {
        println!(
            "Skipping: Unit Activity not found for activity_id {}",
            teach.activity_id
        );
        return Ok(());
    };

    // 4. Get Student Activity
    let student_activity = student_activities::Entity::find()
        .filter(student_activities::Column::StudentId.eq(student.id))
        .filter(student_activities::Column::UnitActivityId.eq(unit_activity.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find student activity: {:?}", e);
            e.into()
        })?;

    let Some(student_activity) = student_activity else {
        println!(
            "Skipping: Student Activity not found for student_id {} and unit_activity_id {}",
            student.id, unit_activity.id
        );
        return Ok(());
    };

    // 5. Check if exists in student_detail_activities
    let existing_detail = detail_activities::Entity::find()
        .filter(detail_activities::Column::ActivityId.eq(student_activity.id))
        .filter(detail_activities::Column::TeachId.eq(teach.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find detail activity: {:?}", e);
            e.into()
        })?;

    // Prepare data for insertion (Need Unit, Institution, Academic Year, Course for name)

    // Get Unit
    let unit = units::Entity::find_by_id(student.unit_id)
        .one(&txn)
        .await
        .map_err(|e| e.into())?
        .ok_or_else(|| "Unit not found".into())?;

    // Get Institution
    let institution = institutions::Entity::find_by_id(unit.institution_id)
        .one(&txn)
        .await
        .map_err(|e| e.into())?
        .ok_or_else(|| "Institution not found".into())?;

    // Get Academic Year
    let academic_year = academic_years::Entity::find_by_id(unit_activity.academic_year_id)
        .one(&txn)
        .await
        .map_err(|e| e.into())?
        .ok_or_else(|| "Academic Year not found".into())?;

    // Get Course
    let course = courses::Entity::find_by_id(teach.course_id)
        .one(&txn)
        .await
        .map_err(|e| e.into())?
        .ok_or_else(|| "Course not found".into())?;

    // Construct Name
    // "DetailAktifitasPerkuliahan" space student.unit.institution.code space student.unit.code space student.code unit_activity.academic_year.feeder_name teach.course.code
    let detail_activity_name = format!(
        "DetailAktifitasPerkuliahan {} {} {} {} {}",
        institution.code, unit.code, student.code, academic_year.feeder_name, course.code
    );

    if existing_detail.is_none() {
        let active = detail_activities::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(detail_activity_name.clone())),
            feeder_id: Set(Uuid::nil()), // As per instructions "feeder_id = uuid::nil()"
            feeder_grade_id: Set(Uuid::nil()),
            grade_id: Set(Uuid::nil()),
            mark: Set(0.0),
            credit: Set(course.total_credit),
            curiculum_detail_sequence: Set(0),
            is_lock: Set(true), // As per instructions "is_lock = true"
            activity_id: Set(student_activity.id),
            teach_id: Set(teach.id),
            course_id: Set(teach.course_id),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        active.insert(&txn).await.map_err(|e| e.into())?;
        println!("  ✅ INSERTED Detail Activity for Student {}", student.code);
    } else {
        println!(
            "  ℹ️ Detail Activity already exists for Student {}",
            detail_activity_name.clone()
        );
    }

    txn.commit().await?;
    Ok(())
}