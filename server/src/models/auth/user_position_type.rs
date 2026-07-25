use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "auth", table_name = "user_position_type")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub user_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub position_type_id: Uuid,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "user_id", to = "id")]
    pub user: BelongsTo<super::users::Entity>,
    #[sea_orm(belongs_to, from = "position_type_id", to = "id")]
    pub position_type: BelongsTo<crate::models::institution::reference::position_type::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
