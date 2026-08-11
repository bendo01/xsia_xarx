use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034547_schema_feeder_rekapitulasi_table_kartu_rencana_studi_mahasiswa"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS feeder_rekapitulasi")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("feeder_rekapitulasi"), Alias::new("kartu_rencana_studi_mahasiswa")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_registrasi_mahasiswa").uuid(),
                    )
                    .col(
                        ColumnDef::new("nim").integer(),
                    )
                    .col(
                        ColumnDef::new("nama_mahasiswa").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_matkul").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_semester").uuid(),
                    )
                    .col(
                        ColumnDef::new("kode_mata_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_mata_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sks_mata_kuliah").integer(),
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
                            .name("feeder_rekapitulasi_kartu_rencana_studi_mahasiswa_pkey")
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
                    .table((Alias::new("feeder_rekapitulasi"), Alias::new("kartu_rencana_studi_mahasiswa")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
