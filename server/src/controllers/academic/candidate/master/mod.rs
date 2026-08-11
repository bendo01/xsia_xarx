use salvo::prelude::*;

pub mod candidate_unit;
pub mod candidates;
pub mod exam_classes;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("candidate-unit")
                .get(candidate_unit::list_candidate_unit)
                .post(candidate_unit::create_candidate_unit)
                .push(
                    Router::with_path("{id}")
                        .get(candidate_unit::get_candidate_unit)
                        .put(candidate_unit::update_candidate_unit)
                        .delete(candidate_unit::delete_candidate_unit),
                ),
        )
        .push(
            Router::with_path("candidates")
                .get(candidates::list_candidates)
                .post(candidates::create_candidate)
                .push(
                    Router::with_path("{id}")
                        .get(candidates::get_candidate)
                        .put(candidates::update_candidate)
                        .delete(candidates::delete_candidate),
                ),
        )
        .push(
            Router::with_path("exam-classes")
                .get(exam_classes::list_exam_classes)
                .post(exam_classes::create_exam_classe)
                .push(
                    Router::with_path("{id}")
                        .get(exam_classes::get_exam_classe)
                        .put(exam_classes::update_exam_classe)
                        .delete(exam_classes::delete_exam_classe),
                ),
        )
}
