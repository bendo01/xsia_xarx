#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]

// pub mod academic;
// pub mod ai;
pub mod auth;
// pub mod building;
// pub mod contact;
// pub mod document;
// pub mod feeder;
// pub mod general;
// pub mod institution;
// pub mod literate;
// pub mod location;
// pub mod payment;
// pub mod person;

pub use sea_orm_migration::prelude::*;

use auth::m20260803_135500_schema_auth_table_users;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    #[allow(clippy::too_many_lines)]
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260803_135500_schema_auth_table_users::Migration),
        ]
    }
}
