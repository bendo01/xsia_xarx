#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]

pub mod academic;
pub mod auth;
pub mod building;
pub mod contact;
pub mod document;
pub mod feeder;
pub mod institution;
pub mod literate;
pub mod location;
pub mod person;
pub mod preference;
pub mod webhook;

use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    #[allow(clippy::too_many_lines)]
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20261014_091108_schema_preference_table_mail_server::Migration),
            Box::new(m20261014_120536_schema_preference_table_open_whats_apps::Migration),
            Box::new(m20261014_120817_schema_preference_table_applications::Migration),
            Box::new(webhook::m20261014_130000_schema_webhook_table_mail_in_a_box_events::Migration),
        ]
    }
}
mod m20261014_091108_schema_preference_table_mail_server;
mod m20261014_120536_schema_preference_table_open_whats_apps;
mod m20261014_120817_schema_preference_table_applications;
