use super::{EmailAction, EmailContent};
use crate::config::email::EmailConfig;
use crate::jobs::email::EmailJob;

fn client_url(path: &str, token: &str, email: &str) -> String {
    format!(
        "{}{path}?token={}&email={}",
        EmailConfig::from_env().app_url,
        urlencoding::encode(token),
        urlencoding::encode(email)
    )
}

/// Email asking the user to verify their email address.
pub fn verify_email(name: &str, email: &str, token: &str) -> Result<EmailJob, tera::Error> {
    let system_name = EmailConfig::from_env().system_name;
    EmailContent {
        title: "Verifikasi Email".to_string(),
        icon: Some("✉️".to_string()),
        name: Some(name.to_string()),
        paragraphs: vec![
            format!("Terima kasih telah mendaftar di {system_name}. Klik tombol di bawah untuk memverifikasi alamat email Anda."),
            format!("Token verifikasi Anda: {token}"),
        ],
        action: Some(EmailAction {
            label: "Verifikasi Email".to_string(),
            url: client_url("/authentification/verify", token, email),
        }),
        notice: None,
        footnote: Some("Jika Anda tidak merasa mendaftar, abaikan email ini.".to_string()),
    }
    .into_job(email, "Verifikasi Email")
}

/// Email containing a link to the client's password reset page.
pub fn reset_password(name: &str, email: &str, token: &str) -> Result<EmailJob, tera::Error> {
    let system_name = EmailConfig::from_env().system_name;
    EmailContent {
        title: "Reset Password".to_string(),
        icon: Some("🔐".to_string()),
        name: Some(name.to_string()),
        paragraphs: vec![format!(
            "Kami menerima permintaan untuk mereset password akun Anda di {system_name}. Klik tombol di bawah untuk membuat password baru."
        )],
        action: Some(EmailAction {
            label: "Reset Password".to_string(),
            url: client_url("/authentification/password-reset", token, email),
        }),
        notice: Some("Link ini hanya berlaku selama 1 jam. Setelah itu, Anda perlu meminta link reset password yang baru.".to_string()),
        footnote: Some("Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.".to_string()),
    }
    .into_job(email, "Reset Password")
}

/// Notification that the password has been changed.
pub fn password_reset_success(name: &str, email: &str) -> Result<EmailJob, tera::Error> {
    let config = EmailConfig::from_env();
    EmailContent {
        title: "Password Berhasil Diubah".to_string(),
        icon: Some("✅".to_string()),
        name: Some(name.to_string()),
        paragraphs: vec![format!(
            "Password akun Anda di {} telah berhasil diubah. Silakan login menggunakan password baru Anda.",
            config.system_name
        )],
        action: Some(EmailAction {
            label: "Login".to_string(),
            url: format!("{}/authentification/login", config.app_url),
        }),
        notice: Some("Jika Anda tidak melakukan perubahan ini, segera hubungi administrator.".to_string()),
        footnote: None,
    }
    .into_job(email, "Password Berhasil Diubah")
}

/// Notification that an account has been created through account acquisition.
pub fn account_created(name: &str, email: &str) -> Result<EmailJob, tera::Error> {
    let config = EmailConfig::from_env();
    EmailContent {
        title: "Akun Berhasil Dibuat".to_string(),
        icon: Some("🎉".to_string()),
        name: Some(name.to_string()),
        paragraphs: vec![format!(
            "Akun Anda di {} telah berhasil dibuat. Anda sekarang dapat login.",
            config.system_name
        )],
        action: Some(EmailAction {
            label: "Login".to_string(),
            url: format!("{}/authentification/login", config.app_url),
        }),
        notice: None,
        footnote: None,
    }
    .into_job(email, "Akun Berhasil Dibuat")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reset_password_renders_link_and_escapes_name() {
        let job = reset_password("<Benny>", "blep@unpacti.ac.id", "abc-123").unwrap();
        let html = job.html_body.unwrap();
        assert!(html.contains("/authentification/password-reset?token=abc-123&amp;email=blep%40unpacti.ac.id"));
        assert!(html.contains("&lt;Benny&gt;"));
        assert!(html.contains("Perhatian:"));
        assert!(job.body.contains("token=abc-123&email=blep%40unpacti.ac.id"));
    }

    #[test]
    fn optional_sections_are_omitted() {
        let html = account_created("Benny", "blep@unpacti.ac.id").unwrap().html_body.unwrap();
        assert!(!html.contains("Perhatian:"));
        assert!(html.contains("/authentification/login"));
    }
}
