use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_master", table_name = "family_cards")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(default_value = "0000000000000000")]
    pub code: Option<String>,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub individual_id: Option<Uuid>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "individual_id", to = "id")]
    pub individual: BelongsTo<Option<super::individual::Entity>>,
    #[sea_orm(has_many)]
    pub family_card_members: HasMany<super::family_card_member::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
