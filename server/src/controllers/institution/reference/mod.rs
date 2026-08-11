
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
                .post(categories::create_categories)
                .push(
                    Router::with_path("<id>")
                        .get(categories::get_categories)
                        .put(categories::update_categories)
                        .delete(categories::delete_categories),
                ),
        )
        .push(
            Router::with_path("position-types")
                .get(position_type::list_position_types)
                .post(position_type::create_position_type)
                .push(
                    Router::with_path("<id>")
                        .get(position_type::get_position_type)
                        .put(position_type::update_position_type)
                        .delete(position_type::delete_position_type),
                ),
        )
        .push(
            Router::with_path("unit-types")
                .get(unit_types::list_unit_types)
                .post(unit_types::create_unit_types)
                .push(
                    Router::with_path("<id>")
                        .get(unit_types::get_unit_types)
                        .put(unit_types::update_unit_types)
                        .delete(unit_types::delete_unit_types),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get(varieties::list_varieties)
                .post(varieties::create_varieties)
                .push(
                    Router::with_path("<id>")
                        .get(varieties::get_varieties)
                        .put(varieties::update_varieties)
                        .delete(varieties::delete_varieties),
                ),
        )
}
