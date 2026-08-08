use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034545_schema_feeder_master_table_komponen_evaluasi_kelas"
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
                    .table((Alias::new("feeder_master"), Alias::new("komponen_evaluasi_kelas")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("id_komponen_evaluasi").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_kelas_kuliah").uuid(),
                    )
                    .col(
                        ColumnDef::new("id_jenis_evaluasi").integer(),
                    )
                    .col(
                        ColumnDef::new("nama").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nama_inggris").string_len(255),
                    )
                    .col(
                        ColumnDef::new("nomor_urut").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("bobot_evaluasi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("last_update").date(),
                    )
                    .col(
                        ColumnDef::new("tgl_create").date(),
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
                            .name("feeder_master_komponen_evaluasi_kelas_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("komponen_evaluasi_kelas")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
