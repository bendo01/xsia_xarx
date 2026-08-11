use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034545_schema_feeder_master_table_mahasiswa_bimbingan_dosen"
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
                    .table((Alias::new("feeder_master"), Alias::new("mahasiswa_bimbingan_dosen")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_aktivitas").uuid(),
                    )
                    .col(
                        ColumnDef::new("judul").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_bimbing_mahasiswa").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_kategori_kegiatan").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_kategori_kegiatan").string_len(255),
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
                        ColumnDef::new("pembimbing_ke").integer(),
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
                            .name("feeder_master_mahasiswa_bimbingan_dosen_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("mahasiswa_bimbingan_dosen")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
