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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_kelas_kuliah_to_academic_campaign_transaction_teaches")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::{
        campaign::{
            reference::scopes,
            transaction::{
                activities, class_codes,
                teach_decrees, teaches,
            },
        },
        course::master::courses,
        general::reference::academic_years,
    },
    feeder::master::kelas_kuliah,
    institution::master::{
        institutions, staffes, units,
    },
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

    println!(
        "Processing Kelas Kuliah for Teaches: {:?}",
        model.nama_kelas_kuliah
    );

    // 0. Pre-fetch required references (Scope: Internal)
    let internal_scope = scopes::Entity::find()
        .filter(scopes::Column::Name.eq("Internal"))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find Internal scope: {:?}", e);
            e.into()
        })?;

    let Some(internal_scope) = internal_scope else {
        println!("Skipping: 'Internal' Scope not found");
        return Ok(());
    };

    // let encounter_category = encounter_categories::Entity::find() ... (Skipped per request)

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

    // 4. Get Course
    let Some(id_matkul) = model.id_matkul else {
        println!("Skipping: id_matkul is missing");
        return Ok(());
    };

    let course = courses::Entity::find()
        .filter(courses::Column::FeederCourseId.eq(id_matkul))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find course: {:?}", e);
            e.into()
        })?;

    let Some(course) = course else {
        println!("Skipping: Course not found for id_matkul {}", id_matkul);
        return Ok(());
    };

    // 5. Get Curriculum Detail (Pick first associated with course)
    // For now set to Nil as per request
    // let curriculum_detail = curriculum_details::Entity::find() ...

    // 6. Get Class Code
    let Some(nama_kelas_kuliah) = &model.nama_kelas_kuliah else {
        println!("Skipping: nama_kelas_kuliah is missing");
        return Ok(());
    };

    let class_code = class_codes::Entity::find()
        .filter(class_codes::Column::ActivityId.eq(activity.id))
        .filter(class_codes::Column::AlphabetCode.eq(nama_kelas_kuliah))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find class code: {:?}", e);
            e.into()
        })?;

    let Some(class_code) = class_code else {
        println!(
            "Skipping: Class Code not found for activity {} and name {}",
            activity.id, nama_kelas_kuliah
        );
        return Ok(());
    };

    // 7. Get Staff (Specific Position Type)
    let position_type_id = uuid::Uuid::parse_str("b3ad82b8-520b-4b77-8cca-b487bf77a91c")
        .map_err(|e| format!("Invalid UUID for position type: {}", e).into())?;

    let staff = staffes::Entity::find()
        .filter(staffes::Column::UnitId.eq(unit.id))
        .filter(staffes::Column::PositionTypeId.eq(position_type_id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find staff: {:?}", e);
            e.into()
        })?;

    // 8. Upsert Teach Decree
    let existing_decree = teach_decrees::Entity::find()
        .filter(teach_decrees::Column::ActivityId.eq(activity.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find existing decree: {:?}", e);
            e.into()
        })?;

    let teach_decree_id = if let Some(decree) = existing_decree {
        decree.id
    } else {
        let new_id = Uuid::new_v4();
        let staff_id = staff.as_ref().map(|s| s.id).unwrap_or(uuid::Uuid::nil());
        let decree_date = academic_year
            .start_date
            .unwrap_or(chrono::Utc::now().naive_utc().date());

        let new_decree = teach_decrees::ActiveModel {
            id: Set(new_id),
            activity_id: Set(activity.id),
            decree_date: Set(decree_date),
            decree_number: Set("-".to_string()),
            staff_id: Set(Some(staff_id)),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        new_decree.insert(&txn).await.map_err(|e| e.into())?.id
    };

    // 9. Upsert Teaches
    // Name pattern: "Aktifitas Pengajaran [unit_inst_code] [unit_code] [sem_feeder] [course_code]"
    let teaches_name = format!(
        "AktifitasPengajaran {} {} {} {}",
        institution.code, unit.code, academic_year.feeder_name, course.code
    );

    let (practice_start_date, practice_end_date) =
        if course.practice_credit == 0.0 && course.field_practice_credit == 0.0 {
            (None, None)
        } else {
            (academic_year.start_date, academic_year.end_date)
        };

    let existing_teaches = teaches::Entity::find()
        .filter(teaches::Column::ActivityId.eq(activity.id))
        .filter(teaches::Column::ClassCodeId.eq(class_code.id))
        .filter(teaches::Column::CourseId.eq(course.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find teaches: {:?}", e);
            e.into()
        })?;

    let action = if let Some(existing) = existing_teaches {
        let mut active = existing.into_active_model();
        active.name = Set(Some(teaches_name.clone()));
        active.start_date = Set(academic_year.start_date);
        active.end_date = Set(academic_year.end_date);
        active.practice_start_date = Set(practice_start_date);
        active.practice_end_date = Set(practice_end_date);
        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

        // Ensure mandatory fields are set if they were missing or updated
        active.scope_id = Set(internal_scope.id);
        active.encounter_category_id = Set(Uuid::nil());
        active.teach_decree_id = Set(teach_decree_id);
        active.curriculum_detail_id = Set(Uuid::nil());
        active.max_member = Set(40);
        active.is_lock = Set(false);
        active.is_lecturer_credit_sum_problem = Set(false);
        active.feeder_id = Set(model.id_kelas_kuliah);

        match active.update(&txn).await {
            Ok(_) => "UPDATED",
            Err(sea_orm::DbErr::RecordNotUpdated) => "SKIPPED_UPDATE",
            Err(e) => return Err(e.into()),
        }
    } else {
        let active = teaches::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(teaches_name.clone())),
            activity_id: Set(activity.id),
            class_code_id: Set(class_code.id),
            course_id: Set(course.id),
            scope_id: Set(internal_scope.id),
            encounter_category_id: Set(Uuid::nil()),
            teach_decree_id: Set(teach_decree_id),
            curriculum_detail_id: Set(Uuid::nil()),
            max_member: Set(40),
            is_lock: Set(false),
            is_lecturer_credit_sum_problem: Set(false),
            start_date: Set(academic_year.start_date),
            end_date: Set(academic_year.end_date),
            practice_start_date: Set(practice_start_date),
            practice_end_date: Set(practice_end_date),
            feeder_id: Set(model.id_kelas_kuliah),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        active.insert(&txn).await.map_err(|e| e.into())?;
        "INSERTED"
    };

    println!("  ✅ {} Teaches: {}", action, teaches_name);

    txn.commit().await?;

    Ok(())
}