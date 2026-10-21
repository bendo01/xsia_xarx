use chrono::Local;
use rand::RngCore;
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    Set,
};

use crate::library::crypto;
use crate::models::preference::what_apps;
use crate::tasks::Task;

pub struct GenerateWebhookSecretTask;

/// 32 random bytes as 64 hex characters, same as `openssl rand -hex 32`.
fn generate_secret() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[async_trait]
impl Task for GenerateWebhookSecretTask {
    fn name(&self) -> &str {
        "utility:preference-generate-webhook-secret"
    }

    fn description(&self) -> &str {
        "Generates MIAB and OpenWA webhook secrets ([miab|openwa], default both), prints them as .env lines and stores them encrypted in the active OpenWA settings"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let target = args.first().map(|s| s.to_lowercase());
        let (gen_miab, gen_openwa) = match target.as_deref() {
            None | Some("all") => (true, true),
            Some("miab") => (true, false),
            Some("openwa") => (false, true),
            Some(other) => return Err(format!("Unknown target '{other}', use miab, openwa or all").into()),
        };

        println!("\n{}", "=".repeat(60));
        println!(" GENERATE WEBHOOK SECRET");
        println!("{}", "=".repeat(60));

        let miab_secret = gen_miab.then(generate_secret);
        let openwa_secret = gen_openwa.then(generate_secret);

        println!("Add to server/.env, then restart the API:\n");
        if let Some(secret) = &miab_secret {
            println!("MIAB_WEBHOOK_SECRET=\"{secret}\"");
        }
        if let Some(secret) = &openwa_secret {
            println!("OPENWA_WEBHOOK_SECRET=\"{secret}\"");
        }
        println!();

        let existing = what_apps::Entity::find()
            .filter(what_apps::Column::IsActive.eq(true))
            .filter(what_apps::Column::DeletedAt.is_null())
            .one(db)
            .await?;

        println!("{}", "-".repeat(60));
        match existing {
            Some(existing) => {
                let mut active = existing.into_active_model();
                if let Some(secret) = &miab_secret {
                    active.miab_webhook_secret = Set(crypto::encrypt(secret).map_err(|e| e.to_string())?);
                }
                if let Some(secret) = &openwa_secret {
                    active.openwa_webhook_secret = Set(crypto::encrypt(secret).map_err(|e| e.to_string())?);
                }
                active.updated_at = Set(Some(Local::now().naive_local()));
                active.update(db).await?;
                println!("✅ Secrets stored (encrypted) in the active OpenWA settings");
            }
            None => {
                println!("⚠️  No active OpenWA settings found, secrets were not stored in the database.");
                println!("   Run `cargo run -- task utility:preference-add-openwa` and paste them there.");
            }
        }
        println!("{}", "=".repeat(60));
        println!();

        Ok(())
    }
}
