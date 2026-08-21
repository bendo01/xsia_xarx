use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod conducts;
pub mod responds;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("conducts")
                .get_named("academic.survey.transaction.conducts.list_conducts", conducts::list_conducts)
                .post_named("academic.survey.transaction.conducts.create_conduct", conducts::create_conduct)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.transaction.conducts.get_conduct", conducts::get_conduct)
                        .put_named("academic.survey.transaction.conducts.update_conduct", conducts::update_conduct)
                        .delete_named("academic.survey.transaction.conducts.delete_conduct", conducts::delete_conduct),
                ),
        )
        .push(
            Router::with_path("responds")
                .get_named("academic.survey.transaction.responds.list_responds", responds::list_responds)
                .post_named("academic.survey.transaction.responds.create_respond", responds::create_respond)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.survey.transaction.responds.get_respond", responds::get_respond)
                        .put_named("academic.survey.transaction.responds.update_respond", responds::update_respond)
                        .delete_named("academic.survey.transaction.responds.delete_respond", responds::delete_respond),
                ),
        )
}
