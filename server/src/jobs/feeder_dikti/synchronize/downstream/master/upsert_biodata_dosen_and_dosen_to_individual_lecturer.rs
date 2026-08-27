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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_biodata_dosen_and_dosen_to_individual_lecturer")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use std::str::FromStr;

use crate::models::academic::lecturer::master::lecturers as AcademicLecturerMasterLecturer;
use crate::models::academic::lecturer::reference::statuses as AcademicLecturerReferenceStatus;
use crate::models::feeder::master::biodata_dosen as FeederMasterBiodataDosen;
use crate::models::feeder::master::dosen as FeederMasterDosen;

use crate::models::person::{
    master::individuals as PersonMasterIndividual,
    reference::{
        genders as PersonReferenceGender,
        religions as PersonReferenceReligion,
    },
};

pub struct Worker;

pub struct UpsertIndividual;

pub struct UpsertLecturer;

#[derive(Serialize, Deserialize)]
pub struct WorkerArgs {
    pub model: FeederMasterBiodataDosen::Model,
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

    async fn proceed(db: &DatabaseConnection, model: FeederMasterBiodataDosen::Model) -> Result<PersonMasterIndividual::Model, Box<dyn std::error::Error + Send + Sync>> {
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

        // 2. Fetch dosen data using id_dosen from biodata
        if let Some(id_dosen_str) = model.id_dosen {
            // Parse UUID from string
            let id_dosen = match Uuid::from_str(&id_dosen_str) {
                Ok(uuid) => uuid,
                Err(e) => {
                    tracing::warn!("Invalid UUID string for id_dosen '{}': {}", id_dosen_str, e);
                    // Decide if we should return Ok(individual) or Err
                    // If we can't link to lecturer, we just return individual
                    return Ok(individual);
                }
            };

            
            // Fetch the dosen record
            let dosen = match FeederMasterDosen::Entity::find()
                .filter(FeederMasterDosen::Column::IdDosen.eq(id_dosen))
                .one(db)
                .await
            {
                Ok(Some(m)) => m,
                Ok(None) => {
                    tracing::warn!(
                        "Dosen not found for ID: {}, skipping lecturer upsert",
                        id_dosen
                    );
                    return Ok(individual);
                }
                Err(e) => {
                    tracing::error!("Error finding dosen: {}", e);
                    return Err(e.into());
                }
            };

            // 3. Upsert lecturer
            let upsert_lecturer = UpsertLecturer;

            match upsert_lecturer.upsert(db, individual.clone(), dosen, id_dosen)
                .await
            {
                Ok(lecturer) => {
                    tracing::info!(
                        "Successfully upserted lecturer: {} for individual: {}",
                        lecturer.code,
                        individual.code
                    );
                }
                Err(e) => {
                    tracing::error!("Failed to upsert lecturer: {}", e);
                    // Don't return error here, we still want to return the individual
                }
            }
        } else {
            tracing::warn!("No id_dosen found in biodata, skipping lecturer upsert");
        }

        Ok(individual)
    }
}

impl UpsertIndividual {
    async fn upsert(&self, db: &DatabaseConnection,
        model: FeederMasterBiodataDosen::Model,
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

        let religion_id = if let Some(agama_id_str) = data.id_agama {
            let agama_id_parsed = agama_id_str.parse::<i32>().ok();
            match agama_id_parsed {
                Some(agama_id) => {
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
                }
                None => {
                    tracing::warn!(
                        "Religion code '{}' parse error, using default",
                        agama_id_str
                    );
                    Default::default()
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
                active.name = Set(data
                    .nama_dosen
                    .clone()
                    .unwrap_or_else(|| "Unknown".to_string()));
                active.birth_date = Set(data
                    .tanggal_lahir
                    .unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(1900, 1, 1).unwrap()));
                active.birth_place =
                    Set(data.tempat_lahir.clone().unwrap_or_else(|| "-".to_string()));
                active.gender_id = Set(gender_id);
                active.religion_id = Set(religion_id);
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
                        .nama_dosen
                        .clone()
                        .unwrap_or_else(|| "Unknown".to_string())),
                    birth_date: Set(data
                        .tanggal_lahir
                        .unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(1970, 1, 1).unwrap())),
                    birth_place: Set(data.tempat_lahir.clone().unwrap_or_else(|| "-".to_string())),
                    gender_id: Set(gender_id),
                    religion_id: Set(religion_id),
                    occupation_id: Set(Uuid::from_str("e619d78e-014f-4d45-b22d-cf7266965297").ok()), // Default occupation?
                    income_id: Set(Uuid::from_str("00000000-0000-0000-0000-000000000000").ok()),
                    identification_type_id: Set(Uuid::from_str(
                        "3d59fc95-b07d-46ad-95ff-206b7e7f253f",
                    )
                    .unwrap_or_default()),
                    marital_status_id: Set(Uuid::default()),
                    profession_id: Set(Uuid::default()),
                    is_special_need: Set(false),
                    is_social_protection_card_recipient: Set(false),
                    is_deceased: Set(false),
                    created_at: Set(Some(chrono::Utc::now().naive_utc())),
                    updated_at: Set(Some(chrono::Utc::now().naive_utc())),
                    ..Default::default()
                };
                match new_individual.insert(db).await {
                    Ok(model) => {
                        // upsert lecturer logic is separate in proceed
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

impl UpsertLecturer {
    async fn upsert(&self, db: &DatabaseConnection,
        individual: PersonMasterIndividual::Model,
        dosen: FeederMasterDosen::Model,
        id_dosen: Uuid,
    ) -> Result<AcademicLecturerMasterLecturer::Model, Box<dyn std::error::Error + Send + Sync>> {
        
        // find status based on nama_status_aktif
        let status_name = dosen
            .nama_status_aktif
            .clone()
            .unwrap_or_else(|| {
                tracing::warn!(
                    "Dosen status name is missing for {}, defaulting to 'LAINNYA'",
                    dosen.nama_dosen.clone().unwrap_or_default()
                );
                "LAINNYA".to_string()
            })
            .to_uppercase();

        let lecturer_status = match AcademicLecturerReferenceStatus::Entity::find()
            .filter(AcademicLecturerReferenceStatus::Column::Name.eq(&status_name))
            .one(db)
            .await
            ?
        {
            Some(s) => s,
            None => {
                // If not found, maybe fallback or error. We'll error for now or fallback if there's a default.
                return Err(format!(
                    "Status not found for Name: {}",
                    status_name
                ).into());
            }
        };

        // Check if lecturer already exists data based on id_dosen (feeder_id) or NIDN/NIP?
        // Relying on feeder_id is best if we populated it.
        // But if we are migrating, we might want to check other fields.
        // The student worker checks by id_mahasiswa.
        // We will check by id_dosen (feeder_id) which maps to feeder_id in Lecturer?
        // Lecturer model has `feeder_id`.
        // Also checks by individual_id?

        // Let's check by matching feeder_id
        let existing_lecturer = match AcademicLecturerMasterLecturer::Entity::find()
            .filter(AcademicLecturerMasterLecturer::Column::IdDosen.eq(id_dosen))
            .one(db)
            .await
        {
            Ok(result) => result,
            Err(e) => {
                tracing::error!("Error finding lecturer by Feeder ID: {}", e);
                return Err(e.into());
            }
        };

        // Determine Code: NIDN -> NIP -> "UNKNOWN"
        let lecturer_code = dosen
            .nidn
            .clone()
            .or(dosen.nip.clone())
            .unwrap_or_else(|| "UNKNOWN".to_string());

        // Determine Name
        let lecturer_name = dosen
            .nama_dosen
            .clone()
            .unwrap_or_else(|| "Unknown".to_string());

        let lecturer = match existing_lecturer {
            Some(lecturer) => {
                // Update existing lecturer
                let mut active: AcademicLecturerMasterLecturer::ActiveModel = lecturer.into();
                active.status_id = Set(Some(lecturer_status.id));
                // active.feeder_id = Set(Some(id_dosen)); // Already set
                active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));

                // Update other fields?
                active.code = Set(lecturer_code);
                active.name = Set(Some(lecturer_name));
                active.accessor_number = Set(None); // TODO mapping
                active.identification_number = Set(dosen.nip.clone()); // NIP
                active.nuptk = Set(dosen.nuptk.clone());

                match active.save(db).await {
                    Ok(saved) => match saved.try_into_model() {
                        Ok(model) => model,
                        Err(e) => {
                            tracing::error!("Error converting to model: {}", e);
                            return Err(e.into());
                        }
                    },
                    Err(e) => {
                        tracing::error!("Error saving lecturer: {}", e);
                        return Err(e.into());
                    }
                }
            }
            None => {
                // Create new lecturer
                let new_lecturer = AcademicLecturerMasterLecturer::ActiveModel {
                    id: Set(()),
                    code: Set(lecturer_code),
                    name: Set(Some(lecturer_name)),
                    individual_id: Set(individual.id),
                    institution_id: Set(None), // TODO: Map institution
                    alternative_code: Set(None),
                    accessor_number: Set(None),
                    identification_number: Set(dosen.nip.clone()),
                    status_id: Set(Some(lecturer_status.id)),
                    contract_id: Set(None),
                    rank_id: Set(None),
                    group_id: Set(None),
                    front_title: Set(None),
                    last_title: Set(None),
                    id_dosen: Set(Some(id_dosen)),
                    nuptk: Set(dosen.nuptk.clone()),
                    start_date: Set(None),
                    end_date: Set(None),
                    created_at: Set(Some(chrono::Utc::now().naive_utc())),
                    updated_at: Set(Some(chrono::Utc::now().naive_utc())),
                    sync_at: Set(Some(chrono::Utc::now().naive_utc())),
                    deleted_at: Set(None),
                    created_by: Set(None),
                    updated_by: Set(None),
                };

                match new_lecturer.insert(db).await {
                    Ok(model) => model,
                    Err(e) => {
                        tracing::error!("Error inserting lecturer: {}", e);
                        return Err(e.into());
                    }
                }
            }
        };

        Ok(lecturer)
    }
}