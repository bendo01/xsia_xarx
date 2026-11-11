use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(
    schema_name = "academic_campaign_transaction",
    table_name = "teach_meetings"
)]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub teach_id: Uuid,
    pub sequence: i32,
    pub meeting_type: String,
    pub topic: Option<String>,
    pub held_on: Option<Date>,
    pub qr_open_until: Option<DateTime>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "teach_id", to = "id")]
    pub teach: BelongsTo<crate::models::academic::campaign::transaction::teaches::Entity>,
    #[sea_orm(has_many)]
    pub teach_attendances: HasMany<crate::models::academic::campaign::transaction::teach_attendances::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
