use salvo::prelude::*;

pub mod answers;
pub mod bundle_question;
pub mod bundles;
pub mod questions;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("answers")
                .get(answers::list_answers)
                .post(answers::create_answer)
                .push(
                    Router::with_path("{id}")
                        .get(answers::get_answer)
                        .put(answers::update_answer)
                        .delete(answers::delete_answer),
                ),
        )
        .push(
            Router::with_path("bundle-question")
                .get(bundle_question::list_bundle_question)
                .post(bundle_question::create_bundle_question)
                .push(
                    Router::with_path("{id}")
                        .get(bundle_question::get_bundle_question)
                        .put(bundle_question::update_bundle_question)
                        .delete(bundle_question::delete_bundle_question),
                ),
        )
        .push(
            Router::with_path("bundles")
                .get(bundles::list_bundles)
                .post(bundles::create_bundle)
                .push(
                    Router::with_path("{id}")
                        .get(bundles::get_bundle)
                        .put(bundles::update_bundle)
                        .delete(bundles::delete_bundle),
                ),
        )
        .push(
            Router::with_path("questions")
                .get(questions::list_questions)
                .post(questions::create_question)
                .push(
                    Router::with_path("{id}")
                        .get(questions::get_question)
                        .put(questions::update_question)
                        .delete(questions::delete_question),
                ),
        )
}
