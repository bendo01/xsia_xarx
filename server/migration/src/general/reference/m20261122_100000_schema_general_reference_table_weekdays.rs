use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261122_100000_schema_general_reference_table_weekdays"
    }
}

/// The seven days of the week, Monday first: (id, ISO weekday number, short code, name).
///
/// The ids are UUIDv5 of the English day name under namespace 7f1c2a5e-4b3d-4e8a-9c61-2d7b0a9e5f10 and
/// must never change: `academic_campaign_transaction.schedules.weekday_id` stores them. The same list is
/// kept by the `utility:seed-weekdays` task (src/tasks/utilities/utility_15_seed_weekdays.rs), which can
/// re-apply it to a database that already ran this migration.
const WEEKDAYS: [(&str, i32, &str, &str); 7] = [
    ("8c1dfa7b-c9f8-5c7e-87de-88cd63f6289a", 1, "SEN", "Senin"),
    ("abdc4f7a-862b-558f-889f-050bdfb49c32", 2, "SEL", "Selasa"),
    ("9bf5c09c-0e68-59f0-8807-6c82f096944a", 3, "RAB", "Rabu"),
    ("8088943f-0b7d-59d7-8347-5e85e1df553d", 4, "KAM", "Kamis"),
    ("49751cfa-1688-5de1-9082-a4fbfe63a07b", 5, "JUM", "Jumat"),
    ("d34e56a4-f305-59e2-842a-ed5bf938b969", 6, "SAB", "Sabtu"),
    ("69a44e48-11ec-511c-a9c9-1c536479cbe4", 7, "MIN", "Minggu"),
];

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS general_reference")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("general_reference"), Alias::new("weekdays")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(
                        ColumnDef::new("code")
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new("alphabet_code")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("name")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("created_at")
                            .date_time()
                            .default(Expr::cust("now()")),
                    )
                    .col(
                        ColumnDef::new("updated_at")
                            .date_time()
                            .default(Expr::cust("now()")),
                    )
                    .col(
                        ColumnDef::new("deleted_at")
                            .date_time(),
                    )
                    .col(
                        ColumnDef::new("sync_at")
                            .date_time(),
                    )
                    .col(
                        ColumnDef::new("created_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("updated_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .primary_key(
                        Index::create()
                            .name("gnrr_weekdays_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        // One live row per ISO weekday number; a soft-deleted row does not block re-creating it.
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE UNIQUE INDEX IF NOT EXISTS gnrr_weekdays_code_key \
                 ON general_reference.weekdays (code) WHERE deleted_at IS NULL",
            )
            .await?;

        // Seed data (idempotent): the seven days.
        let values = WEEKDAYS
            .iter()
            .map(|(id, code, alphabet, name)| format!("('{id}'::uuid, {code}, '{alphabet}', '{name}')"))
            .collect::<Vec<_>>()
            .join(", ");
        manager
            .get_connection()
            .execute_unprepared(&format!(
                "INSERT INTO general_reference.weekdays (id, code, alphabet_code, name) VALUES {values} \
                 ON CONFLICT (id) DO NOTHING"
            ))
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("general_reference"), Alias::new("weekdays")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::WEEKDAYS;

    #[test]
    fn seven_days_monday_first() {
        assert_eq!(WEEKDAYS.len(), 7);
        assert_eq!(WEEKDAYS.iter().map(|d| d.1).collect::<Vec<_>>(), vec![1, 2, 3, 4, 5, 6, 7]);
        assert_eq!(WEEKDAYS[0].3, "Senin");
        assert_eq!(WEEKDAYS[6].3, "Minggu");
    }

    #[test]
    fn codes_fit_the_api_limit_and_ids_are_unique() {
        let mut ids: Vec<_> = WEEKDAYS.iter().map(|d| d.0).collect();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), 7);
        assert!(WEEKDAYS.iter().all(|d| d.2.len() <= 10 && !d.2.contains('\'') && !d.3.contains('\'')));
    }
}
