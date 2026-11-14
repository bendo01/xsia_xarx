use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261114_100008_schema_person_nutritional_intake_table_corrections"
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
                    .table((Alias::new("person_nutritional_intake"), Alias::new("corrections")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("food_id")
                            .uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("nutrient_id")
                            .uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("original_value")
                            .decimal_len(14, 4),
                    )
                    .col(
                        ColumnDef::new("corrected_value")
                            .decimal_len(14, 4),
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
                            .name("ni_corrections_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("ni_corrections_food_id_idx")
                    .table((Alias::new("person_nutritional_intake"), Alias::new("corrections")))
                    .col(Alias::new("food_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("ni_corrections_nutrient_id_idx")
                    .table((Alias::new("person_nutritional_intake"), Alias::new("corrections")))
                    .col(Alias::new("nutrient_id"))
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
                    .table((Alias::new("person_nutritional_intake"), Alias::new("corrections")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
