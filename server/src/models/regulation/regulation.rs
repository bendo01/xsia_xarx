use sea_orm::entity::prelude::*;

/// A regulation; its structure lives in `regulation_nodes` and its chunks in `ai.chunks`
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "regulation", table_name = "regulations")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub type_id: Uuid,
    pub pillar_id: Option<Uuid>,
    pub number: String,
    pub year: i16,
    #[sea_orm(column_type = "Text")]
    pub title: String,
    pub issuer: Option<String>,
    pub enacted_on: Option<Date>,
    pub effective_on: Option<Date>,
    pub revoked_on: Option<Date>,
    /// `berlaku`, `dicabut`, `diubah` or `verifikasi`
    pub status: String,
    pub is_historical: bool,
    pub audit_valid_from: Option<Date>,
    pub audit_valid_until: Option<Date>,
    pub source_file: Option<String>,
    pub file_sha256: Option<String>,
    pub ingest_order: Option<i16>,
    #[sea_orm(column_type = "Text", nullable)]
    pub verification_note: Option<String>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "type_id", to = "id")]
    pub regulation_type: BelongsTo<crate::models::regulation::regulation_type::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

/// The pillar a regulation is classified under (none when `pillar_id` is empty)
pub struct RegulationToPillar;

impl Linked for RegulationToPillar {
    type FromEntity = Entity;
    type ToEntity = super::pillar::Entity;

    fn link(&self) -> Vec<RelationDef> {
        vec![Entity::belongs_to(super::pillar::Entity)
            .from(Column::PillarId)
            .to(super::pillar::Column::Id)
            .into()]
    }
}

/// Links where this regulation is the one acting on another (e.g. it revokes it)
pub struct RegulationToOutgoingRelations;

impl Linked for RegulationToOutgoingRelations {
    type FromEntity = Entity;
    type ToEntity = super::regulation_relation::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = super::regulation_relation::Entity::belongs_to(Entity)
            .from(super::regulation_relation::Column::SourceId)
            .to(Column::Id)
            .into();
        vec![rel.rev()]
    }
}

/// Links where another regulation acts on this one (e.g. it is amended by it)
pub struct RegulationToIncomingRelations;

impl Linked for RegulationToIncomingRelations {
    type FromEntity = Entity;
    type ToEntity = super::regulation_relation::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = super::regulation_relation::Entity::belongs_to(Entity)
            .from(super::regulation_relation::Column::TargetId)
            .to(Column::Id)
            .into();
        vec![rel.rev()]
    }
}
