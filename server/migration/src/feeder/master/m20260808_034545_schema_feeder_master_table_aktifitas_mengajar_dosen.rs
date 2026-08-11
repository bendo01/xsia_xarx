use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034545_schema_feeder_master_table_aktifitas_mengajar_dosen"
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
                    .table((Alias::new("feeder_master"), Alias::new("aktifitas_mengajar_dosen")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_registrasi_dosen").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_dosen").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_dosen").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_periode").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_periode").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_program_studi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_matkul").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_mata_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_kelas").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_kelas_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("rencana_minggu_pertemuan").integer(),
                    )
                    .col(
                        ColumnDef::new("realisasi_minggu_pertemuan").integer(),
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
                            .name("feeder_master_aktifitas_mengajar_dosen_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("aktifitas_mengajar_dosen")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
