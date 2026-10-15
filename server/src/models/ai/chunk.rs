use sea_orm::entity::prelude::*;

/// A piece of a source document, embedded for semantic search
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "ai", table_name = "chunks")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// Polymorphic owner of the chunk: the source entity type and its id
    pub chunkable_type: Option<String>,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub chunkable_id: Uuid,
    pub content: String,
    pub heading_context: Option<String>,
    pub title_hierarchy: Option<String>,
    pub markdown_content: Option<String>,
    pub metadata: Option<Json>,
    /// `vector(384)` embedding of `content`
    #[sea_orm(column_type = "Vector(Some(384))", nullable)]
    pub embedding: Option<PgVector>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
