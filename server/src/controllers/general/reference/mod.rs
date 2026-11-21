use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod weekdays;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("weekdays")
                .get_named("general.reference.weekdays.index", weekdays::index)
                .post_named("general.reference.weekdays.store", weekdays::store)
                .push(
                    Router::with_path("options")
                        .post_named("general.reference.weekdays.option_select", weekdays::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("general.reference.weekdays.show", weekdays::show)
                        .put_named("general.reference.weekdays.update", weekdays::update)
                        .delete_named("general.reference.weekdays.delete", weekdays::delete),
                ),
        )
}
