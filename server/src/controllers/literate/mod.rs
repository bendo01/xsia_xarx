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
                .get_named("literate.categories.list_categories", categories::list_categories)
                .post_named("literate.categories.create_categorie", categories::create_categorie)
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.categories.get_categorie", categories::get_categorie)
                        .put_named("literate.categories.update_categorie", categories::update_categorie)
                        .delete_named("literate.categories.delete_categorie", categories::delete_categorie),
                ),
        )
        .push(
            Router::with_path("educations")
                .get_named("literate.educations.list_educations", educations::list_educations)
                .post_named("literate.educations.create_education", educations::create_education)
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.educations.get_education", educations::get_education)
                        .put_named("literate.educations.update_education", educations::update_education)
                        .delete_named("literate.educations.delete_education", educations::delete_education),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("literate.groups.list_groups", groups::list_groups)
                .post_named("literate.groups.create_group", groups::create_group)
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.groups.get_group", groups::get_group)
                        .put_named("literate.groups.update_group", groups::update_group)
                        .delete_named("literate.groups.delete_group", groups::delete_group),
                ),
        )
        .push(
            Router::with_path("levels")
                .get_named("literate.levels.list_levels", levels::list_levels)
                .post_named("literate.levels.create_level", levels::create_level)
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.levels.get_level", levels::get_level)
                        .put_named("literate.levels.update_level", levels::update_level)
                        .delete_named("literate.levels.delete_level", levels::delete_level),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("literate.varieties.list_varieties", varieties::list_varieties)
                .post_named("literate.varieties.create_varietie", varieties::create_varietie)
                .push(
                    Router::with_path("{id}")
                        .get_named("literate.varieties.get_varietie", varieties::get_varietie)
                        .put_named("literate.varieties.update_varietie", varieties::update_varietie)
                        .delete_named("literate.varieties.delete_varietie", varieties::delete_varietie),
                ),
        )
}
