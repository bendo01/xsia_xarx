use salvo::prelude::*;

pub mod categories;
pub mod conditions;
pub mod room_types;
pub mod varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("categories")
                .get(categories::list_categories)
                .post(categories::create_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(categories::get_categorie)
                        .put(categories::update_categorie)
                        .delete(categories::delete_categorie),
                ),
        )
        .push(
            Router::with_path("conditions")
                .get(conditions::list_conditions)
                .post(conditions::create_condition)
                .push(
                    Router::with_path("{id}")
                        .get(conditions::get_condition)
                        .put(conditions::update_condition)
                        .delete(conditions::delete_condition),
                ),
        )
        .push(
            Router::with_path("room-types")
                .get(room_types::list_room_types)
                .post(room_types::create_room_type)
                .push(
                    Router::with_path("{id}")
                        .get(room_types::get_room_type)
                        .put(room_types::update_room_type)
                        .delete(room_types::delete_room_type),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get(varieties::list_varieties)
                .post(varieties::create_varietie)
                .push(
                    Router::with_path("{id}")
                        .get(varieties::get_varietie)
                        .put(varieties::update_varietie)
                        .delete(varieties::delete_varietie),
                ),
        )
}
