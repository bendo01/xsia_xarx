use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod counsellors;
pub mod decrees;

pub fn router() -> Router {
    Router::with_path("adviser")
        .push(
            Router::with_path("counsellors")
                .get_named("academic.student.adviser.counsellors.list_counsellors", counsellors::list_counsellors)
                .post_named("academic.student.adviser.counsellors.create_counsellor", counsellors::create_counsellor)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.adviser.counsellors.get_counsellor", counsellors::get_counsellor)
                        .put_named("academic.student.adviser.counsellors.update_counsellor", counsellors::update_counsellor)
                        .delete_named("academic.student.adviser.counsellors.delete_counsellor", counsellors::delete_counsellor),
                ),
        )
        .push(
            Router::with_path("decrees")
                .get_named("academic.student.adviser.decrees.list_decrees", decrees::list_decrees)
                .post_named("academic.student.adviser.decrees.create_decree", decrees::create_decree)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.adviser.decrees.get_decree", decrees::get_decree)
                        .put_named("academic.student.adviser.decrees.update_decree", decrees::update_decree)
                        .delete_named("academic.student.adviser.decrees.delete_decree", decrees::delete_decree),
                ),
        )
}
