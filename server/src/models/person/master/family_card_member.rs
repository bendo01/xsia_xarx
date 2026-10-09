use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_master", table_name = "family_card_members")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub family_card_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub individual_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub relative_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub relative_type_id: Uuid,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "family_card_id", to = "id")]
    pub family_card: BelongsTo<super::family_card::Entity>,
    #[sea_orm(belongs_to, from = "individual_id", to = "id")]
    pub individual: BelongsTo<super::individual::Entity>,
    #[sea_orm(belongs_to, relation_enum = "Relative", from = "relative_id", to = "id")]
    pub relative: BelongsTo<super::individual::Entity>,
    #[sea_orm(belongs_to, from = "relative_type_id", to = "id")]
    pub relative_type: BelongsTo<crate::models::person::reference::relative_type::Entity>,
}


impl ActiveModelBehavior for ActiveModel {}
