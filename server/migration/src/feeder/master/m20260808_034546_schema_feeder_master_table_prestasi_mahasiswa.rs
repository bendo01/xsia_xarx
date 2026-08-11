use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_prestasi_mahasiswa"
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
                    .table((Alias::new("feeder_master"), Alias::new("prestasi_mahasiswa")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_prestasi").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_mahasiswa").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_mahasiswa").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_jenis_prestasi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_jenis_prestasi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_tingkat_prestasi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_tingkat_prestasi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_prestasi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("tahun_prestasi").integer(),
                    )
                    .col(
                        ColumnDef::new("penyelenggara").string_len(255),
                    )
                    .col(
                        ColumnDef::new("peringkat").integer(),
                    )
                    .col(
                        ColumnDef::new("id_aktivitas").uuid(),
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
                            .name("feeder_master_prestasi_mahasiswa_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("prestasi_mahasiswa")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
