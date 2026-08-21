use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod answers;
pub mod bundle_question;
pub mod bundles;
pub mod questions;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("answers")
                .get_named("academic.survey.master.answers.list_answers", answers::list_answers)
                .post_named("academic.survey.master.answers.create_answer", answers::create_answer)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.answers.get_answer", answers::get_answer)
                        .put_named("academic.survey.master.answers.update_answer", answers::update_answer)
                        .delete_named("academic.survey.master.answers.delete_answer", answers::delete_answer),
                ),
        )
        .push(
            Router::with_path("bundle-question")
                .get_named("academic.survey.master.bundle_question.list_bundle_question", bundle_question::list_bundle_question)
                .post_named("academic.survey.master.bundle_question.create_bundle_question", bundle_question::create_bundle_question)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.bundle_question.get_bundle_question", bundle_question::get_bundle_question)
                        .put_named("academic.survey.master.bundle_question.update_bundle_question", bundle_question::update_bundle_question)
                        .delete_named("academic.survey.master.bundle_question.delete_bundle_question", bundle_question::delete_bundle_question),
                ),
        )
        .push(
            Router::with_path("bundles")
                .get_named("academic.survey.master.bundles.list_bundles", bundles::list_bundles)
                .post_named("academic.survey.master.bundles.create_bundle", bundles::create_bundle)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.bundles.get_bundle", bundles::get_bundle)
                        .put_named("academic.survey.master.bundles.update_bundle", bundles::update_bundle)
                        .delete_named("academic.survey.master.bundles.delete_bundle", bundles::delete_bundle),
                ),
        )
        .push(
            Router::with_path("questions")
                .get_named("academic.survey.master.questions.list_questions", questions::list_questions)
                .post_named("academic.survey.master.questions.create_question", questions::create_question)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.questions.get_question", questions::get_question)
                        .put_named("academic.survey.master.questions.update_question", questions::update_question)
                        .delete_named("academic.survey.master.questions.delete_question", questions::delete_question),
                ),
        )
}
