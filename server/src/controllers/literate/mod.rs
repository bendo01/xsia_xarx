use salvo::prelude::*;

pub mod categories;
pub mod educations;
pub mod groups;
pub mod levels;
pub mod varieties;

pub fn router() -> Router {
    let literate_router = Router::with_path("literate")
        .push(
            Router::with_path("categories")
                .get(categories::list_categories)
                .post(categories::create_category)
                .push(
                    Router::with_path("{id}")
                        .get(categories::get_category)
                        .put(categories::update_category)
                        .delete(categories::delete_category),
                ),
        )
        .push(
            Router::with_path("educations")
                .get(educations::list_educations)
                .post(educations::create_education)
                .push(
                    Router::with_path("{id}")
                        .get(educations::get_education)
                        .put(educations::update_education)
                        .delete(educations::delete_education),
                ),
        )
        .push(
            Router::with_path("groups")
                .get(groups::list_groups)
                .post(groups::create_group)
                .push(
                    Router::with_path("{id}")
                        .get(groups::get_group)
                        .put(groups::update_group)
                        .delete(groups::delete_group),
                ),
        )
        .push(
            Router::with_path("levels")
                .get(levels::list_levels)
                .post(levels::create_level)
                .push(
                    Router::with_path("{id}")
                        .get(levels::get_level)
                        .put(levels::update_level)
                        .delete(levels::delete_level),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get(varieties::list_varieties)
                .post(varieties::create_variety)
                .push(
                    Router::with_path("{id}")
                        .get(varieties::get_variety)
                        .put(varieties::update_variety)
                        .delete(varieties::delete_variety),
                ),
        );

    literate_router
}
