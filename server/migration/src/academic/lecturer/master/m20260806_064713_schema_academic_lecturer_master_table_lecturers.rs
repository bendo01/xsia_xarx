use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_064713_schema_academic_lecturer_master_table_lecturers"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS academic_lecturer_master")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("academic_lecturer_master"), Alias::new("lecturers")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(
                        ColumnDef::new("code").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("name").string_len(255),
                    )
                    .col(
                        ColumnDef::new("individual_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("institution_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("alternative_code").string_len(255),
                    )
                    .col(
                        ColumnDef::new("accessor_number").string_len(255),
                    )
                    .col(
                        ColumnDef::new("identification_number").string_len(255),
                    )
                    .col(
                        ColumnDef::new("status_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("contract_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("rank_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("start_date").date(),
                    )
                    .col(
                        ColumnDef::new("end_date").date(),
                    )
                    .col(
                        ColumnDef::new("front_title").string_len(255),
                    )
                    .col(
                        ColumnDef::new("last_title").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_dosen").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_registrasi_dosen").uuid(),
                    )
                    .col(
                        ColumnDef::new("group_id").uuid(),
                    )
                    .col(
                        ColumnDef::new("nuptk").string(),
                    )
                    .col(
                        ColumnDef::new("created_at").date_time().default(Expr::cust("now()")),
                    )
                    .col(
                        ColumnDef::new("updated_at").date_time().default(Expr::cust("now()")),
                    )
                    .col(
                        ColumnDef::new("deleted_at").date_time(),
                    )
                    .col(
                        ColumnDef::new("sync_at").date_time(),
                    )
                    .col(
                        ColumnDef::new("created_by").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("updated_by").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .primary_key(
                        Index::create()
                            .name("alm_lecturers_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("academic_lecturer_master"), Alias::new("lecturers")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
