use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod images;
pub mod students;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("images")
                .get_named("academic.student.master.images.list_images", images::index)
                .post_named("academic.student.master.images.create_image", images::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.master.images.options_images", images::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.master.images.get_image", images::show)
                        .put_named("academic.student.master.images.update_image", images::update)
                        .delete_named("academic.student.master.images.delete_image", images::delete),
                ),
        )
        .push(
            Router::with_path("students")
                .get_named("academic.student.master.students.list_students", students::index)
                .post_named("academic.student.master.students.create_student", students::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.master.students.options_students", students::option_select),
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
                        .get_named("academic.student.master.students.get_student", students::show)
                        .put_named("academic.student.master.students.update_student", students::update)
                        .delete_named("academic.student.master.students.delete_student", students::delete),
                ),
        )
}
