use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

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
                .get_named("location.continents.list_continents", continents::list_continents)
                .post_named("location.continents.create_continent", continents::create_continent)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.continents.get_continent", continents::get_continent)
                        .put_named("location.continents.update_continent", continents::update_continent)
                        .delete_named("location.continents.delete_continent", continents::delete_continent),
                ),
        )
        .push(
            Router::with_path("countries")
                .get_named("location.countries.list_countries", countries::list_countries)
                .post_named("location.countries.create_countrie", countries::create_countrie)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.countries.get_countrie", countries::get_countrie)
                        .put_named("location.countries.update_countrie", countries::update_countrie)
                        .delete_named("location.countries.delete_countrie", countries::delete_countrie),
                ),
        )
        .push(
            Router::with_path("provinces")
                .get_named("location.provinces.list_provinces", provinces::list_provinces)
                .post_named("location.provinces.create_province", provinces::create_province)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.provinces.get_province", provinces::get_province)
                        .put_named("location.provinces.update_province", provinces::update_province)
                        .delete_named("location.provinces.delete_province", provinces::delete_province),
                ),
        )
        .push(
            Router::with_path("regencies")
                .get_named("location.regencies.list_regencies", regencies::list_regencies)
                .post_named("location.regencies.create_regencie", regencies::create_regencie)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regencies.get_regencie", regencies::get_regencie)
                        .put_named("location.regencies.update_regencie", regencies::update_regencie)
                        .delete_named("location.regencies.delete_regencie", regencies::delete_regencie),
                ),
        )
        .push(
            Router::with_path("regency-types")
                .get_named("location.regency_types.list_regency_types", regency_types::list_regency_types)
                .post_named("location.regency_types.create_regency_type", regency_types::create_regency_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regency_types.get_regency_type", regency_types::get_regency_type)
                        .put_named("location.regency_types.update_regency_type", regency_types::update_regency_type)
                        .delete_named("location.regency_types.delete_regency_type", regency_types::delete_regency_type),
                ),
        )
        .push(
            Router::with_path("regions")
                .get_named("location.regions.list_regions", regions::list_regions)
                .post_named("location.regions.create_region", regions::create_region)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regions.get_region", regions::get_region)
                        .put_named("location.regions.update_region", regions::update_region)
                        .delete_named("location.regions.delete_region", regions::delete_region),
                ),
        )
        .push(
            Router::with_path("sub-districts")
                .get_named("location.sub_districts.list_sub_districts", sub_districts::list_sub_districts)
                .post_named("location.sub_districts.create_sub_district", sub_districts::create_sub_district)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.sub_districts.get_sub_district", sub_districts::get_sub_district)
                        .put_named("location.sub_districts.update_sub_district", sub_districts::update_sub_district)
                        .delete_named("location.sub_districts.delete_sub_district", sub_districts::delete_sub_district),
                ),
        )
        .push(
            Router::with_path("villages")
                .get_named("location.villages.list_villages", villages::list_villages)
                .post_named("location.villages.create_village", villages::create_village)
                .push(
                    Router::with_path("{id}")
                        .get_named("location.villages.get_village", villages::get_village)
                        .put_named("location.villages.update_village", villages::update_village)
                        .delete_named("location.villages.delete_village", villages::delete_village),
                ),
        )
}
