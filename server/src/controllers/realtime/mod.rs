use std::time::Duration;
use futures_util::StreamExt;
use salvo::prelude::*;
use salvo::sse::{self, SseEvent};
use serde::{Deserialize, Serialize};
use tokio_stream::wrappers::IntervalStream;

pub mod web_socket;
pub use web_socket::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct RealtimeNotification {
    pub event: String,
    pub timestamp: String,
    pub data: serde_json::Value,
}

// ── SSE Endpoint ─────────────────────────────────────────────────────────────

#[endpoint(
    tags("Realtime"),
    summary = "Server-Sent Events (SSE) stream",
    description = "Streams server-to-client real-time events and heartbeats"
)]
pub async fn sse_handler(_req: &mut Request, res: &mut Response) {
    let interval = tokio::time::interval(Duration::from_secs(2));
    let stream = IntervalStream::new(interval).map(|_| {
        let notification = RealtimeNotification {
            event: "heartbeat".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            data: serde_json::json!({
                "status": "online",
                "server_time": chrono::Utc::now().to_rfc3339()
            }),
        };
        let json_str = serde_json::to_string(&notification).unwrap_or_default();
        Ok::<_, std::convert::Infallible>(
            SseEvent::default()
                .name("heartbeat")
                .text(json_str)
        )
    });

    sse::stream(res, stream);
}

// ── WebTransport Endpoint ────────────────────────────────────────────────────

#[endpoint(
    tags("Realtime"),
    summary = "WebTransport session handler",
    description = "Handles WebTransport over HTTP/3 for low-latency bidirectional streams"
)]
pub async fn webtransport_handler(req: &mut Request, _res: &mut Response) -> Result<(), StatusError> {
    match req.web_transport_mut().await {
        Ok(session) => {
            tracing::info!("WebTransport session established");
            while let Ok(Some(_accepted)) = session.accept_bi().await {
                tracing::debug!("Accepted WebTransport bidirectional stream");
            }
            tracing::info!("WebTransport session closed");
            Ok(())
        }
        Err(e) => {
            tracing::warn!("WebTransport handshake failed: {:?}", e);
            Err(StatusError::bad_request().brief("WebTransport upgrade failed"))
        }
    }
}

pub fn router() -> Router {
    Router::with_path("realtime")
        .push(Router::with_path("ws").get(web_socket::ws_handler))
        .push(Router::with_path("sse").get(sse_handler))
        .push(
            Router::with_path("webtransport")
                .post(webtransport_handler)
                .get(webtransport_handler),
        )
}
