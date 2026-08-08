use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034546_schema_feeder_master_table_profil_perguruan_tinggi"
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
                    .table((Alias::new("feeder_master"), Alias::new("profil_perguruan_tinggi")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_perguruan_tinggi").uuid(),
                    )
                    .col(
                        ColumnDef::new("kode_perguruan_tinggi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_perguruan_tinggi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("telepon").string_len(255),
                    )
                    .col(
                        ColumnDef::new("faximile").string_len(255),
                    )
                    .col(
                        ColumnDef::new("email").string_len(255),
                    )
                    .col(
                        ColumnDef::new("website").string_len(255),
                    )
                    .col(
                        ColumnDef::new("jalan").string_len(255),
                    )
                    .col(
                        ColumnDef::new("dusun").string_len(255),
                    )
                    .col(
                        ColumnDef::new("kelurahan").string_len(255),
                    )
                    .col(
                        ColumnDef::new("kode_pos").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_wilayah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_wilayah").string_len(255),
                    )
                    .col(
                        ColumnDef::new("lintang_bujur").string_len(255),
                    )
                    .col(
                        ColumnDef::new("bank").string_len(255),
                    )
                    .col(
                        ColumnDef::new("unit_cabang").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nomor_rekening").string_len(255),
                    )
                    .col(
                        ColumnDef::new("mbs").string_len(255),
                    )
                    .col(
                        ColumnDef::new("luas_tanah_milik").string_len(255),
                    )
                    .col(
                        ColumnDef::new("luas_tanah_bukan_milik").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sk_pendirian").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_status_milik").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_status_milik").string_len(255),
                    )
                    .col(
                        ColumnDef::new("status_perguruan_tinggi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("sk_izin_operasional").string_len(255),
                    )
                    .col(
                        ColumnDef::new("tanggal_izin_operasional").date(),
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
                        ColumnDef::new("nama_singkat").string_len(255),
                    )
                    .col(
                        ColumnDef::new("rt_rw").string_len(255),
                    )
                    .col(
                        ColumnDef::new("tanggal_sk_pendirian").date_time(),
                    )
                    .primary_key(
                        Index::create()
                            .name("feeder_master_profil_perguruan_tinggi_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("profil_perguruan_tinggi")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
