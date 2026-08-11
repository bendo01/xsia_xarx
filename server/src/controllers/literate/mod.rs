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
                .post(categories::create_categories)
                .push(
                    Router::with_path("{id}")
                        .get(categories::get_categories)
                        .put(categories::update_categories)
                        .delete(categories::delete_categories),
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
                .post(groups::create_groups)
                .push(
                    Router::with_path("{id}")
                        .get(groups::get_groups)
                        .put(groups::update_groups)
                        .delete(groups::delete_groups),
                ),
        )
        .push(
            Router::with_path("levels")
                .get(levels::list_levels)
                .post(levels::create_levels)
                .push(
                    Router::with_path("{id}")
                        .get(levels::get_levels)
                        .put(levels::update_levels)
                        .delete(levels::delete_levels),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get(varieties::list_varieties)
                .post(varieties::create_varieties)
                .push(
                    Router::with_path("{id}")
                        .get(varieties::get_varieties)
                        .put(varieties::update_varieties)
                        .delete(varieties::delete_varieties),
                ),
        );

    literate_router
}
