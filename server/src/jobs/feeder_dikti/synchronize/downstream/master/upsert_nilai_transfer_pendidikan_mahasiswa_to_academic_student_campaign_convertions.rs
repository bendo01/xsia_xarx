use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait, TryIntoModel,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::{
    academic::{
        campaign::transaction::grades as campaign_grades,
        course::master::courses as course_master_courses,
        general::reference::academic_years as academic_years_ent,
        student::{
            campaign::convertions as student_convertions,
            master::students as students_ent,
        },
    },
    feeder::master::nilai_transfer_pendidikan_mahasiswa,
};

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkerArgs {
    pub model: nilai_transfer_pendidikan_mahasiswa::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    // 1. Get Student
    let student = students_ent::Entity::find()
        .filter(students_ent::Column::IdRegistrasiMahasiswa.eq(model.id_registrasi_mahasiswa))
        .one(&txn)
        .await
        ?;

    let Some(student) = student else {
        tracing::warn!(
            "❌  Student not found for id_registrasi_mahasiswa: {}",
            model.id_registrasi_mahasiswa
        );
        return Ok(());
    };

    // 2. Get Academic Year
    let academic_year = academic_years_ent::Entity::find()
        .filter(academic_years_ent::Column::FeederName.eq(&model.id_periode_masuk))
        .one(&txn)
        .await
        ?;

    // 3. Get Course (Optional)
    let course = course_master_courses::Entity::find()
        .filter(course_master_courses::Column::FeederCourseId.eq(model.id_matkul))
        .one(&txn)
        .await
        ?;

    if course.is_none() {
        tracing::warn!("❌  Course not found for id_matkul: {}", model.id_matkul);
    }

    let (course_id, course_code) = if let Some(course) = &course {
        (course.id, course.code.clone())
    } else {
        (Uuid::nil(), model.kode_matkul_diakui.clone())
    };

    // 4. Get Grade
    let grade = if let Some(nilai_huruf_diakui) = &model.nilai_huruf_diakui {
        campaign_grades::Entity::find()
            .filter(campaign_grades::Column::UnitId.eq(student.unit_id))
            .filter(campaign_grades::Column::Name.eq(nilai_huruf_diakui))
            .one(&txn)
            .await
            ?
    } else {
        None
    };

    let grade_id = if let Some(grade) = grade {
        grade.id
    } else {
        tracing::warn!(
            "❌  Grade not found for unit_id: {} and name: {:?}",
            student.unit_id,
            model.nilai_huruf_diakui
        );
        println!("student {:#?}", student.clone());
        Uuid::nil()
    };

    // 5. Upsert Convertion
    let _convertion = student_convertions::Entity::find()
        .filter(student_convertions::Column::FeederId.eq(model.id_transfer))
        .one(&txn)
        .await
        ?;

    // 5. Upsert Convertion
    let convertion = student_convertions::Entity::find()
        .filter(student_convertions::Column::FeederId.eq(model.id_transfer))
        .one(&txn)
        .await
        ?;

    let mut active = match convertion {
        Some(c) => c.into_active_model(),
        None => {
            let mut a = student_convertions::ActiveModel {
                id: Set(()),
                ..Default::default()
            };
            a.created_at = Set(Some(chrono::Utc::now().naive_utc()));
            a
        }
    };

    active.feeder_id = Set(Some(model.id_transfer));
    active.student_id = Set(student.id);
    active.academic_year_id = Set(academic_year.as_ref().map(|ay| ay.id));
    active.course_id = Set(course_id);
    active.grade_id = Set(grade_id);

    // Validate if course_id is Nil, it might fail if table has FK.
    // But since no FK is explicit, maybe the update fails due to other reasons.
    // Try to ensure deleted_at is None if we are reviving/updating.
    active.deleted_at = Set(None);

    // Mapping requested fields
    let name = format!(
        "NilaiTransferPendidikanMahasiswa {} {} {}",
        student.code,
        academic_year
            .as_ref()
            .map(|ay| ay.feeder_name.as_str())
            .unwrap_or(&model.id_semester),
        course_code
    );
    active.name = Set(Some(name));
    active.origin_code = Set(Some(model.kode_mata_kuliah_asal));
    active.origin_name = Set(Some(model.nama_mata_kuliah_asal));

    // Handle f32 -> f64 conversion for transfer_credit
    let credit = model.sks_mata_kuliah_asal.unwrap_or(0.0) as f64;
    active.origin_credit = Set(Some(credit));

    // Handle Option<String> -> String for transfer_grade (assuming not null in target or handle default)
    // Target schema says String, source is Option. Plan says map directly.
    // If source is None, we default to empty string to satisfy non-null constraint if needed,
    // but logic above checked grade existence. Let's use the value found.
    active.origin_grade = Set(Some(model.nilai_huruf_asal.unwrap_or_default()));
    active.transfer_code = Set(model.kode_matkul_diakui);
    active.transfer_name = Set(model.nama_mata_kuliah_diakui);
    active.transfer_credit = Set(model.sks_mata_kuliah_diakui.unwrap_or_default() as f64);
    active.transfer_grade = Set(model.nilai_huruf_diakui.unwrap_or_default());
    active.is_lock = Set(Some(chrono::Utc::now().naive_utc()));
    active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

    if active.id.is_unchanged() {
        // Update
        if active.is_changed() {
            active.update(&txn).await?;
            println!("✅ Updated Convertion for Student: {}", student.name);
        } else {
            println!(
                "✅ Convertion already up to date for Student: {}",
                student.name
            );
        }
    } else {
        // Insert
        active.insert(&txn).await?;
        println!("✅ Created Convertion for Student: {}", student.name);
    }

    txn.commit().await?;
    Ok(())
}