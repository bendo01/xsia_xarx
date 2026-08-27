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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::{
        campaign::transaction::{
            teach_evaluations::{ActiveModel, Column, Entity},
            teaches as TeachModel,
        },
        course::reference::evaluation_types as EvaluationTypeModel,
    },
    feeder::master::komponen_evaluasi_kelas as KomponenEvaluasiKelasModel,
};
pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkerArgs {
    pub model: KomponenEvaluasiKelasModel::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;

    // 2. get evaluation_type where evaluation_type.code = komponen_evaluasi_kelas.id_jenis_evaluasi
    let evaluation_type = EvaluationTypeModel::Entity::find()
        .filter(EvaluationTypeModel::Column::Code.eq(model.id_jenis_evaluasi))
        .one(db)
        .await?;

    let evaluation_type = match evaluation_type {
        Some(v) => v,
        None => {
            println!(
                "❌ Evaluation Type not found for code: {}",
                model.id_jenis_evaluasi
            );
            return Ok(());
        }
    };

    // 3. get teaches where teaches.feeder_id = komponen_evaluasi_kelas.id_kelas_kuliah
    let teach = TeachModel::Entity::find()
        .filter(TeachModel::Column::FeederId.eq(model.id_kelas_kuliah))
        .one(db)
        .await?;

    let teach = match teach {
        Some(v) => v,
        None => {
            println!(
                "❌ Teach not found for feeder_id: {}",
                model.id_kelas_kuliah
            );
            return Ok(());
        }
    };

    // 4. upsert academic_campaign_teach_evaluations
    let existing = Entity::find()
        .filter(Column::FeederId.eq(model.id))
        .one(db)
        .await?;

    if let Some(existing) = existing {
        let mut active_model = existing.into_active_model();

        active_model.name = Set(model.nama.clone().unwrap_or_default());
        active_model.english_name = Set(model.nama_inggris.clone());
        active_model.thread = Set(model.nomor_urut);

        let weight = model.bobot_evaluasi.parse::<f32>().unwrap_or(0.0);
        active_model.evaluation_weight = Set(weight);

        active_model.teach_id = Set(teach.id);
        active_model.evaluation_type_id = Set(evaluation_type.id);
        active_model.feeder_id = Set(Some(model.id));
        active_model.sync_at = Set(Some(chrono::Utc::now().naive_utc()));

        active_model.update(db).await?;

        println!(
            "✅ Updated Teach Evaluation: {}",
            model.nama.unwrap_or_default()
        );
    } else {
        let mut active_model = ActiveModel {
            id: Set(Uuid::new_v4()),
            ..Default::default()
        };

        active_model.name = Set(model.nama.clone().unwrap_or_default());
        active_model.english_name = Set(model.nama_inggris.clone());
        active_model.thread = Set(model.nomor_urut);

        let weight = model.bobot_evaluasi.parse::<f32>().unwrap_or(0.0);
        active_model.evaluation_weight = Set(weight);

        active_model.teach_id = Set(teach.id);
        active_model.evaluation_type_id = Set(evaluation_type.id);
        active_model.feeder_id = Set(Some(model.id));
        active_model.sync_at = Set(Some(chrono::Utc::now().naive_utc()));

        active_model.insert(db).await?;

        println!(
            "✅ Inserted Teach Evaluation: {}",
            model.nama.unwrap_or_default()
        );
    }

    Ok(())
}