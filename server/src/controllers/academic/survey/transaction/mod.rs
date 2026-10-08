use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod conducts;
pub mod responds;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("conducts")
                .get_named("academic.survey.transaction.conducts.list_conducts", conducts::index)
                .post_named("academic.survey.transaction.conducts.create_conduct", conducts::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.transaction.conducts.options_conducts", conducts::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.transaction.conducts.get_conduct", conducts::show)
                        .put_named("academic.survey.transaction.conducts.update_conduct", conducts::update)
                        .delete_named("academic.survey.transaction.conducts.delete_conduct", conducts::delete),
                ),
        )
        .push(
            Router::with_path("responds")
                .get_named("academic.survey.transaction.responds.list_responds", responds::index)
                .post_named("academic.survey.transaction.responds.create_respond", responds::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.survey.transaction.responds.options_responds", responds::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.transaction.responds.get_respond", responds::show)
                        .put_named("academic.survey.transaction.responds.update_respond", responds::update)
                        .delete_named("academic.survey.transaction.responds.delete_respond", responds::delete),
                ),
        )
}
