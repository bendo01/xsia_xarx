use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261022_100400_schema_regulation_table_regulation_nodes"
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
                CREATE TABLE IF NOT EXISTS regulation.regulation_nodes (
    id uuid NOT NULL DEFAULT public.uuid_generate_v7() PRIMARY KEY,
    regulation_id uuid NOT NULL REFERENCES regulation.regulations(id),
    parent_id uuid REFERENCES regulation.regulation_nodes(id),
    node_type varchar(16) NOT NULL
        CHECK (node_type IN ('bab','bagian','paragraf','pasal','ayat','huruf','angka','lampiran')),
    number varchar(32),
    heading text,
    path text NOT NULL,
    seq integer NOT NULL DEFAULT 0,
    body text,
    is_revoked boolean NOT NULL DEFAULT false,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    deleted_at timestamp,
    sync_at timestamp,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);
CREATE INDEX IF NOT EXISTS idx_regulation_nodes_tree ON regulation.regulation_nodes (regulation_id, parent_id, seq);
                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS regulation.regulation_nodes")
            .await?;
        Ok(())
    }
}
