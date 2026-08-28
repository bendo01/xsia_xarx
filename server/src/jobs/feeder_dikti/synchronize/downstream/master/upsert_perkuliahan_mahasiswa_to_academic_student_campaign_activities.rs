use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_perkuliahan_mahasiswa_to_academic_student_campaign_activities")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::{
        campaign::transaction::activities as campaign_activities,
        general::reference::academic_years,
        student::{
            campaign::activities as student_activities,
            master::students,
            reference::{finances, statuses},
        },
    },
    feeder::master::perkuliahan_mahasiswa,
};

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkerArgs {
    pub model: perkuliahan_mahasiswa::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!(
        "Processing Perkuliahan Mahasiswa: {:?} - {:?}",
        model.nim, model.nama_mahasiswa
    );

    // 1. Find Student
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
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let Some(student) = student else {
        println!(
            "Skipping: Student not found for id_registrasi_mahasiswa {}",
            id_registrasi_mahasiswa
        );
        return Ok(());
    };

    // 2. Find Academic Year
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
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let Some(academic_year) = academic_year else {
        println!(
            "Skipping: Academic Year not found for id_semester {}",
            id_semester
        );
        return Ok(());
    };

    // 3. Find Unit Activity (Campaign Activity)
    // where unit_id = students.unit_id and academic_year_id = academic_year.id
    let unit_activity = campaign_activities::Entity::find()
        .filter(campaign_activities::Column::UnitId.eq(student.unit_id))
        .filter(campaign_activities::Column::AcademicYearId.eq(academic_year.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find unit activity: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let Some(unit_activity) = unit_activity else {
        println!(
            "Skipping: Unit Activity not found for unit_id {} and academic_year_id {}",
            student.unit_id, academic_year.id
        );
        return Ok(());
    };

    // 4. Upsert Student Activity
    let existing_student_activity = student_activities::Entity::find()
        .filter(student_activities::Column::StudentId.eq(student.id))
        .filter(student_activities::Column::UnitActivityId.eq(unit_activity.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find student activity: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let name = format!("Perkuliahan {} {}", academic_year.feeder_name, student.code);

    let cumulative_index = f64::from(model.ips.unwrap_or(0.0));
    let grand_cumulative_index = f64::from(model.ipk.unwrap_or(0.0));
    let total_credit = f64::from(model.sks_semester.unwrap_or(0.0));
    let grand_total_credit = f64::from(model.sks_total.unwrap_or(0.0));
    let finance_fee = model.biaya_kuliah_smt.unwrap_or(0.0) as f64;
    // Handling status_id and resign_status_id as Uuid::nil() default for now
    // Find Status
    let status_id = if let Some(id_status_mahasiswa) = &model.id_status_mahasiswa {
        let status = statuses::Entity::find()
            // .filter(statuses::Column::AlphabetCode.eq(id_status_mahasiswa)) // Assuming AlphabetCode matches id_status_mahasiswa
            // But wait, id_status_mahasiswa is String, AlphabetCode is String? Let's check model.
            // Model: alphabet_code: String. model.id_status_mahasiswa: Option<String>.
            .filter(statuses::Column::AlphabetCode.eq(id_status_mahasiswa))
            .one(&txn)
            .await
            .map_err(|e| {
            tracing::error!("Failed to find status: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;
        match status {
            Some(s) => s.id,
            None => Uuid::nil(),
        }
    } else {
        Uuid::nil()
    };
    let resign_status_id = Uuid::nil();
    // Find Finance
    let finance_id = if let Some(id_pembiayaan) = &model.id_pembiayaan {
        // id_pembiayaan is String, finances.code is Option<i32>. Need to parse.
        if let Ok(code) = id_pembiayaan.parse::<i32>() {
            let finance = finances::Entity::find()
                .filter(finances::Column::Code.eq(code))
                .one(&txn)
                .await
                .map_err(|e| {
            tracing::error!("Failed to find finance: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;
            match finance {
                Some(f) => f.id,
                None => Uuid::nil(),
            }
        } else {
            // Try referencing by name if parsing fails? Or just Nil?
            // Schema says code = id_pembiayaan. If id_pembiayaan is meant to be code, parsing should strictly match.
            // If parsing fails, it might be a name or invalid data. Safe to default to Nil.
            Uuid::nil()
        }
    } else {
        Uuid::nil()
    };

    let action = if let Some(existing) = existing_student_activity {
        let mut active = existing.into_active_model();
        active.name = Set(Some(name.clone()));
        active.cumulative_index = Set(cumulative_index);
        active.grand_cumulative_index = Set(grand_cumulative_index);
        active.total_credit = Set(Some(total_credit));
        active.grand_total_credit = Set(Some(grand_total_credit));
        active.finance_fee = Set(Some(finance_fee));
        active.status_id = Set(status_id);
        active.finance_id = Set(Some(finance_id));
        active.is_lock = Set(Some(true));
        // We keep IDs if they exist, or update them?
        // Feeder doesn't give us new IDs for these statuses, so we might skip updating them
        // if they are already set to something meaningful.
        // But if we want to ensure data consistency with feeder (if feeder provided status), we would update.
        // Since feeder `nama_status_mahasiswa` exists, we COULD lookup.
        // For now, adhere to plan: rely on defaults or minimal updates.
        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
        active.feeder_id = Set(Some(model.id));

        match active.update(&txn).await {
            Ok(_) => "UPDATED",
            Err(sea_orm::DbErr::RecordNotUpdated) => "SKIPPED_UPDATE",
            Err(e) => return Err(Box::new(e)),
        }
    } else {
        let active = student_activities::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(name.clone())),
            cumulative_index: Set(cumulative_index),
            grand_cumulative_index: Set(grand_cumulative_index),
            total_credit: Set(Some(total_credit)),
            grand_total_credit: Set(Some(grand_total_credit)),
            student_id: Set(student.id),
            unit_activity_id: Set(unit_activity.id),
            unit_id: Set(Some(student.unit_id)), // Redundant but in schema
            status_id: Set(status_id),
            resign_status_id: Set(Some(resign_status_id)),
            is_lock: Set(Some(true)),
            feeder_id: Set(Some(model.id)),
            finance_id: Set(Some(finance_id)),
            finance_fee: Set(Some(finance_fee)),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        active.insert(&txn).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        "INSERTED"
    };

    println!("  ✅ {} Student Activity: {}", action, name);

    txn.commit().await?;
    Ok(())
}