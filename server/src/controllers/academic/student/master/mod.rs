use salvo::prelude::*;

pub mod images;
pub mod students;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("images")
                .get(images::list_images)
                .post(images::create_image)
                .push(
                    Router::with_path("{id}")
                        .get(images::get_image)
                        .put(images::update_image)
                        .delete(images::delete_image),
                ),
        )
        .push(
            Router::with_path("students")
                .get(students::list_students)
                .post(students::create_student)
                .push(
                    Router::with_path("{id}")
                        .get(students::get_student)
                        .put(students::update_student)
                        .delete(students::delete_student),
                ),
        )
}
