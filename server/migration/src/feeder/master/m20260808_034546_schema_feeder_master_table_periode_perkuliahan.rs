use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_periode_perkuliahan"
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
                    .table((Alias::new("feeder_master"), Alias::new("periode_perkuliahan")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
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
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_program_studi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_semester").string_len(10),
                    )
                    .col(
                        ColumnDef::new("nama_semester").string_len(50),
                    )
                    .col(
                        ColumnDef::new("jumlah_target_mahasiswa_baru").integer(),
                    )
                    .col(
                        ColumnDef::new("jumlah_pendaftar_ikut_seleksi").integer(),
                    )
                    .col(
                        ColumnDef::new("jumlah_pendaftar_lulus_seleksi").integer(),
                    )
                    .col(
                        ColumnDef::new("jumlah_daftar_ulang").integer(),
                    )
                    .col(
                        ColumnDef::new("jumlah_mengundurkan_diri").integer(),
                    )
                    .col(
                        ColumnDef::new("tanggal_awal_perkuliahan").date(),
                    )
                    .col(
                        ColumnDef::new("tanggal_akhir_perkuliahan").date(),
                    )
                    .col(
                        ColumnDef::new("jumlah_minggu_pertemuan").integer(),
                    )
                    .col(
                        ColumnDef::new("metode_kul").string_len(100),
                    )
                    .col(
                        ColumnDef::new("metode_kul_eks").string_len(100),
                    )
                    .col(
                        ColumnDef::new("tgl_create").date(),
                    )
                    .col(
                        ColumnDef::new("last_update").date(),
                    )
                    .col(
                        ColumnDef::new("status_sync").string_len(50),
                    )
                    .primary_key(
                        Index::create()
                            .name("feeder_master_periode_perkuliahan_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("periode_perkuliahan")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
