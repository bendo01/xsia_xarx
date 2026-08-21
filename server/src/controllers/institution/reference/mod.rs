use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod categories;
pub mod position_type;
pub mod unit_types;
pub mod varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("categories")
                .get_named("institution.reference.categories.list_categories", categories::list_categories)
                .post_named("institution.reference.categories.create_categorie", categories::create_categorie)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.categories.get_categorie", categories::get_categorie)
                        .put_named("institution.reference.categories.update_categorie", categories::update_categorie)
                        .delete_named("institution.reference.categories.delete_categorie", categories::delete_categorie),
                ),
        )
        .push(
            Router::with_path("position-type")
                .get_named("institution.reference.position_type.list_position_type", position_type::list_position_type)
                .post_named("institution.reference.position_type.create_position_type", position_type::create_position_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.position_type.get_position_type", position_type::get_position_type)
                        .put_named("institution.reference.position_type.update_position_type", position_type::update_position_type)
                        .delete_named("institution.reference.position_type.delete_position_type", position_type::delete_position_type),
                ),
        )
        .push(
            Router::with_path("unit-types")
                .get_named("institution.reference.unit_types.list_unit_types", unit_types::list_unit_types)
                .post_named("institution.reference.unit_types.create_unit_type", unit_types::create_unit_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.unit_types.get_unit_type", unit_types::get_unit_type)
                        .put_named("institution.reference.unit_types.update_unit_type", unit_types::update_unit_type)
                        .delete_named("institution.reference.unit_types.delete_unit_type", unit_types::delete_unit_type),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("institution.reference.varieties.list_varieties", varieties::list_varieties)
                .post_named("institution.reference.varieties.create_varietie", varieties::create_varietie)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.varieties.get_varietie", varieties::get_varietie)
                        .put_named("institution.reference.varieties.update_varietie", varieties::update_varietie)
                        .delete_named("institution.reference.varieties.delete_varietie", varieties::delete_varietie),
                ),
        )
}
