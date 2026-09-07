use std::time::Duration;
use lettre::{Message, SmtpTransport, Transport, transport::smtp::authentication::Credentials};
use pgmq::errors::PgmqError;
use pgmq::PGMQueueExt;
use serde::{Deserialize, Serialize};

use crate::config::email::EmailConfig;

pub const EMAIL_QUEUE: &str = "email";

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct EmailJob {
    pub to: String,
    pub subject: String,
    pub body: String,
}

pub async fn send_email(job: &EmailJob) -> Result<(), std::io::Error> {
    let email_config = EmailConfig::from_env();

    let email = Message::builder()
        .from(
            format!("{} <{}>", email_config.from_name, email_config.from_email)
                .parse()
                .map_err(|e: lettre::address::AddressError| std::io::Error::other(e.to_string()))?,
        )
        .to(job
            .to
            .parse()
            .map_err(|e: lettre::address::AddressError| std::io::Error::other(e.to_string()))?)
        .subject(&job.subject)
        .body(job.body.clone())
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

/// Ensures the email queue exists in PGMQ.
pub async fn init_email_queue(queue: &PGMQueueExt) -> Result<(), PgmqError> {
    queue.create(EMAIL_QUEUE).await?;
    Ok(())
}

/// Enqueues an email job into the PGMQ email queue.
pub async fn enqueue_email(queue: &PGMQueueExt, job: &EmailJob) -> Result<i64, PgmqError> {
    queue.send(EMAIL_QUEUE, job).await
}

/// Starts the background email worker using PGMQ.
pub fn start_email_worker(queue: PGMQueueExt) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        tracing::info!("PGMQ email worker loop started on queue '{EMAIL_QUEUE}'");

        loop {
            // Visibility timeout: 60 seconds, poll timeout: 5 seconds, poll interval: 500ms
            let poll_result = queue
                .read_with_poll::<EmailJob>(
                    EMAIL_QUEUE,
                    60i32,
                    Some(Duration::from_secs(5)),
                    Some(Duration::from_millis(500)),
                )
                .await;

            match poll_result {
                Ok(Some(msg)) => {
                    tracing::info!(
                        "Processing email job msg_id: {} to: '{}'",
                        msg.msg_id,
                        msg.message.to
                    );

                    match send_email(&msg.message).await {
                        Ok(_) => {
                            tracing::info!(
                                "Email delivered successfully for job msg_id: {}",
                                msg.msg_id
                            );
                            if let Err(e) = queue.archive(EMAIL_QUEUE, msg.msg_id).await {
                                tracing::error!(
                                    "Failed to archive completed email job {}: {}",
                                    msg.msg_id,
                                    e
                                );
                            }
                        }
                        Err(e) => {
                            tracing::error!(
                                "Failed to send email for job msg_id: {} (read count: {}): {}",
                                msg.msg_id,
                                msg.read_ct,
                                e
                            );
                            // After max retries (5), archive to dead-letter/archive table
                            if msg.read_ct >= 5 {
                                tracing::warn!(
                                    "Email job msg_id: {} exceeded max retries ({}), archiving...",
                                    msg.msg_id,
                                    msg.read_ct
                                );
                                let _ = queue.archive(EMAIL_QUEUE, msg.msg_id).await;
                            }
                        }
                    }
                }
                Ok(None) => {
                    // No messages received within poll timeout, continue loop
                }
                Err(e) => {
                    tracing::error!("Error reading from PGMQ email queue: {}", e);
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        }
    })
}
