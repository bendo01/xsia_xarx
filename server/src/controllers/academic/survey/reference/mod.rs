use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod bundle_categories;
pub mod question_varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("bundle-categories")
                .get_named("academic.survey.reference.bundle_categories.index", bundle_categories::index)
                .post_named("academic.survey.reference.bundle_categories.store", bundle_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.reference.bundle_categories.option_select", bundle_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.reference.bundle_categories.show", bundle_categories::show)
                        .put_named("academic.survey.reference.bundle_categories.update", bundle_categories::update)
                        .delete_named("academic.survey.reference.bundle_categories.delete", bundle_categories::delete),
                ),
        )
        .push(
            Router::with_path("question-varieties")
                .get_named("academic.survey.reference.question_varieties.index", question_varieties::index)
                .post_named("academic.survey.reference.question_varieties.store", question_varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.reference.question_varieties.option_select", question_varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.reference.question_varieties.show", question_varieties::show)
                        .put_named("academic.survey.reference.question_varieties.update", question_varieties::update)
                        .delete_named("academic.survey.reference.question_varieties.delete", question_varieties::delete),
                ),
        )
}
