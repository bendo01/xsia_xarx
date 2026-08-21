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
                .get_named("institution.master.employees.list_employees", employees::list_employees)
                .post_named("institution.master.employees.create_employee", employees::create_employee)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.employees.get_employee", employees::get_employee)
                        .put_named("institution.master.employees.update_employee", employees::update_employee)
                        .delete_named("institution.master.employees.delete_employee", employees::delete_employee),
                ),
        )
        .push(
            Router::with_path("institutions")
                .get_named("institution.master.institutions.list_institutions", institutions::list_institutions)
                .post_named("institution.master.institutions.create_institution", institutions::create_institution)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.institutions.get_institution", institutions::get_institution)
                        .put_named("institution.master.institutions.update_institution", institutions::update_institution)
                        .delete_named("institution.master.institutions.delete_institution", institutions::delete_institution),
                ),
        )
        .push(
            Router::with_path("staffes")
                .get_named("institution.master.staffes.list_staffes", staffes::list_staffes)
                .post_named("institution.master.staffes.create_staffe", staffes::create_staffe)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.staffes.get_staffe", staffes::get_staffe)
                        .put_named("institution.master.staffes.update_staffe", staffes::update_staffe)
                        .delete_named("institution.master.staffes.delete_staffe", staffes::delete_staffe),
                ),
        )
        .push(
            Router::with_path("units")
                .get_named("institution.master.units.list_units", units::list_units)
                .post_named("institution.master.units.create_unit", units::create_unit)
                .push(
                    Router::with_path("{id}")
                        .get_named("institution.master.units.get_unit", units::get_unit)
                        .put_named("institution.master.units.update_unit", units::update_unit)
                        .delete_named("institution.master.units.delete_unit", units::delete_unit),
                ),
        )
}
