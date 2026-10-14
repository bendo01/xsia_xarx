use chrono::NaiveDate;
use salvo::prelude::*;
use salvo::test::*;
use sea_orm::{DatabaseBackend, DatabaseConnection, MockDatabase};
use serde_json::json;
use uuid::Uuid;
use xsia_xarx::config::mail_in_a_box::MailInABoxConfig;
use xsia_xarx::config::openwa::OpenwaConfig;
use xsia_xarx::controllers::webhook::{self, openwa};
use xsia_xarx::dtos::webhook::openwa::OpenWaWebhookResponse;
use xsia_xarx::models::webhook::open_wa_event;

const SECRET: &str = "test-secret-at-least-16";
const URL: &str = "http://127.0.0.1:5800/webhook/openwa";
const KEY: &str = "msg_my-session_3EB0ABC123_wh1";

struct InjectDb(DatabaseConnection);

#[async_trait]
impl Handler for InjectDb {
    async fn handle(&self, req: &mut Request, depot: &mut Depot, res: &mut Response, ctrl: &mut FlowCtrl) {
        depot.insert_typed::<DatabaseConnection>(self.0.clone());
        ctrl.call_next(req, depot, res).await;
    }
}

fn service(secret: &str, db: DatabaseConnection) -> Service {
    let router = webhook::router_with_config(
        MailInABoxConfig::default(),
        OpenwaConfig { webhook_secret: secret.to_string(), ..OpenwaConfig::default() },
    );
    Service::new(router).hoop(InjectDb(db))
}

fn empty_db() -> DatabaseConnection {
    MockDatabase::new(DatabaseBackend::Postgres).into_connection()
}

fn stored_event() -> open_wa_event::Model {
    let ts = NaiveDate::from_ymd_opt(2026, 10, 14).unwrap().and_hms_opt(12, 0, 0).unwrap();
    open_wa_event::Model {
        id: Uuid::now_v7(),
        idempotency_key: KEY.to_string(),
        delivery_id: Some("dlv_550e8400-e29b-41d4-a716-446655440000".to_string()),
        event_type: "message.received".to_string(),
        session_id: "my-session".to_string(),
        occurred_at: Some(ts),
        payload: json!({}),
        created_at: ts,
        updated_at: ts,
    }
}

fn body() -> String {
    json!({
        "event": "message.received",
        "timestamp": "2026-10-14T12:00:00.000Z",
        "sessionId": "my-session",
        "idempotencyKey": KEY,
        "deliveryId": "dlv_550e8400-e29b-41d4-a716-446655440000",
        "data": { "id": "3EB0ABC123", "from": "628123456789@c.us", "body": "halo", "type": "chat" }
    })
    .to_string()
}

fn signature(body: &str) -> String {
    format!("sha256={}", openwa::sign(SECRET, body.as_bytes()).unwrap())
}

#[tokio::test]
async fn returns_503_when_secret_not_configured() {
    let body = body();
    let res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, signature(&body), true)
        .body(body)
        .send(&service("", empty_db()))
        .await;
    assert_eq!(res.status_code, Some(StatusCode::SERVICE_UNAVAILABLE));
}

#[tokio::test]
async fn returns_401_without_valid_signature() {
    let res = TestClient::post(URL).body(body()).send(&service(SECRET, empty_db())).await;
    assert_eq!(res.status_code, Some(StatusCode::UNAUTHORIZED));

    let res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, "sha256=deadbeef", true)
        .body(body())
        .send(&service(SECRET, empty_db()))
        .await;
    assert_eq!(res.status_code, Some(StatusCode::UNAUTHORIZED));

    // Signed over a different body
    let res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, signature("{}"), true)
        .body(body())
        .send(&service(SECRET, empty_db()))
        .await;
    assert_eq!(res.status_code, Some(StatusCode::UNAUTHORIZED));
}

#[tokio::test]
async fn returns_400_for_invalid_payload() {
    let bad_payloads = [
        "not json".to_string(),
        json!({ "event": "message.received", "sessionId": "s" }).to_string(),
        json!({ "event": "Bad Event!", "sessionId": "s", "idempotencyKey": "k" }).to_string(),
    ];
    for bad in bad_payloads {
        let res = TestClient::post(URL)
            .add_header(openwa::SIGNATURE_HEADER, signature(&bad), true)
            .body(bad.clone())
            .send(&service(SECRET, empty_db()))
            .await;
        assert_eq!(res.status_code, Some(StatusCode::BAD_REQUEST), "payload: {bad}");
    }
}

#[tokio::test]
async fn stores_signed_event() {
    let saved = stored_event();
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([Vec::<open_wa_event::Model>::new()])
        .append_query_results([vec![saved.clone()]])
        .into_connection();

    let body = body();
    let mut res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, signature(&body), true)
        .body(body)
        .send(&service(SECRET, db))
        .await;

    assert_eq!(res.status_code, Some(StatusCode::OK));
    let out: OpenWaWebhookResponse = res.take_json().await.unwrap();
    assert_eq!(out.id, saved.id);
    assert!(!out.duplicate);
}

#[tokio::test]
async fn acknowledges_retry_with_same_idempotency_key_without_inserting() {
    let existing = stored_event();
    // Only the lookup is mocked: an insert would fail with no result left
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![existing.clone()]])
        .into_connection();

    let body = body();
    let mut res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, signature(&body), true)
        .add_header("x-openwa-retry-count", "1", true)
        .body(body)
        .send(&service(SECRET, db))
        .await;

    assert_eq!(res.status_code, Some(StatusCode::OK));
    let out: OpenWaWebhookResponse = res.take_json().await.unwrap();
    assert_eq!(out.id, existing.id);
    assert!(out.duplicate);
}

#[tokio::test]
async fn accepts_openwa_test_event_without_optional_fields() {
    let saved = stored_event();
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([Vec::<open_wa_event::Model>::new()])
        .append_query_results([vec![saved.clone()]])
        .into_connection();

    let body = json!({ "event": "test", "sessionId": "my-session", "idempotencyKey": "test_dlv_1_wh1" }).to_string();
    let res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, signature(&body), true)
        .body(body)
        .send(&service(SECRET, db))
        .await;

    assert_eq!(res.status_code, Some(StatusCode::OK));
}
