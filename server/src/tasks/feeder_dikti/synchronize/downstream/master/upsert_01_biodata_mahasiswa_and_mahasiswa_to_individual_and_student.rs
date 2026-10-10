use std::collections::HashMap;
use std::time::Duration;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    TransactionTrait,
};
use uuid::Uuid;

use crate::tasks::Task;

use crate::models::feeder::master::biodata_mahasiswa as FeederBiodataMahasiswa;
use crate::models::feeder::master::mahasiswa as FeederMahasiswa;
use crate::models::feeder::master::riwayat_pendidikan_mahasiswa as FeederRiwayatPendidikan;
use crate::models::person::master::individual as PersonIndividual;
use crate::models::person::reference::gender as PersonGender;
use crate::models::person::reference::religion as PersonReligion;
use crate::models::person::reference::identification_type as PersonIdentificationType;
use crate::models::person::reference::occupation as PersonOccupation;
use crate::models::academic::student::master::students as AcademicStudent;
use crate::models::academic::student::reference::statuses as AcademicStudentStatus;
use crate::models::academic::student::reference::registrations as AcademicStudentRegistration;
use crate::models::academic::student::reference::resign_statuses as AcademicStudentResignStatus;
use crate::models::academic::student::reference::selection_types as AcademicStudentSelectionType;
use crate::models::academic::student::reference::finances as AcademicStudentFinance;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::academic::general::reference::academic_years as AcademicYear;

pub struct SyncBiodataMahasiswaToAcademicStudentMasterStudent;

struct ReferenceCache {
    genders_by_code: HashMap<String, PersonGender::Model>,
    religions_by_name: HashMap<String, PersonReligion::Model>,
    religions_by_code: HashMap<i32, PersonReligion::Model>,
    default_religion_id: Uuid,
    default_identification_type_id: Uuid,
    default_occupation_id: Uuid,
    statuses_by_name: HashMap<String, AcademicStudentStatus::Model>,
    default_status_id: Uuid,
    registrations_by_code: HashMap<String, AcademicStudentRegistration::Model>,
    default_registration_id: Uuid,
    resign_statuses_by_code: HashMap<String, AcademicStudentResignStatus::Model>,
    default_selection_type_id: Uuid,
    finances_by_code: HashMap<i32, AcademicStudentFinance::Model>,
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    default_unit_id: Uuid,
    academic_years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    default_academic_year: Option<AcademicYear::Model>,
    riwayat_by_reg_id: HashMap<Uuid, FeederRiwayatPendidikan::Model>,
    riwayat_by_mhs_id: HashMap<Uuid, FeederRiwayatPendidikan::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

fn clean_nisn(raw: Option<&str>) -> Option<String> {
    let s = raw?.trim();
    if s.is_empty() || s == "0000000000" {
        None
    } else {
        Some(s.to_string())
    }
}

async fn upsert_individual(
    txn: &DatabaseTransaction,
    biodata: &FeederBiodataMahasiswa::Model,
    nik: &str,
    refs: &ReferenceCache,
) -> Result<(PersonIndividual::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let existing = PersonIndividual::Entity::find()
        .filter(PersonIndividual::Column::Code.eq(nik))
        .order_by_asc(PersonIndividual::Column::CreatedAt)
        .one(txn)
        .await?;

    let gender_id = biodata
        .jenis_kelamin
        .as_deref()
        .and_then(|g| refs.genders_by_code.get(g))
        .map(|m| m.id)
        .unwrap_or(Uuid::nil());

    let religion_id = if let Some(ref name) = biodata.nama_agama {
        refs.religions_by_name
            .get(&name.trim().to_lowercase())
            .map(|m| m.id)
            .or_else(|| {
                biodata
                    .id_agama
                    .filter(|&c| (1..=6).contains(&c))
                    .and_then(|c| refs.religions_by_code.get(&c).map(|m| m.id))
            })
            .unwrap_or(refs.default_religion_id)
    } else if let Some(code) = biodata.id_agama {
        if (1..=6).contains(&code) {
            refs.religions_by_code.get(&code).map(|m| m.id).unwrap_or(refs.default_religion_id)
        } else {
            refs.default_religion_id
        }
    } else {
        refs.default_religion_id
    };

    let name = biodata.nama_mahasiswa.clone().unwrap_or_else(|| "Unknown".to_string());
    let birth_date = biodata.tanggal_lahir.unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(1900, 1, 1).unwrap());
    let birth_place = biodata.tempat_lahir.clone().unwrap_or_else(|| "-".to_string());
    let is_social = biodata.penerima_kps.unwrap_or(false);

    if let Some(person) = existing {
        let mut active = person.into_active_model();
        active.code = Set(nik.to_string());
        active.name = Set(name);
        active.birth_date = Set(birth_date);
        active.birth_place = Set(birth_place);
        active.gender_id = Set(gender_id);
        active.religion_id = Set(religion_id);
        active.is_social_protection_card_recipient = Set(is_social);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));
        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_person = PersonIndividual::ActiveModel {
            id: Set(Uuid::new_v4()),
            code: Set(nik.to_string()),
            name: Set(name),
            front_title: Set(None),
            last_title: Set(None),
            birth_date: Set(birth_date),
            birth_place: Set(birth_place),
            gender_id: Set(gender_id),
            religion_id: Set(religion_id),
            occupation_id: Set(refs.default_occupation_id),
            education_id: Set(Uuid::nil()),
            income_id: Set(Uuid::nil()),
            identification_type_id: Set(refs.default_identification_type_id),
            marital_status_id: Set(Uuid::nil()),
            profession_id: Set(Uuid::nil()),
            age_classification_id: Set(Uuid::nil()),
            is_special_need: Set(false),
            is_social_protection_card_recipient: Set(is_social),
            is_deceased: Set(false),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };
        let inserted = new_person.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

async fn upsert_student(
    txn: &DatabaseTransaction,
    individual: &PersonIndividual::Model,
    mahasiswa: &FeederMahasiswa::Model,
    biodata: &FeederBiodataMahasiswa::Model,
    riwayat: Option<&FeederRiwayatPendidikan::Model>,
    refs: &ReferenceCache,
) -> Result<(AcademicStudent::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let mhs_id = mahasiswa.id_mahasiswa;
    let reg_id = mahasiswa.id_registrasi_mahasiswa;
    let nim = mahasiswa.nim.as_deref().unwrap_or("").trim();

    // 1. Find existing student
    let mut existing: Option<AcademicStudent::Model> = None;

    if let Some(id_m) = mhs_id {
        // Step 1: id_mahasiswa AND individual_id
        let res = AcademicStudent::Entity::find()
            .filter(AcademicStudent::Column::IdMahasiswa.eq(id_m))
            .filter(AcademicStudent::Column::IndividualId.eq(individual.id))
            .one(txn)
            .await?;
        if res.is_some() {
            existing = res;
        } else {
            // Step 2: id_mahasiswa only
            let list = AcademicStudent::Entity::find()
                .filter(AcademicStudent::Column::IdMahasiswa.eq(id_m))
                .order_by_asc(AcademicStudent::Column::CreatedAt)
                .all(txn)
                .await?;
            if !list.is_empty() {
                existing = list.into_iter().next();
            }
        }
    }

    if existing.is_none()
        && let Some(id_r) = reg_id
            && !id_r.is_nil() {
                existing = AcademicStudent::Entity::find()
                    .filter(AcademicStudent::Column::IdRegistrasiMahasiswa.eq(id_r))
                    .one(txn)
                    .await?;
            }

    if existing.is_none() && !nim.is_empty() && nim != "UNKNOWN" {
        existing = AcademicStudent::Entity::find()
            .filter(AcademicStudent::Column::IndividualId.eq(individual.id))
            .filter(AcademicStudent::Column::Code.eq(nim))
            .one(txn)
            .await?;
    }

    if existing.is_none() && !nim.is_empty() && nim != "UNKNOWN" {
        existing = AcademicStudent::Entity::find()
            .filter(AcademicStudent::Column::Code.eq(nim))
            .one(txn)
            .await?;
    }

    if existing.is_none() {
        let list = AcademicStudent::Entity::find()
            .filter(AcademicStudent::Column::IndividualId.eq(individual.id))
            .all(txn)
            .await?;
        if list.len() == 1 {
            existing = list.into_iter().next();
        }
    }

    // Resolve references
    let student_name = mahasiswa
        .nama_mahasiswa
        .as_deref()
        .or(biodata.nama_mahasiswa.as_deref())
        .unwrap_or("Unknown")
        .to_string();

    let status_id = mahasiswa
        .nama_status_mahasiswa
        .as_deref()
        .map(|s| s.trim().to_lowercase())
        .and_then(|s| refs.statuses_by_name.get(&s))
        .map(|m| m.id)
        .unwrap_or(refs.default_status_id);

    let unit_id = mahasiswa
        .id_prodi
        .and_then(|id_p| refs.units_by_feeder_id.get(&id_p))
        .map(|m| m.id);

    let academic_year_opt = mahasiswa
        .id_periode
        .as_deref()
        .and_then(|p| refs.academic_years_by_feeder_name.get(p));

    let academic_year_id = academic_year_opt.map(|m| m.id);

    let nisn = clean_nisn(biodata.nisn.as_deref());

    let (registration_id, resign_status_id, finance_id, finance_fee) = if let Some(rw) = riwayat {
        let reg_id = rw
            .id_jenis_daftar
            .map(|v| v.to_string())
            .and_then(|c| refs.registrations_by_code.get(&c))
            .map(|m| m.id);

        let res_id = rw
            .id_jenis_keluar
            .map(|v| v.to_string())
            .and_then(|c| refs.resign_statuses_by_code.get(&c))
            .map(|m| m.id)
            .unwrap_or(Uuid::nil());

        let fin_id = rw
            .id_pembiayaan
            .and_then(|c| refs.finances_by_code.get(&c))
            .map(|m| m.id)
            .unwrap_or(Uuid::nil());

        let fee = rw.biaya_masuk.map(|b| b as f64).unwrap_or(0.0);

        (reg_id, res_id, Some(fin_id), Some(fee))
    } else {
        (None, Uuid::nil(), Some(Uuid::nil()), Some(0.0))
    };

    if let Some(student) = existing {
        let mut active = student.into_active_model();
        active.name = Set(student_name);
        active.individual_id = Set(individual.id);
        active.status_id = Set(status_id);
        if let Some(uid) = unit_id {
            active.unit_id = Set(uid);
        }
        if let Some(ayid) = academic_year_id {
            active.academic_year_id = Set(ayid);
        }
        active.id_mahasiswa = Set(mhs_id);
        active.id_registrasi_mahasiswa = Set(reg_id);
        active.nisn = Set(nisn);
        if let Some(rid) = registration_id {
            active.registration_id = Set(rid);
        }
        active.resign_status_id = Set(resign_status_id);
        active.finance_id = Set(finance_id);
        active.finance_fee = Set(finance_fee);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        if !nim.is_empty() && nim != "UNKNOWN" {
            active.code = Set(nim.to_string());
        }

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let code = if !nim.is_empty() && nim != "UNKNOWN" {
            nim.to_string()
        } else if let Some(ref nik_str) = biodata.nik {
            if !nik_str.is_empty() {
                nik_str.clone()
            } else {
                Uuid::new_v4().to_string()
            }
        } else {
            Uuid::new_v4().to_string()
        };

        let unit_id = unit_id.unwrap_or(refs.default_unit_id);
        let registered_date = academic_year_opt
            .and_then(|ay| ay.start_date)
            .or_else(|| refs.default_academic_year.as_ref().and_then(|ay| ay.start_date))
            .unwrap_or_else(|| chrono::Utc::now().date_naive());
        let academic_year_id = academic_year_id
            .or_else(|| refs.default_academic_year.as_ref().map(|ay| ay.id))
            .unwrap_or(Uuid::nil());

        let new_student = AcademicStudent::ActiveModel {
            id: Set(Uuid::new_v4()),
            code: Set(code),
            name: Set(student_name),
            individual_id: Set(individual.id),
            status_id: Set(status_id),
            unit_id: Set(unit_id),
            academic_year_id: Set(academic_year_id),
            registration_id: Set(registration_id.unwrap_or(refs.default_registration_id)),
            selection_type_id: Set(refs.default_selection_type_id),
            registered: Set(registered_date),
            nisn: Set(nisn),
            resign_status_id: Set(resign_status_id),
            finance_id: Set(finance_id),
            finance_fee: Set(finance_fee),
            curriculum_id: Set(Uuid::nil()),
            class_code_id: Set(Uuid::nil()),
            concentration_id: Set(Uuid::nil()),
            transfer_unit_id: Set(Uuid::nil()),
            transfer_code: Set(None),
            id_mahasiswa: Set(mhs_id),
            id_registrasi_mahasiswa: Set(reg_id),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_student.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncBiodataMahasiswaToAcademicStudentMasterStudent {
    fn name(&self) -> &str {
        "SyncBiodataMahasiswaToAcademicStudentMasterStudent"
    }

    fn description(&self) -> &str {
        "Upsert biodata_mahasiswa and mahasiswa to person_master.individuals and academic_student_master.students"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        // 1. Preload reference caches
        let genders = PersonGender::Entity::find().all(db).await?;
        let mut genders_by_code = HashMap::new();
        for g in genders {
            genders_by_code.insert(g.alphabet_code.clone(), g.clone());
        }

        let religions = PersonReligion::Entity::find().all(db).await?;
        let mut religions_by_name = HashMap::new();
        let mut religions_by_code = HashMap::new();
        let mut default_religion_id = Uuid::nil();
        for r in religions {
            religions_by_name.insert(r.name.trim().to_lowercase(), r.clone());
            religions_by_code.insert(r.code, r.clone());
            if r.code == 99 || r.name.to_lowercase().contains("tidak diisi") {
                default_religion_id = r.id;
            }
        }

        let default_identification_type_id = PersonIdentificationType::Entity::find()
            .filter(PersonIdentificationType::Column::AlphabetCode.eq("A"))
            .one(db)
            .await?
            .map(|m| m.id)
            .unwrap_or(Uuid::nil());

        let default_occupation_id = PersonOccupation::Entity::find()
            .filter(PersonOccupation::Column::Code.eq(12))
            .one(db)
            .await?
            .map(|m| m.id)
            .unwrap_or(Uuid::nil());

        let statuses = AcademicStudentStatus::Entity::find().all(db).await?;
        let mut statuses_by_name = HashMap::new();
        let mut default_status_id = Uuid::nil();
        for s in statuses {
            statuses_by_name.insert(s.name.trim().to_lowercase(), s.clone());
            if s.code == 7 || s.name.to_lowercase().contains("tidak diketahui") {
                default_status_id = s.id;
            }
        }
        if default_status_id.is_nil()
            && let Some(s) = statuses_by_name.values().next() {
                default_status_id = s.id;
            }

        let registrations = AcademicStudentRegistration::Entity::find().all(db).await?;
        let mut registrations_by_code = HashMap::new();
        let mut default_registration_id = Uuid::nil();
        for r in registrations {
            if let Some(ref c) = r.alphabet_code {
                registrations_by_code.insert(c.clone(), r.clone());
                if c == "1" {
                    default_registration_id = r.id;
                }
            }
        }
        if default_registration_id.is_nil()
            && let Some(r) = registrations_by_code.values().next() {
                default_registration_id = r.id;
            }

        let resign_statuses = AcademicStudentResignStatus::Entity::find().all(db).await?;
        let mut resign_statuses_by_code = HashMap::new();
        for rs in resign_statuses {
            if let Some(ref c) = rs.alphabet_code {
                resign_statuses_by_code.insert(c.clone(), rs.clone());
            }
        }

        let default_selection_type_id = AcademicStudentSelectionType::Entity::find()
            .filter(AcademicStudentSelectionType::Column::AlphabetCode.eq("L"))
            .one(db)
            .await?
            .map(|m| m.id)
            .unwrap_or(Uuid::nil());

        let finances = AcademicStudentFinance::Entity::find().all(db).await?;
        let mut finances_by_code = HashMap::new();
        for f in finances {
            finances_by_code.insert(f.code, f.clone());
        }

        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_feeder_id = HashMap::new();
        let mut default_unit_id = Uuid::nil();
        for u in units {
            if let Some(fid) = u.feeder_id
                && !fid.is_nil() {
                    units_by_feeder_id.insert(fid, u.clone());
                }
            if default_unit_id.is_nil() {
                default_unit_id = u.id;
            }
        }

        let years = AcademicYear::Entity::find().all(db).await?;
        let mut academic_years_by_feeder_name = HashMap::new();
        let mut default_academic_year = years.first().cloned();
        for y in years {
            if !y.feeder_name.is_empty() {
                academic_years_by_feeder_name.insert(y.feeder_name.clone(), y.clone());
            }
            if default_academic_year.is_none() {
                default_academic_year = Some(y);
            }
        }

        let riwayat_list = FeederRiwayatPendidikan::Entity::find().all(db).await?;
        let mut riwayat_by_reg_id = HashMap::new();
        let mut riwayat_by_mhs_id = HashMap::new();
        for rw in riwayat_list {
            if let Some(reg_id) = rw.id_registrasi_mahasiswa {
                riwayat_by_reg_id.insert(reg_id, rw.clone());
            }
            if let Some(mhs_id) = rw.id_mahasiswa {
                riwayat_by_mhs_id.insert(mhs_id, rw.clone());
            }
        }

        let cache = ReferenceCache {
            genders_by_code,
            religions_by_name,
            religions_by_code,
            default_religion_id,
            default_identification_type_id,
            default_occupation_id,
            statuses_by_name,
            default_status_id,
            registrations_by_code,
            default_registration_id,
            resign_statuses_by_code,
            default_selection_type_id,
            finances_by_code,
            units_by_feeder_id,
            default_unit_id,
            academic_years_by_feeder_name,
            default_academic_year,
            riwayat_by_reg_id,
            riwayat_by_mhs_id,
        };

        // 2. Setup Progress Bar
        let pb = if show_progress {
            let bar = ProgressBar::new_spinner();
            bar.set_style(
                ProgressStyle::default_spinner()
                    .template("{spinner:.green} [{elapsed_precise}] {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_spinner()),
            );
            bar.enable_steady_tick(Duration::from_millis(100));
            bar.set_message("Counting feeder biodata_mahasiswa records...");

            let total_records = FeederBiodataMahasiswa::Entity::find().count(db).await?;

            bar.set_length(total_records);
            bar.set_position(0);
            bar.set_style(
                ProgressStyle::default_bar()
                    .template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_bar())
                    .progress_chars("#>-"),
            );
            bar.set_message("");
            Some(bar)
        } else {
            None
        };

        let mut individual_inserted: u64 = 0;
        let mut individual_updated: u64 = 0;
        let mut student_inserted: u64 = 0;
        let mut student_updated: u64 = 0;
        let mut student_skipped: u64 = 0;
        let mut errors: u64 = 0;

        let mut offset = 0;
        let limit = 1000;

        loop {
            let records = FeederBiodataMahasiswa::Entity::find()
                .order_by_asc(FeederBiodataMahasiswa::Column::Id)
                .offset(offset)
                .limit(limit)
                .all(db)
                .await?;

            if records.is_empty() {
                break;
            }

            for biodata in records {
                let nik = match biodata.nik.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
                    Some(n) => n.to_string(),
                    None => {
                        errors += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to begin transaction: {e}");
                        errors += 1;
                        continue;
                    }
                };

                // Upsert individual
                let individual = match upsert_individual(&txn, &biodata, &nik, &cache).await {
                    Ok((indiv, action)) => {
                        match action {
                            UpsertAction::Inserted => individual_inserted += 1,
                            UpsertAction::Updated => individual_updated += 1,
                        }
                        indiv
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error upserting individual (NIK: {nik}): {e}");
                        errors += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                // Find Feeder Mahasiswa
                let id_mhs = match biodata.id_mahasiswa {
                    Some(id) if !id.is_nil() => id,
                    _ => {
                        let _ = txn.commit().await;
                        student_skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.set_message(format!(
                                "indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | stud_ins: {student_inserted} | stud_upd: {student_updated} | stud_skip: {student_skipped} | errors: {errors}"
                            ));
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let mahasiswa_opt = match FeederMahasiswa::Entity::find()
                    .filter(FeederMahasiswa::Column::IdMahasiswa.eq(id_mhs))
                    .one(&txn)
                    .await
                {
                    Ok(m) => m,
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error querying mahasiswa (id_mahasiswa: {id_mhs}): {e}");
                        errors += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let mahasiswa = match mahasiswa_opt {
                    Some(m) => m,
                    None => {
                        let _ = txn.commit().await;
                        student_skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.set_message(format!(
                                "indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | stud_ins: {student_inserted} | stud_upd: {student_updated} | stud_skip: {student_skipped} | errors: {errors}"
                            ));
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let riwayat = mahasiswa
                    .id_registrasi_mahasiswa
                    .and_then(|reg_id| cache.riwayat_by_reg_id.get(&reg_id))
                    .or_else(|| cache.riwayat_by_mhs_id.get(&id_mhs));

                // Upsert student
                match upsert_student(&txn, &individual, &mahasiswa, &biodata, riwayat, &cache).await {
                    Ok((_student, action)) => {
                        match action {
                            UpsertAction::Inserted => student_inserted += 1,
                            UpsertAction::Updated => student_updated += 1,
                        }
                        if let Err(e) = txn.commit().await {
                            eprintln!("Failed to commit transaction: {e}");
                            errors += 1;
                        }
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error upserting student (NIK: {nik}, NIM: {:?}): {e}", mahasiswa.nim);
                        errors += 1;
                    }
                }

                if let Some(ref pb) = pb {
                    pb.set_message(format!(
                        "indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | stud_ins: {student_inserted} | stud_upd: {student_updated} | stud_skip: {student_skipped} | errors: {errors}"
                    ));
                    pb.inc(1);
                }
            }

            offset += limit;
        }

        let summary = format!(
            "Sync completed - indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | stud_ins: {student_inserted} | stud_upd: {student_updated} | stud_skip: {student_skipped} | errors: {errors}"
        );

        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }

        Ok(())
    }
}
