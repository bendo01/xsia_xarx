use sea_orm::{entity::prelude::*, Condition};
use xsia_xarx::models::document::transaction::archives::{self, Column, Entity};
use xsia_xarx::models::person::master::individual;

pub enum Relation {
    Individual,
}

impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        match self {
            Relation::Individual => Entity::belongs_to(individual::Entity)
                .from(Column::ArchiveableId)
                .to(individual::Column::Id)
                .on_condition(|_left, _right| {
                    Expr::col((Entity, Column::ArchiveableType))
                        .eq("Individual")
                        .into_condition()
                })
                .into(),
        }
    }
}
