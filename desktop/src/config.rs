//! Runtime configuration. The API base URL mirrors the web client's `VITE_API_SERVER_URL`.

pub const DEFAULT_API_URL: &str = "http://127.0.0.1:5800/api/v1";

pub fn api_base_url() -> String {
    std::env::var("XSIA_API_SERVER_URL")
        .unwrap_or_else(|_| DEFAULT_API_URL.to_string())
        .trim_end_matches('/')
        .to_string()
}
