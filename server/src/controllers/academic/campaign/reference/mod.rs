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
                .get_named("academic.campaign.reference.attend_types.list_attend_types", attend_types::list_attend_types)
                .post_named("academic.campaign.reference.attend_types.create_attend_type", attend_types::create_attend_type)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.attend_types.options_attend_types", attend_types::options_attend_types),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.attend_types.get_attend_type", attend_types::get_attend_type)
                        .put_named("academic.campaign.reference.attend_types.update_attend_type", attend_types::update_attend_type)
                        .delete_named("academic.campaign.reference.attend_types.delete_attend_type", attend_types::delete_attend_type),
                ),
        )
        .push(
            Router::with_path("calendar-categories")
                .get_named("academic.campaign.reference.calendar_categories.list_calendar_categories", calendar_categories::list_calendar_categories)
                .post_named("academic.campaign.reference.calendar_categories.create_calendar_categorie", calendar_categories::create_calendar_categorie)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.calendar_categories.options_calendar_categories", calendar_categories::options_calendar_categories),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.calendar_categories.get_calendar_categorie", calendar_categories::get_calendar_categorie)
                        .put_named("academic.campaign.reference.calendar_categories.update_calendar_categorie", calendar_categories::update_calendar_categorie)
                        .delete_named("academic.campaign.reference.calendar_categories.delete_calendar_categorie", calendar_categories::delete_calendar_categorie),
                ),
        )
        .push(
            Router::with_path("encounter-categories")
                .get_named("academic.campaign.reference.encounter_categories.list_encounter_categories", encounter_categories::list_encounter_categories)
                .post_named("academic.campaign.reference.encounter_categories.create_encounter_categorie", encounter_categories::create_encounter_categorie)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.encounter_categories.options_encounter_categories", encounter_categories::options_encounter_categories),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.encounter_categories.get_encounter_categorie", encounter_categories::get_encounter_categorie)
                        .put_named("academic.campaign.reference.encounter_categories.update_encounter_categorie", encounter_categories::update_encounter_categorie)
                        .delete_named("academic.campaign.reference.encounter_categories.delete_encounter_categorie", encounter_categories::delete_encounter_categorie),
                ),
        )
        .push(
            Router::with_path("implementations")
                .get_named("academic.campaign.reference.implementations.list_implementations", implementations::list_implementations)
                .post_named("academic.campaign.reference.implementations.create_implementation", implementations::create_implementation)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.implementations.options_implementations", implementations::options_implementations),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.implementations.get_implementation", implementations::get_implementation)
                        .put_named("academic.campaign.reference.implementations.update_implementation", implementations::update_implementation)
                        .delete_named("academic.campaign.reference.implementations.delete_implementation", implementations::delete_implementation),
                ),
        )
        .push(
            Router::with_path("scopes")
                .get_named("academic.campaign.reference.scopes.list_scopes", scopes::list_scopes)
                .post_named("academic.campaign.reference.scopes.create_scope", scopes::create_scope)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.scopes.options_scopes", scopes::options_scopes),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.scopes.get_scope", scopes::get_scope)
                        .put_named("academic.campaign.reference.scopes.update_scope", scopes::update_scope)
                        .delete_named("academic.campaign.reference.scopes.delete_scope", scopes::delete_scope),
                ),
        )
        .push(
            Router::with_path("substances")
                .get_named("academic.campaign.reference.substances.list_substances", substances::list_substances)
                .post_named("academic.campaign.reference.substances.create_substance", substances::create_substance)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.reference.substances.options_substances", substances::options_substances),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.reference.substances.get_substance", substances::get_substance)
                        .put_named("academic.campaign.reference.substances.update_substance", substances::update_substance)
                        .delete_named("academic.campaign.reference.substances.delete_substance", substances::delete_substance),
                ),
        )
}
