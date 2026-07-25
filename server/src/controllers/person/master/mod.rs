use salvo::oapi::OpenApi;
use salvo::oapi::swagger_ui::SwaggerUi;
use salvo::prelude::*;

pub mod biodata;
pub mod dto;
pub mod individual;

pub fn router() -> Router {
    let master_router = Router::with_path("master")
        .push(
            Router::with_path("individuals")
                .get(individual::list_individuals)
                .post(individual::create_individual)
                .push(
                    Router::with_path("{id}")
                        .get(individual::get_individual)
                        .put(individual::update_individual)
                        .delete(individual::delete_individual),
                ),
        )
        .push(
            Router::with_path("biodatas")
                .get(biodata::list_biodatas)
                .post(biodata::create_biodata)
                .push(
                    Router::with_path("by-individual/{individual_id}")
                        .get(biodata::get_biodata_by_individual),
                )
                .push(
                    Router::with_path("{id}")
                        .get(biodata::get_biodata)
                        .put(biodata::update_biodata)
                        .delete(biodata::delete_biodata),
                ),
        );

    master_router
}
