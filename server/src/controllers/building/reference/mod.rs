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
                .get_named("building.reference.categories.list_categories", categories::list_categories)
                .post_named("building.reference.categories.create_categorie", categories::create_categorie)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.categories.options_categories", categories::options_categories),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.categories.get_categorie", categories::get_categorie)
                        .put_named("building.reference.categories.update_categorie", categories::update_categorie)
                        .delete_named("building.reference.categories.delete_categorie", categories::delete_categorie),
                ),
        )
        .push(
            Router::with_path("conditions")
                .get_named("building.reference.conditions.list_conditions", conditions::list_conditions)
                .post_named("building.reference.conditions.create_condition", conditions::create_condition)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.conditions.options_conditions", conditions::options_conditions),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.conditions.get_condition", conditions::get_condition)
                        .put_named("building.reference.conditions.update_condition", conditions::update_condition)
                        .delete_named("building.reference.conditions.delete_condition", conditions::delete_condition),
                ),
        )
        .push(
            Router::with_path("room-types")
                .get_named("building.reference.room_types.list_room_types", room_types::list_room_types)
                .post_named("building.reference.room_types.create_room_type", room_types::create_room_type)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.room_types.options_room_types", room_types::options_room_types),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.room_types.get_room_type", room_types::get_room_type)
                        .put_named("building.reference.room_types.update_room_type", room_types::update_room_type)
                        .delete_named("building.reference.room_types.delete_room_type", room_types::delete_room_type),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("building.reference.varieties.list_varieties", varieties::list_varieties)
                .post_named("building.reference.varieties.create_varietie", varieties::create_varietie)
                .push(
                    Router::with_path("options")
                        .post_named("building.reference.varieties.options_varieties", varieties::options_varieties),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.reference.varieties.get_varietie", varieties::get_varietie)
                        .put_named("building.reference.varieties.update_varietie", varieties::update_varietie)
                        .delete_named("building.reference.varieties.delete_varietie", varieties::delete_varietie),
                ),
        )
}
