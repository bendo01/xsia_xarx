use salvo::prelude::*;

pub mod lecturers;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("lecturers")
                .get(lecturers::list_lecturers)
                .post(lecturers::create_lecturer)
                .push(
                    Router::with_path("{id}")
                        .get(lecturers::get_lecturer)
                        .put(lecturers::update_lecturer)
                        .delete(lecturers::delete_lecturer),
                ),
        )
}
