use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection,
    EntityTrait, QueryFilter, TransactionTrait,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_detail_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activity")
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
                activities as campaign_activities,
                class_codes, grades,
                teach_decrees, teaches,
            },
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
    feeder::master::detail_nilai_perkuliahan_kelas,
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
    pub model: detail_nilai_perkuliahan_kelas::Model,
}



pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let model = args.model;
    let txn = db.begin().await?;

    println!(
        "Processing Detail Nilai Perkuliahan Kelas: Student ID {:?} - Class ID {:?}",
        model.id_registrasi_mahasiswa, model.id_kelas_kuliah
    );

    // 1. Get Unit (Prodi)
    let Some(id_prodi) = model.id_prodi.clone() else {
        println!("Skipping: id_prodi is missing");
        return Ok(());
    };
    // 0. Pre-fetch Internal scope
    let internal_scope = scopes::Entity::find()
        .filter(scopes::Column::Name.eq("Internal"))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find Internal scope: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let Some(internal_scope) = internal_scope else {
        println!("Skipping: 'Internal' Scope not found");
        return Ok(());
    };

    let unit = units::Entity::find()
        .filter(units::Column::FeederId.eq(id_prodi.clone()))
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    let Some(unit) = unit else {
        println!("Skipping: Unit not found for feeder_id {}", id_prodi);
        return Ok(());
    };

    let institution = institutions::Entity::find_by_id(unit.institution_id)
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

    let Some(institution) = institution else {
        println!("Skipping: Institution not found for unit {}", unit.id);
        return Ok(());
    };

    // 2. Get Academic Year
    let Some(id_semester) = model.id_semester.clone() else {
        println!("Skipping: id_semester is missing");
        return Ok(());
    };
    let academic_year = academic_years::Entity::find()
        .filter(academic_years::Column::FeederName.eq(id_semester.clone()))
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    let Some(academic_year) = academic_year else {
        println!(
            "Skipping: Academic Year not found for feeder_name {}",
            id_semester
        );
        return Ok(());
    };

    // 3. Get Course
    let Some(id_matkul) = model.id_matkul.clone() else {
        println!("Skipping: id_matkul is missing");
        return Ok(());
    };
    let course = courses::Entity::find()
        .filter(courses::Column::FeederCourseId.eq(id_matkul.clone()))
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    let Some(course) = course else {
        println!(
            "Skipping: Course not found for feeder_course_id {}",
            id_matkul
        );
        return Ok(());
    };

    // 4. Get Unit Activity
    let unit_activity = campaign_activities::Entity::find()
        .filter(campaign_activities::Column::UnitId.eq(unit.id))
        .filter(campaign_activities::Column::AcademicYearId.eq(academic_year.id))
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

    let unit_activity = if let Some(ua) = unit_activity {
        ua
    } else {
        let new_id = Uuid::new_v4();
        let name = format!(
            "KegiatanPerkuliahan {} {}",
            academic_year.feeder_name, unit.code.as_deref().unwrap_or("")
        );
        let active_model = campaign_activities::ActiveModel {
            id: Set(new_id),
            name: Set(name),
            unit_id: Set(unit.id),
            academic_year_id: Set(academic_year.id),
            week_quantity: Set(Some(16)),
            student_target: Set(0),
            candidate_number: Set(0),
            candidate_pass: Set(0),
            became_student: Set(0),
            transfer_student: Set(0),
            total_class_member: Set(Some(0)),
            start_date: Set(academic_year.start_date),
            end_date: Set(academic_year.end_date),
            start_transaction: Set(academic_year.start_date),
            end_transaction: Set(academic_year.end_date),
            is_active: Set(Some(true)),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };
        let ua = active_model.insert(&txn).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        println!(
            "✅ CREATED Unit Activity: {} for Unit {}",
            ua.name, unit.code.as_deref().unwrap_or("")
        );
        ua
    };

    // 5. Get or Create Teach
    let Some(id_kelas_kuliah) = model.id_kelas_kuliah.clone() else {
        println!("Skipping: id_kelas_kuliah is missing");
        return Ok(());
    };

    let teach = teaches::Entity::find()
        .filter(teaches::Column::FeederId.eq(id_kelas_kuliah.clone()))
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

    let teach = if let Some(t) = teach {
        t
    } else {
        // Create Logic from UpsertNilaiPerkuliahanKelasToAcademicCampaignTeachesWorker
        let Some(nama_kelas_kuliah) = model.nama_kelas_kuliah.clone() else {
            println!(
                "Skipping: nama_kelas_kuliah is missing for NEW TEACH creation (id: {})",
                id_kelas_kuliah
            );
            return Ok(());
        };

        // 5.1 Get/Create Class Code
        let class_code = class_codes::Entity::find()
            .filter(class_codes::Column::ActivityId.eq(unit_activity.id))
            .filter(class_codes::Column::AlphabetCode.eq(&nama_kelas_kuliah))
            .one(&txn)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let class_code_id = if let Some(cc) = class_code {
            cc.id
        } else {
            let new_id = Uuid::new_v4();
            let name = format!(
                "KelasKuliah {} {} {} {}",
                institution.code.as_deref().unwrap_or(""), unit.code.as_deref().unwrap_or(""), academic_year.feeder_name, nama_kelas_kuliah
            );
            let active_model = class_codes::ActiveModel {
                id: Set(new_id),
                alphabet_code: Set(Some(nama_kelas_kuliah.clone())),
                name: Set(name),
                activity_id: Set(unit_activity.id),
                created_at: Set(Some(chrono::Utc::now().naive_utc())),
                updated_at: Set(Some(chrono::Utc::now().naive_utc())),
                unit_id: Set(Some(unit.id)),
                capacity: Set(Some(40)),
                start_effective_date: Set(academic_year.start_date),
                end_effective_date: Set(academic_year.end_date),
                ..Default::default()
            };
            active_model
                .insert(&txn)
                .await
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
                .id
        };

        // 4.2 Get/Create Teach Decree
        let teach_decree = teach_decrees::Entity::find()
            .filter(teach_decrees::Column::ActivityId.eq(unit_activity.id))
            .one(&txn)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let teach_decree_id = if let Some(td) = teach_decree {
            td.id
        } else {
            let new_id = Uuid::new_v4();
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
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
                .id
        };

        // 4.3 Create Teach
        let teach_name = format!(
            "AktifitasPengajaran {} {} {} {}",
            institution.code.as_deref().unwrap_or(""), unit.code.as_deref().unwrap_or(""), academic_year.feeder_name, course.code
        );

        let (practice_start, practice_end) =
            if course.practice_credit > 0.0 || course.field_practice_credit > 0.0 {
                (academic_year.start_date, academic_year.end_date)
            } else {
                (None, None)
            };

        let new_id = Uuid::new_v4();
        let active = teaches::ActiveModel {
            id: Set(new_id),
            name: Set(Some(teach_name)),
            start_date: Set(academic_year.start_date),
            end_date: Set(academic_year.end_date),
            practice_start_date: Set(practice_start),
            practice_end_date: Set(practice_end),
            is_lecturer_credit_sum_problem: Set(Some(false)),
            is_lock: Set(Some(false)),
            max_member: Set(Some(40)),
            class_code_id: Set(class_code_id),
            course_id: Set(course.id),
            activity_id: Set(Some(unit_activity.id)),
            teach_decree_id: Set(teach_decree_id),
            feeder_id: Set(Some(id_kelas_kuliah.clone())),
            scope_id: Set(Some(internal_scope.id)),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            curriculum_detail_id: Set(None),
            encounter_category_id: Set(None),
            ..Default::default()
        };
        let t = active.insert(&txn).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        println!("✅ CREATED Teach: {}", id_kelas_kuliah);
        t
    };

    // 6. Get Student
    let Some(id_registrasi_mahasiswa) = model.id_registrasi_mahasiswa.clone() else {
        println!("Skipping: id_registrasi_mahasiswa is missing");
        return Ok(());
    };
    let student = students::Entity::find()
        .filter(students::Column::IdRegistrasiMahasiswa.eq(id_registrasi_mahasiswa.clone()))
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    let Some(student) = student else {
        println!(
            "Skipping: Student not found for id_registrasi_mahasiswa {}",
            id_registrasi_mahasiswa
        );
        return Ok(());
    };

    // 7. Get Student Activity
    let student_activity = student_activities::Entity::find()
        .filter(student_activities::Column::StudentId.eq(student.id))
        .filter(student_activities::Column::UnitActivityId.eq(unit_activity.id))
        .one(&txn)
        .await
        .map_err(|e| {
            tracing::error!("Failed to find student activity: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

    let student_activity = if let Some(sa) = student_activity {
        sa
    } else {
        // Create Student Activity if it doesn't exist
        let name = format!("Perkuliahan {} {}", academic_year.feeder_name, student.code);
        let active = student_activities::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(name)),
            cumulative_index: Set(0.0),
            grand_cumulative_index: Set(0.0),
            total_credit: Set(Some(0.0)),
            grand_total_credit: Set(Some(0.0)),
            student_id: Set(student.id),
            unit_activity_id: Set(unit_activity.id),
            unit_id: Set(Some(student.unit_id)),
            status_id: Set(Uuid::nil()),        // Default to Nil
            resign_status_id: Set(Some(Uuid::nil())), // Default to Nil
            is_lock: Set(Some(true)),
            feeder_id: Set(Some(Uuid::nil())),  // Default to Nil
            finance_id: Set(Some(Uuid::nil())), // Default to Nil
            finance_fee: Set(Some(0.0)),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };
        let new_sa = active.insert(&txn).await.map_err(|e| {
            tracing::error!("Failed to create student activity: {:?}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;
        println!("  ✅ CREATED Student Activity for Student {}", student.code);
        new_sa
    };

    // 8. Get Grade
    let grade_id = if let Some(nilai_huruf) = &model.nilai_huruf {
        let grade = grades::Entity::find()
            .filter(grades::Column::UnitId.eq(unit.id))
            .filter(grades::Column::Name.eq(nilai_huruf))
            .one(&txn)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        grade.map(|g| g.id).unwrap_or(Uuid::nil())
    } else {
        Uuid::nil()
    };

    // 9. Get Student Detail Activity (Check Existence)
    let existing_detail = detail_activities::Entity::find()
        .filter(detail_activities::Column::TeachId.eq(teach.id))
        .filter(detail_activities::Column::CourseId.eq(course.id))
        .filter(detail_activities::Column::ActivityId.eq(student_activity.id))
        .one(&txn)
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

    let mark = model.nilai_indeks.unwrap_or(0.0) as f64; // Assuming nilai_indeks is convertible to f64

    if let Some(existing) = existing_detail {
        // Update
        let mut active: detail_activities::ActiveModel = existing.into();
        active.mark = Set(Some(mark));
        active.grade_id = Set(Some(grade_id));
        active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
        active.update(&txn).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        println!("  ✅ UPDATED Detail Activity for Student {}", student.code);
    } else {
        // Create (Partial implementation as per request to primarily focus on updates if exists, but typically upsert implies create if not exists too.
        //  The instructions said: "if exists update mark and grade_id if not create it")

        let active = detail_activities::ActiveModel {
            id: Set(Uuid::new_v4()),
            activity_id: Set(student_activity.id),
            teach_id: Set(Some(teach.id)),
            course_id: Set(course.id),
            mark: Set(Some(mark)),
            grade_id: Set(Some(grade_id)),
            credit: Set(Some(course.total_credit)), // Assuming course credit
            feeder_id: Set(Some(Uuid::nil())),
            feeder_grade_id: Set(Some(Uuid::nil())),
            curiculum_detail_sequence: Set(Some(0)),
            is_lock: Set(Some(true)),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };
        active.insert(&txn).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        println!("  ✅ CREATED Detail Activity for Student {}", student.code);
    }

    txn.commit().await?;
    Ok(())
}