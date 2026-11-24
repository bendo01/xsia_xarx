//! Blocking HTTP client for the backend. Call from a background executor, never the UI thread.

use crate::config::api_base_url;
use crate::models::{LoginRequest, LoginResponse};
use std::time::Duration;

pub fn login(req: &LoginRequest) -> Result<LoginResponse, String> {
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(20)))
        .http_status_as_error(false)
        .build()
        .into();

    let mut res = agent
        .post(format!("{}/login", api_base_url()))
        .header("Accept", "application/json")
        .send_json(serde_json::json!({
            "email": req.email.trim(),
            "password": req.password,
        }))
        .map_err(|e| format!("Gagal terhubung ke server: {e}"))?;

    let status = res.status().as_u16();
    let body: serde_json::Value = res.body_mut().read_json().unwrap_or_default();

    if !(200..300).contains(&status) {
        return Err(error_message(&body)
            .unwrap_or_else(|| "Email atau kata sandi tidak valid".to_string()));
    }
    serde_json::from_value(body).map_err(|e| format!("Respons server tidak valid: {e}"))
}

/// Mirrors the web client: message, brief, error.brief, error.message, error.
fn error_message(body: &serde_json::Value) -> Option<String> {
    let pick = |v: &serde_json::Value| v.as_str().map(str::to_string);
    pick(&body["message"])
        .or_else(|| pick(&body["brief"]))
        .or_else(|| pick(&body["error"]["brief"]))
        .or_else(|| pick(&body["error"]["message"]))
        .or_else(|| pick(&body["error"]))
}
