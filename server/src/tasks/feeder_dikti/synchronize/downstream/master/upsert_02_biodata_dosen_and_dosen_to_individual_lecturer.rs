use std::collections::HashMap;
use std::str::FromStr;
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

use crate::models::feeder::master::biodata_dosen as FeederBiodataDosen;
use crate::models::feeder::master::dosen as FeederDosen;
use crate::models::feeder::master::penugasan_dosen as FeederPenugasanDosen;
use crate::models::feeder::master::riwayat_fungsional_dosen as FeederRiwayatFungsionalDosen;
use crate::models::person::master::individual as PersonIndividual;
use crate::models::person::reference::gender as PersonGender;
use crate::models::person::reference::religion as PersonReligion;
use crate::models::person::reference::marital_status as PersonMaritalStatus;
use crate::models::person::reference::identification_type as PersonIdentificationType;
use crate::models::person::reference::occupation as PersonOccupation;
use crate::models::academic::lecturer::master::lecturers as AcademicLecturer;
use crate::models::academic::lecturer::reference::statuses as AcademicLecturerStatus;
use crate::models::academic::lecturer::reference::groups as AcademicLecturerGroup;
use crate::models::academic::lecturer::reference::contracts as AcademicLecturerContract;
use crate::models::academic::lecturer::reference::ranks as AcademicLecturerRank;
use crate::models::institution::master::institutions as Institution;

pub struct SyncBiodataDosenToAcademicLecturerMasterLecturer;

struct ReferenceCache {
    genders_by_code: HashMap<String, PersonGender::Model>,
    religions_by_name: HashMap<String, PersonReligion::Model>,
    religions_by_code: HashMap<i32, PersonReligion::Model>,
    default_religion_id: Uuid,
    marital_statuses_by_name: HashMap<String, PersonMaritalStatus::Model>,
    default_marital_status_id: Uuid,
    default_identification_type_id: Uuid,
    default_occupation_id: Uuid,
    statuses_by_name: HashMap<String, AcademicLecturerStatus::Model>,
    default_status_id: Option<Uuid>,
    #[allow(dead_code)]
    groups_by_code: HashMap<i32, AcademicLecturerGroup::Model>,
    contracts_by_code: HashMap<String, AcademicLecturerContract::Model>,
    ranks_by_name: HashMap<String, AcademicLecturerRank::Model>,
    institutions_by_feeder_id: HashMap<Uuid, Institution::Model>,
    penugasan_by_dosen_id: HashMap<Uuid, FeederPenugasanDosen::Model>,
    riwayat_fungsional_by_dosen_id: HashMap<Uuid, FeederRiwayatFungsionalDosen::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_individual(
    txn: &DatabaseTransaction,
    biodata: &FeederBiodataDosen::Model,
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
                    .as_deref()
                    .and_then(|id_str| id_str.parse::<i32>().ok())
                    .filter(|&c| (1..=6).contains(&c))
                    .and_then(|c| refs.religions_by_code.get(&c).map(|m| m.id))
            })
            .unwrap_or(refs.default_religion_id)
    } else if let Some(code) = biodata.id_agama.as_deref().and_then(|s| s.parse::<i32>().ok()) {
        if (1..=6).contains(&code) {
            refs.religions_by_code.get(&code).map(|m| m.id).unwrap_or(refs.default_religion_id)
        } else {
            refs.default_religion_id
        }
    } else {
        refs.default_religion_id
    };

    let marital_status_id = biodata
        .status_pernikahan
        .as_deref()
        .and_then(|sp| refs.marital_statuses_by_name.get(&sp.trim().to_lowercase()))
        .map(|m| m.id)
        .unwrap_or(refs.default_marital_status_id);

    let name = biodata.nama_dosen.clone().unwrap_or_else(|| "Unknown".to_string());
    let birth_date = biodata.tanggal_lahir.unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(1900, 1, 1).unwrap());
    let birth_place = biodata.tempat_lahir.clone().unwrap_or_else(|| "-".to_string());

    if let Some(person) = existing {
        let mut active = person.into_active_model();
        active.code = Set(nik.to_string());
        active.name = Set(name);
        active.birth_date = Set(birth_date);
        active.birth_place = Set(birth_place);
        active.gender_id = Set(gender_id);
        active.religion_id = Set(religion_id);
        active.marital_status_id = Set(marital_status_id);
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
            marital_status_id: Set(marital_status_id),
            profession_id: Set(Uuid::nil()),
            age_classification_id: Set(Uuid::nil()),
            is_special_need: Set(false),
            is_social_protection_card_recipient: Set(false),
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

async fn upsert_lecturer(
    txn: &DatabaseTransaction,
    individual: &PersonIndividual::Model,
    dosen: &FeederDosen::Model,
    biodata: &FeederBiodataDosen::Model,
    id_dosen: Uuid,
    refs: &ReferenceCache,
) -> Result<(AcademicLecturer::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();

    // 1. Try finding existing lecturer
    let mut existing: Option<AcademicLecturer::Model> = None;

    let res = AcademicLecturer::Entity::find()
        .filter(AcademicLecturer::Column::IdDosen.eq(id_dosen))
        .order_by_asc(AcademicLecturer::Column::CreatedAt)
        .all(txn)
        .await?;

    if !res.is_empty() {
        existing = res.into_iter().next();
    }

    if existing.is_none() {
        existing = AcademicLecturer::Entity::find()
            .filter(AcademicLecturer::Column::IndividualId.eq(individual.id))
            .one(txn)
            .await?;
    }

    if existing.is_none() {
        if let Some(ref nidn_str) = dosen.nidn {
            let n = nidn_str.trim();
            if !n.is_empty() {
                existing = AcademicLecturer::Entity::find()
                    .filter(AcademicLecturer::Column::Code.eq(n))
                    .one(txn)
                    .await?;
            }
        }
    }

    // Determine Code
    let lecturer_code = dosen
        .nidn
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .or_else(|| dosen.nuptk.as_deref().map(str::trim).filter(|s| !s.is_empty()))
        .or_else(|| dosen.nip.as_deref().map(str::trim).filter(|s| !s.is_empty()))
        .or_else(|| biodata.nik.as_deref().map(str::trim).filter(|s| !s.is_empty()))
        .unwrap_or(individual.code.as_str())
        .to_string();

    let lecturer_name = dosen
        .nama_dosen
        .as_deref()
        .or(biodata.nama_dosen.as_deref())
        .unwrap_or("Unknown")
        .to_string();

    let status_id = dosen
        .nama_status_aktif
        .as_deref()
        .map(|s| s.trim().to_uppercase())
        .and_then(|s| refs.statuses_by_name.get(&s))
        .map(|m| m.id)
        .or(refs.default_status_id);

    let penugasan = refs.penugasan_by_dosen_id.get(&id_dosen);
    let riwayat_fungsional = refs.riwayat_fungsional_by_dosen_id.get(&id_dosen);

    let id_registrasi_dosen = penugasan.and_then(|p| p.id_registrasi_dosen);

    let institution_id = penugasan
        .and_then(|p| p.id_perguruan_tinggi)
        .and_then(|pt_id| refs.institutions_by_feeder_id.get(&pt_id))
        .map(|inst| inst.id);

    let contract_id = penugasan
        .and_then(|p| p.id_ikatan_kerja.as_deref())
        .and_then(|c| refs.contracts_by_code.get(c.trim()))
        .map(|ct| ct.id);

    let rank_id = riwayat_fungsional
        .and_then(|rf| rf.nama_jabatan_fungsional.as_deref())
        .and_then(|name| refs.ranks_by_name.get(&name.trim().to_lowercase()))
        .map(|rk| rk.id);

    let start_date = riwayat_fungsional.and_then(|rf| rf.mulai_sk_jabatan);

    if let Some(lecturer) = existing {
        let mut active = lecturer.into_active_model();
        active.code = Set(lecturer_code);
        active.name = Set(Some(lecturer_name));
        active.individual_id = Set(individual.id);
        active.identification_number = Set(dosen.nip.clone().or_else(|| biodata.nip.clone()));
        active.nuptk = Set(dosen.nuptk.clone());
        active.id_dosen = Set(Some(id_dosen));
        if status_id.is_some() {
            active.status_id = Set(status_id);
        }
        if id_registrasi_dosen.is_some() {
            active.id_registrasi_dosen = Set(id_registrasi_dosen);
        }
        if institution_id.is_some() {
            active.institution_id = Set(institution_id);
        }
        if contract_id.is_some() {
            active.contract_id = Set(contract_id);
        }
        if rank_id.is_some() {
            active.rank_id = Set(rank_id);
        }
        if start_date.is_some() {
            active.start_date = Set(start_date);
        }
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_lecturer = AcademicLecturer::ActiveModel {
            id: Set(Uuid::new_v4()),
            code: Set(lecturer_code),
            name: Set(Some(lecturer_name)),
            individual_id: Set(individual.id),
            institution_id: Set(institution_id),
            alternative_code: Set(None),
            accessor_number: Set(None),
            identification_number: Set(dosen.nip.clone().or_else(|| biodata.nip.clone())),
            status_id: Set(status_id),
            contract_id: Set(contract_id),
            rank_id: Set(rank_id),
            start_date: Set(start_date),
            end_date: Set(None),
            front_title: Set(None),
            last_title: Set(None),
            id_dosen: Set(Some(id_dosen)),
            id_registrasi_dosen: Set(id_registrasi_dosen),
            group_id: Set(None),
            nuptk: Set(dosen.nuptk.clone()),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_lecturer.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncBiodataDosenToAcademicLecturerMasterLecturer {
    fn name(&self) -> &str {
        "SyncBiodataDosenToAcademicLecturerMasterLecturer"
    }

    fn description(&self) -> &str {
        "Upsert biodata_dosen and dosen to person_master.individuals and academic_lecturer_master.lecturers"
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

        let marital_statuses = PersonMaritalStatus::Entity::find().all(db).await?;
        let mut marital_statuses_by_name = HashMap::new();
        let mut default_marital_status_id = Uuid::nil();
        for ms in marital_statuses {
            marital_statuses_by_name.insert(ms.name.trim().to_lowercase(), ms.clone());
            if default_marital_status_id.is_nil() {
                default_marital_status_id = ms.id;
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

        let statuses = AcademicLecturerStatus::Entity::find().all(db).await?;
        let mut statuses_by_name = HashMap::new();
        let mut default_status_id = None;
        for s in statuses {
            statuses_by_name.insert(s.name.trim().to_uppercase(), s.clone());
            if s.name.eq_ignore_ascii_case("AKTIF") {
                default_status_id = Some(s.id);
            }
        }

        let groups = AcademicLecturerGroup::Entity::find().all(db).await?;
        let mut groups_by_code = HashMap::new();
        for g in groups {
            groups_by_code.insert(g.code, g.clone());
        }

        let contracts = AcademicLecturerContract::Entity::find().all(db).await?;
        let mut contracts_by_code = HashMap::new();
        for c in contracts {
            if let Some(ref ac) = c.alphabet_code {
                contracts_by_code.insert(ac.trim().to_string(), c.clone());
            }
        }

        let ranks = AcademicLecturerRank::Entity::find().all(db).await?;
        let mut ranks_by_name = HashMap::new();
        for r in ranks {
            ranks_by_name.insert(r.name.trim().to_lowercase(), r.clone());
        }

        let institutions = Institution::Entity::find().all(db).await?;
        let mut institutions_by_feeder_id = HashMap::new();
        for inst in institutions {
            if let Some(fid) = inst.feeder_id {
                institutions_by_feeder_id.insert(fid, inst.clone());
            }
        }

        let penugasan_list = FeederPenugasanDosen::Entity::find().all(db).await?;
        let mut penugasan_by_dosen_id = HashMap::new();
        for p in penugasan_list {
            if let Some(id_d) = p.id_dosen {
                // If multiple assignments, prioritize apakah_homebase = true
                if p.apakah_homebase == Some(true) || !penugasan_by_dosen_id.contains_key(&id_d) {
                    penugasan_by_dosen_id.insert(id_d, p);
                }
            }
        }

        let riwayat_fungsional_list = FeederRiwayatFungsionalDosen::Entity::find().all(db).await?;
        let mut riwayat_fungsional_by_dosen_id: HashMap<Uuid, FeederRiwayatFungsionalDosen::Model> = HashMap::new();
        for rf in riwayat_fungsional_list {
            if let Some(id_d) = rf.id_dosen {
                // prioritize latest mulai_sk_jabatan
                let should_replace = if let Some(existing) = riwayat_fungsional_by_dosen_id.get(&id_d) {
                    rf.mulai_sk_jabatan > existing.mulai_sk_jabatan
                } else {
                    true
                };
                if should_replace {
                    riwayat_fungsional_by_dosen_id.insert(id_d, rf);
                }
            }
        }

        let cache = ReferenceCache {
            genders_by_code,
            religions_by_name,
            religions_by_code,
            default_religion_id,
            marital_statuses_by_name,
            default_marital_status_id,
            default_identification_type_id,
            default_occupation_id,
            statuses_by_name,
            default_status_id,
            groups_by_code,
            contracts_by_code,
            ranks_by_name,
            institutions_by_feeder_id,
            penugasan_by_dosen_id,
            riwayat_fungsional_by_dosen_id,
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
            bar.set_message("Counting feeder biodata_dosen records...");

            let total_records = FeederBiodataDosen::Entity::find().count(db).await?;

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
        let mut lecturer_inserted: u64 = 0;
        let mut lecturer_updated: u64 = 0;
        let mut lecturer_skipped: u64 = 0;
        let mut errors: u64 = 0;

        let mut offset = 0;
        let limit = 1000;

        loop {
            let records = FeederBiodataDosen::Entity::find()
                .order_by_asc(FeederBiodataDosen::Column::Id)
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

                // Resolve id_dosen UUID
                let id_dosen = match biodata.id_dosen.as_deref().and_then(|s| Uuid::from_str(s).ok()) {
                    Some(id) if !id.is_nil() => id,
                    _ => {
                        let _ = txn.commit().await;
                        lecturer_skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.set_message(format!(
                                "indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | lect_ins: {lecturer_inserted} | lect_upd: {lecturer_updated} | lect_skip: {lecturer_skipped} | errors: {errors}"
                            ));
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let dosen_opt = match FeederDosen::Entity::find()
                    .filter(FeederDosen::Column::IdDosen.eq(id_dosen))
                    .one(&txn)
                    .await
                {
                    Ok(d) => d,
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error querying dosen (id_dosen: {id_dosen}): {e}");
                        errors += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let dosen = match dosen_opt {
                    Some(d) => d,
                    None => {
                        let _ = txn.commit().await;
                        lecturer_skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.set_message(format!(
                                "indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | lect_ins: {lecturer_inserted} | lect_upd: {lecturer_updated} | lect_skip: {lecturer_skipped} | errors: {errors}"
                            ));
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                match upsert_lecturer(&txn, &individual, &dosen, &biodata, id_dosen, &cache).await {
                    Ok((_lecturer, action)) => {
                        match action {
                            UpsertAction::Inserted => lecturer_inserted += 1,
                            UpsertAction::Updated => lecturer_updated += 1,
                        }
                        if let Err(e) = txn.commit().await {
                            eprintln!("Failed to commit transaction: {e}");
                            errors += 1;
                        }
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error upserting lecturer (NIK: {nik}, NIDN: {:?}): {e}", dosen.nidn);
                        errors += 1;
                    }
                }

                if let Some(ref pb) = pb {
                    pb.set_message(format!(
                        "indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | lect_ins: {lecturer_inserted} | lect_upd: {lecturer_updated} | lect_skip: {lecturer_skipped} | errors: {errors}"
                    ));
                    pb.inc(1);
                }
            }

            offset += limit;
        }

        let summary = format!(
            "Sync completed - indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | lect_ins: {lecturer_inserted} | lect_upd: {lecturer_updated} | lect_skip: {lecturer_skipped} | errors: {errors}"
        );

        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }

        Ok(())
    }
}
