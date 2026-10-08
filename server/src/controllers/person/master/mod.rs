use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod biodata;
pub mod individual;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("biodata")
                .get_named("person.master.biodata.index", biodata::index)
                .post_named("person.master.biodata.store", biodata::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.master.biodata.option_select", biodata::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.master.biodata.show", biodata::show)
                        .put_named("person.master.biodata.update", biodata::update)
                        .delete_named("person.master.biodata.delete", biodata::delete),
                ),
        )
        .push(
            Router::with_path("individual")
                .get_named("person.master.individual.index", individual::index)
                .post_named("person.master.individual.store", individual::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.master.individual.option_select", individual::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.master.individual.show", individual::show)
                        .put_named("person.master.individual.update", individual::update)
                        .delete_named("person.master.individual.delete", individual::delete),
                ),
        )
}
