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
                .get_named("academic.survey.master.answers.index", answers::index)
                .post_named("academic.survey.master.answers.store", answers::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.answers.option_select", answers::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.answers.show", answers::show)
                        .put_named("academic.survey.master.answers.update", answers::update)
                        .delete_named("academic.survey.master.answers.delete", answers::delete),
                ),
        )
        .push(
            Router::with_path("bundle-question")
                .get_named("academic.survey.master.bundle_question.index", bundle_question::index)
                .post_named("academic.survey.master.bundle_question.store", bundle_question::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.bundle_question.option_select", bundle_question::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.bundle_question.show", bundle_question::show)
                        .put_named("academic.survey.master.bundle_question.update", bundle_question::update)
                        .delete_named("academic.survey.master.bundle_question.delete", bundle_question::delete),
                ),
        )
        .push(
            Router::with_path("bundles")
                .get_named("academic.survey.master.bundles.index", bundles::index)
                .post_named("academic.survey.master.bundles.store", bundles::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.bundles.option_select", bundles::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.bundles.show", bundles::show)
                        .put_named("academic.survey.master.bundles.update", bundles::update)
                        .delete_named("academic.survey.master.bundles.delete", bundles::delete),
                ),
        )
        .push(
            Router::with_path("questions")
                .get_named("academic.survey.master.questions.index", questions::index)
                .post_named("academic.survey.master.questions.store", questions::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.master.questions.option_select", questions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.master.questions.show", questions::show)
                        .put_named("academic.survey.master.questions.update", questions::update)
                        .delete_named("academic.survey.master.questions.delete", questions::delete),
                ),
        )
}
