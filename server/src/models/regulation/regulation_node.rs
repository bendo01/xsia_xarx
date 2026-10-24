use sea_orm::entity::prelude::*;

/// One element of a regulation tree (bab, pasal, ayat, ...); \`parent_id\` points at the enclosing node
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "regulation", table_name = "regulation_nodes")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub regulation_id: Uuid,
    pub parent_id: Option<Uuid>,
    /// `bab`, `bagian`, `paragraf`, `pasal`, `ayat`, `huruf`, `angka` or `lampiran`
    pub node_type: String,
    pub number: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub heading: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub path: String,
    pub seq: i32,
    #[sea_orm(column_type = "Text", nullable)]
    pub body: Option<String>,
    pub is_revoked: bool,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "regulation_id", to = "id")]
    pub regulation: BelongsTo<crate::models::regulation::regulation::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

/// The node that encloses this one (none for a top level node)
pub struct NodeToParent;

impl Linked for NodeToParent {
    type FromEntity = Entity;
    type ToEntity = Entity;

    fn link(&self) -> Vec<RelationDef> {
        vec![Entity::belongs_to(Entity).from(Column::ParentId).to(Column::Id).into()]
    }
}

/// The nodes directly inside this one
pub struct NodeToChildren;

impl Linked for NodeToChildren {
    type FromEntity = Entity;
    type ToEntity = Entity;

    fn link(&self) -> Vec<RelationDef> {
        let rel: RelationDef = Entity::belongs_to(Entity).from(Column::ParentId).to(Column::Id).into();
        vec![rel.rev()]
    }
}
