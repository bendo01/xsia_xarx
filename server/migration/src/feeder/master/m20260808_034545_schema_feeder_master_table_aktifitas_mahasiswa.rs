use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034545_schema_feeder_master_table_aktifitas_mahasiswa"
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
                    .table((Alias::new("feeder_master"), Alias::new("aktifitas_mahasiswa")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("asal_data").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nm_asaldata").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_aktivitas").uuid(),
                    )
                    .col(
                        ColumnDef::new("jenis_anggota").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_jenis_anggota").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_jenis_aktivitas").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_jenis_aktivitas").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_prodi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_semester").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_semester").string_len(255),
                    )
                    .col(
                        ColumnDef::new("judul").string_len(255),
                    )
                    .col(
                        ColumnDef::new("keterangan").string_len(255),
                    )
                    .col(
                        ColumnDef::new("lokasi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sk_tugas").string_len(255),
                    )
                    .col(
                        ColumnDef::new("tanggal_sk_tugas").date(),
                    )
                    .col(
                        ColumnDef::new("untuk_kampus_merdeka").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("tanggal_mulai").date(),
                    )
                    .col(
                        ColumnDef::new("tanggal_selesai").date(),
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
                            .name("feeder_master_aktifitas_mahasiswa_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("aktifitas_mahasiswa")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
