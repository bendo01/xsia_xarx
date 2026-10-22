use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261022_100200_schema_regulation_table_regulations"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE SCHEMA IF NOT EXISTS regulation;
                CREATE TABLE IF NOT EXISTS regulation.regulations (
    id uuid NOT NULL DEFAULT public.uuid_generate_v7() PRIMARY KEY,
    type_id uuid NOT NULL REFERENCES regulation.regulation_types(id),
    pillar_id uuid REFERENCES regulation.pillars(id),
    number varchar(32) NOT NULL,
    year smallint NOT NULL,
    title text NOT NULL,
    issuer varchar(255),
    enacted_on date,
    effective_on date,
    revoked_on date,
    status varchar(16) NOT NULL DEFAULT 'berlaku'
        CHECK (status IN ('berlaku','dicabut','diubah','verifikasi')),
    is_historical boolean NOT NULL DEFAULT false,
    audit_valid_from date,
    audit_valid_until date,
    source_file varchar(512),
    file_sha256 char(64),
    ingest_order smallint,
    verification_note text,
    CONSTRAINT uq_regulations_type_number_year UNIQUE (type_id, number, year),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    deleted_at timestamp,
    sync_at timestamp,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);
CREATE INDEX IF NOT EXISTS idx_regulations_status ON regulation.regulations (status, type_id, pillar_id);
                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS regulation.regulations")
            .await?;
        Ok(())
    }
}
