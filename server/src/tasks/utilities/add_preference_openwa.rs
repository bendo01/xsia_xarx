use chrono::Local;
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    Set,
};
use std::io::{self, Write};
use uuid::Uuid;

use crate::library::crypto;
use crate::models::preference::what_apps;
use crate::tasks::Task;

pub struct AddPreferenceOpenWaTask;

fn prompt(label: &str, default: Option<&str>) -> io::Result<String> {
    match default {
        Some(default) => print!("{label} [{default}]: "),
        None => print!("{label}: "),
    }
    io::stdout().flush()?;
    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    let trimmed = input.trim();
    Ok(match default {
        Some(default) if trimmed.is_empty() => default.to_string(),
        _ => trimmed.to_string(),
    })
}

fn prompt_required(label: &str, default: Option<&str>) -> Result<String, Box<dyn std::error::Error>> {
    let value = prompt(label, default)?;
    if value.is_empty() {
        return Err(format!("{label} cannot be empty").into());
    }
    Ok(value)
}

fn prompt_secret(label: &str) -> Result<String, Box<dyn std::error::Error>> {
    let value = rpassword::prompt_password(format!("{label}: "))?;
    if value.is_empty() {
        return Err(format!("{label} cannot be empty").into());
    }
    Ok(crypto::encrypt(&value).map_err(|e| e.to_string())?)
}

#[async_trait]
impl Task for AddPreferenceOpenWaTask {
    fn name(&self) -> &str {
        "utility:preference-add-openwa"
    }

    fn description(&self) -> &str {
        "Prompts for OpenWA URL, session ID, operator API key and webhook secrets, then stores the active OpenWA settings (keys and secrets encrypted)"
    }

    async fn run(&self, db: &DatabaseConnection, _args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n{}", "=".repeat(60));
        println!(" ADD PREFERENCE OPENWA");
        println!("{}", "=".repeat(60));

        let url = prompt_required("OpenWA URL (e.g. http://host:2785)", None)?;
        if !(url.starts_with("http://") || url.starts_with("https://")) {
            return Err("OpenWA URL must start with http:// or https://".into());
        }
        let default_session_id = std::env::var("OPENWA_API_KEY_SESSION_ID").ok();
        let session_id = prompt_required("OpenWA session ID", default_session_id.as_deref())?;
        let encrypted_operator_key = prompt_secret("OpenWA operator API key")?;
        let encrypted_openwa_secret = prompt_secret("OpenWA webhook secret")?;
        let encrypted_miab_secret = prompt_secret("Mail-in-a-Box webhook secret")?;

        let now = Local::now().naive_local();

        let existing = what_apps::Entity::find()
            .filter(what_apps::Column::IsActive.eq(true))
            .filter(what_apps::Column::DeletedAt.is_null())
            .one(db)
            .await?;

        let action = if let Some(existing) = existing {
            let mut active = existing.into_active_model();
            active.url = Set(url.clone());
            active.openwa_api_key_session_id = Set(session_id);
            active.openwa_api_key_operator = Set(encrypted_operator_key);
            active.openwa_webhook_secret = Set(encrypted_openwa_secret);
            active.miab_webhook_secret = Set(encrypted_miab_secret);
            active.updated_at = Set(Some(now));
            active.update(db).await?;
            "updated"
        } else {
            what_apps::ActiveModel {
                id: Set(Uuid::new_v4()),
                url: Set(url.clone()),
                openwa_api_key_session_id: Set(session_id),
                openwa_api_key_operator: Set(encrypted_operator_key),
                openwa_webhook_secret: Set(encrypted_openwa_secret),
                miab_webhook_secret: Set(encrypted_miab_secret),
                is_active: Set(true),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                deleted_at: Set(None),
                sync_at: Set(None),
                created_by: Set(None),
                updated_by: Set(None),
            }
            .insert(db)
            .await?;
            "created"
        };

        println!("{}", "-".repeat(60));
        println!("✅ OpenWA settings {action} for '{url}'");
        println!("{}", "=".repeat(60));
        println!();

        Ok(())
    }
}
