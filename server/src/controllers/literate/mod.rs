use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod categories;
pub mod educations;
pub mod groups;
pub mod levels;
pub mod varieties;

pub fn router() -> Router {
    Router::with_path("")
        .push(
            Router::with_path("categories")
                .get_named("literate.categories.list_categories", categories::index)
                .post_named("literate.categories.create_categorie", categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.categories.options_categories", categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.categories.get_categorie", categories::show)
                        .put_named("literate.categories.update_categorie", categories::update)
                        .delete_named("literate.categories.delete_categorie", categories::delete),
                ),
        )
        .push(
            Router::with_path("educations")
                .get_named("literate.educations.list_educations", educations::index)
                .post_named("literate.educations.create_education", educations::store)
                .push(
                    Router::with_path("options")
                        .get_named("literate.educations.options_educations_get", educations::option_select)
                        .post_named("literate.educations.options_educations", educations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.educations.get_education", educations::show)
                        .put_named("literate.educations.update_education", educations::update)
                        .delete_named("literate.educations.delete_education", educations::delete),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("literate.groups.list_groups", groups::index)
                .post_named("literate.groups.create_group", groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.groups.options_groups", groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.groups.get_group", groups::show)
                        .put_named("literate.groups.update_group", groups::update)
                        .delete_named("literate.groups.delete_group", groups::delete),
                ),
        )
        .push(
            Router::with_path("levels")
                .get_named("literate.levels.list_levels", levels::index)
                .post_named("literate.levels.create_level", levels::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.levels.options_levels", levels::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.levels.get_level", levels::show)
                        .put_named("literate.levels.update_level", levels::update)
                        .delete_named("literate.levels.delete_level", levels::delete),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("literate.varieties.list_varieties", varieties::index)
                .post_named("literate.varieties.create_varietie", varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.varieties.options_varieties", varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.varieties.get_varietie", varieties::show)
                        .put_named("literate.varieties.update_varietie", varieties::update)
                        .delete_named("literate.varieties.delete_varietie", varieties::delete),
                ),
        )
}
