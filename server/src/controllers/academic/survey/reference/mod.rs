use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod bundle_categories;
pub mod question_varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("bundle-categories")
                .get_named("academic.survey.reference.bundle_categories.list_bundle_categories", bundle_categories::list_bundle_categories)
                .post_named("academic.survey.reference.bundle_categories.create_bundle_categorie", bundle_categories::create_bundle_categorie)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.reference.bundle_categories.options_bundle_categories", bundle_categories::options_bundle_categories),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.reference.bundle_categories.get_bundle_categorie", bundle_categories::get_bundle_categorie)
                        .put_named("academic.survey.reference.bundle_categories.update_bundle_categorie", bundle_categories::update_bundle_categorie)
                        .delete_named("academic.survey.reference.bundle_categories.delete_bundle_categorie", bundle_categories::delete_bundle_categorie),
                ),
        )
        .push(
            Router::with_path("question-varieties")
                .get_named("academic.survey.reference.question_varieties.list_question_varieties", question_varieties::list_question_varieties)
                .post_named("academic.survey.reference.question_varieties.create_question_varietie", question_varieties::create_question_varietie)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.reference.question_varieties.options_question_varieties", question_varieties::options_question_varieties),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.reference.question_varieties.get_question_varietie", question_varieties::get_question_varietie)
                        .put_named("academic.survey.reference.question_varieties.update_question_varietie", question_varieties::update_question_varietie)
                        .delete_named("academic.survey.reference.question_varieties.delete_question_varietie", question_varieties::delete_question_varietie),
                ),
        )
}
