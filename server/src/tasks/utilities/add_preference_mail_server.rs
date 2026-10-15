use chrono::Local;
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    Set,
};
use std::io::{self, Write};
use uuid::Uuid;

use crate::library::crypto;
use crate::models::preference::mail_servers;
use crate::tasks::Task;

pub struct AddPreferenceMailServerTask;

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

fn prompt_bool(label: &str, default: bool) -> Result<bool, Box<dyn std::error::Error>> {
    let value = prompt(&format!("{label} (y/n)"), Some(if default { "y" } else { "n" }))?;
    match value.to_lowercase().as_str() {
        "y" | "yes" => Ok(true),
        "n" | "no" => Ok(false),
        _ => Err(format!("{label} must be y or n").into()),
    }
}

#[async_trait]
impl Task for AddPreferenceMailServerTask {
    fn name(&self) -> &str {
        "preference:add-mail-server"
    }

    fn description(&self) -> &str {
        "Prompts for SMTP host, port, sender, address and credentials, then stores the active mail server (password encrypted)"
    }

    async fn run(&self, db: &DatabaseConnection, _args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n{}", "=".repeat(60));
        println!(" ADD PREFERENCE MAIL SERVER");
        println!("{}", "=".repeat(60));

        let host = prompt_required("SMTP host", None)?;
        let port = prompt_required("SMTP port", Some("587"))?;
        if port.parse::<u16>().is_err() {
            return Err("SMTP port must be a number between 0 and 65535".into());
        }
        let is_secure = prompt_bool("Use TLS", true)?;
        let sender = prompt_required("Sender name", None)?;
        let default_address = std::env::var("SYSTEM_MAIL_ADDRESS").ok();
        let mail_address = prompt_required("Sender mail address", default_address.as_deref())?;
        if !mail_address.contains('@') {
            return Err("Sender mail address is not a valid e-mail address".into());
        }

        let user = prompt("SMTP user (leave empty for no authentication)", None)?;
        let (user, encrypted_password) = if user.is_empty() {
            (None, None)
        } else {
            let password = rpassword::prompt_password("SMTP password: ")?;
            if password.is_empty() {
                return Err("SMTP password cannot be empty".into());
            }
            let encrypted = crypto::encrypt(&password).map_err(|e| e.to_string())?;
            (Some(user), Some(encrypted))
        };

        let now = Local::now().naive_local();

        let existing = mail_servers::Entity::find()
            .filter(mail_servers::Column::IsActive.eq(true))
            .filter(mail_servers::Column::DeletedAt.is_null())
            .one(db)
            .await?;

        let action = if let Some(existing) = existing {
            let mut active = existing.into_active_model();
            active.host = Set(host.clone());
            active.port = Set(port);
            active.sender = Set(sender);
            active.mail_address = Set(mail_address);
            active.user = Set(user);
            active.password = Set(encrypted_password);
            active.is_secure = Set(is_secure);
            active.updated_at = Set(Some(now));
            active.update(db).await?;
            "updated"
        } else {
            mail_servers::ActiveModel {
                id: Set(Uuid::new_v4()),
                host: Set(host.clone()),
                port: Set(port),
                sender: Set(sender),
                mail_address: Set(mail_address),
                user: Set(user),
                password: Set(encrypted_password),
                is_secure: Set(is_secure),
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
        println!("✅ Mail server {action} for host '{host}'");
        println!("{}", "=".repeat(60));
        println!();

        Ok(())
    }
}
