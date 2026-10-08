use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod attend_types;
pub mod calendar_categories;
pub mod encounter_categories;
pub mod implementations;
pub mod scopes;
pub mod substances;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("attend-types")
                .get_named("academic.campaign.reference.attend_types.index", attend_types::index)
                .post_named("academic.campaign.reference.attend_types.store", attend_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.attend_types.option_select", attend_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.attend_types.show", attend_types::show)
                        .put_named("academic.campaign.reference.attend_types.update", attend_types::update)
                        .delete_named("academic.campaign.reference.attend_types.delete", attend_types::delete),
                ),
        )
        .push(
            Router::with_path("calendar-categories")
                .get_named("academic.campaign.reference.calendar_categories.index", calendar_categories::index)
                .post_named("academic.campaign.reference.calendar_categories.store", calendar_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.calendar_categories.option_select", calendar_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.calendar_categories.show", calendar_categories::show)
                        .put_named("academic.campaign.reference.calendar_categories.update", calendar_categories::update)
                        .delete_named("academic.campaign.reference.calendar_categories.delete", calendar_categories::delete),
                ),
        )
        .push(
            Router::with_path("encounter-categories")
                .get_named("academic.campaign.reference.encounter_categories.index", encounter_categories::index)
                .post_named("academic.campaign.reference.encounter_categories.store", encounter_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.encounter_categories.option_select", encounter_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.encounter_categories.show", encounter_categories::show)
                        .put_named("academic.campaign.reference.encounter_categories.update", encounter_categories::update)
                        .delete_named("academic.campaign.reference.encounter_categories.delete", encounter_categories::delete),
                ),
        )
        .push(
            Router::with_path("implementations")
                .get_named("academic.campaign.reference.implementations.index", implementations::index)
                .post_named("academic.campaign.reference.implementations.store", implementations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.implementations.option_select", implementations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.implementations.show", implementations::show)
                        .put_named("academic.campaign.reference.implementations.update", implementations::update)
                        .delete_named("academic.campaign.reference.implementations.delete", implementations::delete),
                ),
        )
        .push(
            Router::with_path("scopes")
                .get_named("academic.campaign.reference.scopes.index", scopes::index)
                .post_named("academic.campaign.reference.scopes.store", scopes::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.scopes.option_select", scopes::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.scopes.show", scopes::show)
                        .put_named("academic.campaign.reference.scopes.update", scopes::update)
                        .delete_named("academic.campaign.reference.scopes.delete", scopes::delete),
                ),
        )
        .push(
            Router::with_path("substances")
                .get_named("academic.campaign.reference.substances.index", substances::index)
                .post_named("academic.campaign.reference.substances.store", substances::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.substances.option_select", substances::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.substances.show", substances::show)
                        .put_named("academic.campaign.reference.substances.update", substances::update)
                        .delete_named("academic.campaign.reference.substances.delete", substances::delete),
                ),
        )
}
