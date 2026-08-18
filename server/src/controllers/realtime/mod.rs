use salvo::prelude::*;
use salvo::websocket::{Message, WebSocketUpgrade};
use salvo::sse::{self, SseEvent};
use futures_util::StreamExt;
use tokio_stream::wrappers::IntervalStream;
use std::time::Duration;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct RealtimeNotification {
    pub event: String,
    pub timestamp: String,
    pub data: serde_json::Value,
}

/// WebSocket Endpoint
/// Upgrades HTTP connection to WebSocket, receives client messages and echoes back with timestamps.
#[endpoint(
    tags("Realtime"),
    summary = "WebSocket real-time connection",
    description = "Upgrades HTTP connection to full-duplex WebSocket communication"
)]
pub async fn ws_handler(req: &mut Request, res: &mut Response) -> Result<(), StatusError> {
    WebSocketUpgrade::new()
        .upgrade(req, res, |mut ws| async move {
            tracing::info!("WebSocket client connected");
            while let Some(msg) = ws.recv().await {
                match msg {
                    Ok(msg) if msg.is_text() => {
                        let text = msg.as_str().unwrap_or_default();
                        tracing::debug!("WebSocket text message received: {}", text);
                        let reply = format!("Echo: {} (at {})", text, chrono::Utc::now().to_rfc3339());
                        if ws.send(Message::text(reply)).await.is_err() {
                            break;
                        }
                    }
                    Ok(msg) if msg.is_binary() => {
                        let bytes = msg.as_bytes();
                        tracing::debug!("WebSocket binary message received: {} bytes", bytes.len());
                        if ws.send(Message::binary(bytes.to_vec())).await.is_err() {
                            break;
                        }
                    }
                    Ok(msg) if msg.is_ping() => {
                        if ws.send(Message::pong(msg.as_bytes().to_vec())).await.is_err() {
                            break;
                        }
                    }
                    Ok(msg) if msg.is_close() => {
                        tracing::info!("WebSocket client initiated close");
                        break;
                    }
                    _ => {}
                }
            }
            tracing::info!("WebSocket client disconnected");
        })
        .await
}

/// Server-Sent Events (SSE) Endpoint
/// Streams heartbeat and event notifications continuously to subscribed clients.
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

/// WebTransport Endpoint
/// Establishes WebTransport HTTP/3 sessions and handles bidirectional streaming channels.
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
        .push(Router::with_path("ws").get(ws_handler))
        .push(Router::with_path("sse").get(sse_handler))
        .push(Router::with_path("webtransport").post(webtransport_handler).get(webtransport_handler))
}
