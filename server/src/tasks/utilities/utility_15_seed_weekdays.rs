//! `utility:seed-weekdays`: makes sure `general_reference.weekdays` holds the seven days.
//!
//! The migration `m20261122_100000_schema_general_reference_table_weekdays` already seeds them; this
//! task re-applies the same rows to a database that has drifted (a restore, a hand edit, a soft-deleted
//! day) without touching anything else. It is idempotent: run it as often as you like.
//!
//! The ids are UUIDv5 of the English day name under a fixed namespace and must never change, because
//! `academic_campaign_transaction.schedules.weekday_id` stores them.

use chrono::Utc;
use salvo::async_trait;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, IntoActiveModel, Set};
use uuid::Uuid;

use crate::models::general::reference::weekdays;
use crate::tasks::Task;

pub struct SeedWeekdaysTask;

pub const WEEKDAY_NAMESPACE: Uuid = Uuid::from_u128(0x7f1c2a5e_4b3d_4e8a_9c61_2d7b0a9e5f10);

/// (English name the id derives from, ISO weekday number, short code, Indonesian name), Monday first.
pub const WEEKDAYS: [(&str, i32, &str, &str); 7] = [
    ("monday", 1, "SEN", "Senin"),
    ("tuesday", 2, "SEL", "Selasa"),
    ("wednesday", 3, "RAB", "Rabu"),
    ("thursday", 4, "KAM", "Kamis"),
    ("friday", 5, "JUM", "Jumat"),
    ("saturday", 6, "SAB", "Sabtu"),
    ("sunday", 7, "MIN", "Minggu"),
];

/// The stable id of a weekday, derived from its English name.
pub fn weekday_id(english: &str) -> Uuid {
    Uuid::new_v5(&WEEKDAY_NAMESPACE, english.as_bytes())
}

/// The seven ids in order (used by the schedule repair task to tell valid weekday ids from stray ones).
pub fn weekday_ids() -> Vec<Uuid> {
    WEEKDAYS.iter().map(|d| weekday_id(d.0)).collect()
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct SeedReport {
    pub inserted: usize,
    pub updated: usize,
    pub restored: usize,
    pub unchanged: usize,
}

/// Upsert the seven days by id.
pub async fn seed(db: &DatabaseConnection) -> Result<SeedReport, Box<dyn std::error::Error>> {
    let mut report = SeedReport::default();
    let now = Utc::now().naive_utc();
    for (english, code, alphabet, name) in WEEKDAYS {
        let id = weekday_id(english);
        match weekdays::Entity::find_by_id(id).one(db).await? {
            None => {
                weekdays::ActiveModel {
                    id: Set(id),
                    code: Set(code),
                    alphabet_code: Set(alphabet.to_string()),
                    name: Set(name.to_string()),
                    created_at: Set(Some(now)),
                    updated_at: Set(Some(now)),
                    deleted_at: Set(None),
                    sync_at: Set(None),
                    created_by: Set(None),
                    updated_by: Set(None),
                }
                .insert(db)
                .await?;
                report.inserted += 1;
            }
            Some(row) => {
                let deleted = row.deleted_at.is_some();
                let same = row.code == code && row.alphabet_code == alphabet && row.name == name;
                if same && !deleted {
                    report.unchanged += 1;
                    continue;
                }
                let mut active = row.into_active_model();
                active.code = Set(code);
                active.alphabet_code = Set(alphabet.to_string());
                active.name = Set(name.to_string());
                active.deleted_at = Set(None);
                active.updated_at = Set(Some(now));
                active.update(db).await?;
                if deleted {
                    report.restored += 1;
                } else {
                    report.updated += 1;
                }
            }
        }
    }
    Ok(report)
}

#[async_trait]
impl Task for SeedWeekdaysTask {
    fn name(&self) -> &str {
        "utility:seed-weekdays"
    }

    fn description(&self) -> &str {
        "Makes sure general_reference.weekdays holds the seven days (Senin..Minggu) with their fixed ids; idempotent"
    }

    async fn run(&self, db: &DatabaseConnection, _args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let r = seed(db).await?;
        println!(
            "weekdays: {} inserted, {} updated, {} restored, {} unchanged",
            r.inserted, r.updated, r.restored, r.unchanged
        );
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seven_days_monday_first() {
        assert_eq!(WEEKDAYS.len(), 7);
        assert_eq!(WEEKDAYS.iter().map(|d| d.1).collect::<Vec<_>>(), vec![1, 2, 3, 4, 5, 6, 7]);
        assert_eq!(WEEKDAYS[0].3, "Senin");
        assert_eq!(WEEKDAYS[6].3, "Minggu");
        assert!(WEEKDAYS.iter().all(|d| d.2.len() <= 10)); // the API limits alphabet_code to 10
    }

    #[test]
    fn ids_never_change() {
        // Saved schedules store these ids, and the migration seeds the same literals.
        let ids: Vec<String> = weekday_ids().iter().map(|i| i.to_string()).collect();
        assert_eq!(
            ids,
            vec![
                "8c1dfa7b-c9f8-5c7e-87de-88cd63f6289a",
                "abdc4f7a-862b-558f-889f-050bdfb49c32",
                "9bf5c09c-0e68-59f0-8807-6c82f096944a",
                "8088943f-0b7d-59d7-8347-5e85e1df553d",
                "49751cfa-1688-5de1-9082-a4fbfe63a07b",
                "d34e56a4-f305-59e2-842a-ed5bf938b969",
                "69a44e48-11ec-511c-a9c9-1c536479cbe4",
            ]
        );
    }
}
