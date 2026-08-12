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
    pub roleable_id: Option<Uuid>,
    pub roleable_type: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "user_id", to = "id")]
    pub user: BelongsTo<Option<super::user::Entity>>,
    #[sea_orm(has_many, via = "permission_role")]
    pub permissions: HasMany<super::permission::Entity>,
    #[sea_orm(has_many)]
    pub permission_role: HasMany<crate::models::auth::permission_role::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

// ── Polymorphic Linked: Role → Staffes ──

pub struct RoleToStaff;

impl Linked for RoleToStaff {
    type FromEntity = Entity;
    type ToEntity = crate::models::institution::master::staffes::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = Entity::belongs_to(crate::models::institution::master::staffes::Entity)
            .from(Column::RoleableId)
            .to(crate::models::institution::master::staffes::Column::Id)
            .on_condition(|_left, _right| {
                Column::RoleableType.eq("Staff").into()
            })
            .into();
        vec![rel]
    }
}

// ── Polymorphic Linked: Role → Lecturers ──

pub struct RoleToLecturer;

impl Linked for RoleToLecturer {
    type FromEntity = Entity;
    type ToEntity = crate::models::academic::lecturer::master::lecturers::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = Entity::belongs_to(crate::models::academic::lecturer::master::lecturers::Entity)
            .from(Column::RoleableId)
            .to(crate::models::academic::lecturer::master::lecturers::Column::Id)
            .on_condition(|_left, _right| {
                Column::RoleableType.eq("Lecturer").into()
            })
            .into();
        vec![rel]
    }
}

// ── Polymorphic Linked: Role → Candidates ──

pub struct RoleToCandidate;

impl Linked for RoleToCandidate {
    type FromEntity = Entity;
    type ToEntity = crate::models::academic::candidate::master::candidates::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = Entity::belongs_to(crate::models::academic::candidate::master::candidates::Entity)
            .from(Column::RoleableId)
            .to(crate::models::academic::candidate::master::candidates::Column::Id)
            .on_condition(|_left, _right| {
                Column::RoleableType.eq("Candidate").into()
            })
            .into();
        vec![rel]
    }
}

// ── Polymorphic Linked: Role → Students ──

pub struct RoleToStudent;

impl Linked for RoleToStudent {
    type FromEntity = Entity;
    type ToEntity = crate::models::academic::student::master::students::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = Entity::belongs_to(crate::models::academic::student::master::students::Entity)
            .from(Column::RoleableId)
            .to(crate::models::academic::student::master::students::Column::Id)
            .on_condition(|_left, _right| {
                Column::RoleableType.eq("Student").into()
            })
            .into();
        vec![rel]
    }
}
