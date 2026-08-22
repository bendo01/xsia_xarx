use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_master", table_name = "individuals")]

pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub birth_date: Date,
    pub birth_place: String,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub gender_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub religion_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub occupation_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub education_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub income_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub identification_type_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub marital_status_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub profession_id: Uuid,
    #[sea_orm(default_value = "00000000-0000-0000-0000-000000000000")]
    pub age_classification_id: Uuid,
    #[sea_orm(default_value = false)]
    pub is_special_need: bool,
    #[sea_orm(default_value = false)]
    pub is_social_protection_card_recipient: bool,
    #[sea_orm(default_value = false)]
    pub is_deceased: bool,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "gender_id", to = "id")]
    pub gender: BelongsTo<crate::models::person::reference::gender::Entity>,
    #[sea_orm(belongs_to, from = "religion_id", to = "id")]
    pub religion: BelongsTo<crate::models::person::reference::religion::Entity>,
    #[sea_orm(belongs_to, from = "occupation_id", to = "id")]
    pub occupation: BelongsTo<crate::models::person::reference::occupation::Entity>,
    #[sea_orm(belongs_to, from = "income_id", to = "id")]
    pub income: BelongsTo<crate::models::person::reference::income::Entity>,
    #[sea_orm(belongs_to, from = "identification_type_id", to = "id")]
    pub identification_type: BelongsTo<crate::models::person::reference::identification_type::Entity>,
    #[sea_orm(belongs_to, from = "marital_status_id", to = "id")]
    pub marital_status: BelongsTo<crate::models::person::reference::marital_status::Entity>,
    #[sea_orm(belongs_to, from = "profession_id", to = "id")]
    pub profession: BelongsTo<crate::models::person::reference::profession::Entity>,
    #[sea_orm(belongs_to, from = "education_id", to = "id")]
    pub education: BelongsTo<crate::models::literate::educations::Entity>,
    #[sea_orm(belongs_to, from = "age_classification_id", to = "id")]
    pub age_classification: BelongsTo<crate::models::person::reference::age_classification::Entity>,
    #[sea_orm(has_one)]
    pub biodata: HasOne<super::biodata::Entity>,
    #[sea_orm(has_one)]
    pub user: HasOne<crate::models::auth::user::Entity>,
    #[sea_orm(has_one)]
    pub lecturer: HasOne<crate::models::academic::lecturer::master::lecturers::Entity>,
    #[sea_orm(has_many)]
    pub employees: HasMany<crate::models::institution::master::employees::Entity>,
    #[sea_orm(has_many)]
    pub candidates: HasMany<crate::models::academic::candidate::master::candidates::Entity>,
    #[sea_orm(has_many)]
    pub evaluators: HasMany<crate::models::academic::prior_learning_recognition::transaction::evaluators::Entity>,
    #[sea_orm(has_many)]
    pub students: HasMany<crate::models::academic::student::master::students::Entity>,
}


impl ActiveModelBehavior for ActiveModel {}

pub struct IndividualToArchive;

impl Linked for IndividualToArchive {
    type FromEntity = Entity;
    type ToEntity = crate::models::document::transaction::archives::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = crate::models::document::transaction::archives::Entity::belongs_to(Entity)
            .from(crate::models::document::transaction::archives::Column::ArchiveableId)
            .to(Column::Id)
            .on_condition(|_left, _right| {
                crate::models::document::transaction::archives::Column::ArchiveableType.eq("Individual").into()
            })
            .into();
        vec![rel.rev()]
    }
}
