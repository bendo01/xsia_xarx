use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod conducts;
pub mod responds;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("conducts")
                .get_named("academic.survey.transaction.conducts.index", conducts::index)
                .post_named("academic.survey.transaction.conducts.store", conducts::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.transaction.conducts.option_select", conducts::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.transaction.conducts.show", conducts::show)
                        .put_named("academic.survey.transaction.conducts.update", conducts::update)
                        .delete_named("academic.survey.transaction.conducts.delete", conducts::delete),
                ),
        )
        .push(
            Router::with_path("responds")
                .get_named("academic.survey.transaction.responds.index", responds::index)
                .post_named("academic.survey.transaction.responds.store", responds::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.transaction.responds.option_select", responds::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.transaction.responds.show", responds::show)
                        .put_named("academic.survey.transaction.responds.update", responds::update)
                        .delete_named("academic.survey.transaction.responds.delete", responds::delete),
                ),
        )
}
