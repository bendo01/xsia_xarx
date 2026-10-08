use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod counsellors;
pub mod decrees;

pub fn router() -> Router {
    Router::with_path("adviser")
        .push(
            Router::with_path("counsellors")
                .get_named("academic.student.adviser.counsellors.list_counsellors", counsellors::index)
                .post_named("academic.student.adviser.counsellors.create_counsellor", counsellors::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.adviser.counsellors.options_counsellors", counsellors::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.adviser.counsellors.get_counsellor", counsellors::show)
                        .put_named("academic.student.adviser.counsellors.update_counsellor", counsellors::update)
                        .delete_named("academic.student.adviser.counsellors.delete_counsellor", counsellors::delete),
                ),
        )
        .push(
            Router::with_path("decrees")
                .get_named("academic.student.adviser.decrees.list_decrees", decrees::index)
                .post_named("academic.student.adviser.decrees.create_decree", decrees::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.adviser.decrees.options_decrees", decrees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.adviser.decrees.get_decree", decrees::show)
                        .put_named("academic.student.adviser.decrees.update_decree", decrees::update)
                        .delete_named("academic.student.adviser.decrees.delete_decree", decrees::delete),
                ),
        )
}
