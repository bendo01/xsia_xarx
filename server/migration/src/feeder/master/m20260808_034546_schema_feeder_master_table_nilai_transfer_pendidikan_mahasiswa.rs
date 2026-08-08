use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_nilai_transfer_pendidikan_mahasiswa"
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
                    .table((Alias::new("feeder_master"), Alias::new("nilai_transfer_pendidikan_mahasiswa")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_transfer").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_registrasi_mahasiswa").uuid(),
                    )
                    .col(
                        ColumnDef::new("nim").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_mahasiswa").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_program_studi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_periode_masuk").string_len(255),
                    )
                    .col(
                        ColumnDef::new("kode_mata_kuliah_asal").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_mata_kuliah_asal").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sks_mata_kuliah_asal").float(),
                    )
                    .col(
                        ColumnDef::new("nilai_huruf_asal").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_matkul").uuid(),
                    )
                    .col(
                        ColumnDef::new("kode_matkul_diakui").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_mata_kuliah_diakui").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sks_mata_kuliah_diakui").float(),
                    )
                    .col(
                        ColumnDef::new("nilai_huruf_diakui").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nilai_angka_diakui").float(),
                    )
                    .col(
                        ColumnDef::new("id_perguruan_tinggi").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_aktivitas").string_len(255),
                    )
                    .col(
                        ColumnDef::new("judul").text(),
                    )
                    .col(
                        ColumnDef::new("id_jenis_aktivitas").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_jenis_aktivitas").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_semester").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_semester").string_len(255),
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
                            .name("feeder_master_nilai_transfer_pendidikan_mahasiswa_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("nilai_transfer_pendidikan_mahasiswa")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
