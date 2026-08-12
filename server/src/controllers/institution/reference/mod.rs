use salvo::prelude::*;

pub mod categories;
pub mod position_type;
pub mod unit_types;
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
            Router::with_path("position-type")
                .get(position_type::list_position_type)
                .post(position_type::create_position_type)
                .push(
                    Router::with_path("{id}")
                        .get(position_type::get_position_type)
                        .put(position_type::update_position_type)
                        .delete(position_type::delete_position_type),
                ),
        )
        .push(
            Router::with_path("unit-types")
                .get(unit_types::list_unit_types)
                .post(unit_types::create_unit_type)
                .push(
                    Router::with_path("{id}")
                        .get(unit_types::get_unit_type)
                        .put(unit_types::update_unit_type)
                        .delete(unit_types::delete_unit_type),
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
