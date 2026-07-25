use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "auth", table_name = "users")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub pid: Uuid,
    #[sea_orm(unique)]
    pub email: String,
    pub password: String,
    #[sea_orm(unique)]
    pub api_key: String,
    pub name: String,
    // pub remember_token: String,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub individual_id: Uuid,
    #[sea_orm(default_value = false)]
    pub is_active: bool,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub current_role_id: Uuid,
    pub reset_token: Option<String>,
    pub reset_sent_at: Option<DateTime>,
    pub email_verification_token: Option<String>,
    pub email_verification_sent_at: Option<DateTime>,
    pub email_verified_at: Option<DateTime>,
    pub magic_link_token: Option<String>,
    pub magic_link_expiration: Option<DateTime>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(has_many, via = "permission_user")]
    pub permissions: HasMany<super::permissions::Entity>,
    #[sea_orm(has_many, via = "user_position_type")]
    pub position_types: HasMany<super::user_position_type::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
