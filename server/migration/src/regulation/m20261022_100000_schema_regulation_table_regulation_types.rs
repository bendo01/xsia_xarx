use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261022_100000_schema_regulation_table_regulation_types"
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
                CREATE TABLE IF NOT EXISTS regulation.regulation_types (
    id uuid NOT NULL DEFAULT public.uuid_generate_v7() PRIMARY KEY,
    code varchar(32) NOT NULL UNIQUE,
    name varchar(255) NOT NULL,
    level smallint NOT NULL,
    rank_order smallint NOT NULL DEFAULT 0,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    deleted_at timestamp,
    sync_at timestamp,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);

                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS regulation.regulation_types")
            .await?;
        Ok(())
    }
}
