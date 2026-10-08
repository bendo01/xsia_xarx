use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod categories;
pub mod conditions;
pub mod room_types;
pub mod varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("categories")
                .get_named("building.reference.categories.index", categories::index)
                .post_named("building.reference.categories.store", categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.categories.option_select", categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.categories.show", categories::show)
                        .put_named("building.reference.categories.update", categories::update)
                        .delete_named("building.reference.categories.delete", categories::delete),
                ),
        )
        .push(
            Router::with_path("conditions")
                .get_named("building.reference.conditions.index", conditions::index)
                .post_named("building.reference.conditions.store", conditions::store)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.conditions.option_select", conditions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.conditions.show", conditions::show)
                        .put_named("building.reference.conditions.update", conditions::update)
                        .delete_named("building.reference.conditions.delete", conditions::delete),
                ),
        )
        .push(
            Router::with_path("room-types")
                .get_named("building.reference.room_types.index", room_types::index)
                .post_named("building.reference.room_types.store", room_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.room_types.option_select", room_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.room_types.show", room_types::show)
                        .put_named("building.reference.room_types.update", room_types::update)
                        .delete_named("building.reference.room_types.delete", room_types::delete),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("building.reference.varieties.index", varieties::index)
                .post_named("building.reference.varieties.store", varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.varieties.option_select", varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.varieties.show", varieties::show)
                        .put_named("building.reference.varieties.update", varieties::update)
                        .delete_named("building.reference.varieties.delete", varieties::delete),
                ),
        )
}
