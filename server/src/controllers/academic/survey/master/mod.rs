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
                .get_named("academic.survey.master.answers.list_answers", answers::index)
                .post_named("academic.survey.master.answers.create_answer", answers::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.answers.options_answers", answers::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.answers.get_answer", answers::show)
                        .put_named("academic.survey.master.answers.update_answer", answers::update)
                        .delete_named("academic.survey.master.answers.delete_answer", answers::delete),
                ),
        )
        .push(
            Router::with_path("bundle-question")
                .get_named("academic.survey.master.bundle_question.list_bundle_question", bundle_question::index)
                .post_named("academic.survey.master.bundle_question.create_bundle_question", bundle_question::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.bundle_question.options_bundle_question", bundle_question::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.bundle_question.get_bundle_question", bundle_question::show)
                        .put_named("academic.survey.master.bundle_question.update_bundle_question", bundle_question::update)
                        .delete_named("academic.survey.master.bundle_question.delete_bundle_question", bundle_question::delete),
                ),
        )
        .push(
            Router::with_path("bundles")
                .get_named("academic.survey.master.bundles.list_bundles", bundles::index)
                .post_named("academic.survey.master.bundles.create_bundle", bundles::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.bundles.options_bundles", bundles::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.bundles.get_bundle", bundles::show)
                        .put_named("academic.survey.master.bundles.update_bundle", bundles::update)
                        .delete_named("academic.survey.master.bundles.delete_bundle", bundles::delete),
                ),
        )
        .push(
            Router::with_path("questions")
                .get_named("academic.survey.master.questions.list_questions", questions::index)
                .post_named("academic.survey.master.questions.create_question", questions::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.questions.options_questions", questions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.questions.get_question", questions::show)
                        .put_named("academic.survey.master.questions.update_question", questions::update)
                        .delete_named("academic.survey.master.questions.delete_question", questions::delete),
                ),
        )
}
