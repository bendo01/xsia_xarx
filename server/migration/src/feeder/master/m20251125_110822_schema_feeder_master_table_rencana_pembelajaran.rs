use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::ConnectionTrait;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared(
            "
            CREATE TABLE IF NOT EXISTS feeder_master.rencana_pembelajaran
            (
                id uuid DEFAULT uuid_generate_v7(),
                id_rencana_ajar uuid,
                id_matkul uuid,
                nama_mata_kuliah varchar,
                kode_mata_kuliah varchar,
                sks_mata_kuliah real,
                id_prodi uuid,
                nama_program_studi varchar,
                pertemuan integer,
                materi_indonesia text,
                materi_inggris text,
                status_sync varchar,
                created_at timestamp(0) without time zone DEFAULT now(),
                updated_at timestamp(0) without time zone DEFAULT now(),
                deleted_at timestamp(0) without time zone,
                sync_at timestamp(0) without time zone,
                created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                CONSTRAINT feeder_master_rencana_pembelajaran_pkey PRIMARY KEY (id)
            )
            ",
        )
        .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS feeder_master.rencana_pembelajaran")
            .await?;

        Ok(())
    }
}
