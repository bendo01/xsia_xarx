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
                .get_named("academic.campaign.reference.attend_types.list_attend_types", attend_types::index)
                .post_named("academic.campaign.reference.attend_types.create_attend_type", attend_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.attend_types.options_attend_types", attend_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.attend_types.get_attend_type", attend_types::show)
                        .put_named("academic.campaign.reference.attend_types.update_attend_type", attend_types::update)
                        .delete_named("academic.campaign.reference.attend_types.delete_attend_type", attend_types::delete),
                ),
        )
        .push(
            Router::with_path("calendar-categories")
                .get_named("academic.campaign.reference.calendar_categories.list_calendar_categories", calendar_categories::index)
                .post_named("academic.campaign.reference.calendar_categories.create_calendar_categorie", calendar_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.calendar_categories.options_calendar_categories", calendar_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.calendar_categories.get_calendar_categorie", calendar_categories::show)
                        .put_named("academic.campaign.reference.calendar_categories.update_calendar_categorie", calendar_categories::update)
                        .delete_named("academic.campaign.reference.calendar_categories.delete_calendar_categorie", calendar_categories::delete),
                ),
        )
        .push(
            Router::with_path("encounter-categories")
                .get_named("academic.campaign.reference.encounter_categories.list_encounter_categories", encounter_categories::index)
                .post_named("academic.campaign.reference.encounter_categories.create_encounter_categorie", encounter_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.encounter_categories.options_encounter_categories", encounter_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.encounter_categories.get_encounter_categorie", encounter_categories::show)
                        .put_named("academic.campaign.reference.encounter_categories.update_encounter_categorie", encounter_categories::update)
                        .delete_named("academic.campaign.reference.encounter_categories.delete_encounter_categorie", encounter_categories::delete),
                ),
        )
        .push(
            Router::with_path("implementations")
                .get_named("academic.campaign.reference.implementations.list_implementations", implementations::index)
                .post_named("academic.campaign.reference.implementations.create_implementation", implementations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.implementations.options_implementations", implementations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.implementations.get_implementation", implementations::show)
                        .put_named("academic.campaign.reference.implementations.update_implementation", implementations::update)
                        .delete_named("academic.campaign.reference.implementations.delete_implementation", implementations::delete),
                ),
        )
        .push(
            Router::with_path("scopes")
                .get_named("academic.campaign.reference.scopes.list_scopes", scopes::index)
                .post_named("academic.campaign.reference.scopes.create_scope", scopes::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.scopes.options_scopes", scopes::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.scopes.get_scope", scopes::show)
                        .put_named("academic.campaign.reference.scopes.update_scope", scopes::update)
                        .delete_named("academic.campaign.reference.scopes.delete_scope", scopes::delete),
                ),
        )
        .push(
            Router::with_path("substances")
                .get_named("academic.campaign.reference.substances.list_substances", substances::index)
                .post_named("academic.campaign.reference.substances.create_substance", substances::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.substances.options_substances", substances::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.substances.get_substance", substances::show)
                        .put_named("academic.campaign.reference.substances.update_substance", substances::update)
                        .delete_named("academic.campaign.reference.substances.delete_substance", substances::delete),
                ),
        )
}
