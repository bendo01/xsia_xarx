use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034545_schema_feeder_master_table_dosen_pengajar_kelas_kuliah"
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
                    .table((Alias::new("feeder_master"), Alias::new("dosen_pengajar_kelas_kuliah")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_aktivitas_mengajar").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_registrasi_dosen").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_dosen").uuid(),
                    )
                    .col(
                        ColumnDef::new("nidn").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nuptk").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_dosen").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_kelas_kuliah").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_kelas_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_substansi").uuid(),
                    )
                    .col(
                        ColumnDef::new("sks_substansi_total").float(),
                    )
                    .col(
                        ColumnDef::new("rencana_minggu_pertemuan").integer(),
                    )
                    .col(
                        ColumnDef::new("realisasi_minggu_pertemuan").integer(),
                    )
                    .col(
                        ColumnDef::new("id_jenis_evaluasi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_jenis_evaluasi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_semester").string_len(255),
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
                            .name("pfeeder_master_dosen_pengajar_kelas_kuliah_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("dosen_pengajar_kelas_kuliah")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
