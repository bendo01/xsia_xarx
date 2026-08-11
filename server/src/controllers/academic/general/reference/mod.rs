use salvo::prelude::*;

pub mod academic_year_categories;
pub mod academic_years;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("academic-year-categories")
                .get(academic_year_categories::list_academic_year_categories)
                .post(academic_year_categories::create_academic_year_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(academic_year_categories::get_academic_year_categorie)
                        .put(academic_year_categories::update_academic_year_categorie)
                        .delete(academic_year_categories::delete_academic_year_categorie),
                ),
        )
        .push(
            Router::with_path("academic-years")
                .get(academic_years::list_academic_years)
                .post(academic_years::create_academic_year)
                .push(
                    Router::with_path("{id}")
                        .get(academic_years::get_academic_year)
                        .put(academic_years::update_academic_year)
                        .delete(academic_years::delete_academic_year),
                ),
        )
}
