//! Symmetric encryption for secrets that must be recovered in plaintext
//! (e.g. Feeder Dikti passwords sent to the `GetToken` API).
//!
//! Uses AES-256-GCM with a random 96-bit nonce per value. The key is read from
//! `APP_ENCRYPTION_KEY` as base64-encoded 32 bytes. Generate one with:
//! `openssl rand -base64 32`
//!
//! Stored format: `v1:<base64(nonce || ciphertext || tag)>`

use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::{Engine as _, engine::general_purpose::STANDARD};
use std::env;

const KEY_ENV: &str = "APP_ENCRYPTION_KEY";
const PREFIX: &str = "v1:";
const NONCE_LEN: usize = 12;

type CryptoResult<T> = Result<T, Box<dyn std::error::Error + Send + Sync>>;

fn cipher() -> CryptoResult<Aes256Gcm> {
    dotenv::dotenv().ok();
    let encoded = env::var(KEY_ENV).map_err(|_| format!("{KEY_ENV} is not set"))?;
    let bytes = STANDARD
        .decode(encoded.trim())
        .map_err(|e| format!("{KEY_ENV} is not valid base64: {e}"))?;
    if bytes.len() != 32 {
        return Err(format!("{KEY_ENV} must decode to 32 bytes, got {}", bytes.len()).into());
    }
    Ok(Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&bytes)))
}

/// Encrypts `plaintext` into the versioned storage format.
pub fn encrypt(plaintext: &str) -> CryptoResult<String> {
    let cipher = cipher()?;
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|_| "Encryption failed")?;

    let mut payload = nonce.to_vec();
    payload.extend_from_slice(&ciphertext);
    Ok(format!("{PREFIX}{}", STANDARD.encode(payload)))
}

/// Decrypts a value produced by [`encrypt`].
pub fn decrypt(stored: &str) -> CryptoResult<String> {
    let encoded = stored
        .strip_prefix(PREFIX)
        .ok_or("Value is not in encrypted format")?;
    let payload = STANDARD
        .decode(encoded)
        .map_err(|e| format!("Encrypted value is not valid base64: {e}"))?;
    if payload.len() <= NONCE_LEN {
        return Err("Encrypted value is too short".into());
    }

    let (nonce, ciphertext) = payload.split_at(NONCE_LEN);
    let plaintext = cipher()?
        .decrypt(Nonce::from_slice(nonce), ciphertext)
        .map_err(|_| "Decryption failed (wrong key or tampered value)")?;
    Ok(String::from_utf8(plaintext)?)
}

/// Returns true if `value` looks like output of [`encrypt`].
pub fn is_encrypted(value: &str) -> bool {
    value.starts_with(PREFIX)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_and_tamper_detection() {
        // SAFETY: test-only; no other test reads this variable concurrently.
        unsafe { env::set_var(KEY_ENV, STANDARD.encode([7u8; 32])) };

        let encrypted = encrypt("s3cret").unwrap();
        assert!(is_encrypted(&encrypted));
        assert_ne!(encrypt("s3cret").unwrap(), encrypted, "nonce must be random");
        assert_eq!(decrypt(&encrypted).unwrap(), "s3cret");

        let mut tampered = STANDARD.decode(&encrypted[PREFIX.len()..]).unwrap();
        *tampered.last_mut().unwrap() ^= 1;
        assert!(decrypt(&format!("{PREFIX}{}", STANDARD.encode(tampered))).is_err());
    }
}
