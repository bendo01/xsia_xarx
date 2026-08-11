use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_034545_schema_feeder_master_table_kurikulum"
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
                    .table((Alias::new("feeder_master"), Alias::new("kurikulum")))
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
                        ColumnDef::new("id_kurikulum").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_kurikulum").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_prodi").uuid(),
                    )
                    .col(
                        ColumnDef::new("nama_program_studi").string_len(255),
                    )
                    .col(
                        ColumnDef::new("id_jenj_didik").integer(),
                    )
                    .col(
                        ColumnDef::new("jml_sem_normal").integer(),
                    )
                    .col(
                        ColumnDef::new("id_semester").string_len(255),
                    )
                    .col(
                        ColumnDef::new("semester_mulai_berlaku").string_len(50),
                    )
                    .col(
                        ColumnDef::new("jumlah_sks_lulus").float(),
                    )
                    .col(
                        ColumnDef::new("jumlah_sks_wajib").float(),
                    )
                    .col(
                        ColumnDef::new("jumlah_sks_pilihan").float(),
                    )
                    .col(
                        ColumnDef::new("jumlah_sks_mata_kuliah_wajib").float(),
                    )
                    .col(
                        ColumnDef::new("jumlah_sks_mata_kuliah_pilihan").float(),
                    )
                    .col(
                        ColumnDef::new("status_sync").string_len(255),
                    )
                    .primary_key(
                        Index::create()
                            .name("feeder_master_kurikulum_pkey")
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
                    .table((Alias::new("feeder_master"), Alias::new("kurikulum")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
