use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod bundle_categories;
pub mod question_varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("bundle-categories")
                .get_named("academic.survey.reference.bundle_categories.list_bundle_categories", bundle_categories::index)
                .post_named("academic.survey.reference.bundle_categories.create_bundle_categorie", bundle_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.reference.bundle_categories.options_bundle_categories", bundle_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.reference.bundle_categories.get_bundle_categorie", bundle_categories::show)
                        .put_named("academic.survey.reference.bundle_categories.update_bundle_categorie", bundle_categories::update)
                        .delete_named("academic.survey.reference.bundle_categories.delete_bundle_categorie", bundle_categories::delete),
                ),
        )
        .push(
            Router::with_path("question-varieties")
                .get_named("academic.survey.reference.question_varieties.list_question_varieties", question_varieties::index)
                .post_named("academic.survey.reference.question_varieties.create_question_varietie", question_varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.reference.question_varieties.options_question_varieties", question_varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.reference.question_varieties.get_question_varietie", question_varieties::show)
                        .put_named("academic.survey.reference.question_varieties.update_question_varietie", question_varieties::update)
                        .delete_named("academic.survey.reference.question_varieties.delete_question_varietie", question_varieties::delete),
                ),
        )
}
