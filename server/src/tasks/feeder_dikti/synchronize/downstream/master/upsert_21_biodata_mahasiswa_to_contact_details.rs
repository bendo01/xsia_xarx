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
use crate::models::person::master::individual as PersonIndividual;
use crate::models::contact::master::phones as ContactPhone;
use crate::models::contact::master::electronic_mails as ContactEmail;
use crate::models::contact::master::residences as ContactResidence;
use crate::models::contact::reference::phone_types as ContactPhoneType;
use crate::models::contact::reference::electronic_mail_types as ContactEmailType;
use crate::models::contact::reference::residence_types as ContactResidenceType;
use crate::models::location::sub_districts as LocationSubDistrict;
use crate::models::location::regencies as LocationRegency;
use crate::models::location::provinces as LocationProvince;

pub struct SyncBiodataMahasiswaToContactDetails;

struct ReferenceCache {
    individuals_by_nik: HashMap<String, PersonIndividual::Model>,
    sub_districts_by_dikti_code: HashMap<String, LocationSubDistrict::Model>,
    sub_districts_by_code: HashMap<String, LocationSubDistrict::Model>,
    regencies_by_id: HashMap<Uuid, LocationRegency::Model>,
    regencies_by_dikti_code: HashMap<String, LocationRegency::Model>,
    regencies_by_code: HashMap<String, LocationRegency::Model>,
    provinces_by_dikti_code: HashMap<String, LocationProvince::Model>,
    provinces_by_code: HashMap<String, LocationProvince::Model>,
    default_phone_type_id: Uuid,
    default_email_type_id: Uuid,
    default_residence_type_id: Uuid,
}

enum UpsertAction {
    Inserted,
    Updated,
}

fn clean_phone(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let digits: String = trimmed.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() < 5 {
        return None;
    }
    Some(digits)
}

fn clean_email(raw: &str) -> Option<String> {
    let trimmed = raw.trim().to_lowercase();
    if trimmed.is_empty() || !trimmed.contains('@') || !trimmed.contains('.') {
        return None;
    }
    Some(trimmed)
}

fn resolve_location(
    id_wilayah: Option<&str>,
    cache: &ReferenceCache,
) -> (Option<Uuid>, Option<Uuid>, Option<Uuid>) {
    let id_w = match id_wilayah {
        Some(w) => w.trim(),
        None => return (None, None, None),
    };

    if id_w.is_empty() || id_w == "999999" {
        return (None, None, None);
    }

    // 1. Check Sub-district by dikti_code then code
    if let Some(sd) = cache.sub_districts_by_dikti_code.get(id_w).or_else(|| cache.sub_districts_by_code.get(id_w)) {
        let regency_id = Some(sd.regency_id);
        let province_id = cache.regencies_by_id.get(&sd.regency_id).map(|r| r.province_id);
        return (Some(sd.id), regency_id, province_id);
    }

    // 2. Check Regency by dikti_code, code, or 4-digit prefix
    if let Some(r) = cache.regencies_by_dikti_code.get(id_w)
        .or_else(|| cache.regencies_by_code.get(id_w))
        .or_else(|| if id_w.len() >= 4 { cache.regencies_by_code.get(&id_w[..4]) } else { None })
    {
        return (None, Some(r.id), Some(r.province_id));
    }

    // 3. Check Province by dikti_code, code, or 2-digit prefix
    if let Some(p) = cache.provinces_by_dikti_code.get(id_w)
        .or_else(|| cache.provinces_by_code.get(id_w))
        .or_else(|| if id_w.len() >= 2 { cache.provinces_by_code.get(&id_w[..2]) } else { None })
    {
        return (None, None, Some(p.id));
    }

    (None, None, None)
}

async fn upsert_contact_phone(
    txn: &DatabaseTransaction,
    individual_id: Uuid,
    phone_number: &str,
    phone_type_id: Uuid,
) -> Result<UpsertAction, sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let existing = ContactPhone::Entity::find()
        .filter(ContactPhone::Column::PhoneableType.eq("App\\Models\\Person\\Master\\Individual"))
        .filter(ContactPhone::Column::PhoneableId.eq(individual_id))
        .filter(ContactPhone::Column::PhoneNumber.eq(phone_number))
        .one(txn)
        .await?;

    if let Some(phone) = existing {
        let mut active: ContactPhone::ActiveModel = phone.into_active_model();
        active.phone_type_id = Set(Some(phone_type_id));
        active.updated_at = Set(Some(now));
        active.sync_at = Set(Some(now));
        active.update(txn).await?;
        Ok(UpsertAction::Updated)
    } else {
        let new_phone = ContactPhone::ActiveModel {
            id: Set(Uuid::new_v4()),
            phone_number: Set(phone_number.to_string()),
            phone_type_id: Set(Some(phone_type_id)),
            phoneable_id: Set(individual_id),
            phoneable_type: Set("App\\Models\\Person\\Master\\Individual".to_string()),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };
        new_phone.insert(txn).await?;
        Ok(UpsertAction::Inserted)
    }
}

async fn upsert_contact_email(
    txn: &DatabaseTransaction,
    individual_id: Uuid,
    email: &str,
    email_type_id: Uuid,
) -> Result<UpsertAction, sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let existing = ContactEmail::Entity::find()
        .filter(ContactEmail::Column::ElectronicMailableType.eq("App\\Models\\Person\\Master\\Individual"))
        .filter(ContactEmail::Column::ElectronicMailableId.eq(individual_id))
        .filter(ContactEmail::Column::EmailAddress.eq(email))
        .one(txn)
        .await?;

    if let Some(email_record) = existing {
        let mut active: ContactEmail::ActiveModel = email_record.into_active_model();
        active.electronic_mail_type_id = Set(Some(email_type_id));
        active.updated_at = Set(Some(now));
        active.sync_at = Set(Some(now));
        active.update(txn).await?;
        Ok(UpsertAction::Updated)
    } else {
        let new_email = ContactEmail::ActiveModel {
            id: Set(Uuid::new_v4()),
            email_address: Set(email.to_string()),
            electronic_mail_type_id: Set(Some(email_type_id)),
            electronic_mailable_id: Set(individual_id),
            electronic_mailable_type: Set("App\\Models\\Person\\Master\\Individual".to_string()),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };
        new_email.insert(txn).await?;
        Ok(UpsertAction::Inserted)
    }
}

async fn upsert_contact_residence(
    txn: &DatabaseTransaction,
    individual_id: Uuid,
    street: &str,
    rt: i32,
    rw: i32,
    id_wilayah: Option<&str>,
    cache: &ReferenceCache,
) -> Result<UpsertAction, sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let (sub_district_id, regency_id, province_id) = resolve_location(id_wilayah, cache);

    let existing = ContactResidence::Entity::find()
        .filter(ContactResidence::Column::ResidenceableType.eq("App\\Models\\Person\\Master\\Individual"))
        .filter(ContactResidence::Column::ResidenceableId.eq(individual_id))
        .one(txn)
        .await?;

    if let Some(residence) = existing {
        let mut active: ContactResidence::ActiveModel = residence.into_active_model();
        active.street = Set(street.to_string());
        active.neighborhood_association = Set(rt);
        active.citizens_association = Set(rw);
        active.residence_type_id = Set(Some(cache.default_residence_type_id));
        active.province_id = Set(province_id);
        active.regency_id = Set(regency_id);
        active.sub_district_id = Set(sub_district_id);
        active.updated_at = Set(Some(now));
        active.sync_at = Set(Some(now));
        active.update(txn).await?;
        Ok(UpsertAction::Updated)
    } else {
        let new_residence = ContactResidence::ActiveModel {
            id: Set(Uuid::new_v4()),
            street: Set(street.to_string()),
            neighborhood_association: Set(rt),
            citizens_association: Set(rw),
            residence_type_id: Set(Some(cache.default_residence_type_id)),
            residenceable_type: Set(Some("App\\Models\\Person\\Master\\Individual".to_string())),
            residenceable_id: Set(Some(individual_id)),
            province_id: Set(province_id),
            regency_id: Set(regency_id),
            sub_district_id: Set(sub_district_id),
            village_id: Set(None),
            latitude: Set(None),
            longitude: Set(None),
            zoom: Set(None),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };
        new_residence.insert(txn).await?;
        Ok(UpsertAction::Inserted)
    }
}

#[async_trait]
impl Task for SyncBiodataMahasiswaToContactDetails {
    fn name(&self) -> &str {
        "SyncBiodataMahasiswaToContactDetails"
    }

    fn description(&self) -> &str {
        "Upsert biodata_mahasiswa to contact_master.phones, electronic_mails, residences"
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

        if let Some(ref bar) = pb {
            bar.set_message("Preloading references...");
        }

        // 1. Preload Individuals
        let individuals = PersonIndividual::Entity::find().all(db).await?;
        let mut individuals_by_nik = HashMap::new();
        for ind in individuals {
            let trimmed_code = ind.code.trim().to_string();
            if !trimmed_code.is_empty() {
                individuals_by_nik.entry(trimmed_code).or_insert(ind);
            }
        }

        // 2. Preload Sub-districts
        let sub_districts = LocationSubDistrict::Entity::find().all(db).await?;
        let mut sub_districts_by_dikti_code = HashMap::new();
        let mut sub_districts_by_code = HashMap::new();
        for sd in sub_districts {
            if let Some(ref d_code) = sd.dikti_code {
                let trimmed = d_code.trim().to_string();
                if !trimmed.is_empty() {
                    sub_districts_by_dikti_code.insert(trimmed, sd.clone());
                }
            }
            let trimmed_code = sd.code.trim().to_string();
            if !trimmed_code.is_empty() {
                sub_districts_by_code.insert(trimmed_code, sd);
            }
        }

        // 3. Preload Regencies
        let regencies = LocationRegency::Entity::find().all(db).await?;
        let mut regencies_by_id = HashMap::new();
        let mut regencies_by_dikti_code = HashMap::new();
        let mut regencies_by_code = HashMap::new();
        for r in regencies {
            regencies_by_id.insert(r.id, r.clone());
            if let Some(ref d_code) = r.dikti_code {
                let trimmed = d_code.trim().to_string();
                if !trimmed.is_empty() {
                    regencies_by_dikti_code.insert(trimmed, r.clone());
                }
            }
            if let Some(ref c) = r.code {
                let trimmed = c.trim().to_string();
                if !trimmed.is_empty() {
                    regencies_by_code.insert(trimmed, r);
                }
            }
        }

        // 4. Preload Provinces
        let provinces = LocationProvince::Entity::find().all(db).await?;
        let mut provinces_by_dikti_code = HashMap::new();
        let mut provinces_by_code = HashMap::new();
        for p in provinces {
            if let Some(ref d_code) = p.dikti_code {
                let trimmed = d_code.trim().to_string();
                if !trimmed.is_empty() {
                    provinces_by_dikti_code.insert(trimmed, p.clone());
                }
            }
            if let Some(ref c) = p.code {
                let trimmed = c.trim().to_string();
                if !trimmed.is_empty() {
                    provinces_by_code.insert(trimmed, p);
                }
            }
        }

        // 5. Reference Types
        let default_phone_type_id = ContactPhoneType::Entity::find()
            .filter(ContactPhoneType::Column::AlphabetCode.eq("B"))
            .one(db)
            .await?
            .map(|m| m.id)
            .unwrap_or_else(|| Uuid::parse_str("5cf06051-0434-4581-807f-52ee40c7b7bf").unwrap());

        let default_email_type_id = ContactEmailType::Entity::find()
            .filter(ContactEmailType::Column::AlphabetCode.eq("B"))
            .one(db)
            .await?
            .map(|m| m.id)
            .unwrap_or_else(|| Uuid::parse_str("3df226c0-3280-48f3-b8b5-168dff719e54").unwrap());

        let default_residence_type_id = ContactResidenceType::Entity::find()
            .filter(ContactResidenceType::Column::AlphabetCode.eq("A"))
            .one(db)
            .await?
            .map(|m| m.id)
            .unwrap_or_else(|| Uuid::parse_str("a24667c1-6e1f-4b00-982f-b3b297bc4d60").unwrap());

        let cache = ReferenceCache {
            individuals_by_nik,
            sub_districts_by_dikti_code,
            sub_districts_by_code,
            regencies_by_id,
            regencies_by_dikti_code,
            regencies_by_code,
            provinces_by_dikti_code,
            provinces_by_code,
            default_phone_type_id,
            default_email_type_id,
            default_residence_type_id,
        };

        let mut phones_inserted: u64 = 0;
        let mut phones_updated: u64 = 0;
        let mut emails_inserted: u64 = 0;
        let mut emails_updated: u64 = 0;
        let mut residences_inserted: u64 = 0;
        let mut residences_updated: u64 = 0;
        let mut skipped: u64 = 0;

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
                let nik = match &record.nik {
                    Some(n) if !n.trim().is_empty() => n.trim(),
                    _ => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let individual = match cache.individuals_by_nik.get(nik) {
                    Some(ind) => ind,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let txn = db.begin().await?;

                // 1. Telepon
                if let Some(ref tel) = record.telepon {
                    if let Some(cleaned_tel) = clean_phone(tel) {
                        if let Ok(action) = upsert_contact_phone(&txn, individual.id, &cleaned_tel, cache.default_phone_type_id).await {
                            match action {
                                UpsertAction::Inserted => phones_inserted += 1,
                                UpsertAction::Updated => phones_updated += 1,
                            }
                        }
                    }
                }

                // 2. Handphone
                if let Some(ref hp) = record.handphone {
                    if let Some(cleaned_hp) = clean_phone(hp) {
                        let tel_cleaned = record.telepon.as_deref().and_then(clean_phone);
                        if tel_cleaned.as_deref() != Some(&cleaned_hp) {
                            if let Ok(action) = upsert_contact_phone(&txn, individual.id, &cleaned_hp, cache.default_phone_type_id).await {
                                match action {
                                    UpsertAction::Inserted => phones_inserted += 1,
                                    UpsertAction::Updated => phones_updated += 1,
                                }
                            }
                        }
                    }
                }

                // 3. Email
                if let Some(ref em) = record.email {
                    if let Some(cleaned_em) = clean_email(em) {
                        if let Ok(action) = upsert_contact_email(&txn, individual.id, &cleaned_em, cache.default_email_type_id).await {
                            match action {
                                UpsertAction::Inserted => emails_inserted += 1,
                                UpsertAction::Updated => emails_updated += 1,
                            }
                        }
                    }
                }

                // 4. Residence
                let street = record.jalan.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty()).unwrap_or("-");
                let rt = record.rt.unwrap_or(0);
                let rw = record.rw.unwrap_or(0);

                if let Ok(action) = upsert_contact_residence(
                    &txn,
                    individual.id,
                    street,
                    rt,
                    rw,
                    record.id_wilayah.as_deref(),
                    &cache,
                ).await {
                    match action {
                        UpsertAction::Inserted => residences_inserted += 1,
                        UpsertAction::Updated => residences_updated += 1,
                    }
                }

                txn.commit().await?;

                if let Some(ref pb) = pb {
                    let total_phones = phones_inserted + phones_updated;
                    let total_emails = emails_inserted + emails_updated;
                    let total_residences = residences_inserted + residences_updated;
                    pb.set_message(format!(
                        "phones: {total_phones} | emails: {total_emails} | residences: {total_residences} | skipped: {skipped}"
                    ));
                    pb.inc(1);
                }
            }

            offset += limit;
        }

        let total_phones = phones_inserted + phones_updated;
        let total_emails = emails_inserted + emails_updated;
        let total_residences = residences_inserted + residences_updated;
        let summary = format!(
            "Sync completed - phones: {total_phones} (ins: {phones_inserted}, upd: {phones_updated}) | emails: {total_emails} (ins: {emails_inserted}, upd: {emails_updated}) | residences: {total_residences} (ins: {residences_inserted}, upd: {residences_updated}) | skipped: {skipped}"
        );

        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }

        Ok(())
    }
}
