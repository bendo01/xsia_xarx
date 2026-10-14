use chrono::NaiveDate;
use salvo::prelude::*;
use salvo::test::*;
use sea_orm::{DatabaseBackend, DatabaseConnection, MockDatabase};
use serde_json::json;
use uuid::Uuid;
use xsia_xarx::config::mail_in_a_box::MailInABoxConfig;
use xsia_xarx::config::openwa::OpenwaConfig;
use xsia_xarx::controllers::webhook::{self, mail_in_a_box};
use xsia_xarx::dtos::webhook::mail_in_a_box::MailInABoxWebhookResponse;
use xsia_xarx::models::webhook::mail_in_a_box_event;

const SECRET: &str = "test-secret";
const URL: &str = "http://127.0.0.1:5800/webhook/mail-in-a-box";

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
        MailInABoxConfig { webhook_secret: secret.to_string() },
        OpenwaConfig::default(),
    );
    Service::new(router).hoop(InjectDb(db))
}

fn empty_db() -> DatabaseConnection {
    MockDatabase::new(DatabaseBackend::Postgres).into_connection()
}

fn stored_event(event_id: Option<&str>) -> mail_in_a_box_event::Model {
    let ts = NaiveDate::from_ymd_opt(2026, 10, 14).unwrap().and_hms_opt(12, 0, 0).unwrap();
    mail_in_a_box_event::Model {
        id: Uuid::now_v7(),
        event_id: event_id.map(str::to_string),
        event_type: "mail.bounced".to_string(),
        hostname: Some("box.example.com".to_string()),
        occurred_at: Some(ts),
        payload: json!({}),
        created_at: ts,
        updated_at: ts,
    }
}

fn body() -> String {
    json!({
        "event": "mail.bounced",
        "id": "evt-1",
        "occurred_at": "2026-10-14T12:00:00Z",
        "hostname": "box.example.com",
        "data": { "to": "user@example.org", "reason": "550 5.1.1 user unknown" }
    })
    .to_string()
}

#[test]
fn verify_accepts_valid_hmac_with_and_without_prefix() {
    let body = b"{\"event\":\"mail.received\"}";
    let sig = mail_in_a_box::sign(SECRET, body).unwrap();
    assert!(mail_in_a_box::verify(SECRET, Some(&format!("sha256={sig}")), None, body));
    assert!(mail_in_a_box::verify(SECRET, Some(&sig.to_uppercase()), None, body));
}

#[test]
fn verify_rejects_bad_hmac_even_with_correct_plain_secret() {
    let body = b"{}";
    assert!(!mail_in_a_box::verify(SECRET, Some("sha256=deadbeef"), Some(SECRET), body));
}

#[test]
fn verify_plain_secret_and_empty_config() {
    assert!(mail_in_a_box::verify(SECRET, None, Some(SECRET), b"{}"));
    assert!(!mail_in_a_box::verify(SECRET, None, Some("wrong"), b"{}"));
    assert!(!mail_in_a_box::verify(SECRET, None, None, b"{}"));
    assert!(!mail_in_a_box::verify("", None, Some(""), b"{}"));
}

#[tokio::test]
async fn returns_503_when_secret_not_configured() {
    let res = TestClient::post(URL)
        .add_header(mail_in_a_box::SECRET_HEADER, "anything", true)
        .body(body())
        .send(&service("", empty_db()))
        .await;
    assert_eq!(res.status_code, Some(StatusCode::SERVICE_UNAVAILABLE));
}

#[tokio::test]
async fn returns_401_without_valid_secret() {
    let res = TestClient::post(URL).body(body()).send(&service(SECRET, empty_db())).await;
    assert_eq!(res.status_code, Some(StatusCode::UNAUTHORIZED));

    let res = TestClient::post(URL)
        .add_header(mail_in_a_box::SECRET_HEADER, "wrong", true)
        .body(body())
        .send(&service(SECRET, empty_db()))
        .await;
    assert_eq!(res.status_code, Some(StatusCode::UNAUTHORIZED));
}

#[tokio::test]
async fn returns_400_for_invalid_payload() {
    for bad in ["not json", r#"{"data":{}}"#, r#"{"event":"Bad Event!"}"#] {
        let res = TestClient::post(URL)
            .add_header(mail_in_a_box::SECRET_HEADER, SECRET, true)
            .body(bad)
            .send(&service(SECRET, empty_db()))
            .await;
        assert_eq!(res.status_code, Some(StatusCode::BAD_REQUEST), "payload: {bad}");
    }
}

#[tokio::test]
async fn stores_signed_event() {
    let saved = stored_event(Some("evt-1"));
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([Vec::<mail_in_a_box_event::Model>::new()])
        .append_query_results([vec![saved.clone()]])
        .into_connection();

    let body = body();
    let sig = mail_in_a_box::sign(SECRET, body.as_bytes()).unwrap();
    let mut res = TestClient::post(URL)
        .add_header(mail_in_a_box::SIGNATURE_HEADER, format!("sha256={sig}"), true)
        .body(body)
        .send(&service(SECRET, db))
        .await;

    assert_eq!(res.status_code, Some(StatusCode::OK));
    let out: MailInABoxWebhookResponse = res.take_json().await.unwrap();
    assert_eq!(out.id, saved.id);
    assert!(!out.duplicate);
}

#[tokio::test]
async fn acknowledges_duplicate_event_id_without_inserting() {
    let existing = stored_event(Some("evt-1"));
    // Only the lookup is mocked: an insert would fail with no result left
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![existing.clone()]])
        .into_connection();

    let mut res = TestClient::post(URL)
        .add_header(mail_in_a_box::SECRET_HEADER, SECRET, true)
        .body(body())
        .send(&service(SECRET, db))
        .await;

    assert_eq!(res.status_code, Some(StatusCode::OK));
    let out: MailInABoxWebhookResponse = res.take_json().await.unwrap();
    assert_eq!(out.id, existing.id);
    assert!(out.duplicate);
}

#[tokio::test]
async fn stores_event_without_id_and_skips_lookup() {
    let saved = stored_event(None);
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![saved.clone()]])
        .into_connection();

    let mut res = TestClient::post(URL)
        .add_header(mail_in_a_box::SECRET_HEADER, SECRET, true)
        .body(json!({ "event": "mailbox.created", "data": { "email": "new@example.com" } }).to_string())
        .send(&service(SECRET, db))
        .await;

    assert_eq!(res.status_code, Some(StatusCode::OK));
    let out: MailInABoxWebhookResponse = res.take_json().await.unwrap();
    assert_eq!(out.id, saved.id);
}
