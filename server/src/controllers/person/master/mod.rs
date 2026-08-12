use salvo::prelude::*;

pub mod biodata;
pub mod individual;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("biodata")
                .get(biodata::list_biodata)
                .post(biodata::create_biodata)
                .push(
                    Router::with_path("{id}")
                        .get(biodata::get_biodata)
                        .put(biodata::update_biodata)
                        .delete(biodata::delete_biodata),
                ),
        )
        .push(
            Router::with_path("individual")
                .get(individual::list_individual)
                .post(individual::create_individual)
                .push(
                    Router::with_path("{id}")
                        .get(individual::get_individual)
                        .put(individual::update_individual)
                        .delete(individual::delete_individual),
                ),
        )
}
