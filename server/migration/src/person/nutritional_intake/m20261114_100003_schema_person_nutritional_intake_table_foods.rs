use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261114_100003_schema_person_nutritional_intake_table_foods"
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
                    .table((Alias::new("person_nutritional_intake"), Alias::new("foods")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("food_group_id")
                            .uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("source_id")
                            .uuid(),
                    )
                    .col(
                        ColumnDef::new("code")
                            .string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("name")
                            .string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("kind")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("edible_portion")
                            .decimal_len(14, 4),
                    )
                    .col(
                        ColumnDef::new("species")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("genus")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("family")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("english_name")
                            .string_len(255),
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
                            .name("ni_foods_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("ni_foods_food_group_id_idx")
                    .table((Alias::new("person_nutritional_intake"), Alias::new("foods")))
                    .col(Alias::new("food_group_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("ni_foods_source_id_idx")
                    .table((Alias::new("person_nutritional_intake"), Alias::new("foods")))
                    .col(Alias::new("source_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("ni_foods_code_uniq")
                    .table((Alias::new("person_nutritional_intake"), Alias::new("foods")))
                    .col(Alias::new("code"))
                    .unique()
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
                    .table((Alias::new("person_nutritional_intake"), Alias::new("foods")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
