use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod counsellors;
pub mod decrees;

pub fn router() -> Router {
    Router::with_path("adviser")
        .push(
            Router::with_path("counsellors")
                .get_named("academic.student.adviser.counsellors.index", counsellors::index)
                .post_named("academic.student.adviser.counsellors.store", counsellors::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.adviser.counsellors.option_select", counsellors::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.adviser.counsellors.show", counsellors::show)
                        .put_named("academic.student.adviser.counsellors.update", counsellors::update)
                        .delete_named("academic.student.adviser.counsellors.delete", counsellors::delete),
                ),
        )
        .push(
            Router::with_path("decrees")
                .get_named("academic.student.adviser.decrees.index", decrees::index)
                .post_named("academic.student.adviser.decrees.store", decrees::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.adviser.decrees.option_select", decrees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.adviser.decrees.show", decrees::show)
                        .put_named("academic.student.adviser.decrees.update", decrees::update)
                        .delete_named("academic.student.adviser.decrees.delete", decrees::delete),
                ),
        )
}
