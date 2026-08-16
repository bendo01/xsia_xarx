use serde::{Deserialize, Serialize};
use apalis::prelude::Monitor;
use lettre::{Message, SmtpTransport, Transport, transport::smtp::authentication::Credentials};
use crate::config::email::EmailConfig;

#[derive(Debug, Deserialize, Serialize)]
pub struct EmailJob {
    pub to: String,
    pub subject: String,
    pub body: String,
}

pub async fn send_email(job: EmailJob) -> Result<(), std::io::Error> {
    let email_config = EmailConfig::from_env();
    
    let email = Message::builder()
        .from(format!("{} <{}>", email_config.from_name, email_config.from_email).parse().map_err(|e: lettre::address::AddressError| std::io::Error::other(e.to_string()))?)
        .to(job.to.parse().map_err(|e: lettre::address::AddressError| std::io::Error::other(e.to_string()))?)
        .subject(job.subject)
        .body(job.body)
        .map_err(|e| std::io::Error::other(e.to_string()))?;

    let creds = if let Some(password) = email_config.smtp_password {
        Some(Credentials::new(email_config.smtp_user.clone(), password))
    } else if !email_config.smtp_user.is_empty() {
        Some(Credentials::new(email_config.smtp_user.clone(), "".to_string()))
    } else {
        None
    };

    let mut mailer_builder = if email_config.smtp_port == 465 {
        SmtpTransport::relay(&email_config.smtp_host)
            .map_err(|e| std::io::Error::other(e.to_string()))?
    } else {
        SmtpTransport::builder_dangerous(&email_config.smtp_host).port(email_config.smtp_port)
    };

    if let Some(c) = creds {
        mailer_builder = mailer_builder.credentials(c);
    }

    let mailer = mailer_builder.build();

    // Send the email
    match mailer.send(&email) {
        Ok(_) => Ok(()),
        Err(e) => Err(std::io::Error::other(e.to_string())),
    }
}

pub async fn start_email_worker(redis_url: String) -> Result<Monitor, std::io::Error> {
    use apalis_redis::RedisStorage;
    use apalis::prelude::{WorkerBuilder, WorkerFactoryFn};

    let conn = apalis_redis::connect(redis_url).await.map_err(|e| std::io::Error::other(e.to_string()))?;
    let storage: RedisStorage<EmailJob> = RedisStorage::new(conn);

    let worker = WorkerBuilder::new("xsia-xarx:email")
        .backend(storage)
        .build_fn(send_email);

    let monitor = Monitor::new()
        .register(worker);

    Ok(monitor)
}
