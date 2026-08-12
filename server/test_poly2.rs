use sea_orm::entity::prelude::*;
use xsia_xarx::models::document::transaction::archives::{self, Column, Entity};
use xsia_xarx::models::person::master::individual;

pub struct IndividualToArchive;

impl Linked for IndividualToArchive {
    type FromEntity = individual::Entity;
    type ToEntity = archives::Entity;

    fn link(&self) -> Vec<RelationDef> {
        vec![
            archives::Entity::belongs_to(individual::Entity)
                .from(archives::Column::ArchiveableId)
                .to(individual::Column::Id)
                .on_condition(|_left, _right| {
                    archives::Column::ArchiveableType.eq("Individual")
                })
                .into()
        ]
    }
}
