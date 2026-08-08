use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_nilai_perkuliahan_kelas"
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
                    .table((Alias::new("feeder_master"), Alias::new("nilai_perkuliahan_kelas")))
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
                        ColumnDef::new("id_matkul").uuid(),
                    )
                    .col(
                        ColumnDef::new("kode_mata_kuliah").text(),
                    )
                    .col(
                        ColumnDef::new("nama_mata_kuliah").text(),
                    )
                    .col(
                        ColumnDef::new("id_kelas_kuliah").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_kelas_kuliah").text(),
                    )
                    .col(
                        ColumnDef::new("sks_mata_kuliah").float().default(0),
                    )
                    .col(
                        ColumnDef::new("jumlah_mahasiswa_krs").integer(),
                    )
                    .col(
                        ColumnDef::new("jumlah_mahasiswa_dapat_nilai").integer(),
                    )
                    .col(
                        ColumnDef::new("sks_tm").float().default(0),
                    )
                    .col(
                        ColumnDef::new("sks_prak").float().default(0),
                    )
                    .col(
                        ColumnDef::new("sks_prak_lap").float().default(0),
                    )
                    .col(
                        ColumnDef::new("sks_sim").float().default(0),
                    )
                    .col(
                        ColumnDef::new("bahasan_case").text(),
                    )
                    .col(
                        ColumnDef::new("a_selenggara_pditt").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("a_pengguna_pditt").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("kuota_pditt").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("tgl_mulai_koas").date(),
                    )
                    .col(
                        ColumnDef::new("tgl_selesai_koas").date(),
                    )
                    .col(
                        ColumnDef::new("id_mou").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_kls_pditt").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_sms").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_smt").text(),
                    )
                    .col(
                        ColumnDef::new("tgl_create").date(),
                    )
                    .col(
                        ColumnDef::new("lingkup_kelas").integer(),
                    )
                    .col(
                        ColumnDef::new("mode_kuliah").text(),
                    )
                    .col(
                        ColumnDef::new("nm_smt").text(),
                    )
                    .col(
                        ColumnDef::new("nama_prodi").text(),
                    )
                    .col(
                        ColumnDef::new("status_sync").text(),
                    )
                    .primary_key(
                        Index::create()
                            .name("feeder_master_nilai_perkuliahan_kelas_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("nilai_perkuliahan_kelas")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
