use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "auth", table_name = "roles")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub name: String,
    pub user_id: Option<Uuid>,
    pub position_type_id: Option<Uuid>,
    pub archiveable_id: Option<Uuid>,
    pub archiveable_type: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
