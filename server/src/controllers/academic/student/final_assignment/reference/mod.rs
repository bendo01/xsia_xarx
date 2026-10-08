use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

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
                .get_named("academic.student.final_assignment.reference.adviser_categories.index", adviser_categories::index)
                .post_named("academic.student.final_assignment.reference.adviser_categories.store", adviser_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.adviser_categories.option_select", adviser_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.adviser_categories.show", adviser_categories::show)
                        .put_named("academic.student.final_assignment.reference.adviser_categories.update", adviser_categories::update)
                        .delete_named("academic.student.final_assignment.reference.adviser_categories.delete", adviser_categories::delete),
                ),
        )
        .push(
            Router::with_path("approval-types")
                .get_named("academic.student.final_assignment.reference.approval_types.index", approval_types::index)
                .post_named("academic.student.final_assignment.reference.approval_types.store", approval_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.approval_types.option_select", approval_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.approval_types.show", approval_types::show)
                        .put_named("academic.student.final_assignment.reference.approval_types.update", approval_types::update)
                        .delete_named("academic.student.final_assignment.reference.approval_types.delete", approval_types::delete),
                ),
        )
        .push(
            Router::with_path("categories")
                .get_named("academic.student.final_assignment.reference.categories.index", categories::index)
                .post_named("academic.student.final_assignment.reference.categories.store", categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.categories.option_select", categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.categories.show", categories::show)
                        .put_named("academic.student.final_assignment.reference.categories.update", categories::update)
                        .delete_named("academic.student.final_assignment.reference.categories.delete", categories::delete),
                ),
        )
        .push(
            Router::with_path("requirements")
                .get_named("academic.student.final_assignment.reference.requirements.index", requirements::index)
                .post_named("academic.student.final_assignment.reference.requirements.store", requirements::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.requirements.option_select", requirements::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.requirements.show", requirements::show)
                        .put_named("academic.student.final_assignment.reference.requirements.update", requirements::update)
                        .delete_named("academic.student.final_assignment.reference.requirements.delete", requirements::delete),
                ),
        )
        .push(
            Router::with_path("stages")
                .get_named("academic.student.final_assignment.reference.stages.index", stages::index)
                .post_named("academic.student.final_assignment.reference.stages.store", stages::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.stages.option_select", stages::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.stages.show", stages::show)
                        .put_named("academic.student.final_assignment.reference.stages.update", stages::update)
                        .delete_named("academic.student.final_assignment.reference.stages.delete", stages::delete),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("academic.student.final_assignment.reference.varieties.index", varieties::index)
                .post_named("academic.student.final_assignment.reference.varieties.store", varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.varieties.option_select", varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.varieties.show", varieties::show)
                        .put_named("academic.student.final_assignment.reference.varieties.update", varieties::update)
                        .delete_named("academic.student.final_assignment.reference.varieties.delete", varieties::delete),
                ),
        )
}
