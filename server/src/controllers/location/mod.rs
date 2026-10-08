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
                .get_named("location.continents.list_continents", continents::index)
                .post_named("location.continents.create_continent", continents::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.continents.options_continents", continents::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.continents.get_continent", continents::show)
                        .put_named("location.continents.update_continent", continents::update)
                        .delete_named("location.continents.delete_continent", continents::delete),
                ),
        )
        .push(
            Router::with_path("countries")
                .get_named("location.countries.list_countries", countries::index)
                .post_named("location.countries.create_countrie", countries::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.countries.options_countries", countries::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.countries.get_countrie", countries::show)
                        .put_named("location.countries.update_countrie", countries::update)
                        .delete_named("location.countries.delete_countrie", countries::delete),
                ),
        )
        .push(
            Router::with_path("provinces")
                .get_named("location.provinces.list_provinces", provinces::index)
                .post_named("location.provinces.create_province", provinces::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.provinces.options_provinces", provinces::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.provinces.get_province", provinces::show)
                        .put_named("location.provinces.update_province", provinces::update)
                        .delete_named("location.provinces.delete_province", provinces::delete),
                ),
        )
        .push(
            Router::with_path("regencies")
                .get_named("location.regencies.list_regencies", regencies::index)
                .post_named("location.regencies.create_regencie", regencies::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.regencies.options_regencies", regencies::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regencies.get_regencie", regencies::show)
                        .put_named("location.regencies.update_regencie", regencies::update)
                        .delete_named("location.regencies.delete_regencie", regencies::delete),
                ),
        )
        .push(
            Router::with_path("regency-types")
                .get_named("location.regency_types.list_regency_types", regency_types::index)
                .post_named("location.regency_types.create_regency_type", regency_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.regency_types.options_regency_types", regency_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regency_types.get_regency_type", regency_types::show)
                        .put_named("location.regency_types.update_regency_type", regency_types::update)
                        .delete_named("location.regency_types.delete_regency_type", regency_types::delete),
                ),
        )
        .push(
            Router::with_path("regions")
                .get_named("location.regions.list_regions", regions::index)
                .post_named("location.regions.create_region", regions::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.regions.options_regions", regions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regions.get_region", regions::show)
                        .put_named("location.regions.update_region", regions::update)
                        .delete_named("location.regions.delete_region", regions::delete),
                ),
        )
        .push(
            Router::with_path("sub-districts")
                .get_named("location.sub_districts.list_sub_districts", sub_districts::index)
                .post_named("location.sub_districts.create_sub_district", sub_districts::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.sub_districts.options_sub_districts", sub_districts::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.sub_districts.get_sub_district", sub_districts::show)
                        .put_named("location.sub_districts.update_sub_district", sub_districts::update)
                        .delete_named("location.sub_districts.delete_sub_district", sub_districts::delete),
                ),
        )
        .push(
            Router::with_path("villages")
                .get_named("location.villages.list_villages", villages::index)
                .post_named("location.villages.create_village", villages::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.villages.options_villages", villages::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.villages.get_village", villages::show)
                        .put_named("location.villages.update_village", villages::update)
                        .delete_named("location.villages.delete_village", villages::delete),
                ),
        )
}
