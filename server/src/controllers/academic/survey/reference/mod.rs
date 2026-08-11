use salvo::prelude::*;

pub mod bundle_categories;
pub mod question_varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("bundle-categories")
                .get(bundle_categories::list_bundle_categories)
                .post(bundle_categories::create_bundle_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(bundle_categories::get_bundle_categorie)
                        .put(bundle_categories::update_bundle_categorie)
                        .delete(bundle_categories::delete_bundle_categorie),
                ),
        )
        .push(
            Router::with_path("question-varieties")
                .get(question_varieties::list_question_varieties)
                .post(question_varieties::create_question_varietie)
                .push(
                    Router::with_path("{id}")
                        .get(question_varieties::get_question_varietie)
                        .put(question_varieties::update_question_varietie)
                        .delete(question_varieties::delete_question_varietie),
                ),
        )
}
