use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_reference", table_name = "eye_colors")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(default_value = 0)]
    pub code: i32,
    pub alphabet_code: String,
    pub name: String,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(has_many)]
    pub biodatas: HasMany<crate::models::person::master::biodata::Entity>,
    }


impl ActiveModelBehavior for ActiveModel {}
