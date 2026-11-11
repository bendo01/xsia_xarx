use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(
    schema_name = "academic_campaign_transaction",
    table_name = "teach_attendances"
)]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub teach_meeting_id: Uuid,
    pub student_id: Uuid,
    pub attend_type_id: Uuid,
    pub method: String,
    pub marked_at: Option<DateTime>,
    pub marked_by: Option<Uuid>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "teach_meeting_id", to = "id")]
    pub teach_meeting: BelongsTo<crate::models::academic::campaign::transaction::teach_meetings::Entity>,
    #[sea_orm(belongs_to, from = "student_id", to = "id")]
    pub student: BelongsTo<crate::models::academic::student::master::students::Entity>,
    #[sea_orm(belongs_to, from = "attend_type_id", to = "id")]
    pub attend_type: BelongsTo<crate::models::academic::campaign::reference::attend_types::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
