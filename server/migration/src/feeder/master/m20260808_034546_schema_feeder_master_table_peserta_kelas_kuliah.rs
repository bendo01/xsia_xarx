use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_peserta_kelas_kuliah"
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
                    .table((Alias::new("feeder_master"), Alias::new("peserta_kelas_kuliah")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_kelas_kuliah").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_kelas_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_registrasi_mahasiswa").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_mahasiswa").uuid(),
                    )
                    .col(
                        ColumnDef::new("nim").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_mahasiswa").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_matkul").uuid(),
                    )
                    .col(
                        ColumnDef::new("kode_mata_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_mata_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_program_studi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("angkatan").string_len(255),
                    )
                    .col(
                        ColumnDef::new("status_sync").string_len(255),
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
                            .name("feeder_master_peserta_kelas_kuliah_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("peserta_kelas_kuliah")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
