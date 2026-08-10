use sea_orm::entity::prelude::*;

// Minimal reproduction: A reference table with a single HasMany
// pointing to a master table that itself has multiple BelongsTo

pub mod ref_table {
    use super::*;
    #[sea_orm::model]
    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
    #[sea_orm(table_name = "ref_table")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        pub name: String,
        #[sea_orm(has_many)]
        pub masters: HasMany<super::master::Entity>,
    }
    impl ActiveModelBehavior for ActiveModel {}
}

pub mod other_ref {
    use super::*;
    #[sea_orm::model]
    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
    #[sea_orm(table_name = "other_ref")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        pub name: String,
        #[sea_orm(has_many)]
        pub masters: HasMany<super::master::Entity>,
    }
    impl ActiveModelBehavior for ActiveModel {}
}

pub mod master {
    use super::*;
    #[sea_orm::model]
    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
    #[sea_orm(table_name = "master")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        pub ref_id: Uuid,
        pub other_ref_id: Uuid,
        #[sea_orm(belongs_to, from = "ref_id", to = "id")]
        pub ref_table: BelongsTo<super::ref_table::Entity>,
        #[sea_orm(belongs_to, from = "other_ref_id", to = "id")]
        pub other_ref: BelongsTo<super::other_ref::Entity>,
        #[sea_orm(has_many)]
        pub children: HasMany<super::child::Entity>,
    }
    impl ActiveModelBehavior for ActiveModel {}
}

pub mod child {
    use super::*;
    #[sea_orm::model]
    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
    #[sea_orm(table_name = "child")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        pub master_id: Uuid,
        #[sea_orm(belongs_to, from = "master_id", to = "id")]
        pub master: BelongsTo<super::master::Entity>,
    }
    impl ActiveModelBehavior for ActiveModel {}
}
