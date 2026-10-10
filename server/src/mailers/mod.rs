pub mod auth;

use serde::Serialize;
use std::sync::OnceLock;
use tera::{Context, Tera};

use crate::config::email::EmailConfig;
use crate::jobs::email::EmailJob;

static TERA: OnceLock<Tera> = OnceLock::new();

fn get_templates() -> &'static Tera {
    TERA.get_or_init(|| {
        let mut tera = Tera::default();
        if let Err(e) = tera.add_raw_template("email.html", include_str!("templates/email.html")) {
            tracing::error!("Error adding email template email.html: {e}");
        }
        tera
    })
}

#[derive(Debug, Clone, Serialize)]
pub struct EmailAction {
    pub label: String,
    pub url: String,
}

/// Content of an email rendered with the shared `email.html` layout.
/// Every field is plain text and is HTML-escaped when rendered.
#[derive(Debug, Clone, Default, Serialize)]
pub struct EmailContent {
    /// Shown in the green header
    pub title: String,
    /// Emoji shown above the title
    pub icon: Option<String>,
    /// Recipient name for the "Halo {name}," greeting
    pub name: Option<String>,
    pub paragraphs: Vec<String>,
    /// Button plus a copy-paste fallback link
    pub action: Option<EmailAction>,
    /// Yellow "Perhatian:" box
    pub notice: Option<String>,
    /// Small grey text at the end of the body
    pub footnote: Option<String>,
}

impl EmailContent {
    /// Renders the content into an `EmailJob` with an HTML body and a plain-text fallback.
    pub fn into_job(self, to: &str, subject: &str) -> Result<EmailJob, tera::Error> {
        let config = EmailConfig::from_env();

        let mut context = Context::from_serialize(&self)?;
        context.insert("institution_name", &config.institution_name);
        context.insert("institution_address", &config.institution_address);
        let html_body = get_templates().render("email.html", &context)?;

        let subject = if config.institution_name.is_empty() {
            subject.to_string()
        } else {
            format!("{subject} - {}", config.institution_name)
        };

        Ok(EmailJob {
            to: to.to_string(),
            subject,
            body: self.plain_text(),
            html_body: Some(html_body),
        })
    }

    fn plain_text(&self) -> String {
        let mut parts = Vec::new();
        if let Some(name) = &self.name {
            parts.push(format!("Halo {name},"));
        }
        parts.extend(self.paragraphs.iter().cloned());
        if let Some(action) = &self.action {
            parts.push(format!("{}: {}", action.label, action.url));
        }
        if let Some(notice) = &self.notice {
            parts.push(format!("Perhatian: {notice}"));
        }
        if let Some(footnote) = &self.footnote {
            parts.push(footnote.clone());
        }
        parts.join("\n\n")
    }
}
