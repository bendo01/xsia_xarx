use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod candidate_unit;
pub mod candidates;
pub mod exam_classes;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("candidate-unit")
                .get_named("academic.candidate.master.candidate_unit.index", candidate_unit::index)
                .post_named("academic.candidate.master.candidate_unit.store", candidate_unit::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.master.candidate_unit.option_select", candidate_unit::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.candidate_unit.show", candidate_unit::show)
                        .put_named("academic.candidate.master.candidate_unit.update", candidate_unit::update)
                        .delete_named("academic.candidate.master.candidate_unit.delete", candidate_unit::delete),
                ),
        )
        .push(
            Router::with_path("candidates")
                .get_named("academic.candidate.master.candidates.index", candidates::index)
                .post_named("academic.candidate.master.candidates.store", candidates::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.master.candidates.option_select", candidates::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.candidates.show", candidates::show)
                        .put_named("academic.candidate.master.candidates.update", candidates::update)
                        .delete_named("academic.candidate.master.candidates.delete", candidates::delete),
                ),
        )
        .push(
            Router::with_path("exam-classes")
                .get_named("academic.candidate.master.exam_classes.index", exam_classes::index)
                .post_named("academic.candidate.master.exam_classes.store", exam_classes::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.master.exam_classes.option_select", exam_classes::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.exam_classes.show", exam_classes::show)
                        .put_named("academic.candidate.master.exam_classes.update", exam_classes::update)
                        .delete_named("academic.candidate.master.exam_classes.delete", exam_classes::delete),
                ),
        )
}
