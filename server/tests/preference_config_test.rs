use base64::{Engine as _, engine::general_purpose::STANDARD};
use salvo::prelude::*;
use salvo::test::*;
use sea_orm::{DatabaseBackend, DatabaseConnection, MockDatabase};
use serde_json::json;
use uuid::Uuid;
use xsia_xarx::config::email::EmailConfig;
use xsia_xarx::config::mail_in_a_box::MailInABoxConfig;
use xsia_xarx::config::openwa::OpenwaConfig;
use xsia_xarx::controllers::webhook::{self, openwa};
use xsia_xarx::library::crypto;
use xsia_xarx::models::preference::{mail_servers, what_apps};

const OPENWA_SECRET: &str = "openwa-secret-from-database";
const MIAB_SECRET: &str = "miab-secret-from-database";

fn set_key() {
    // SAFETY: every test in this file sets the same value, so concurrent writes agree.
    unsafe { std::env::set_var("APP_ENCRYPTION_KEY", STANDARD.encode([9u8; 32])) };
}

fn what_apps_record(miab_secret: &str) -> what_apps::Model {
    what_apps::Model {
        id: Uuid::new_v4(),
        url: "http://wa.example.test:2785/".to_string(),
        openwa_api_key_session_id: "session-1".to_string(),
        openwa_api_key_operator: crypto::encrypt("owa_operator_key").unwrap(),
        miab_webhook_secret: if miab_secret.is_empty() { String::new() } else { crypto::encrypt(miab_secret).unwrap() },
        openwa_webhook_secret: crypto::encrypt(OPENWA_SECRET).unwrap(),
        is_active: true,
        created_at: None,
        updated_at: None,
        deleted_at: None,
        sync_at: None,
        created_by: None,
        updated_by: None,
    }
}

fn db_with(record: Option<what_apps::Model>) -> DatabaseConnection {
    MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([record.into_iter().collect::<Vec<_>>()])
        .into_connection()
}

#[tokio::test]
async fn openwa_from_db_decrypts_record() {
    set_key();
    let config = OpenwaConfig::from_db(&db_with(Some(what_apps_record(MIAB_SECRET))))
        .await
        .unwrap()
        .expect("active record");

    assert_eq!(config.base_url, "http://wa.example.test:2785");
    assert_eq!(config.session_id, "session-1");
    assert_eq!(config.operator_key, "owa_operator_key");
    assert_eq!(config.webhook_secret, OPENWA_SECRET);
}

#[tokio::test]
async fn openwa_from_db_is_none_without_record() {
    set_key();
    assert!(OpenwaConfig::from_db(&db_with(None)).await.unwrap().is_none());
}

#[tokio::test]
async fn miab_from_db_reads_secret_and_skips_empty() {
    set_key();
    let config = MailInABoxConfig::from_db(&db_with(Some(what_apps_record(MIAB_SECRET))))
        .await
        .unwrap()
        .expect("active record");
    assert_eq!(config.webhook_secret, MIAB_SECRET);

    let empty = MailInABoxConfig::from_db(&db_with(Some(what_apps_record("")))).await.unwrap();
    assert!(empty.is_none(), "an empty stored secret falls back to the environment");
}

#[tokio::test]
async fn email_from_db_maps_mail_server() {
    set_key();
    let record = mail_servers::Model {
        id: Uuid::new_v4(),
        host: "smtp.example.test".to_string(),
        port: "587".to_string(),
        sender: "Akademik".to_string(),
        mail_address: "no-reply@example.test".to_string(),
        user: Some("no-reply@example.test".to_string()),
        password: Some(crypto::encrypt("smtp-pass").unwrap()),
        is_secure: true,
        is_active: true,
        created_at: None,
        updated_at: None,
        deleted_at: None,
        sync_at: None,
        created_by: None,
        updated_by: None,
    };
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![record]])
        .into_connection();

    let config = EmailConfig::from_db(&db).await.unwrap().expect("active mail server");
    assert_eq!(config.smtp_host, "smtp.example.test");
    assert_eq!(config.smtp_port, 587);
    assert_eq!(config.smtp_user, "no-reply@example.test");
    assert_eq!(config.smtp_password.as_deref(), Some("smtp-pass"));
    assert!(config.smtp_secure);
    assert_eq!(config.from_email, "no-reply@example.test");
    assert_eq!(config.from_name, "Akademik");
}

struct InjectDb(DatabaseConnection);

#[async_trait]
impl Handler for InjectDb {
    async fn handle(&self, req: &mut Request, depot: &mut Depot, res: &mut Response, ctrl: &mut FlowCtrl) {
        depot.insert_typed::<DatabaseConnection>(self.0.clone());
        ctrl.call_next(req, depot, res).await;
    }
}

#[tokio::test]
async fn webhook_router_uses_secret_from_database() {
    set_key();
    const URL: &str = "http://127.0.0.1:5800/webhook/openwa";
    // Signed correctly but missing required fields: 400 proves the DB secret was accepted
    let body = json!({ "event": "message.received" }).to_string();

    let service = |db| Service::new(webhook::router()).hoop(InjectDb(db));

    let good = format!("sha256={}", openwa::sign(OPENWA_SECRET, body.as_bytes()).unwrap());
    let res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, good, true)
        .body(body.clone())
        .send(&service(db_with(Some(what_apps_record(MIAB_SECRET)))))
        .await;
    assert_eq!(res.status_code, Some(StatusCode::BAD_REQUEST));

    let wrong = format!("sha256={}", openwa::sign("some-other-secret-value", body.as_bytes()).unwrap());
    let res = TestClient::post(URL)
        .add_header(openwa::SIGNATURE_HEADER, wrong, true)
        .body(body)
        .send(&service(db_with(Some(what_apps_record(MIAB_SECRET)))))
        .await;
    assert_eq!(res.status_code, Some(StatusCode::UNAUTHORIZED));
}
