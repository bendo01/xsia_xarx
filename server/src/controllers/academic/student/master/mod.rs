use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod images;
pub mod students;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("images")
                .get_named("academic.student.master.images.index", images::index)
                .post_named("academic.student.master.images.store", images::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.master.images.option_select", images::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.master.images.show", images::show)
                        .put_named("academic.student.master.images.update", images::update)
                        .delete_named("academic.student.master.images.delete", images::delete),
                ),
        )
        .push(
            Router::with_path("students")
                .get_named("academic.student.master.students.index", students::index)
                .post_named("academic.student.master.students.store", students::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.master.students.option_select", students::option_select),
                )
                .push(
                    Router::with_path("academic-years")
                        .get_named("academic.student.master.students.list_distinct_academic_years", students::list_distinct_academic_years),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("academic.student.master.students.get_students_by_unit", students::get_students_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.master.students.show", students::show)
                        .put_named("academic.student.master.students.update", students::update)
                        .delete_named("academic.student.master.students.delete", students::delete),
                ),
        )
}
