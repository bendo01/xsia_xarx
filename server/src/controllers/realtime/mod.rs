use std::collections::HashMap;
use std::sync::{Arc, LazyLock, RwLock};
use salvo::prelude::*;
use salvo::websocket::{Message, WebSocketUpgrade};
use salvo::sse::{self, SseEvent};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::{broadcast, mpsc};
use tokio_stream::wrappers::IntervalStream;
use std::time::Duration;
use serde::{Deserialize, Serialize};

// ── Multi-Channel Hub State ──────────────────────────────────────────────────

#[derive(Clone, Default)]
pub struct ChannelHub {
    channels: Arc<RwLock<HashMap<String, broadcast::Sender<String>>>>,
}

pub static HUB: LazyLock<ChannelHub> = LazyLock::new(ChannelHub::default);

impl ChannelHub {
    pub fn get_or_create(&self, channel: &str) -> broadcast::Sender<String> {
        let mut map = self.channels.write().unwrap();
        if let Some(sender) = map.get(channel) {
            sender.clone()
        } else {
            let (tx, _rx) = broadcast::channel(256);
            map.insert(channel.to_string(), tx.clone());
            tx
        }
    }

    pub fn publish(&self, channel: &str, msg: String) -> usize {
        let map = self.channels.read().unwrap();
        if let Some(sender) = map.get(channel) {
            sender.send(msg).unwrap_or(0)
        } else {
            0
        }
    }

    pub fn active_channels(&self) -> Vec<String> {
        let map = self.channels.read().unwrap();
        map.keys().cloned().collect()
    }
}

// ── Payload DTOs ─────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug)]
pub struct RealtimeNotification {
    pub event: String,
    pub timestamp: String,
    pub data: serde_json::Value,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum ClientAction {
    Subscribe {
        channel: String,
    },
    Unsubscribe {
        channel: String,
    },
    Publish {
        channel: String,
        data: serde_json::Value,
    },
    ListChannels,
    Ping,
}

#[derive(Serialize, Debug)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum ServerEvent {
    Subscribed {
        channel: String,
        message: String,
        timestamp: String,
    },
    Unsubscribed {
        channel: String,
        timestamp: String,
    },
    Message {
        channel: String,
        data: serde_json::Value,
        timestamp: String,
    },
    ChannelsList {
        channels: Vec<String>,
        timestamp: String,
    },
    Echo {
        text: String,
        timestamp: String,
    },
    Error {
        message: String,
        timestamp: String,
    },
}

// ── WebSocket Handler ────────────────────────────────────────────────────────

#[endpoint(
    tags("Realtime"),
    summary = "Multi-Channel WebSocket real-time connection",
    description = "Upgrades HTTP connection to full-duplex Multi-Channel WebSocket communication"
)]
pub async fn ws_handler(req: &mut Request, res: &mut Response) -> Result<(), StatusError> {
    let initial_channel = req.query::<String>("channel").unwrap_or_else(|| "general".to_string());

    WebSocketUpgrade::new()
        .upgrade(req, res, move |ws| async move {
            tracing::info!("WebSocket client connected. Initial channel: {}", initial_channel);
            let (mut ws_sender, mut ws_receiver) = ws.split();

            // Client-bound message queue
            let (client_tx, mut client_rx) = mpsc::unbounded_channel::<String>();

            // Spawn outgoing forwarder task to write to WebSocket
            tokio::spawn(async move {
                while let Some(msg_text) = client_rx.recv().await {
                    if ws_sender.send(Message::text(msg_text)).await.is_err() {
                        break;
                    }
                }
            });

            // Map of active channel subscription cancel handles: Channel -> oneshot::Sender<()>
            let mut active_subs: HashMap<String, tokio::sync::oneshot::Sender<()>> = HashMap::new();

            // Helper to subscribe this connection to a channel
            let subscribe_channel = |chan: &str,
                                     client_tx: &mpsc::UnboundedSender<String>,
                                     subs: &mut HashMap<String, tokio::sync::oneshot::Sender<()>>| {
                if subs.contains_key(chan) {
                    return;
                }

                let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
                let mut broadcast_rx = HUB.get_or_create(chan).subscribe();
                let client_tx_clone = client_tx.clone();

                tokio::spawn(async move {
                    loop {
                        tokio::select! {
                            _ = &mut cancel_rx => {
                                break;
                            }
                            recv_res = broadcast_rx.recv() => {
                                match recv_res {
                                    Ok(msg) => {
                                        if client_tx_clone.send(msg).is_err() {
                                            break;
                                        }
                                    }
                                    Err(broadcast::error::RecvError::Lagged(skipped)) => {
                                        tracing::warn!("Client lagged, skipped {} messages", skipped);
                                    }
                                    Err(broadcast::error::RecvError::Closed) => {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                });

                subs.insert(chan.to_string(), cancel_tx);

                let ack = ServerEvent::Subscribed {
                    channel: chan.to_string(),
                    message: format!("Subscribed to channel '{}'", chan),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                };
                if let Ok(ack_str) = serde_json::to_string(&ack) {
                    let _ = client_tx.send(ack_str);
                }
            };

            // Auto-subscribe to initial channel
            subscribe_channel(&initial_channel, &client_tx, &mut active_subs);

            // Handle incoming client messages
            while let Some(msg) = ws_receiver.next().await {
                match msg {
                    Ok(msg) if msg.is_text() => {
                        let text = msg.as_str().unwrap_or_default().trim();
                        tracing::debug!("WebSocket text message: {}", text);

                        if text.eq_ignore_ascii_case("PING") {
                            let pong = ServerEvent::Echo {
                                text: "PONG".to_string(),
                                timestamp: chrono::Utc::now().to_rfc3339(),
                            };
                            if let Ok(pong_str) = serde_json::to_string(&pong) {
                                let _ = client_tx.send(pong_str);
                            }
                            continue;
                        }

                        // Try to parse as structured ClientAction
                        if let Ok(action) = serde_json::from_str::<ClientAction>(text) {
                            match action {
                                ClientAction::Subscribe { channel } => {
                                    subscribe_channel(&channel, &client_tx, &mut active_subs);
                                }
                                ClientAction::Unsubscribe { channel } => {
                                    if let Some(cancel) = active_subs.remove(&channel) {
                                        let _ = cancel.send(());
                                    }
                                    let ack = ServerEvent::Unsubscribed {
                                        channel: channel.clone(),
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                    };
                                    if let Ok(ack_str) = serde_json::to_string(&ack) {
                                        let _ = client_tx.send(ack_str);
                                    }
                                }
                                ClientAction::Publish { channel, data } => {
                                    let payload = ServerEvent::Message {
                                        channel: channel.clone(),
                                        data,
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                    };
                                    if let Ok(payload_str) = serde_json::to_string(&payload) {
                                        HUB.publish(&channel, payload_str);
                                    }
                                }
                                ClientAction::ListChannels => {
                                    let channels = HUB.active_channels();
                                    let resp = ServerEvent::ChannelsList {
                                        channels,
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                    };
                                    if let Ok(resp_str) = serde_json::to_string(&resp) {
                                        let _ = client_tx.send(resp_str);
                                    }
                                }
                                ClientAction::Ping => {
                                    let pong = ServerEvent::Echo {
                                        text: "PONG".to_string(),
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                    };
                                    if let Ok(pong_str) = serde_json::to_string(&pong) {
                                        let _ = client_tx.send(pong_str);
                                    }
                                }
                            }
                        } else {
                            // Fallback raw text echo
                            let echo = ServerEvent::Echo {
                                text: format!("Echo: {}", text),
                                timestamp: chrono::Utc::now().to_rfc3339(),
                            };
                            if let Ok(echo_str) = serde_json::to_string(&echo) {
                                let _ = client_tx.send(echo_str);
                            }
                        }
                    }
                    Ok(msg) if msg.is_ping() => {
                        let pong = ServerEvent::Echo {
                            text: "PONG".to_string(),
                            timestamp: chrono::Utc::now().to_rfc3339(),
                        };
                        if let Ok(pong_str) = serde_json::to_string(&pong) {
                            let _ = client_tx.send(pong_str);
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
        .push(Router::with_path("ws").get(ws_handler))
        .push(Router::with_path("sse").get(sse_handler))
        .push(
            Router::with_path("webtransport")
                .post(webtransport_handler)
                .get(webtransport_handler),
        )
}
