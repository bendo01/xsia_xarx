use chrono::Local;
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    Set,
};
use std::io::{self, Write};
use uuid::Uuid;

use crate::library::crypto;
use crate::models::feeder::akun::kredential;
use crate::models::institution::master::institutions;
use crate::tasks::Task;

pub struct AddFeederCredentialTask;

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

#[async_trait]
impl Task for AddFeederCredentialTask {
    fn name(&self) -> &str {
        "feeder:add-credential"
    }

    fn description(&self) -> &str {
        "Prompts for Feeder username, password, institution code and URL, then stores the credential (password encrypted)"
    }

    async fn run(&self, db: &DatabaseConnection, _args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n{}", "=".repeat(60));
        println!(" ADD FEEDER CREDENTIAL");
        println!("{}", "=".repeat(60));

        let default_code = std::env::var("CURRENT_INSTITUTION_CODE").ok();
        let institution_code = prompt_required("Institution code", default_code.as_deref())?;

        let institution = institutions::Entity::find()
            .filter(institutions::Column::Code.eq(institution_code.as_str()))
            .filter(institutions::Column::DeletedAt.is_null())
            .one(db)
            .await?
            .ok_or_else(|| format!("Institution with code '{institution_code}' not found"))?;
        println!(
            "Institution: {} ({})",
            institution.name.as_deref().unwrap_or("-"),
            institution.id
        );

        let username = prompt_required("Feeder username", None)?;
        let password = rpassword::prompt_password("Feeder password: ")?;
        if password.is_empty() {
            return Err("Feeder password cannot be empty".into());
        }
        let service_url = prompt_required("Feeder URL (e.g. http://host:3003/ws/live2.php)", None)?;
        if !(service_url.starts_with("http://") || service_url.starts_with("https://")) {
            return Err("Feeder URL must start with http:// or https://".into());
        }

        let encrypted_password = crypto::encrypt(&password).map_err(|e| e.to_string())?;
        let now = Local::now().naive_local();

        let existing = kredential::Entity::find()
            .filter(kredential::Column::InstitutionId.eq(institution.id))
            .filter(kredential::Column::DeletedAt.is_null())
            .one(db)
            .await?;

        let action = if let Some(existing) = existing {
            let mut active = existing.into_active_model();
            active.username = Set(username);
            active.password = Set(encrypted_password);
            active.service_url = Set(service_url);
            active.updated_at = Set(Some(now));
            active.update(db).await?;
            "updated"
        } else {
            kredential::ActiveModel {
                id: Set(Uuid::new_v4()),
                username: Set(username),
                password: Set(encrypted_password),
                institution_id: Set(institution.id),
                service_url: Set(service_url),
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
        println!("✅ Feeder credential {action} for institution '{institution_code}'");
        println!("{}", "=".repeat(60));
        println!();

        Ok(())
    }
}
