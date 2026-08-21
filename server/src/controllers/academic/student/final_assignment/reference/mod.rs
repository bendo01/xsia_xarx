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
                .get_named("academic.student.final_assignment.reference.adviser_categories.list_adviser_categories", adviser_categories::list_adviser_categories)
                .post_named("academic.student.final_assignment.reference.adviser_categories.create_adviser_categorie", adviser_categories::create_adviser_categorie)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.adviser_categories.options_adviser_categories", adviser_categories::options_adviser_categories),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.adviser_categories.get_adviser_categorie", adviser_categories::get_adviser_categorie)
                        .put_named("academic.student.final_assignment.reference.adviser_categories.update_adviser_categorie", adviser_categories::update_adviser_categorie)
                        .delete_named("academic.student.final_assignment.reference.adviser_categories.delete_adviser_categorie", adviser_categories::delete_adviser_categorie),
                ),
        )
        .push(
            Router::with_path("approval-types")
                .get_named("academic.student.final_assignment.reference.approval_types.list_approval_types", approval_types::list_approval_types)
                .post_named("academic.student.final_assignment.reference.approval_types.create_approval_type", approval_types::create_approval_type)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.approval_types.options_approval_types", approval_types::options_approval_types),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.approval_types.get_approval_type", approval_types::get_approval_type)
                        .put_named("academic.student.final_assignment.reference.approval_types.update_approval_type", approval_types::update_approval_type)
                        .delete_named("academic.student.final_assignment.reference.approval_types.delete_approval_type", approval_types::delete_approval_type),
                ),
        )
        .push(
            Router::with_path("categories")
                .get_named("academic.student.final_assignment.reference.categories.list_categories", categories::list_categories)
                .post_named("academic.student.final_assignment.reference.categories.create_categorie", categories::create_categorie)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.categories.options_categories", categories::options_categories),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.categories.get_categorie", categories::get_categorie)
                        .put_named("academic.student.final_assignment.reference.categories.update_categorie", categories::update_categorie)
                        .delete_named("academic.student.final_assignment.reference.categories.delete_categorie", categories::delete_categorie),
                ),
        )
        .push(
            Router::with_path("requirements")
                .get_named("academic.student.final_assignment.reference.requirements.list_requirements", requirements::list_requirements)
                .post_named("academic.student.final_assignment.reference.requirements.create_requirement", requirements::create_requirement)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.requirements.options_requirements", requirements::options_requirements),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.requirements.get_requirement", requirements::get_requirement)
                        .put_named("academic.student.final_assignment.reference.requirements.update_requirement", requirements::update_requirement)
                        .delete_named("academic.student.final_assignment.reference.requirements.delete_requirement", requirements::delete_requirement),
                ),
        )
        .push(
            Router::with_path("stages")
                .get_named("academic.student.final_assignment.reference.stages.list_stages", stages::list_stages)
                .post_named("academic.student.final_assignment.reference.stages.create_stage", stages::create_stage)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.stages.options_stages", stages::options_stages),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.stages.get_stage", stages::get_stage)
                        .put_named("academic.student.final_assignment.reference.stages.update_stage", stages::update_stage)
                        .delete_named("academic.student.final_assignment.reference.stages.delete_stage", stages::delete_stage),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("academic.student.final_assignment.reference.varieties.list_varieties", varieties::list_varieties)
                .post_named("academic.student.final_assignment.reference.varieties.create_varietie", varieties::create_varietie)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.reference.varieties.options_varieties", varieties::options_varieties),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.reference.varieties.get_varietie", varieties::get_varietie)
                        .put_named("academic.student.final_assignment.reference.varieties.update_varietie", varieties::update_varietie)
                        .delete_named("academic.student.final_assignment.reference.varieties.delete_varietie", varieties::delete_varietie),
                ),
        )
}
