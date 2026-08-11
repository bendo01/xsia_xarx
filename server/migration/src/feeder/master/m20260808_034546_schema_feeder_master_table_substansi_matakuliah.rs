use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_substansi_matakuliah"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS feeder_master")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("feeder_master"), Alias::new("substansi_matakuliah")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_substansi").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_program_studi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_substansi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sks_mata_kuliah").float(),
                    )
                    .col(
                        ColumnDef::new("sks_tatap_muka").float(),
                    )
                    .col(
                        ColumnDef::new("sks_praktek").float(),
                    )
                    .col(
                        ColumnDef::new("sks_praktek_lapangan").float(),
                    )
                    .col(
                        ColumnDef::new("sks_simulasi").float(),
                    )
                    .col(
                        ColumnDef::new("id_jenis_substansi").uuid(),
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
                            .name("feeder_master_substansi_matakuliah_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("substansi_matakuliah")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
