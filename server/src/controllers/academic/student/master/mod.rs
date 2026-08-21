use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod images;
pub mod students;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("images")
                .get_named("academic.student.master.images.list_images", images::list_images)
                .post_named("academic.student.master.images.create_image", images::create_image)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.master.images.get_image", images::get_image)
                        .put_named("academic.student.master.images.update_image", images::update_image)
                        .delete_named("academic.student.master.images.delete_image", images::delete_image),
                ),
        )
        .push(
            Router::with_path("students")
                .get_named("academic.student.master.students.list_students", students::list_students)
                .post_named("academic.student.master.students.create_student", students::create_student)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.master.students.get_student", students::get_student)
                        .put_named("academic.student.master.students.update_student", students::update_student)
                        .delete_named("academic.student.master.students.delete_student", students::delete_student),
                ),
        )
}
