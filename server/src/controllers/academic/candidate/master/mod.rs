use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod candidate_unit;
pub mod candidates;
pub mod exam_classes;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("candidate-unit")
                .get_named("academic.candidate.master.candidate_unit.list_candidate_unit", candidate_unit::index)
                .post_named("academic.candidate.master.candidate_unit.create_candidate_unit", candidate_unit::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.master.candidate_unit.options_candidate_unit", candidate_unit::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.candidate_unit.get_candidate_unit", candidate_unit::show)
                        .put_named("academic.candidate.master.candidate_unit.update_candidate_unit", candidate_unit::update)
                        .delete_named("academic.candidate.master.candidate_unit.delete_candidate_unit", candidate_unit::delete),
                ),
        )
        .push(
            Router::with_path("candidates")
                .get_named("academic.candidate.master.candidates.list_candidates", candidates::index)
                .post_named("academic.candidate.master.candidates.create_candidate", candidates::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.master.candidates.options_candidates", candidates::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.candidates.get_candidate", candidates::show)
                        .put_named("academic.candidate.master.candidates.update_candidate", candidates::update)
                        .delete_named("academic.candidate.master.candidates.delete_candidate", candidates::delete),
                ),
        )
        .push(
            Router::with_path("exam-classes")
                .get_named("academic.candidate.master.exam_classes.list_exam_classes", exam_classes::index)
                .post_named("academic.candidate.master.exam_classes.create_exam_classe", exam_classes::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.master.exam_classes.options_exam_classes", exam_classes::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.exam_classes.get_exam_classe", exam_classes::show)
                        .put_named("academic.candidate.master.exam_classes.update_exam_classe", exam_classes::update)
                        .delete_named("academic.candidate.master.exam_classes.delete_exam_classe", exam_classes::delete),
                ),
        )
}
