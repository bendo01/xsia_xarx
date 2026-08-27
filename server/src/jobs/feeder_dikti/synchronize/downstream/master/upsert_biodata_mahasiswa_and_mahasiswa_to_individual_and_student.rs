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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_biodata_mahasiswa_and_mahasiswa_to_individual_and_student")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use std::str::FromStr;

use crate::models::academic::general::reference::academic_years as AcademicGeneralReferenceAcademicYear;
use crate::models::academic::student::master::students as AcademicStudentMasterStudent;
use crate::models::academic::student::reference::finances as AcademicStudentReferenceFinance;
use crate::models::academic::student::reference::registrations as AcademicStudentReferenceRegistration;
use crate::models::academic::student::reference::resign_statuses as AcademicStudentReferenceResignStatus;
use crate::models::academic::student::reference::statuses as AcademicStudentReferenceStatus;
use crate::models::feeder::master::biodata_mahasiswa as FeederMasterBiodataMahasiswa;
use crate::models::feeder::master::mahasiswa as FeederMasterMahasiswa;
use crate::models::feeder::master::riwayat_pendidikan_mahasiswa as FeederMasterRiwayatPendidikanMahasiswa;
use crate::models::institution::master::units as InstitutionMasterUnit;

use crate::models::person::{
    master::individuals as PersonMasterIndividual,
    reference::{
        genders as PersonReferenceGender,
        religions as PersonReferenceReligion,
    },
};

pub struct Worker;

pub struct UpsertIndividual;

pub struct UpsertStudent;

#[derive(Serialize, Deserialize)]
pub struct WorkerArgs {
    pub model: FeederMasterBiodataMahasiswa::Model,
}



impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let data = args.model.clone();
        println!("=================📄 Process Data {} =======================", data.nik.clone().unwrap_or_default());
        match Self::proceed(db, data).await {
            Ok(individual) => {
                println!("✅ Successfully processed individual: {}", individual.code);
                Ok(())
            }
            Err(e) => {
                println!("❌ Failed to process individual: {}", e);
                Err(e)
            }
        }
    }

    async fn proceed(db: &DatabaseConnection, model: FeederMasterBiodataMahasiswa::Model) -> Result<PersonMasterIndividual::Model, Box<dyn std::error::Error + Send + Sync>> {
        // 1. Upsert individual first
        let upsert_individual = UpsertIndividual;

        let individual = match upsert_individual.upsert(db, model.clone()).await {
            Ok(individual) => {
                tracing::info!("Successfully upserted individual: {}", individual.code);
                individual
            }
            Err(e) => {
                tracing::error!("Failed to upsert individual: {}", e);
                return Err(e);
            }
        };

        // 2. Fetch mahasiswa data using id_mahasiswa from biodata
        if let Some(id_mahasiswa) = model.id_mahasiswa {
            
            // Fetch the mahasiswa record to get id_registrasi_mahasiswa
            let mahasiswa = match FeederMasterMahasiswa::Entity::find()
                .filter(FeederMasterMahasiswa::Column::IdMahasiswa.eq(id_mahasiswa))
                .one(db)
                .await
            {
                Ok(Some(m)) => m,
                Ok(None) => {
                    tracing::warn!(
                        "Mahasiswa not found for ID: {}, skipping student upsert",
                        id_mahasiswa
                    );
                    return Ok(individual);
                }
                Err(e) => {
                    tracing::error!("Error finding mahasiswa: {}", e);
                    return Err(e.into());
                }
            };

            // 3. Upsert student
            let upsert_student = UpsertStudent;

            match upsert_student.upsert(db, 
                    model.clone(),
                    individual.clone(),
                    mahasiswa.id_registrasi_mahasiswa,
                    id_mahasiswa,
                )
                .await
            {
                Ok(student) => {
                    tracing::info!(
                        "Successfully upserted student: {} for individual: {}",
                        student.code,
                        individual.code
                    );
                }
                Err(e) => {
                    tracing::error!("Failed to upsert student: {}", e);
                    // Don't return error here, we still want to return the individual
                    // as it was successfully created/updated
                }
            }
        } else {
            tracing::warn!("No id_mahasiswa found in biodata, skipping student upsert");
        }

        Ok(individual)
    }
}

impl UpsertIndividual {
    async fn upsert(&self, db: &DatabaseConnection,
        model: FeederMasterBiodataMahasiswa::Model,
    ) -> Result<PersonMasterIndividual::Model, Box<dyn std::error::Error + Send + Sync>> {
                let data = model.clone();

        let nik = match &data.nik {
            Some(n) => n.clone(),
            None => {
                return Err("NIK is required".into());
            }
        };

        let gender_id = if let Some(jk) = &data.jenis_kelamin {
            let result = PersonReferenceGender::Entity::find()
                .filter(PersonReferenceGender::Column::AlphabetCode.eq(jk))
                .one(db)
                .await;

            match result {
                Ok(Some(g)) => g.id,
                Ok(None) => {
                    tracing::warn!("Gender '{}' not found, using default", jk);
                    Default::default()
                }
                Err(e) => {
                    tracing::error!("Error fetching gender: {}", e);
                    return Err(e.into());
                }
            }
        } else {
            Default::default()
        };

        let religion_id = if let Some(agama_id) = data.id_agama {
            let result = PersonReferenceReligion::Entity::find()
                .filter(PersonReferenceReligion::Column::Code.eq(agama_id))
                .one(db)
                .await;

            match result {
                Ok(Some(r)) => r.id,
                Ok(None) => {
                    tracing::warn!("Religion code '{}' not found, using default", agama_id);
                    Default::default()
                }
                Err(e) => {
                    tracing::error!("Error fetching religion: {}", e);
                    return Err(e.into());
                }
            }
        } else {
            Default::default()
        };

        // 2. find individual by nik
        let existing_individual = match PersonMasterIndividual::Entity::find()
            .filter(PersonMasterIndividual::Column::Code.eq(&nik))
            .one(db)
            .await
        {
            Ok(result) => result,
            Err(e) => {
                tracing::error!("Error finding individual by NIK: {}", e);
                return Err(e.into());
            }
        };

        let individual = match existing_individual {
            Some(person) => {
                let mut active: PersonMasterIndividual::ActiveModel = person.into();
                active.code = Set(nik);
                active.name = Set(data
                    .nama_mahasiswa
                    .clone()
                    .unwrap_or_else(|| "Unknown".to_string()));
                active.birth_date = Set(data
                    .tanggal_lahir
                    .unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(1900, 1, 1).unwrap()));
                active.birth_place =
                    Set(data.tempat_lahir.clone().unwrap_or_else(|| "-".to_string()));
                active.gender_id = Set(gender_id);
                active.religion_id = Set(religion_id);
                active.is_social_protection_card_recipient =
                    Set(data.penerima_kps.unwrap_or(false));
                active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
                match active.save(db).await {
                    Ok(saved) => match saved.try_into_model() {
                        Ok(model) => model,
                        Err(e) => {
                            tracing::error!("Error converting to model: {}", e);
                            return Err(e.into());
                        }
                    },
                    Err(e) => {
                        tracing::error!("Error saving individual: {}", e);
                        return Err(e.into());
                    }
                }
            }
            None => {
                let new_individual = PersonMasterIndividual::ActiveModel {
                    id: Set(()),
                    code: Set(nik.clone()),
                    name: Set(data
                        .nama_mahasiswa
                        .clone()
                        .unwrap_or_else(|| "Unknown".to_string())),
                    birth_date: Set(data
                        .tanggal_lahir
                        .unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(1970, 1, 1).unwrap())),
                    birth_place: Set(data.tempat_lahir.clone().unwrap_or_else(|| "-".to_string())),
                    gender_id: Set(gender_id),
                    religion_id: Set(religion_id),
                    occupation_id: Set(Uuid::from_str("e619d78e-014f-4d45-b22d-cf7266965297").ok()),
                    income_id: Set(Uuid::from_str("00000000-0000-0000-0000-000000000000").ok()),
                    identification_type_id: Set(Uuid::from_str(
                        "3d59fc95-b07d-46ad-95ff-206b7e7f253f",
                    )
                    .unwrap_or_default()),
                    marital_status_id: Set(Uuid::default()),
                    profession_id: Set(Uuid::default()),
                    is_special_need: Set(false),
                    is_social_protection_card_recipient: Set(data.penerima_kps.unwrap_or(false)),
                    is_deceased: Set(false),
                    created_at: Set(Some(chrono::Utc::now().naive_utc())),
                    updated_at: Set(Some(chrono::Utc::now().naive_utc())),
                    ..Default::default()
                };
                match new_individual.insert(db).await {
                    Ok(model) => {
                        // upsert student
                        if let Some(id_mahasiswa) = data.id_mahasiswa {
                            let mahasiswa_opt = FeederMasterMahasiswa::Entity::find()
                                .filter(FeederMasterMahasiswa::Column::IdMahasiswa.eq(id_mahasiswa))
                                .one(db)
                                .await;

                            if let Ok(Some(m)) = mahasiswa_opt {
                                let student_upserter = UpsertStudent {
                                    ctx: self.ctx.clone(),
                                };
                                match student_upserter
                                    .upsert(
                                        data.clone(),
                                        model.clone(),
                                        m.id_registrasi_mahasiswa,
                                        id_mahasiswa,
                                    )
                                    .await
                                {
                                    Ok(_) => {
                                        tracing::info!(
                                            "Successfully upserted student for individual: {}",
                                            model.code
                                        );
                                    }
                                    Err(e) => {
                                        tracing::error!("Failed to upsert student: {}", e);
                                    }
                                }
                            }
                        }
                        model
                    }
                    Err(e) => {
                        tracing::error!("Error inserting individual: {}", e);
                        return Err(e.into());
                    }
                }
            }
        };
        Ok(individual)
    }
}

impl UpsertStudent {
    async fn upsert(&self, db: &DatabaseConnection,
        biodata_mahasiswa: FeederMasterBiodataMahasiswa::Model,
        individual: PersonMasterIndividual::Model,
        id_registrasi_mahasiswa: Option<Uuid>,
        id_mahasiswa: Uuid,
    ) -> Result<AcademicStudentMasterStudent::Model, Box<dyn std::error::Error + Send + Sync>> {
        
        // Fetch mahasiswa record
        let mahasiswa = match FeederMasterMahasiswa::Entity::find()
            .filter(FeederMasterMahasiswa::Column::IdMahasiswa.eq(id_mahasiswa))
            .one(db)
            .await
        {
            Ok(Some(m)) => m,
            Ok(None) => {
                return Err(format!(
                    "Mahasiswa not found for ID: {}",
                    id_mahasiswa.clone()
                ).into());
            }
            Err(e) => {
                tracing::error!("Error finding mahasiswa by ID: {}", e);
                return Err(e.into());
            }
        };

        // Fetch riwayat pendidikan mahasiswa record
        let riwayat_pendidikan_mahasiswa =
            match FeederMasterRiwayatPendidikanMahasiswa::Entity::find()
                .filter(
                    FeederMasterRiwayatPendidikanMahasiswa::Column::IdMahasiswa.eq(id_mahasiswa),
                )
                .one(db)
                .await
            {
                Ok(Some(r)) => r,
                Ok(None) => {
                    return Err(format!(
                        "Riwayat pendidikan mahasiswa not found for ID: {}",
                        id_mahasiswa.clone()
                    ).into());
                }
                Err(e) => {
                    tracing::error!("Error finding riwayat pendidikan mahasiswa by ID: {}", e);
                    return Err(e.into());
                }
            };

        // Fetch finance info from riwayat_pendidikan_mahasiswa.id_pembiayaan
        let (finance_id, finance_fee) =
            if let Some(id_pembiayaan) = riwayat_pendidikan_mahasiswa.id_pembiayaan {
                let finance = AcademicStudentReferenceFinance::Entity::find()
                    .filter(AcademicStudentReferenceFinance::Column::Code.eq(id_pembiayaan))
                    .one(db)
                    .await
                    .map_err(|e| e.into())?;

                match finance {
                    Some(f) => (
                        Some(f.id),
                        riwayat_pendidikan_mahasiswa.biaya_masuk.map(|b| b as f64),
                    ),
                    None => (Some(Uuid::nil()), Some(0.0)),
                }
            } else {
                (Some(Uuid::nil()), Some(0.0))
            };

        // check if id_jenis_keluar is not null
        let resign_status_id = if let Some(code) = &riwayat_pendidikan_mahasiswa.id_jenis_keluar {
            let status = AcademicStudentReferenceResignStatus::Entity::find()
                .filter(
                    AcademicStudentReferenceResignStatus::Column::AlphabetCode.eq(code.to_string()),
                )
                .one(db)
                .await
                .map_err(|e| e.into())?;

            match status {
                Some(s) => s.id,
                None => Uuid::nil(),
            }
        } else {
            Uuid::nil()
        };

        // find registration based on id_jenis_daftar (from riwayat)
        // riwayat.id_jenis_daftar is Option<i32>, we need String for AlphabetCode
        let id_jenis_daftar_str = riwayat_pendidikan_mahasiswa
            .id_jenis_daftar
            .map(|v| v.to_string())
            .unwrap_or_default();

        let registration = match AcademicStudentReferenceRegistration::Entity::find()
            .filter(
                AcademicStudentReferenceRegistration::Column::AlphabetCode
                    .eq(id_jenis_daftar_str.clone()),
            )
            .one(db)
            .await
        {
            Ok(Some(r)) => r,
            Ok(None) => {
                return Err(format!(
                    "Registration not found for ID: {}",
                    id_jenis_daftar_str
                ).into());
            }
            Err(e) => {
                tracing::error!("Error finding registration by Alphabet Code: {}", e);
                return Err(e.into());
            }
        };

        // find unit based on id_prodi (mahasiswa has id_prodi)
        let id_prodi_val = mahasiswa
            .id_prodi
            .ok_or_else(|| "Mahasiswa id_prodi is missing".into())?;

        let unit = match InstitutionMasterUnit::Entity::find()
            .filter(InstitutionMasterUnit::Column::FeederId.eq(id_prodi_val))
            .one(db)
            .await
        {
            Ok(Some(u)) => u,
            Ok(None) => {
                return Err(format!(
                    "Unit not found for ID: {}",
                    id_prodi_val
                ).into());
            }
            Err(e) => {
                tracing::error!("Error finding unit by ID: {}", e);
                return Err(e.into());
            }
        };

        // find academic year based on id_periode
        let academic_year = match AcademicGeneralReferenceAcademicYear::Entity::find()
            .filter(
                AcademicGeneralReferenceAcademicYear::Column::FeederName
                    .eq(mahasiswa.id_periode.clone()),
            )
            .one(db)
            .await
        {
            Ok(Some(a)) => a,
            Ok(None) => {
                return Err(format!(
                    "Academic year not found for ID: {:?}",
                    mahasiswa.id_periode.clone()
                ).into());
            }
            Err(e) => {
                tracing::error!("Error finding academic year by ID: {}", e);
                return Err(e.into());
            }
        };

        // find status based on nama_status_mahasiswa
        let status_name = mahasiswa
            .nama_status_mahasiswa
            .clone()
            .map(|s| {
                s.split_whitespace()
                    .map(|word| {
                        let mut c = word.chars();
                        match c.next() {
                            None => String::new(),
                            Some(f) => {
                                f.to_uppercase().collect::<String>()
                                    + c.as_str().to_lowercase().as_str()
                            }
                        }
                    })
                    .collect::<Vec<String>>()
                    .join(" ")
            })
            .unwrap_or_else(|| {
                tracing::warn!(
                    "Mahasiswa status name is missing for {}, defaulting to 'Tidak Diketahui'",
                    mahasiswa.nama_mahasiswa,
                );
                "Tidak Diketahui".to_string()
            });

        let student_status = match AcademicStudentReferenceStatus::Entity::find()
            .filter(AcademicStudentReferenceStatus::Column::Name.eq(&status_name))
            .one(db)
            .await
            ?
        {
            Some(s) => s,
            None => {
                return Err(format!(
                    "Status not found for Name: {}",
                    status_name
                ).into());
            }
        };

        // check if biodata_mahasiswa.nisn is not null and biodata_mahasiswa.nisn != "0000000000"
        let nisn = if let Some(nisn) = biodata_mahasiswa.nisn.clone() {
            if nisn.is_empty() || nisn == "0000000000" {
                None
            } else {
                Some(nisn)
            }
        } else {
            None
        };

        // Check if student already exists
        let existing_student = match AcademicStudentMasterStudent::Entity::find()
            .filter(AcademicStudentMasterStudent::Column::IdMahasiswa.eq(id_mahasiswa))
            .one(db)
            .await
        {
            Ok(result) => result,
            Err(e) => {
                tracing::error!("Error finding student by ID Mahasiswa: {}", e);
                return Err(e.into());
            }
        };

        let default_selection_type_id =
            Uuid::from_str("9b4cfd3c-89d5-4b02-87db-5584b9d73866").unwrap_or_default();

        let student = match existing_student {
            Some(student) => {
                // Update existing student
                let mut active: AcademicStudentMasterStudent::ActiveModel = student.into();
                active.status_id = Set(student_status.id);
                active.id_mahasiswa = Set(Some(id_mahasiswa));
                active.id_registrasi_mahasiswa = Set(id_registrasi_mahasiswa);
                active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
                active.unit_id = Set(unit.id);
                active.registration_id = Set(registration.id);
                active.resign_status_id = Set(resign_status_id);
                active.nisn = Set(nisn);
                active.finance_id = Set(finance_id);
                active.finance_fee = Set(finance_fee);

                match active.save(db).await {
                    Ok(saved) => match saved.try_into_model() {
                        Ok(model) => model,
                        Err(e) => {
                            tracing::error!("Error converting to model: {}", e);
                            return Err(e.into());
                        }
                    },
                    Err(e) => {
                        tracing::error!("Error saving student: {}", e);
                        return Err(e.into());
                    }
                }
            }
            None => {
                // Create new student
                // TODO: These default UUIDs need to be mapped from actual reference data
                let default_uuid =
                    Uuid::from_str("00000000-0000-0000-0000-000000000000").unwrap_or_default();

                let new_student = AcademicStudentMasterStudent::ActiveModel {
                    id: Set(()),
                    code: Set(mahasiswa
                        .nim
                        .clone()
                        .unwrap_or_else(|| "UNKNOWN".to_string())),
                    nisn: Set(nisn),
                    name: Set(mahasiswa.nama_mahasiswa.clone()),
                    registered: Set(academic_year
                        .start_date
                        .unwrap_or_else(|| chrono::Utc::now().date_naive())),
                    individual_id: Set(individual.id),
                    unit_id: Set(unit.id), // TODO: Map from id_prodi or unit mapping
                    academic_year_id: Set(academic_year.id), // TODO: Map from id_periode
                    curriculum_id: Set(default_uuid), // TODO: Needs curriculum mapping
                    class_code_id: Set(default_uuid), // TODO: Needs class code mapping
                    status_id: Set(student_status.id), // TODO: Map from id_status_mahasiswa
                    registration_id: Set(registration.id), // TODO: Needs registration type mapping
                    resign_status_id: Set(resign_status_id), // TODO: Needs resign status mapping
                    concentration_id: Set(default_uuid), // TODO: Needs concentration mapping
                    selection_type_id: Set(default_selection_type_id),
                    transfer_unit_id: Set(default_uuid),
                    transfer_code: Set(None),
                    finance_fee: Set(finance_fee),
                    finance_id: Set(finance_id),
                    id_mahasiswa: Set(Some(id_mahasiswa)),
                    id_registrasi_mahasiswa: Set(id_registrasi_mahasiswa),
                    created_at: Set(Some(chrono::Utc::now().naive_utc())),
                    updated_at: Set(Some(chrono::Utc::now().naive_utc())),
                    sync_at: Set(Some(chrono::Utc::now().naive_utc())),
                    deleted_at: Set(None),
                    created_by: Set(None),
                    updated_by: Set(None),
                };

                match new_student.insert(db).await {
                    Ok(model) => model,
                    Err(e) => {
                        tracing::error!("Error inserting student: {}", e);
                        return Err(e.into());
                    }
                }
            }
        };

        Ok(student)
    }
}