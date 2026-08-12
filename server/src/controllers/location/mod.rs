use salvo::prelude::*;

pub mod continents;
pub mod countries;
pub mod provinces;
pub mod regencies;
pub mod regency_types;
pub mod regions;
pub mod sub_districts;
pub mod villages;

pub fn router() -> Router {
    Router::with_path("")
        .push(
            Router::with_path("continents")
                .get(continents::list_continents)
                .post(continents::create_continent)
                .push(
                    Router::with_path("{id}")
                        .get(continents::get_continent)
                        .put(continents::update_continent)
                        .delete(continents::delete_continent),
                ),
        )
        .push(
            Router::with_path("countries")
                .get(countries::list_countries)
                .post(countries::create_countrie)
                .push(
                    Router::with_path("{id}")
                        .get(countries::get_countrie)
                        .put(countries::update_countrie)
                        .delete(countries::delete_countrie),
                ),
        )
        .push(
            Router::with_path("provinces")
                .get(provinces::list_provinces)
                .post(provinces::create_province)
                .push(
                    Router::with_path("{id}")
                        .get(provinces::get_province)
                        .put(provinces::update_province)
                        .delete(provinces::delete_province),
                ),
        )
        .push(
            Router::with_path("regencies")
                .get(regencies::list_regencies)
                .post(regencies::create_regencie)
                .push(
                    Router::with_path("{id}")
                        .get(regencies::get_regencie)
                        .put(regencies::update_regencie)
                        .delete(regencies::delete_regencie),
                ),
        )
        .push(
            Router::with_path("regency-types")
                .get(regency_types::list_regency_types)
                .post(regency_types::create_regency_type)
                .push(
                    Router::with_path("{id}")
                        .get(regency_types::get_regency_type)
                        .put(regency_types::update_regency_type)
                        .delete(regency_types::delete_regency_type),
                ),
        )
        .push(
            Router::with_path("regions")
                .get(regions::list_regions)
                .post(regions::create_region)
                .push(
                    Router::with_path("{id}")
                        .get(regions::get_region)
                        .put(regions::update_region)
                        .delete(regions::delete_region),
                ),
        )
        .push(
            Router::with_path("sub-districts")
                .get(sub_districts::list_sub_districts)
                .post(sub_districts::create_sub_district)
                .push(
                    Router::with_path("{id}")
                        .get(sub_districts::get_sub_district)
                        .put(sub_districts::update_sub_district)
                        .delete(sub_districts::delete_sub_district),
                ),
        )
        .push(
            Router::with_path("villages")
                .get(villages::list_villages)
                .post(villages::create_village)
                .push(
                    Router::with_path("{id}")
                        .get(villages::get_village)
                        .put(villages::update_village)
                        .delete(villages::delete_village),
                ),
        )
}
