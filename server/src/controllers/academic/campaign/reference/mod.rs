use salvo::prelude::*;

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
                .get(attend_types::list_attend_types)
                .post(attend_types::create_attend_type)
                .push(
                    Router::with_path("{id}")
                        .get(attend_types::get_attend_type)
                        .put(attend_types::update_attend_type)
                        .delete(attend_types::delete_attend_type),
                ),
        )
        .push(
            Router::with_path("calendar-categories")
                .get(calendar_categories::list_calendar_categories)
                .post(calendar_categories::create_calendar_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(calendar_categories::get_calendar_categorie)
                        .put(calendar_categories::update_calendar_categorie)
                        .delete(calendar_categories::delete_calendar_categorie),
                ),
        )
        .push(
            Router::with_path("encounter-categories")
                .get(encounter_categories::list_encounter_categories)
                .post(encounter_categories::create_encounter_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(encounter_categories::get_encounter_categorie)
                        .put(encounter_categories::update_encounter_categorie)
                        .delete(encounter_categories::delete_encounter_categorie),
                ),
        )
        .push(
            Router::with_path("implementations")
                .get(implementations::list_implementations)
                .post(implementations::create_implementation)
                .push(
                    Router::with_path("{id}")
                        .get(implementations::get_implementation)
                        .put(implementations::update_implementation)
                        .delete(implementations::delete_implementation),
                ),
        )
        .push(
            Router::with_path("scopes")
                .get(scopes::list_scopes)
                .post(scopes::create_scope)
                .push(
                    Router::with_path("{id}")
                        .get(scopes::get_scope)
                        .put(scopes::update_scope)
                        .delete(scopes::delete_scope),
                ),
        )
        .push(
            Router::with_path("substances")
                .get(substances::list_substances)
                .post(substances::create_substance)
                .push(
                    Router::with_path("{id}")
                        .get(substances::get_substance)
                        .put(substances::update_substance)
                        .delete(substances::delete_substance),
                ),
        )
}
