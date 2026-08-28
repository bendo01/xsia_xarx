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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:update_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::{
    academic::{
        campaign::transaction::{
            activities as campaign_activities,
            grades as campaign_grades,
            teaches as campaign_teaches,
        },
        course::master::courses as course_master_courses,
        general::reference::academic_years as academic_years_ent,
        student::{
            campaign::{
                activities as student_activities,
                detail_activities as detail_activities_ent,
            },
            master::students as students_ent,
        },
    },
    feeder::master::detail_nilai_perkuliahan_kelas,
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
    pub model: detail_nilai_perkuliahan_kelas::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    let Some(id_semester) = &model.id_semester else {
        tracing::warn!("❌  id_semester is None");
        return Ok(());
    };
    let Some(id_prodi) = &model.id_prodi else {
        tracing::warn!("❌  id_prodi is None");
        return Ok(());
    };
    let Some(id_kelas_kuliah) = &model.id_kelas_kuliah else {
        tracing::warn!("❌  id_kelas_kuliah is None");
        return Ok(());
    };
    let Some(id_matkul) = &model.id_matkul else {
        tracing::warn!("❌  id_matkul is None");
        return Ok(());
    };
    let Some(id_registrasi_mahasiswa) = &model.id_registrasi_mahasiswa else {
        tracing::warn!("❌  id_registrasi_mahasiswa is None");
        return Ok(());
    };

    // 1. Get Academic Year
    let academic_year = academic_years_ent::Entity::find()
        .filter(academic_years_ent::Column::FeederName.eq(id_semester))
        .one(&txn)
        .await
        ?;

    let Some(academic_year) = academic_year else {
        tracing::warn!(
            "❌  AcademicYear not found for id_semester: {}",
            id_semester
        );
        return Ok(());
    };

    // 2. Get Unit
    let unit = institution_units::Entity::find()
        .filter(institution_units::Column::FeederId.eq(*id_prodi))
        .one(&txn)
        .await
        ?;

    let Some(unit) = unit else {
        tracing::warn!("❌  Unit not found for id_prodi: {}", id_prodi);
        return Ok(());
    };

    // 3. Get Unit Activity
    let unit_activity = campaign_activities::Entity::find()
        .filter(campaign_activities::Column::AcademicYearId.eq(academic_year.id))
        .filter(campaign_activities::Column::UnitId.eq(unit.id))
        .one(&txn)
        .await
        ?;

    let Some(unit_activity) = unit_activity else {
        tracing::warn!(
            "❌  UnitActivity not found for AcademicYear: {} and Unit: {}",
            academic_year.name,
            unit.name.as_deref().unwrap_or("")
        );
        return Ok(());
    };

    // 4. Get Teach
    let teach = campaign_teaches::Entity::find()
        .filter(campaign_teaches::Column::FeederId.eq(*id_kelas_kuliah))
        .one(&txn)
        .await
        ?;

    let Some(teach) = teach else {
        tracing::warn!(
            "❌  Teach not found for id_kelas_kuliah: {}",
            id_kelas_kuliah
        );
        return Ok(());
    };

    // 5. Get Course
    let course = course_master_courses::Entity::find()
        .filter(course_master_courses::Column::FeederCourseId.eq(*id_matkul))
        .one(&txn)
        .await
        ?;

    let Some(course) = course else {
        tracing::warn!("❌  Course not found for id_matkul: {}", id_matkul);
        return Ok(());
    };

    // 6. Get Grade
    let grade = if let Some(nilai_huruf) = &model.nilai_huruf {
        campaign_grades::Entity::find()
            .filter(campaign_grades::Column::Name.eq(nilai_huruf))
            .filter(campaign_grades::Column::UnitId.eq(unit.id))
            .one(&txn)
            .await
            ?
    } else {
        None
    };

    // 7. Get Student
    let student = students_ent::Entity::find()
        .filter(students_ent::Column::IdRegistrasiMahasiswa.eq(*id_registrasi_mahasiswa))
        .one(&txn)
        .await
        ?;

    let Some(student) = student else {
        tracing::warn!(
            "❌  Student not found for id_registrasi_mahasiswa: {}",
            id_registrasi_mahasiswa
        );
        return Ok(());
    };

    // 8. Get Student Activity
    let student_activity = student_activities::Entity::find()
        .filter(student_activities::Column::StudentId.eq(student.id))
        .filter(student_activities::Column::UnitActivityId.eq(unit_activity.id))
        .one(&txn)
        .await
        ?;

    let Some(student_activity) = student_activity else {
        tracing::warn!(
            "❌  StudentActivity not found for Student: {} and UnitActivity: {}",
            student.name,
            unit_activity.id
        );
        return Ok(());
    };

    // 9. Get Detail Activity (Target)
    let detail_activity = detail_activities_ent::Entity::find()
        .filter(detail_activities_ent::Column::TeachId.eq(teach.id))
        .filter(detail_activities_ent::Column::CourseId.eq(course.id))
        .filter(detail_activities_ent::Column::ActivityId.eq(student_activity.id))
        .one(&txn)
        .await
        ?;

    if let Some(detail) = detail_activity {
        let mut active = detail.into_active_model();

        let mark = model.nilai_indeks.unwrap_or(0.0) as f64;
        let credit = model.sks_mata_kuliah.unwrap_or(0.0) as f64;
        let grade_id = grade.map(|g| g.id).unwrap_or(Uuid::nil());

        active.mark = Set(Some(mark));
        active.credit = Set(Some(credit));
        active.grade_id = Set(Some(grade_id));
        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

        active.update(&txn).await?;
        println!(
            "✅ Updated DetailActivity for nim: {} nama: {} - aktifitas: {} - Course: {}",
            student.code, student.name, student_activity.name.as_deref().unwrap_or(""), course.name
        );
    } else {
        tracing::warn!(
            "❌  DetailActivity not found to update for nim: {} nama: {} - aktifitas: {} - Course: {}",
            student.code,
            student.name,
            student_activity.name.as_deref().unwrap_or(""),
            course.name
        );
    }

    txn.commit().await?;
    Ok(())
}