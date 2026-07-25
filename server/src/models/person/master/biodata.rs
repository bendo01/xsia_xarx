use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_master", table_name = "biodatas")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(default_value = 0.0)]
    pub height: f64,
    #[sea_orm(default_value = 0.0)]
    pub weight: f64,
    #[sea_orm(default_value = false)]
    pub is_positive_blood_rhesus: bool,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub blood_type_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub hair_type_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub hair_color_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub eye_color_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub individual_id: Uuid,
    #[sea_orm(default_value = 0.0)]
    pub bust: f64,
    #[sea_orm(default_value = 0.0)]
    pub waist: f64,
    #[sea_orm(default_value = 0.0)]
    pub hip: f64,
    #[sea_orm(default_value = 0.0)]
    pub arm_circumference: f64,
    #[sea_orm(default_value = 0)]
    pub menarche_age: i32,
    #[sea_orm(default_value = 0)]
    pub menopause_age: i32,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "individual_id", to = "id")]
    pub individual: BelongsTo<crate::models::person::master::individual::Entity>,
    #[sea_orm(belongs_to, from = "blood_type_id", to = "id")]
    pub blood_type: BelongsTo<crate::models::person::reference::blood_type::Entity>,
    #[sea_orm(belongs_to, from = "hair_type_id", to = "id")]
    pub hair_type: BelongsTo<crate::models::person::reference::hair_type::Entity>,
    #[sea_orm(belongs_to, from = "hair_color_id", to = "id")]
    pub hair_color: BelongsTo<crate::models::person::reference::hair_color::Entity>,
    #[sea_orm(belongs_to, from = "eye_color_id", to = "id")]
    pub eye_color: BelongsTo<crate::models::person::reference::eye_color::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
