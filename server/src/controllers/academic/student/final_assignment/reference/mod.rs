use salvo::prelude::*;

pub mod adviser_categories;
pub mod approval_types;
pub mod categories;
pub mod requirements;
pub mod stages;
pub mod varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("adviser-categories")
                .get(adviser_categories::list_adviser_categories)
                .post(adviser_categories::create_adviser_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(adviser_categories::get_adviser_categorie)
                        .put(adviser_categories::update_adviser_categorie)
                        .delete(adviser_categories::delete_adviser_categorie),
                ),
        )
        .push(
            Router::with_path("approval-types")
                .get(approval_types::list_approval_types)
                .post(approval_types::create_approval_type)
                .push(
                    Router::with_path("{id}")
                        .get(approval_types::get_approval_type)
                        .put(approval_types::update_approval_type)
                        .delete(approval_types::delete_approval_type),
                ),
        )
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
            Router::with_path("requirements")
                .get(requirements::list_requirements)
                .post(requirements::create_requirement)
                .push(
                    Router::with_path("{id}")
                        .get(requirements::get_requirement)
                        .put(requirements::update_requirement)
                        .delete(requirements::delete_requirement),
                ),
        )
        .push(
            Router::with_path("stages")
                .get(stages::list_stages)
                .post(stages::create_stage)
                .push(
                    Router::with_path("{id}")
                        .get(stages::get_stage)
                        .put(stages::update_stage)
                        .delete(stages::delete_stage),
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
