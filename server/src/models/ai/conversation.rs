use sea_orm::entity::prelude::*;

/// A chat session between a user and the assistant
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "ai", table_name = "conversations")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub title: Option<String>,
    pub user_id: Option<Uuid>,
    /// When the conversation was pinned, `None` if not pinned
    pub is_pinned: Option<DateTime>,
    /// Maximum tokens generated per answer
    pub max_new_tokens: Option<i32>,
    /// Language model id (`qwen` or `gemma`)
    pub model: Option<String>,
    /// Whether retrieved candidates are reranked
    pub rerank: Option<bool>,
    pub temperature: Option<f64>,
    /// Chunks put in the prompt
    pub top_k: Option<i32>,
    /// Retrieval strategy: `hybrid` or `dense`
    pub search_mode: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "user_id", to = "id")]
    pub user: HasOne<crate::models::auth::user::Entity>,
    #[sea_orm(has_many)]
    pub messages: HasMany<crate::models::ai::message::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
