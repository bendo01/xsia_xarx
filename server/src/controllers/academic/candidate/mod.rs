use salvo::prelude::*;
pub mod admission;
pub mod master;
pub mod reference;
pub mod transaction;

pub fn router() -> Router {
    Router::with_path("candidate")
        .push(admission_router())
        .push(master::router())
        .push(reference::router())
        .push(transaction::router())
}

/// Candidate self-registration and admission checklist.
/// Public routes create the account; the rest only act on the authenticated user's own candidate.
fn admission_router() -> Router {
    Router::with_path("admission")
        .push(Router::with_path("register").post(admission::register))
        .push(Router::with_path("units").get(admission::unit_options))
        .push(
            Router::with_path("{id}")
                .hoop(crate::middleware::auth::JwtAuth)
                .push(Router::with_path("status").get(admission::status))
                .push(Router::with_path("unit").put(admission::save_unit))
                .push(Router::with_path("family-card").put(admission::save_family_card))
                .push(
                    Router::with_path("family-members")
                        .post(admission::store_family_member)
                        .push(Router::with_path("{member_id}").delete(admission::delete_family_member)),
                )
                .push(
                    Router::with_path("archives")
                        .push(Router::with_path("{archive_type_id}").post(admission::upload_archive))
                        .push(Router::with_path("file/{archive_id}").get(admission::archive_file)),
                ),
        )
}
