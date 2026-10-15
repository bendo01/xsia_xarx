use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod chunks;

pub fn router() -> Router {
    Router::with_path("ai").push(
        Router::with_path("chunks").push(
            Router::with_path("upload").post_named("ai.chunks.upload", chunks::upload),
        ),
    )
}
