use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_riwayat_pangkat_dosen"
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
                    .table((Alias::new("feeder_master"), Alias::new("riwayat_pangkat_dosen")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_dosen").uuid(),
                    )
                    .col(
                        ColumnDef::new("nidn").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_dosen").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_pangkat_golongan").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_pangkat_golongan").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sk_pangkat").string_len(255),
                    )
                    .col(
                        ColumnDef::new("tanggal_sk_pangkat").date(),
                    )
                    .col(
                        ColumnDef::new("mulai_sk_pangkat").date(),
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
                    .col(
                        ColumnDef::new("nuptk").string_len(255),
                    )
                    .col(
                        ColumnDef::new("masa_kerja_dalam_tahun").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("masa_kerja_dalam_bulan").integer().default(0),
                    )
                    .primary_key(
                        Index::create()
                            .name("feeder_master_riwayat_pangkat_dosen_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("riwayat_pangkat_dosen")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
