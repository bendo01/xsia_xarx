use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034545_schema_feeder_master_table_kelas_kuliah"
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
                    .table((Alias::new("feeder_master"), Alias::new("kelas_kuliah")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().default(Expr::cust("public.uuid_generate_v7()")),
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
                        ColumnDef::new("id_kelas_kuliah").uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_program_studi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_semester").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_semester").string_len(255),
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
                        ColumnDef::new("nama_kelas_kuliah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sks_mk").float(),
                    )
                    .col(
                        ColumnDef::new("sks_tm").float(),
                    )
                    .col(
                        ColumnDef::new("sks_prak").float(),
                    )
                    .col(
                        ColumnDef::new("sks_prak_lap").float(),
                    )
                    .col(
                        ColumnDef::new("sks_sim").float(),
                    )
                    .col(
                        ColumnDef::new("bahasan").text(),
                    )
                    .col(
                        ColumnDef::new("tanggal_mulai_efektif").date(),
                    )
                    .col(
                        ColumnDef::new("tanggal_akhir_efektif").date(),
                    )
                    .col(
                        ColumnDef::new("kapasitas").integer(),
                    )
                    .col(
                        ColumnDef::new("tanggal_tutup_daftar").date(),
                    )
                    .col(
                        ColumnDef::new("prodi_penyelenggara").string_len(255),
                    )
                    .col(
                        ColumnDef::new("perguruan_tinggi_penyelenggara").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sks").float(),
                    )
                    .col(
                        ColumnDef::new("id_dosen").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_dosen").text(),
                    )
                    .col(
                        ColumnDef::new("jumlah_mahasiswa").integer(),
                    )
                    .col(
                        ColumnDef::new("apa_untuk_pditt").boolean(),
                    )
                    .primary_key(
                        Index::create()
                            .name("feeder_master_kelas_kuliah_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("kelas_kuliah")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
