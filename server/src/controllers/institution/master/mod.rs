use salvo::prelude::*;

pub mod employees;
pub mod institutions;
pub mod staffes;
pub mod units;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("employees")
                .get(employees::list_employees)
                .post(employees::create_employee)
                .push(
                    Router::with_path("{id}")
                        .get(employees::get_employee)
                        .put(employees::update_employee)
                        .delete(employees::delete_employee),
                ),
        )
        .push(
            Router::with_path("institutions")
                .get(institutions::list_institutions)
                .post(institutions::create_institution)
                .push(
                    Router::with_path("{id}")
                        .get(institutions::get_institution)
                        .put(institutions::update_institution)
                        .delete(institutions::delete_institution),
                ),
        )
        .push(
            Router::with_path("staffes")
                .get(staffes::list_staffes)
                .post(staffes::create_staffe)
                .push(
                    Router::with_path("{id}")
                        .get(staffes::get_staffe)
                        .put(staffes::update_staffe)
                        .delete(staffes::delete_staffe),
                ),
        )
        .push(
            Router::with_path("units")
                .get(units::list_units)
                .post(units::create_unit)
                .push(
                    Router::with_path("{id}")
                        .get(units::get_unit)
                        .put(units::update_unit)
                        .delete(units::delete_unit),
                ),
        )
}
