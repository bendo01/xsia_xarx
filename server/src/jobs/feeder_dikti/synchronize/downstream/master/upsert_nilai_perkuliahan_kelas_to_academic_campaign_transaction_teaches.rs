use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait, TryIntoModel,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
        models::{
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
        feeder::master::nilai_perkuliahan_kelas,
        institution::master::{institutions, units},
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
    pub model: nilai_perkuliahan_kelas::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!(
        "Processing Nilai Perkuliahan Kelas: ID={} - Kelas={}",
        model.id, model.nama_kelas_kuliah
    );

    // 0. Pre-fetch Internal scope
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

    // 1. Get Academic Year
    let academic_year = academic_years::Entity::find()
        .filter(academic_years::Column::FeederName.eq(&model.id_smt))
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let Some(academic_year) = academic_year else {
        println!(
            "Skipping: Academic Year not found for id_smt {}",
            model.id_smt
        );
        return Ok(());
    };

    // 2. Get Unit & Institution
    // Mapping id_prodi -> id_sms
    let unit = units::Entity::find()
        .filter(units::Column::FeederId.eq(model.id_sms))
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let Some(unit) = unit else {
        println!("Skipping: Unit not found for id_sms {}", model.id_sms);
        return Ok(());
    };

    let institution = institutions::Entity::find_by_id(unit.institution_id)
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let Some(institution) = institution else {
        println!("Skipping: Institution not found for unit {}", unit.id);
        return Ok(());
    };

    // 3. Get Course
    let course = courses::Entity::find()
        .filter(courses::Column::FeederCourseId.eq(model.id_matkul))
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let Some(course) = course else {
        println!(
            "Skipping: Course not found for id_matkul {}",
            model.id_matkul
        );
        return Ok(());
    };

    // 4. Get Unit Activity
    let unit_activity = activities::Entity::find()
        .filter(activities::Column::UnitId.eq(unit.id))
        .filter(activities::Column::AcademicYearId.eq(academic_year.id))
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let Some(unit_activity) = unit_activity else {
        println!(
            "Skipping: Unit Activity not found for unit {} and academic year {}",
            unit.id, academic_year.id
        );
        return Ok(());
    };

    // 5. Get/Create Class Code
    let class_code = class_codes::Entity::find()
        .filter(class_codes::Column::ActivityId.eq(unit_activity.id))
        .filter(class_codes::Column::AlphabetCode.eq(&model.nama_kelas_kuliah))
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let class_code_id = if let Some(cc) = class_code {
        cc.id
    } else {
        let new_id = ();
        let name = format!(
            "KelasKuliah {} {} {} {}",
            institution.code, unit.code, academic_year.feeder_name, model.nama_kelas_kuliah
        );
        let active_model = class_codes::ActiveModel {
            id: Set(new_id),
            alphabet_code: Set(Some(model.nama_kelas_kuliah.clone())),
            name: Set(name),
            activity_id: Set(unit_activity.id),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            unit_id: Set(unit.id),
            capacity: Set(40),
            start_effective_date: Set(academic_year.start_date),
            end_effective_date: Set(academic_year.end_date),
            ..Default::default()
        };
        active_model
            .insert(&txn)
            .await
            .map_err(|e| e.into())?
            .id
    };

    // 6. Get/Create Teach Decree
    let teach_decree = teach_decrees::Entity::find()
        .filter(teach_decrees::Column::ActivityId.eq(unit_activity.id))
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let teach_decree_id = if let Some(td) = teach_decree {
        td.id
    } else {
        let new_id = ();
        let decree_date = academic_year
            .start_date
            .unwrap_or(chrono::Utc::now().naive_utc().date());
        let active_model = teach_decrees::ActiveModel {
            id: Set(new_id),
            decree_number: Set("-".to_string()),
            decree_date: Set(decree_date),
            activity_id: Set(unit_activity.id),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };
        active_model
            .insert(&txn)
            .await
            .map_err(|e| e.into())?
            .id
    };

    // 7. Upsert Teach
    let existing_teach = teaches::Entity::find()
        .filter(teaches::Column::FeederId.eq(model.id_kelas_kuliah))
        .one(&txn)
        .await
        .map_err(|e| e.into())?;

    let teach_name = format!(
        "AktifitasPengajaran {} {} {} {}",
        institution.code, unit.code, academic_year.feeder_name, course.code
    );

    let (practice_start, practice_end) =
        if course.practice_credit > 0.0 || course.field_practice_credit > 0.0 {
            (academic_year.start_date, academic_year.end_date)
        } else {
            (None, None)
        };

    if let Some(teach) = existing_teach {
        // Update
        let mut active = teach.into_active_model();
        active.name = Set(Some(teach_name));
        active.start_date = Set(academic_year.start_date);
        active.end_date = Set(academic_year.end_date);
        active.practice_start_date = Set(practice_start);
        active.practice_end_date = Set(practice_end);

        active.class_code_id = Set(class_code_id);
        active.course_id = Set(course.id);
        active.activity_id = Set(unit_activity.id);
        active.teach_decree_id = Set(teach_decree_id);
        // Ensure other fields are reset/set
        active.is_lecturer_credit_sum_problem = Set(false);
        active.is_lock = Set(false);
        active.max_member = Set(40);

        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

        match active.update(&txn).await {
            Ok(_) => println!("✅ Updated Teach: {}", model.id_kelas_kuliah),
            Err(sea_orm::DbErr::RecordNotUpdated) => {
                println!("ℹ️ Teach up to date: {}", model.id_kelas_kuliah)
            }
            Err(e) => return Err(e.into()),
        }
    } else {
        // Create
        let new_id = ();
        let active = teaches::ActiveModel {
            id: Set(new_id),
            name: Set(Some(teach_name)),
            start_date: Set(academic_year.start_date),
            end_date: Set(academic_year.end_date),
            practice_start_date: Set(practice_start),
            practice_end_date: Set(practice_end),
            is_lecturer_credit_sum_problem: Set(false),
            is_lock: Set(false),
            max_member: Set(40),
            class_code_id: Set(class_code_id),
            course_id: Set(course.id),
            activity_id: Set(unit_activity.id),
            teach_decree_id: Set(teach_decree_id),
            feeder_id: Set(model.id_kelas_kuliah),
            scope_id: Set(internal_scope.id),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            curriculum_detail_id: Set(uuid::Uuid::nil()), // Default as per pattern
            encounter_category_id: Set(uuid::Uuid::nil()), // Default as per pattern
            ..Default::default()
        };
        active.insert(&txn).await.map_err(|e| e.into())?;
        println!("✅ Created Teach: {}", model.id_kelas_kuliah);
    }

    txn.commit().await?;
    Ok(())
}