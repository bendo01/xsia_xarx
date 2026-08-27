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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::{
        campaign::transaction::{
            activities, teach_lecturers,
            teaches,
        },
        course::master::courses,
        general::reference::academic_years,
        lecturer::master::lecturers,
    },
    feeder::master::aktifitas_mengajar_dosen,
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
    pub model: aktifitas_mengajar_dosen::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!(
        "Processing Aktifitas Mengajar Dosen: {:?}",
        model.nama_dosen
    );

    // 1. Get Teach (via Feeder ID = id_kelas)
    let Some(id_kelas) = model.id_kelas else {
        println!("Skipping: id_kelas is missing");
        return Ok(());
    };

    let teach = teaches::Entity::find()
        .filter(teaches::Column::FeederId.eq(id_kelas))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find teach: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let Some(teach) = teach else {
        println!("Skipping: Teach not found for id_kelas {}", id_kelas);
        return Ok(());
    };

    // 2. Get Lecturer (via id_dosen)
    let Some(id_dosen) = model.id_dosen else {
        println!("Skipping: id_dosen is missing");
        return Ok(());
    };

    let lecturer = lecturers::Entity::find()
        .filter(lecturers::Column::IdDosen.eq(id_dosen))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find lecturer: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let Some(lecturer) = lecturer else {
        println!("Skipping: Lecturer not found for id_dosen {}", id_dosen);
        return Ok(());
    };

    // 2.1 Fetch Relations for Naming (Activity, Unit, Institution, Academic Year, Course)
    let Some(activity_id) = teach.activity_id else {
        println!("Skipping: Teach has no activity_id for teach {}", teach.id);
        return Ok(());
    };

    let activity = activities::Entity::find_by_id(activity_id)
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
        .ok_or("Activity not found")?;

    let unit = units::Entity::find_by_id(activity.unit_id)
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
        .ok_or("Unit not found")?;

    let institution = institutions::Entity::find_by_id(unit.institution_id)
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
        .ok_or("Institution not found")?;

    let academic_year = academic_years::Entity::find_by_id(activity.academic_year_id)
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
        .ok_or("Academic Year not found")?;

    // println!("Teach: {:#?}", teach.clone());
    let course = courses::Entity::find_by_id(teach.course_id)
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

    let course = match course {
        Some(c) => c,
        None => {
            println!("Skipping: Course not found");
            println!("Teach: {:#?}", teach.clone());
            return Ok(());
        }
    };

    // Construct Name
    let lecturer_code = if !lecturer.code.is_empty() {
        lecturer.code.as_str()
    } else {
        lecturer.nuptk.as_deref().unwrap_or("-")
    };

    let name = format!(
        "DosenAktifitasPengajaran {} {} {} {} {}",
        institution.code.as_deref().unwrap_or(""), unit.code.as_deref().unwrap_or(""), academic_year.feeder_name, course.code, lecturer_code
    );

    // 3. Upsert TeachLecturer
    // Key: teach_id, lecturer_id
    let existing_teach_lecturer = teach_lecturers::Entity::find()
        .filter(teach_lecturers::Column::TeachId.eq(teach.id))
        .filter(teach_lecturers::Column::LecturerId.eq(lecturer.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find teach lecturer: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    // Model fields mapping
    let planning = model.rencana_minggu_pertemuan.unwrap_or(0);
    let realization = model.realisasi_minggu_pertemuan.unwrap_or(0);
    let credit = Decimal::ZERO; // Default as not present in model
    // is_lecturer_home_base: logic unknown, setting default false or keep existing

    let action = if let Some(existing) = existing_teach_lecturer {
        let mut active = existing.into_active_model();
        active.name = Set(Some(name.clone()));
        active.planning = Set(planning);
        active.realization = Set(realization);
        active.credit = Set(Some(credit));
        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
        active.feeder_id = Set(Some(model.id)); // Using the ID from aktifitas_mengajar_dosen

        match active.update(&txn).await {
            Ok(_) => "UPDATED",
            Err(sea_orm::DbErr::RecordNotUpdated) => "SKIPPED_UPDATE",
            Err(e) => return Err(Box::new(e)),
        }
    } else {
        let active = teach_lecturers::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(name.clone())),
            planning: Set(planning),
            realization: Set(realization),
            credit: Set(Some(credit)),
            is_lecturer_home_base: Set(true), // Defaulting to true? Or false. Let's say true for now as they are in the system.
            lecturer_id: Set(lecturer.id),
            teach_id: Set(teach.id),
            feeder_id: Set(Some(model.id)),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        active.insert(&txn).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        "INSERTED"
    };

    println!("  ✅ {} Teach Lecturer: {}", action, name);

    txn.commit().await?;
    Ok(())
}