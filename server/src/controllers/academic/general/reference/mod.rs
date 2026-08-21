use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod academic_year_categories;
pub mod academic_years;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("academic-year-categories")
                .get_named("academic.general.reference.academic_year_categories.list_academic_year_categories", academic_year_categories::list_academic_year_categories)
                .post_named("academic.general.reference.academic_year_categories.create_academic_year_categorie", academic_year_categories::create_academic_year_categorie)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.general.reference.academic_year_categories.get_academic_year_categorie", academic_year_categories::get_academic_year_categorie)
                        .put_named("academic.general.reference.academic_year_categories.update_academic_year_categorie", academic_year_categories::update_academic_year_categorie)
                        .delete_named("academic.general.reference.academic_year_categories.delete_academic_year_categorie", academic_year_categories::delete_academic_year_categorie),
                ),
        )
        .push(
            Router::with_path("academic-years")
                .get_named("academic.general.reference.academic_years.list_academic_years", academic_years::list_academic_years)
                .post_named("academic.general.reference.academic_years.create_academic_year", academic_years::create_academic_year)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.general.reference.academic_years.get_academic_year", academic_years::get_academic_year)
                        .put_named("academic.general.reference.academic_years.update_academic_year", academic_years::update_academic_year)
                        .delete_named("academic.general.reference.academic_years.delete_academic_year", academic_years::delete_academic_year),
                ),
        )
}
