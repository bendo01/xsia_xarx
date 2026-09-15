use reqwest::Client;
use serde_json::json;
use crate::config::openwa::OpenwaConfig;

#[derive(Clone, Debug)]
pub struct OpenWaSender {
    client: Client,
    config: OpenwaConfig,
}

impl OpenWaSender {
    /// Create a new OpenWaSender with the provided configuration.
    pub fn new(config: OpenwaConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    /// Send a text message to a specific phone number.
    /// `phone_number` should contain the country code and number (e.g. "628123456789")
    pub async fn send_message(&self, phone_number: &str, message: &str) -> Result<(), reqwest::Error> {
        let chat_id = format!("{}@c.us", phone_number);
        
        let url = format!(
            "{}/api/sessions/{}/messages/send-text",
            self.config.base_url, self.config.session_id
        );

        let payload = json!({
            "chatId": chat_id,
            "text": message,
        });

        let response = self.client
            .post(&url)
            .header("X-API-Key", &self.config.operator_key)
            .json(&payload)
            .send()
            .await?;

        // Error out if the response status is not 2xx successful
        response.error_for_status()?;

        Ok(())
    }

    /// Register a webhook in OpenWA for specific events.
    /// `url` should be the absolute URL to your server's webhook handler.
    /// `events` is a list of events to subscribe to (e.g., `["message.received", "session.status"]`).
    /// `secret` is an HMAC secret for securing the payload.
    pub async fn register_webhook(&self, webhook_url: &str, events: Vec<&str>, secret: &str) -> Result<(), reqwest::Error> {
        let endpoint = format!(
            "{}/api/sessions/{}/webhooks",
            self.config.base_url, self.config.session_id
        );

        let payload = json!({
            "url": webhook_url,
            "events": events,
            "secret": secret,
        });

        let response = self.client
            .post(&endpoint)
            .header("X-API-Key", &self.config.operator_key)
            .json(&payload)
            .send()
            .await?;

        // Error out if the response status is not 2xx successful
        response.error_for_status()?;

        Ok(())
    }
}
