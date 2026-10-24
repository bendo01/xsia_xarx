use sea_orm::entity::prelude::*;

/// A link between two regulations, e.g. one revokes or amends another
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "regulation", table_name = "regulation_relations")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub source_id: Uuid,
    pub target_id: Uuid,
    /// `mencabut`, `mengubah`, `melaksanakan`, `mengamanatkan`, `merujuk` or `menggantikan_sebagian`
    pub relation: String,
    pub article_ref: Option<String>,
    pub effective_on: Option<Date>,
    #[sea_orm(column_type = "Text", nullable)]
    pub note: Option<String>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}

/// The regulation that acts on the other
pub struct RelationToSource;

impl Linked for RelationToSource {
    type FromEntity = Entity;
    type ToEntity = super::regulation::Entity;

    fn link(&self) -> Vec<RelationDef> {
        vec![Entity::belongs_to(super::regulation::Entity)
            .from(Column::SourceId)
            .to(super::regulation::Column::Id)
            .into()]
    }
}

/// The regulation that is acted on
pub struct RelationToTarget;

impl Linked for RelationToTarget {
    type FromEntity = Entity;
    type ToEntity = super::regulation::Entity;

    fn link(&self) -> Vec<RelationDef> {
        vec![Entity::belongs_to(super::regulation::Entity)
            .from(Column::TargetId)
            .to(super::regulation::Column::Id)
            .into()]
    }
}
