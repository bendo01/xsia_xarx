use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod biodata;
pub mod individual;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("biodata")
                .get_named("person.master.biodata.list_biodata", biodata::list_biodata)
                .post_named("person.master.biodata.create_biodata", biodata::create_biodata)
                .push(
                    Router::with_path("{id}")
                        .get_named("person.master.biodata.get_biodata", biodata::get_biodata)
                        .put_named("person.master.biodata.update_biodata", biodata::update_biodata)
                        .delete_named("person.master.biodata.delete_biodata", biodata::delete_biodata),
                ),
        )
        .push(
            Router::with_path("individual")
                .get_named("person.master.individual.list_individual", individual::list_individual)
                .post_named("person.master.individual.create_individual", individual::create_individual)
                .push(
                    Router::with_path("{id}")
                        .get_named("person.master.individual.get_individual", individual::get_individual)
                        .put_named("person.master.individual.update_individual", individual::update_individual)
                        .delete_named("person.master.individual.delete_individual", individual::delete_individual),
                ),
        )
}
