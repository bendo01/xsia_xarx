use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "auth", table_name = "permission_role")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub role_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub permission_id: Uuid,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "role_id", to = "id")]
    pub role: BelongsTo<super::role::Entity>,
    #[sea_orm(belongs_to, from = "permission_id", to = "id")]
    pub permission: BelongsTo<super::permission::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
