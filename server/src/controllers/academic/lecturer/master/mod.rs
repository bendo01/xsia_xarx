use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod lecturers;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("lecturers")
                .get_named("academic.lecturer.master.lecturers.list_lecturers", lecturers::list_lecturers)
                .post_named("academic.lecturer.master.lecturers.create_lecturer", lecturers::create_lecturer)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.master.lecturers.get_lecturer", lecturers::get_lecturer)
                        .put_named("academic.lecturer.master.lecturers.update_lecturer", lecturers::update_lecturer)
                        .delete_named("academic.lecturer.master.lecturers.delete_lecturer", lecturers::delete_lecturer),
                ),
        )
}
