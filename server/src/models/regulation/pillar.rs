use sea_orm::entity::prelude::*;

/// A pillar (thematic group) regulations are classified under
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "regulation", table_name = "pillars")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub code: String,
    pub name: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub description: Option<String>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}

/// The regulations classified under this pillar
pub struct PillarToRegulations;

impl Linked for PillarToRegulations {
    type FromEntity = Entity;
    type ToEntity = super::regulation::Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = super::regulation::Entity::belongs_to(Entity)
            .from(super::regulation::Column::PillarId)
            .to(Column::Id)
            .into();
        vec![rel.rev()]
    }
}
