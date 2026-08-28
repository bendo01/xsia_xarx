use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "test_a")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub b_id: Option<Uuid>,
    #[sea_orm(belongs_to, from = "b_id", to = "id")]
    pub b_rel: Option<BelongsTo<crate::scratch::test_rel::b::Entity>>,
}

impl ActiveModelBehavior for ActiveModel {}

pub mod b {
    use sea_orm::entity::prelude::*;

    #[sea_orm::model]
    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
    #[sea_orm(table_name = "test_b")]
    pub struct Model {
        #[sea_orm(primary_key)]
        pub id: Uuid,
        #[sea_orm(has_many)]
        pub a_rels: HasMany<super::Entity>,
    }

    impl ActiveModelBehavior for ActiveModel {}
}
