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
                .get_named("literate.categories.index", categories::index)
                .post_named("literate.categories.store", categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.categories.option_select", categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.categories.show", categories::show)
                        .put_named("literate.categories.update", categories::update)
                        .delete_named("literate.categories.delete", categories::delete),
                ),
        )
        .push(
            Router::with_path("educations")
                .get_named("literate.educations.index", educations::index)
                .post_named("literate.educations.store", educations::store)
                .push(
                    Router::with_path("options")
                        .get_named("literate.educations.option_select_get", educations::option_select)
                        .post_named("literate.educations.option_select", educations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.educations.show", educations::show)
                        .put_named("literate.educations.update", educations::update)
                        .delete_named("literate.educations.delete", educations::delete),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("literate.groups.index", groups::index)
                .post_named("literate.groups.store", groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.groups.option_select", groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.groups.show", groups::show)
                        .put_named("literate.groups.update", groups::update)
                        .delete_named("literate.groups.delete", groups::delete),
                ),
        )
        .push(
            Router::with_path("levels")
                .get_named("literate.levels.index", levels::index)
                .post_named("literate.levels.store", levels::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.levels.option_select", levels::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.levels.show", levels::show)
                        .put_named("literate.levels.update", levels::update)
                        .delete_named("literate.levels.delete", levels::delete),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("literate.varieties.index", varieties::index)
                .post_named("literate.varieties.store", varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("literate.varieties.option_select", varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.varieties.show", varieties::show)
                        .put_named("literate.varieties.update", varieties::update)
                        .delete_named("literate.varieties.delete", varieties::delete),
                ),
        )
}
