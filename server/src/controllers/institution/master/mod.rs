use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod employees;
pub mod institutions;
pub mod staffes;
pub mod units;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("employees")
                .get_named("institution.master.employees.index", employees::index)
                .post_named("institution.master.employees.store", employees::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.master.employees.option_select", employees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.employees.show", employees::show)
                        .put_named("institution.master.employees.update", employees::update)
                        .delete_named("institution.master.employees.delete", employees::delete),
                ),
        )
        .push(
            Router::with_path("institutions")
                .get_named("institution.master.institutions.index", institutions::index)
                .post_named("institution.master.institutions.store", institutions::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.master.institutions.option_select", institutions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.institutions.show", institutions::show)
                        .put_named("institution.master.institutions.update", institutions::update)
                        .delete_named("institution.master.institutions.delete", institutions::delete),
                ),
        )
        .push(
            Router::with_path("staffes")
                .get_named("institution.master.staffes.index", staffes::index)
                .post_named("institution.master.staffes.store", staffes::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.master.staffes.option_select", staffes::option_select),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("institution.master.staffes.get_staffes_by_unit", staffes::get_staffes_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.staffes.show", staffes::show)
                        .put_named("institution.master.staffes.update", staffes::update)
                        .delete_named("institution.master.staffes.delete", staffes::delete),
                ),
        )
        .push(
            Router::with_path("units")
                .get_named("institution.master.units.index", units::index)
                .post_named("institution.master.units.store", units::store)
                .push(
                    Router::with_path("options")
                        .post_named("institution.master.units.option_select", units::option_select)
                        .get_named("institution.master.units.options_units_get", units::option_select),
                )
                .push(
                    Router::with_path("{unit_id}/dashboard")
                        .get_named("institution.master.units.get_unit_dashboard", units::get_unit_dashboard),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.units.show", units::show)
                        .put_named("institution.master.units.update", units::update)
                        .delete_named("institution.master.units.delete", units::delete),
                ),
        )
}
