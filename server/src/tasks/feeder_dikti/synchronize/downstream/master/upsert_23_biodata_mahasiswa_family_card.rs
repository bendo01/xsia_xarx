//! Step 23: feeder `biodata_mahasiswa` parent data (ayah / ibu / wali)
//! → `person_master.individuals` + `family_cards` + `family_card_members`.
//!
//! Layout produced per student:
//! - one `family_cards` row owned by the student's individual;
//! - one `family_card_members` row per parent / guardian, where
//!   `individual_id` = the student, `relative_id` = the parent individual and
//!   `relative_type_id` = `relative_types` row (code 1 father, 2 mother,
//!   10 guardian).
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
use crate::models::literate::educations as LiterateEducation;
use crate::models::person::master::family_card as PersonFamilyCard;
use crate::models::person::master::family_card_member as PersonFamilyCardMember;
use crate::models::person::master::individual as PersonIndividual;
use crate::models::person::reference::gender as PersonGender;
use crate::models::person::reference::identification_type as PersonIdentificationType;
use crate::models::person::reference::income as PersonIncome;
use crate::models::person::reference::occupation as PersonOccupation;
use crate::models::person::reference::relative_type as PersonRelativeType;

/// `relative_types.code` values (same convention as candidate admission).
const RELATIVE_FATHER: i32 = 1;
const RELATIVE_MOTHER: i32 = 2;
const RELATIVE_GUARDIAN: i32 = 10;

const DEFAULT_FAMILY_CARD_CODE: &str = "0000000000000000";

pub struct SyncBiodataMahasiswaFamilyCard;

struct ReferenceCache {
    individuals_by_nik: HashMap<String, PersonIndividual::Model>,
    genders_by_code: HashMap<String, Uuid>,
    occupations_by_name: HashMap<String, Uuid>,
    incomes_by_name: HashMap<String, Uuid>,
    educations_by_name: HashMap<String, Uuid>,
    relative_types_by_code: HashMap<i32, Uuid>,
    default_identification_type_id: Uuid,
    default_occupation_id: Uuid,
}

/// One parent / guardian block of a feeder biodata row.
struct ParentInput<'a> {
    relative_code: i32,
    /// "L" / "P" when known (father / mother), `None` for guardian.
    gender_code: Option<&'static str>,
    nik: Option<&'a str>,
    name: Option<&'a str>,
    birth_date: Option<chrono::NaiveDate>,
    education_name: Option<&'a str>,
    occupation_name: Option<&'a str>,
    income_name: Option<&'a str>,
    special_need_id: Option<i32>,
}

#[derive(Default)]
struct Counters {
    cards_inserted: u64,
    parents_inserted: u64,
    parents_updated: u64,
    members_inserted: u64,
    members_updated: u64,
    skipped: u64,
}

fn valid_nik(raw: Option<&str>) -> Option<String> {
    let s = raw?.trim();
    if s.len() == 16 && s.chars().all(|c| c.is_ascii_digit()) && s.chars().any(|c| c != '0') {
        Some(s.to_string())
    } else {
        None
    }
}

fn clean_name(raw: Option<&str>) -> Option<String> {
    let s = raw?.trim();
    if s.is_empty() || s == "-" || s == "0" {
        None
    } else {
        Some(s.to_string())
    }
}

fn lookup(map: &HashMap<String, Uuid>, name: Option<&str>) -> Option<Uuid> {
    map.get(&name?.trim().to_lowercase()).copied()
}

async fn upsert_parent(
    txn: &DatabaseTransaction,
    refs: &mut ReferenceCache,
    card_id: Uuid,
    student: &PersonIndividual::Model,
    input: &ParentInput<'_>,
    counters: &mut Counters,
) -> Result<Option<Uuid>, sea_orm::DbErr> {
    let Some(name) = clean_name(input.name) else {
        return Ok(None);
    };
    let Some(&relative_type_id) = refs.relative_types_by_code.get(&input.relative_code) else {
        return Ok(None);
    };
    let now = chrono::Local::now().naive_local();
    let nik = valid_nik(input.nik);

    // Locate an existing individual: by NIK, otherwise the card's current
    // member of the same relative type.
    let mut existing: Option<PersonIndividual::Model> =
        nik.as_ref().and_then(|n| refs.individuals_by_nik.get(n).cloned());
    let existing_member = PersonFamilyCardMember::Entity::find()
        .filter(PersonFamilyCardMember::Column::FamilyCardId.eq(card_id))
        .filter(PersonFamilyCardMember::Column::RelativeTypeId.eq(relative_type_id))
        .filter(PersonFamilyCardMember::Column::DeletedAt.is_null())
        .one(txn)
        .await?;
    if existing.is_none() && nik.is_none() {
        if let Some(ref m) = existing_member {
            existing = PersonIndividual::Entity::find_by_id(m.relative_id).one(txn).await?;
        }
    }
    // Never rewrite the student's own record through a parent entry.
    if existing.as_ref().is_some_and(|e| e.id == student.id) {
        return Ok(None);
    }

    let gender_id = input
        .gender_code
        .and_then(|g| refs.genders_by_code.get(g).copied());
    let occupation_id = lookup(&refs.occupations_by_name, input.occupation_name);
    let income_id = lookup(&refs.incomes_by_name, input.income_name);
    let education_id = lookup(&refs.educations_by_name, input.education_name);
    let special_need = input.special_need_id.is_some_and(|i| i != 0);

    let parent_id = if let Some(person) = existing {
        let id = person.id;
        let mut active = person.into_active_model();
        active.name = Set(name);
        if let Some(d) = input.birth_date {
            active.birth_date = Set(d);
        }
        if let Some(g) = gender_id {
            active.gender_id = Set(g);
        }
        if let Some(o) = occupation_id {
            active.occupation_id = Set(o);
        }
        if let Some(i) = income_id {
            active.income_id = Set(i);
        }
        if let Some(e) = education_id {
            active.education_id = Set(e);
        }
        active.is_special_need = Set(special_need);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));
        let updated = active.update(txn).await?;
        if let Some(ref n) = nik {
            refs.individuals_by_nik.insert(n.clone(), updated);
        }
        counters.parents_updated += 1;
        id
    } else {
        let id = Uuid::new_v4();
        let code = nik.clone().unwrap_or_else(|| format!("NONIK-{id}"));
        let model = PersonIndividual::ActiveModel {
            id: Set(id),
            code: Set(code),
            name: Set(name),
            front_title: Set(None),
            last_title: Set(None),
            birth_date: Set(input
                .birth_date
                .unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(1900, 1, 1).unwrap())),
            birth_place: Set("-".to_string()),
            gender_id: Set(gender_id.unwrap_or(Uuid::nil())),
            religion_id: Set(student.religion_id),
            occupation_id: Set(occupation_id.unwrap_or(refs.default_occupation_id)),
            education_id: Set(education_id.unwrap_or(Uuid::nil())),
            income_id: Set(income_id.unwrap_or(Uuid::nil())),
            identification_type_id: Set(refs.default_identification_type_id),
            marital_status_id: Set(Uuid::nil()),
            profession_id: Set(Uuid::nil()),
            age_classification_id: Set(Uuid::nil()),
            is_special_need: Set(special_need),
            is_social_protection_card_recipient: Set(false),
            is_deceased: Set(false),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        }
        .insert(txn)
        .await?;
        if let Some(ref n) = nik {
            refs.individuals_by_nik.insert(n.clone(), model);
        }
        counters.parents_inserted += 1;
        id
    };

    // Link to the family card.
    if let Some(member) = existing_member {
        let mut active = member.into_active_model();
        active.individual_id = Set(student.id);
        active.relative_id = Set(parent_id);
        active.updated_at = Set(Some(now));
        active.sync_at = Set(Some(now));
        active.update(txn).await?;
        counters.members_updated += 1;
    } else {
        PersonFamilyCardMember::ActiveModel {
            id: Set(Uuid::new_v4()),
            family_card_id: Set(card_id),
            individual_id: Set(student.id),
            relative_id: Set(parent_id),
            relative_type_id: Set(relative_type_id),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        }
        .insert(txn)
        .await?;
        counters.members_inserted += 1;
    }

    Ok(Some(parent_id))
}

#[async_trait]
impl Task for SyncBiodataMahasiswaFamilyCard {
    fn name(&self) -> &str {
        "SyncBiodataMahasiswaFamilyCard"
    }

    fn description(&self) -> &str {
        "Upsert biodata_mahasiswa parent data (ayah, ibu, wali) to person_master.individuals, family_cards, family_card_members"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        let pb = if show_progress {
            let bar = ProgressBar::new_spinner();
            bar.set_style(
                ProgressStyle::default_spinner()
                    .template("{spinner:.green} [{elapsed_precise}] {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_spinner()),
            );
            bar.enable_steady_tick(Duration::from_millis(100));
            bar.set_message("Counting feeder biodata_mahasiswa records...");
            let total = FeederBiodataMahasiswa::Entity::find().count(db).await?;
            bar.set_length(total);
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

        if let Some(ref bar) = pb {
            bar.set_message("Preloading references...");
        }

        let mut individuals_by_nik = HashMap::new();
        for ind in PersonIndividual::Entity::find().all(db).await? {
            let code = ind.code.trim().to_string();
            if !code.is_empty() {
                individuals_by_nik.entry(code).or_insert(ind);
            }
        }

        let genders_by_code = PersonGender::Entity::find()
            .all(db)
            .await?
            .into_iter()
            .map(|g| (g.alphabet_code, g.id))
            .collect();
        let occupations_by_name = PersonOccupation::Entity::find()
            .all(db)
            .await?
            .into_iter()
            .map(|o| (o.name.trim().to_lowercase(), o.id))
            .collect();
        let incomes_by_name = PersonIncome::Entity::find()
            .all(db)
            .await?
            .into_iter()
            .map(|o| (o.name.trim().to_lowercase(), o.id))
            .collect();
        let educations_by_name = LiterateEducation::Entity::find()
            .all(db)
            .await?
            .into_iter()
            .map(|o| (o.name.trim().to_lowercase(), o.id))
            .collect();
        let relative_types_by_code = PersonRelativeType::Entity::find()
            .all(db)
            .await?
            .into_iter()
            .map(|r| (r.code, r.id))
            .collect();
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

        let mut refs = ReferenceCache {
            individuals_by_nik,
            genders_by_code,
            occupations_by_name,
            incomes_by_name,
            educations_by_name,
            relative_types_by_code,
            default_identification_type_id,
            default_occupation_id,
        };

        if !refs.relative_types_by_code.contains_key(&RELATIVE_FATHER)
            || !refs.relative_types_by_code.contains_key(&RELATIVE_MOTHER)
        {
            return Err("person_reference.relative_types is missing father (1) / mother (2) rows".into());
        }

        let mut counters = Counters::default();
        let mut offset: u64 = 0;
        let limit: u64 = 1000;

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

            for record in records {
                let student = record
                    .nik
                    .as_deref()
                    .map(str::trim)
                    .and_then(|n| refs.individuals_by_nik.get(n))
                    .cloned();
                let Some(student) = student else {
                    counters.skipped += 1;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                };

                let parents = [
                    ParentInput {
                        relative_code: RELATIVE_FATHER,
                        gender_code: Some("L"),
                        nik: record.nik_ayah.as_deref(),
                        name: record.nama_ayah.as_deref(),
                        birth_date: record.tanggal_lahir_ayah,
                        education_name: record.nama_pendidikan_ayah.as_deref(),
                        occupation_name: record.nama_pekerjaan_ayah.as_deref(),
                        income_name: record.nama_penghasilan_ayah.as_deref(),
                        special_need_id: record.id_kebutuhan_khusus_ayah,
                    },
                    ParentInput {
                        relative_code: RELATIVE_MOTHER,
                        gender_code: Some("P"),
                        nik: record.nik_ibu.as_deref(),
                        name: record.nama_ibu_kandung.as_deref(),
                        birth_date: record.tanggal_lahir_ibu,
                        education_name: record.nama_pendidikan_ibu.as_deref(),
                        occupation_name: record.nama_pekerjaan_ibu.as_deref(),
                        income_name: record.nama_penghasilan_ibu.as_deref(),
                        special_need_id: record.id_kebutuhan_khusus_ibu,
                    },
                    ParentInput {
                        relative_code: RELATIVE_GUARDIAN,
                        gender_code: None,
                        nik: None,
                        name: record.nama_wali.as_deref(),
                        birth_date: record.tanggal_lahir_wali,
                        education_name: record.nama_pendidikan_wali.as_deref(),
                        occupation_name: record.nama_pekerjaan_wali.as_deref(),
                        income_name: record.nama_penghasilan_wali.as_deref(),
                        special_need_id: None,
                    },
                ];

                if parents.iter().all(|p| clean_name(p.name).is_none()) {
                    counters.skipped += 1;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                }

                let txn = db.begin().await?;
                let now = chrono::Local::now().naive_local();

                let card = PersonFamilyCard::Entity::find()
                    .filter(PersonFamilyCard::Column::IndividualId.eq(student.id))
                    .filter(PersonFamilyCard::Column::DeletedAt.is_null())
                    .order_by_desc(PersonFamilyCard::Column::CreatedAt)
                    .one(&txn)
                    .await?;
                let card_id = match card {
                    Some(c) => c.id,
                    None => {
                        let c = PersonFamilyCard::ActiveModel {
                            id: Set(Uuid::new_v4()),
                            code: Set(Some(DEFAULT_FAMILY_CARD_CODE.to_string())),
                            individual_id: Set(Some(student.id)),
                            created_at: Set(Some(now)),
                            updated_at: Set(Some(now)),
                            sync_at: Set(Some(now)),
                            ..Default::default()
                        }
                        .insert(&txn)
                        .await?;
                        counters.cards_inserted += 1;
                        c.id
                    }
                };

                for parent in &parents {
                    upsert_parent(&txn, &mut refs, card_id, &student, parent, &mut counters).await?;
                }

                txn.commit().await?;

                if let Some(ref pb) = pb {
                    pb.set_message(format!(
                        "cards: {} | parents: {} | members: {} | skipped: {}",
                        counters.cards_inserted,
                        counters.parents_inserted + counters.parents_updated,
                        counters.members_inserted + counters.members_updated,
                        counters.skipped
                    ));
                    pb.inc(1);
                }
            }

            offset += limit;
        }

        let summary = format!(
            "Sync completed - family cards created: {} | parents: {} (ins: {}, upd: {}) | members: {} (ins: {}, upd: {}) | skipped: {}",
            counters.cards_inserted,
            counters.parents_inserted + counters.parents_updated,
            counters.parents_inserted,
            counters.parents_updated,
            counters.members_inserted + counters.members_updated,
            counters.members_inserted,
            counters.members_updated,
            counters.skipped
        );
        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }
        Ok(())
    }
}
