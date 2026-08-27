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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_kelas_kuliah_to_academic_campaign_transaction_class_code")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::{
        campaign::transaction::{
            activities, class_codes,
        },
        general::reference::academic_years,
    },
    feeder::master::kelas_kuliah,
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
    pub model: kelas_kuliah::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!("Processing Kelas Kuliah: {:?}", model.nama_kelas_kuliah);

    // 1. Get Academic Year
    let Some(id_semester) = &model.id_semester else {
        println!("Skipping: id_semester is missing");
        return Ok(());
    };

    let academic_year = academic_years::Entity::find()
        .filter(academic_years::Column::FeederName.eq(id_semester))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find academic year: {:?}", e);
            e.into()
        })?;

    let Some(academic_year) = academic_year else {
        println!(
            "Skipping: Academic Year not found for semester {}",
            id_semester
        );
        return Ok(());
    };

    // 2. Get Unit & Institution
    let Some(id_prodi) = model.id_prodi else {
        println!("Skipping: id_prodi is missing");
        return Ok(());
    };

    let unit = units::Entity::find()
        .filter(units::Column::FeederId.eq(id_prodi))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find unit: {:?}", e);
            e.into()
        })?;

    let Some(unit) = unit else {
        println!("Skipping: Unit not found for id_prodi {}", id_prodi);
        return Ok(());
    };

    let institution = institutions::Entity::find_by_id(unit.institution_id)
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find institution: {:?}", e);
            e.into()
        })?;

    let Some(institution) = institution else {
        println!("Skipping: Institution not found for unit {}", unit.id);
        return Ok(());
    };

    // 3. Get Activity
    let activity = activities::Entity::find()
        .filter(activities::Column::AcademicYearId.eq(academic_year.id))
        .filter(activities::Column::UnitId.eq(unit.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find activity: {:?}", e);
            e.into()
        })?;

    let Some(activity) = activity else {
        println!(
            "Skipping: Activity not found for academic_year {} and unit {}",
            academic_year.id, unit.id
        );
        return Ok(());
    };

    // 4. Upsert Class Code
    let Some(nama_kelas_kuliah) = &model.nama_kelas_kuliah else {
        println!("Skipping: nama_kelas_kuliah is missing");
        return Ok(());
    };

    let existing_class_code = class_codes::Entity::find()
        .filter(class_codes::Column::ActivityId.eq(activity.id))
        .filter(class_codes::Column::AlphabetCode.eq(nama_kelas_kuliah))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find class code: {:?}", e);
            e.into()
        })?;

    let class_name = format!(
        "KelasKuliah {} {} {} {}",
        institution.code, unit.code, academic_year.feeder_name, nama_kelas_kuliah
    );

    let action = if let Some(existing) = existing_class_code {
        let mut active = existing.into_active_model();

        active.unit_id = Set(unit.id);
        active.name = Set(class_name);
        active.capacity = Set(40);
        active.start_effective_date = Set(academic_year.start_date);
        active.end_effective_date = Set(academic_year.end_date);
        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

        match active.update(&txn).await {
            Ok(_) => "UPDATED",
            Err(sea_orm::DbErr::RecordNotUpdated) => {
                println!(
                    "  ❌ Record not updated (no changes detected) for {}",
                    nama_kelas_kuliah
                );
                "SKIPPED_UPDATE"
            }
            Err(e) => return Err(e.into()),
        }
    } else {
        let active = class_codes::ActiveModel {
            id: Set(Uuid::new_v4()),
            activity_id: Set(activity.id),
            alphabet_code: Set(Some(nama_kelas_kuliah.clone())),
            unit_id: Set(unit.id),
            name: Set(class_name),
            capacity: Set(40),
            start_effective_date: Set(academic_year.start_date),
            end_effective_date: Set(academic_year.end_date),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        active.insert(&txn).await.map_err(|e| e.into())?;
        "INSERTED"
    };

    println!("  ✅ {} Class Code: {}", action, nama_kelas_kuliah);

    txn.commit().await?;

    Ok(())
}