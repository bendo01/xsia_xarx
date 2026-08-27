use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait, TryIntoModel,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
    feeder::master::kartu_rencana_studi_mahasiswa,
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
    pub model: kartu_rencana_studi_mahasiswa::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!(
        "Processing KRS: Student ID {:?} - Course {:?} - Class {:?}",
        model.id_registrasi_mahasiswa, model.nama_mata_kuliah, model.nama_kelas_kuliah
    );

    // 1. Find Unit
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

    // 1.5 Find Institution
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

    // 2. Find Academic Year
    let Some(id_periode) = &model.id_periode else {
        println!("Skipping: id_periode is missing");
        return Ok(());
    };

    let academic_year = academic_years::Entity::find()
        .filter(academic_years::Column::FeederName.eq(id_periode))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find academic year: {:?}", e);
            e.into()
        })?;

    let Some(academic_year) = academic_year else {
        println!(
            "Skipping: Academic Year not found for id_periode {}",
            id_periode
        );
        return Ok(());
    };

    // 3. Find Unit Activity (Campaign Activity)
    let unit_activity = campaign_activities::Entity::find()
        .filter(campaign_activities::Column::UnitId.eq(unit.id))
        .filter(campaign_activities::Column::AcademicYearId.eq(academic_year.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find unit activity: {:?}", e);
            e.into()
        })?;

    let Some(unit_activity) = unit_activity else {
        println!(
            "Skipping: Unit Activity not found for unit_id {} and academic_year_id {}",
            unit.id, academic_year.id
        );
        return Ok(());
    };

    // 4. Find Student
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

    // 5. Find Student Activity
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

    // 6. Find Course
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

    // 7. Find Teach (Class)
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
            e.into()
        })?;

    let Some(teach) = teach else {
        println!(
            "Skipping: Teach not found for feeder_id (id_kelas) {}",
            id_kelas
        );
        return Ok(());
    };

    // 8. Upsert Detail Activity
    let existing_detail = detail_activities::Entity::find()
        .filter(detail_activities::Column::TeachId.eq(teach.id))
        .filter(detail_activities::Column::ActivityId.eq(student_activity.id))
        .filter(detail_activities::Column::CourseId.eq(course.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find detail activity: {:?}", e);
            e.into()
        })?;

    let detail_activity_name = format!(
        "DetailAktifitasPerkuliahan {} {} {} {} {}",
        institution.code, unit.code, student.code, academic_year.feeder_name, course.code
    );
    let credit = f64::from(model.sks_mata_kuliah.unwrap_or(0.0));
    let curiculum_detail_sequence = 0; // Default or need calculation? Using 0 as per plan (implied default)

    let action = if let Some(existing) = existing_detail {
        let mut active = existing.into_active_model();
        active.name = Set(Some(detail_activity_name.clone()));
        active.credit = Set(credit); // Model uses f64
        active.feeder_id = Set(model.id);
        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
        active.mark = Set(0.0);
        active.grade_id = Set(Uuid::nil());
        active.feeder_grade_id = Set(Uuid::nil());

        match active.update(&txn).await {
            Ok(_) => "UPDATED",
            Err(sea_orm::DbErr::RecordNotUpdated) => "SKIPPED_UPDATE",
            Err(e) => return Err(e.into()),
        }
    } else {
        let active = detail_activities::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(detail_activity_name.clone())),
            feeder_id: Set(model.id),
            feeder_grade_id: Set(Uuid::nil()),
            curiculum_detail_sequence: Set(curiculum_detail_sequence),
            mark: Set(0.0),
            credit: Set(credit),
            grade_id: Set(Uuid::nil()),
            course_id: Set(course.id),
            activity_id: Set(student_activity.id),
            teach_id: Set(teach.id),
            is_lock: Set(false),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        active.insert(&txn).await.map_err(|e| e.into())?;
        "INSERTED"
    };

    println!(
        "  ✅ {} Detail Activity for Student {} - Course {}",
        action, student.code, course.code
    );

    txn.commit().await?;
    Ok(())
}