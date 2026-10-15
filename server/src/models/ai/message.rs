use sea_orm::entity::prelude::*;

/// A single turn in a conversation
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "ai", table_name = "messages")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub conversation_id: Uuid,
    /// `user` or `assistant`
    pub role: String,
    pub content: String,
    /// Ids of the chunks cited in the answer: `[uuid1, uuid2, ...]`
    pub context_reference: Option<Json>,
    pub feedback: Option<i32>,
    pub feedback_note: Option<String>,
    pub confidence: Option<f32>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "conversation_id", to = "id")]
    pub conversation: BelongsTo<crate::models::ai::conversation::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
