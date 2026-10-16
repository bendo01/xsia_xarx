pub mod database;
pub mod email;
pub mod redis;
pub mod jwt;
pub mod feeder;
pub mod openwa;
pub mod mail_in_a_box;

use crate::library::crypto;

pub(crate) type ConfigResult<T> = Result<T, Box<dyn std::error::Error + Send + Sync>>;

/// Decrypts a secret stored in a preference table. Values saved before encryption
/// was added are returned as-is with a warning.
pub(crate) fn reveal(stored: &str, label: &str) -> ConfigResult<String> {
    if crypto::is_encrypted(stored) {
        return crypto::decrypt(stored);
    }
    if !stored.is_empty() {
        tracing::warn!("{label} is stored unencrypted; re-save it with its `utility:preference-*` task");
    }
    Ok(stored.to_string())
}
