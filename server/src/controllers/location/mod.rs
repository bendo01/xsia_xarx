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
                .get_named("location.continents.index", continents::index)
                .post_named("location.continents.store", continents::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.continents.option_select", continents::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.continents.show", continents::show)
                        .put_named("location.continents.update", continents::update)
                        .delete_named("location.continents.delete", continents::delete),
                ),
        )
        .push(
            Router::with_path("countries")
                .get_named("location.countries.index", countries::index)
                .post_named("location.countries.store", countries::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.countries.option_select", countries::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.countries.show", countries::show)
                        .put_named("location.countries.update", countries::update)
                        .delete_named("location.countries.delete", countries::delete),
                ),
        )
        .push(
            Router::with_path("provinces")
                .get_named("location.provinces.index", provinces::index)
                .post_named("location.provinces.store", provinces::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.provinces.option_select", provinces::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.provinces.show", provinces::show)
                        .put_named("location.provinces.update", provinces::update)
                        .delete_named("location.provinces.delete", provinces::delete),
                ),
        )
        .push(
            Router::with_path("regencies")
                .get_named("location.regencies.index", regencies::index)
                .post_named("location.regencies.store", regencies::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.regencies.option_select", regencies::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regencies.show", regencies::show)
                        .put_named("location.regencies.update", regencies::update)
                        .delete_named("location.regencies.delete", regencies::delete),
                ),
        )
        .push(
            Router::with_path("regency-types")
                .get_named("location.regency_types.index", regency_types::index)
                .post_named("location.regency_types.store", regency_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.regency_types.option_select", regency_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regency_types.show", regency_types::show)
                        .put_named("location.regency_types.update", regency_types::update)
                        .delete_named("location.regency_types.delete", regency_types::delete),
                ),
        )
        .push(
            Router::with_path("regions")
                .get_named("location.regions.index", regions::index)
                .post_named("location.regions.store", regions::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.regions.option_select", regions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.regions.show", regions::show)
                        .put_named("location.regions.update", regions::update)
                        .delete_named("location.regions.delete", regions::delete),
                ),
        )
        .push(
            Router::with_path("sub-districts")
                .get_named("location.sub_districts.index", sub_districts::index)
                .post_named("location.sub_districts.store", sub_districts::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.sub_districts.option_select", sub_districts::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.sub_districts.show", sub_districts::show)
                        .put_named("location.sub_districts.update", sub_districts::update)
                        .delete_named("location.sub_districts.delete", sub_districts::delete),
                ),
        )
        .push(
            Router::with_path("villages")
                .get_named("location.villages.index", villages::index)
                .post_named("location.villages.store", villages::store)
                .push(
                    Router::with_path("options")
                        .post_named("location.villages.option_select", villages::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("location.villages.show", villages::show)
                        .put_named("location.villages.update", villages::update)
                        .delete_named("location.villages.delete", villages::delete),
                ),
        )
}
