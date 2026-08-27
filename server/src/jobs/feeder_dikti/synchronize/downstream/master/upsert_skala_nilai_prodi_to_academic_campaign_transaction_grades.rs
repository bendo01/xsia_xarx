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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_skala_nilai_prodi_to_academic_campaign_transaction_grades")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::campaign::transaction::grades as campaign_grades,
    feeder::master::skala_nilai_program_studi,
    institution::master::units as institution_units,
};

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkerArgs {
    pub model: skala_nilai_program_studi::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!(
        "Processing Grade Scale: {:?} - {:?} - {:?}",
        model.id_prodi, model.nilai_huruf, model.nilai_indeks
    );

    // 1. Find Unit
    let Some(id_prodi) = model.id_prodi else {
        println!("Skipping: id_prodi is missing");
        return Ok(());
    };

    let unit = institution_units::Entity::find()
        .filter(institution_units::Column::FeederId.eq(id_prodi))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find unit: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let Some(unit) = unit else {
        println!(
            "Skipping: Unit not found for feeder_id (id_prodi) {}",
            id_prodi
        );
        return Ok(());
    };

    // 2. Upsert Grade
    // Check if grade already exists for this unit and feeder_id
    // If not found by feeder_id, maybe check by code/name + unit?
    // Using feeder_id (id_bobot_nilai) as primary matching key if available.

    let existing_grade = if let Some(id_bobot_nilai) = model.id_bobot_nilai {
        campaign_grades::Entity::find()
            .filter(campaign_grades::Column::FeederId.eq(id_bobot_nilai))
            .one(&txn)
            .await
            .map_err(|e| {
            tracing::error!("Failed to find grade by feeder_id: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?
    } else {
        None
    };

    let name = model.nilai_huruf.clone().unwrap_or_default();
    let alphabet_code = model.nilai_huruf.clone();
    let grade_val = model.nilai_indeks.unwrap_or(0.0) as f64;
    let minimum = model.bobot_minimum.unwrap_or(0.0) as f64;
    let maximum = model.bobot_maksimum.unwrap_or(0.0) as f64;

    let action = if let Some(existing) = existing_grade {
        let mut active = existing.into_active_model();
        active.name = Set(name);
        active.alphabet_code = Set(alphabet_code);
        active.grade = Set(grade_val);
        active.minimum = Set(minimum);
        active.maximum = Set(maximum);
        active.start_date = Set(model.tanggal_mulai_efektif);
        active.end_date = Set(model.tanggal_akhir_efektif);
        active.unit_id = Set(unit.id);

        // Ensure feeder_id is set if it wasn't before (though we found it by feeder_id)
        if let Some(id_bobot_nilai) = model.id_bobot_nilai {
            active.feeder_id = Set(Some(id_bobot_nilai));
        }

        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

        match active.update(&txn).await {
            Ok(_) => "UPDATED",
            Err(sea_orm::DbErr::RecordNotUpdated) => "SKIPPED_UPDATE",
            Err(e) => return Err(Box::new(e)),
        }
    } else {
        let active = campaign_grades::ActiveModel {
            id: Set(Uuid::new_v4()),
            code: Set(None), // Assuming autoincrement or unused for now
            alphabet_code: Set(alphabet_code),
            name: Set(name),
            grade: Set(grade_val),
            minimum: Set(minimum),
            maximum: Set(maximum),
            start_date: Set(model.tanggal_mulai_efektif),
            end_date: Set(model.tanggal_akhir_efektif),
            unit_id: Set(unit.id),
            feeder_id: Set(model.id_bobot_nilai),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        active.insert(&txn).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        "INSERTED"
    };

    println!(
        "  ✅ {} Grade {} - {} for Unit {}",
        action,
        model.nilai_huruf.as_deref().unwrap_or("-"),
        grade_val,
        unit.code.as_deref().unwrap_or("-")
    );

    txn.commit().await?;
    Ok(())
}