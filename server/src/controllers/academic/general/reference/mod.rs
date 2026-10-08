use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod academic_year_categories;
pub mod academic_years;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("academic-year-categories")
                .get_named("academic.general.reference.academic_year_categories.index", academic_year_categories::index)
                .post_named("academic.general.reference.academic_year_categories.store", academic_year_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.general.reference.academic_year_categories.option_select", academic_year_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.general.reference.academic_year_categories.show", academic_year_categories::show)
                        .put_named("academic.general.reference.academic_year_categories.update", academic_year_categories::update)
                        .delete_named("academic.general.reference.academic_year_categories.delete", academic_year_categories::delete),
                ),
        )
        .push(
            Router::with_path("academic-years")
                .get_named("academic.general.reference.academic_years.index", academic_years::index)
                .post_named("academic.general.reference.academic_years.store", academic_years::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.general.reference.academic_years.option_select", academic_years::option_select)
                        .get_named("academic.general.reference.academic_years.option_select_get", academic_years::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.general.reference.academic_years.show", academic_years::show)
                        .put_named("academic.general.reference.academic_years.update", academic_years::update)
                        .delete_named("academic.general.reference.academic_years.delete", academic_years::delete),
                ),
        )
}
