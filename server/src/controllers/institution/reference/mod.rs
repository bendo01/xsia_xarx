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
                .get_named("institution.reference.categories.index", categories::index)
                .post_named("institution.reference.categories.store", categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.reference.categories.option_select", categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.categories.show", categories::show)
                        .put_named("institution.reference.categories.update", categories::update)
                        .delete_named("institution.reference.categories.delete", categories::delete),
                ),
        )
        .push(
            Router::with_path("position-type")
                .get_named("institution.reference.position_type.index", position_type::index)
                .post_named("institution.reference.position_type.store", position_type::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.reference.position_type.option_select", position_type::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.position_type.show", position_type::show)
                        .put_named("institution.reference.position_type.update", position_type::update)
                        .delete_named("institution.reference.position_type.delete", position_type::delete),
                ),
        )
        .push(
            Router::with_path("unit-types")
                .get_named("institution.reference.unit_types.index", unit_types::index)
                .post_named("institution.reference.unit_types.store", unit_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.reference.unit_types.option_select", unit_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.unit_types.show", unit_types::show)
                        .put_named("institution.reference.unit_types.update", unit_types::update)
                        .delete_named("institution.reference.unit_types.delete", unit_types::delete),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("institution.reference.varieties.index", varieties::index)
                .post_named("institution.reference.varieties.store", varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.reference.varieties.option_select", varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.reference.varieties.show", varieties::show)
                        .put_named("institution.reference.varieties.update", varieties::update)
                        .delete_named("institution.reference.varieties.delete", varieties::delete),
                ),
        )
}
