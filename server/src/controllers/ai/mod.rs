use salvo::prelude::*;
use crate::middleware::rbac::{NamedRouterExt, is_administrator};
use crate::models::auth::role;

pub mod chunks;
pub mod rag;
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
        .push(
            Router::with_path("rag")
                .push(Router::with_path("status").get_named("ai.rag.status", rag::status))
                .push(Router::with_path("retrieve").post_named("ai.rag.retrieve", rag::retrieve))
                .push(Router::with_path("ask").post_named("ai.rag.ask", rag::ask))
                .push(Router::with_path("conversations").get_named("ai.rag.conversations", rag::conversations))
                .push(
                    Router::with_path("conversations/{id}")
                        .get_named("ai.rag.conversation", rag::conversation_turns)
                        .delete_named("ai.rag.conversation.delete", rag::delete_conversation),
                )
                .push(
                    Router::with_path("messages/{id}/feedback")
                        .post_named("ai.rag.feedback", rag::feedback),
                ),
        )
}

/// The RAG and knowledge base tools are for administrators only
pub(crate) fn require_administrator(depot: &Depot) -> Result<(), StatusError> {
    if depot.get::<role::Model>("active_role").map(is_administrator).unwrap_or(false) {
        Ok(())
    } else {
        Err(StatusError::forbidden().brief("Only administrators can use this tool"))
    }
}
