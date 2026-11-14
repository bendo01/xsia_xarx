use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261114_100009_schema_person_nutritional_intake_table_intake_logs"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS person_nutritional_intake")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("person_nutritional_intake"), Alias::new("intake_logs")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("individual_id")
                            .uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("eaten_at")
                            .date_time().not_null(),
                    )
                    .col(
                        ColumnDef::new("meal_type")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("description")
                            .text().not_null(),
                    )
                    .col(
                        ColumnDef::new("status")
                            .string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("llm_model")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("llm_raw_response")
                            .json_binary(),
                    )
                    .col(
                        ColumnDef::new("totals")
                            .json_binary(),
                    )
                    .col(
                        ColumnDef::new("error_message")
                            .text(),
                    )
                    .col(
                        ColumnDef::new("calculated_at")
                            .date_time(),
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
                    .col(ColumnDef::new("deleted_at").date_time())
                    .col(ColumnDef::new("sync_at").date_time())
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
                            .name("ni_intake_logs_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("ni_intake_logs_individual_id_idx")
                    .table((Alias::new("person_nutritional_intake"), Alias::new("intake_logs")))
                    .col(Alias::new("individual_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("ni_intake_logs_eaten_at_idx")
                    .table((Alias::new("person_nutritional_intake"), Alias::new("intake_logs")))
                    .col(Alias::new("eaten_at"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("person_nutritional_intake"), Alias::new("intake_logs")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
