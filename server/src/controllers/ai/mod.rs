use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod chunks;
pub mod regulations;

pub fn router() -> Router {
    Router::with_path("ai")
        .push(
            Router::with_path("chunks").push(
                Router::with_path("upload").post_named("ai.chunks.upload", chunks::upload),
            ),
        )
        .push(
            Router::with_path("regulations")
                .push(Router::with_path("status").get_named("ai.regulations.status", regulations::status))
                .push(Router::with_path("rebuild").post_named("ai.regulations.rebuild", regulations::rebuild)),
        )
}
