use std::collections::HashMap;
use std::sync::{Arc, LazyLock, RwLock};
use salvo::prelude::*;
use salvo::websocket::{Message, WebSocketUpgrade};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::{broadcast, mpsc};
use serde::{Deserialize, Serialize};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

use crate::models::academic::campaign::transaction::{class_codes, teach_meetings, teaches};
use crate::models::academic::student::campaign::student_activities;
use crate::models::academic::student::master::students;
use crate::models::auth::{role, user};
use crate::services::auth::data_scope::DataScope;

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

// ── Channel policy & server-side publishing ─────────────────────────────────

/// Channels a client may subscribe to: `teach:<uuid>` (class seat changes), `activity:<uuid>`
/// (a student's own plan), `meeting:<uuid>` (live attendance roster for lecturers) and
/// `student-attendance:<uuid>` (a student's own attendance notifications).
/// Only the server publishes to them.
pub fn is_allowed_channel(chan: &str) -> bool {
    match chan.split_once(':') {
        Some(("teach" | "activity" | "meeting" | "student-attendance", id)) => uuid::Uuid::parse_str(id).is_ok(),
        _ => false,
    }
}

/// Resolve the user's active role (same rules as `RbacGuard`) and turn it into a data scope.
async fn resolve_scope(db: &DatabaseConnection, user_id: Uuid) -> Result<DataScope, StatusError> {
    let internal = |e: sea_orm::DbErr| StatusError::internal_server_error().brief(e.to_string());

    let current_user = user::Entity::find_by_id(user_id)
        .filter(user::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::unauthorized().brief("User not found"))?;

    let owned_roles = role::Entity::find()
        .filter(role::Column::UserId.eq(user_id))
        .filter(role::Column::DeletedAt.is_null())
        .order_by_asc(role::Column::CreatedAt)
        .all(db)
        .await
        .map_err(internal)?;

    let active_role = match current_user.current_role_id.filter(|id| !id.is_nil()) {
        Some(rid) => owned_roles.iter().find(|r| r.id == rid).cloned(),
        None if owned_roles.len() == 1 => owned_roles.first().cloned(),
        None => None,
    }
    .ok_or_else(|| StatusError::forbidden().brief("Select an active role first"))?;

    let mut depot = Depot::new();
    depot.insert("active_role", active_role);
    DataScope::resolve(db, &depot).await
}

/// Whether the scope may listen to the channel: the class / activity must belong to the user's
/// data scope. Fails closed on any lookup problem.
async fn authorize_channel(db: &DatabaseConnection, scope: &DataScope, chan: &str) -> bool {
    let Some((kind, id)) = chan.split_once(':') else { return false };
    let Ok(id) = Uuid::parse_str(id) else { return false };

    match kind {
        "activity" => scope
            .is_visible::<student_activities::Entity, _>(db, id)
            .await
            .unwrap_or(false),
        "meeting" => {
            // Live roster: only whoever may manage the class, never students
            if matches!(scope, DataScope::Student(_)) {
                return false;
            }
            let Ok(Some(meeting)) = teach_meetings::Entity::find_by_id(id).one(db).await else { return false };
            scope
                .is_visible::<teaches::Entity, _>(db, meeting.teach_id)
                .await
                .unwrap_or(false)
        }
        // A student's own attendance notifications; administrators may listen too
        "student-attendance" => match scope {
            DataScope::Student(student_id) => *student_id == id,
            DataScope::All => true,
            _ => false,
        },
        "teach" => {
            // Students must see seats of classes they have NOT taken yet, so compare units
            // instead of using the (taken-classes-only) teach scope.
            let Ok(Some(teach)) = teaches::Entity::find_by_id(id).one(db).await else { return false };
            if teach.deleted_at.is_some() {
                return false;
            }
            let class_unit = match class_codes::Entity::find_by_id(teach.class_code_id).one(db).await {
                Ok(Some(c)) => c.unit_id,
                _ => return false,
            };
            match scope {
                DataScope::All => true,
                DataScope::Units(_) => class_unit.is_some_and(|u| scope.allows_unit(u)),
                DataScope::Student(student_id) => {
                    match students::Entity::find_by_id(*student_id).one(db).await {
                        Ok(Some(st)) => class_unit == Some(st.unit_id),
                        _ => false,
                    }
                }
                DataScope::Lecturer(_) => scope
                    .is_visible::<teaches::Entity, _>(db, id)
                    .await
                    .unwrap_or(false),
            }
        }
        _ => false,
    }
}

/// Publish a server-originated event to a channel (no-op if nobody listens).
pub fn publish_event(channel: &str, data: serde_json::Value) -> usize {
    let payload = ServerEvent::Message {
        channel: channel.to_string(),
        data,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    match serde_json::to_string(&payload) {
        Ok(s) => HUB.publish(channel, s),
        Err(_) => 0,
    }
}

// ── Payload DTOs ─────────────────────────────────────────────────────────────

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
pub async fn ws_handler(req: &mut Request, depot: &mut Depot, res: &mut Response) -> Result<(), StatusError> {
    let token = req
        .query::<String>("token")
        .ok_or_else(|| StatusError::unauthorized().brief("Missing token"))?;
    let claims = crate::config::jwt::verify_token(&token, &crate::config::jwt::JwtConfig::from_env())
        .map_err(|_| StatusError::unauthorized().brief("Invalid or expired token"))?;

    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?
        .clone();
    let scope = resolve_scope(&db, claims.sub).await?;

    let initial_channel = req.query::<String>("channel");
    if let Some(ref c) = initial_channel {
        if !is_allowed_channel(c) || !authorize_channel(&db, &scope, c).await {
            return Err(StatusError::forbidden().brief("Channel not allowed"));
        }
    }

    WebSocketUpgrade::new()
        .upgrade(req, res, move |ws| async move {
            tracing::info!("WebSocket client connected. Initial channel: {:?}", initial_channel);
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
                if !is_allowed_channel(chan) {
                    let err = ServerEvent::Error {
                        message: format!("Channel '{}' is not allowed", chan),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };
                    if let Ok(s) = serde_json::to_string(&err) {
                        let _ = client_tx.send(s);
                    }
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
            if let Some(ref chan) = initial_channel {
                subscribe_channel(chan, &client_tx, &mut active_subs);
            }

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
                                    if is_allowed_channel(&channel)
                                        && !active_subs.contains_key(&channel)
                                        && !authorize_channel(&db, &scope, &channel).await
                                    {
                                        let err = ServerEvent::Error {
                                            message: format!("Not authorized for channel '{}'", channel),
                                            timestamp: chrono::Utc::now().to_rfc3339(),
                                        };
                                        if let Ok(e) = serde_json::to_string(&err) {
                                            let _ = client_tx.send(e);
                                        }
                                        continue;
                                    }
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
                                ClientAction::Publish { .. } => {
                                    let err = ServerEvent::Error {
                                        message: "Publishing from clients is not allowed".to_string(),
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                    };
                                    if let Ok(s) = serde_json::to_string(&err) {
                                        let _ = client_tx.send(s);
                                    }
                                }
                                ClientAction::ListChannels => {
                                    let channels: Vec<String> = active_subs.keys().cloned().collect();
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
