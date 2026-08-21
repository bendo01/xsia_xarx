use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod candidate_unit;
pub mod candidates;
pub mod exam_classes;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("candidate-unit")
                .get_named("academic.candidate.master.candidate_unit.list_candidate_unit", candidate_unit::list_candidate_unit)
                .post_named("academic.candidate.master.candidate_unit.create_candidate_unit", candidate_unit::create_candidate_unit)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.candidate_unit.get_candidate_unit", candidate_unit::get_candidate_unit)
                        .put_named("academic.candidate.master.candidate_unit.update_candidate_unit", candidate_unit::update_candidate_unit)
                        .delete_named("academic.candidate.master.candidate_unit.delete_candidate_unit", candidate_unit::delete_candidate_unit),
                ),
        )
        .push(
            Router::with_path("candidates")
                .get_named("academic.candidate.master.candidates.list_candidates", candidates::list_candidates)
                .post_named("academic.candidate.master.candidates.create_candidate", candidates::create_candidate)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.candidates.get_candidate", candidates::get_candidate)
                        .put_named("academic.candidate.master.candidates.update_candidate", candidates::update_candidate)
                        .delete_named("academic.candidate.master.candidates.delete_candidate", candidates::delete_candidate),
                ),
        )
        .push(
            Router::with_path("exam-classes")
                .get_named("academic.candidate.master.exam_classes.list_exam_classes", exam_classes::list_exam_classes)
                .post_named("academic.candidate.master.exam_classes.create_exam_classe", exam_classes::create_exam_classe)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.master.exam_classes.get_exam_classe", exam_classes::get_exam_classe)
                        .put_named("academic.candidate.master.exam_classes.update_exam_classe", exam_classes::update_exam_classe)
                        .delete_named("academic.candidate.master.exam_classes.delete_exam_classe", exam_classes::delete_exam_classe),
                ),
        )
}
