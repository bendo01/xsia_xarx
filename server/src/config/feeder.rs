use sea_orm::{ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter};
use std::env;
use uuid::Uuid;

use super::institution::CurrentInstitution;
use crate::library::crypto;
use crate::models::feeder::akun::kredential;

#[derive(Debug, Clone)]
pub struct FeederConfig {
    pub feeder_url: String,
    pub feeder_username: String,
    pub feeder_password: String,
}

impl Default for FeederConfig {
    fn default() -> Self {
        Self {
            feeder_url: "http://feeder_domain.tld/ws/live2.php".to_string(),
            feeder_username: "fill_your_username".to_string(),
            feeder_password: "fill_your_password".to_string(),
        }
    }
}

impl FeederConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();

        Self {
            feeder_url: env::var("FEEDER_URL").unwrap_or(default_config.feeder_url),
            feeder_username: env::var("FEEDER_USERNAME").unwrap_or(default_config.feeder_username),
            feeder_password: env::var("FEEDER_PASSWORD").unwrap_or(default_config.feeder_password),
        }
    }

    /// Loads the credential stored in `feeder_akun.kredential` for `institution_id`,
    /// decrypting the password. Returns `Ok(None)` if no credential exists.
    pub async fn from_db<C: ConnectionTrait>(
        db: &C,
        institution_id: Uuid,
    ) -> Result<Option<Self>, Box<dyn std::error::Error + Send + Sync>> {
        let Some(record) = kredential::Entity::find()
            .filter(kredential::Column::InstitutionId.eq(institution_id))
            .filter(kredential::Column::DeletedAt.is_null())
            .one(db)
            .await?
        else {
            return Ok(None);
        };

        let feeder_password = if crypto::is_encrypted(&record.password) {
            crypto::decrypt(&record.password)?
        } else {
            eprintln!(
                "⚠️  Feeder credential for institution {institution_id} is stored unencrypted; \
                 re-save it with `task utility:feeder-add-credential`"
            );
            record.password
        };

        Ok(Some(Self {
            feeder_url: record.service_url,
            feeder_username: record.username,
            feeder_password,
        }))
    }

    /// Loads the credential of the current institution (see [`CurrentInstitution`])
    /// from the database, falling back to `FEEDER_*` environment variables if no
    /// credential is stored.
    pub async fn load<C: ConnectionTrait>(
        db: &C,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let has_credential = kredential::Entity::find()
            .filter(kredential::Column::DeletedAt.is_null())
            .one(db)
            .await?
            .is_some();
        if !has_credential {
            return Ok(Self::from_env());
        }

        let institution = CurrentInstitution::load(db).await?;
        Self::from_db(db, institution.id).await?.ok_or_else(|| {
            format!("No Feeder credential for institution {}", institution.id).into()
        })
    }
}
