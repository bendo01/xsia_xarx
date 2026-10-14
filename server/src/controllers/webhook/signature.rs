use openssl::hash::MessageDigest;
use openssl::memcmp;
use openssl::pkey::PKey;
use openssl::sign::Signer;

/// Lowercase hex HMAC-SHA256 of `body` keyed with `secret`
pub fn sign(secret: &str, body: &[u8]) -> Result<String, openssl::error::ErrorStack> {
    let key = PKey::hmac(secret.as_bytes())?;
    let mut signer = Signer::new(MessageDigest::sha256(), &key)?;
    signer.update(body)?;
    let mac = signer.sign_to_vec()?;
    Ok(mac.iter().map(|b| format!("{b:02x}")).collect())
}

pub fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && memcmp::eq(a, b)
}

/// Check a `sha256=<hex>` (or bare hex) HMAC-SHA256 signature of `body` against `secret`
pub fn verify_hmac(secret: &str, signature: &str, body: &[u8]) -> bool {
    if secret.is_empty() {
        return false;
    }

    let given = signature.trim();
    let given = given.strip_prefix("sha256=").unwrap_or(given).to_ascii_lowercase();
    match sign(secret, body) {
        Ok(expected) => constant_time_eq(given.as_bytes(), expected.as_bytes()),
        Err(_) => false,
    }
}
