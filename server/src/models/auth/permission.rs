use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "auth", table_name = "permissions")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub name: String,
    pub uri: Option<String>,
    #[sea_orm(default_value = false)]
    pub is_open: bool,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(has_many, via = "permission_role")]
    pub roles: HasMany<super::role::Entity>,
    #[sea_orm(has_many)]
    pub permission_role: HasMany<crate::models::auth::permission_role::Entity>,
}


impl ActiveModelBehavior for ActiveModel {}
