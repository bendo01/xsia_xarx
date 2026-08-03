#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]

pub mod academic;
pub mod ai;
pub mod auth;
pub mod building;
pub mod contact;
pub mod document;
pub mod feeder;
pub mod general;
pub mod institution;
pub mod literate;
pub mod location;
pub mod payment;
pub mod person;

pub use sea_orm_migration::prelude::*;

use auth::m20241004_225447_schema_auth_table_users;
use auth::m20241102_053649_schema_auth_table_verifications;
use auth::m20241102_053701_schema_auth_table_permissions;
use auth::m20241102_053846_schema_auth_table_permission_user;
use auth::m20241102_053904_schema_auth_table_permission_position_type;
use auth::m20241102_053946_schema_auth_table_user_position_type;


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
mod m20260803_135500_schema_auth_table_users;
