//! Per-run log for downstream sync tasks.
//!
//! Each run writes two files under `logs/` with the same stem:
//! - `sync_<name>_<stamp>.log`   human-readable lines (unchanged format)
//! - `sync_<name>_<stamp>.jsonl` one JSON object per line, for log viewers / jq
//!
//! Skip entries in the JSONL file carry the full feeder source row so missing
//! references can be inspected without re-querying the database.

use chrono::Local;
use serde::Serialize;
use serde_json::{Value, json};
use std::fs::{File, OpenOptions};
use std::io::{self, Write};

pub struct SyncLog {
    sync: &'static str,
    echo: bool,
    text: File,
    json: File,
    pub text_path: String,
    pub json_path: String,
}

impl SyncLog {
    /// `echo` prints each message to stdout (used when the progress bar is off).
    pub fn open(sync: &'static str, echo: bool) -> io::Result<Self> {
        let dir = "logs";
        std::fs::create_dir_all(dir)?;
        let stamp = Local::now().format("%Y%m%d_%H%M%S");
        let text_path = format!("{}/sync_{}_{}.log", dir, sync, stamp);
        let json_path = format!("{}/sync_{}_{}.jsonl", dir, sync, stamp);
        let open = |path: &str| OpenOptions::new().create(true).append(true).open(path);
        Ok(Self {
            sync,
            echo,
            text: open(&text_path)?,
            json: open(&json_path)?,
            text_path,
            json_path,
        })
    }

    pub fn info(&mut self, message: &str) -> io::Result<()> {
        self.write_text(message)?;
        self.write_json(json!({ "level": "info", "message": message }))
    }

    /// Record skipped because a required field is missing or a reference was not found.
    /// `reason` is a stable snake_case code for filtering; `context` holds the lookup keys.
    pub fn skip<R: Serialize>(
        &mut self,
        record: &R,
        reason: &str,
        context: Value,
        message: &str,
    ) -> io::Result<()> {
        let record = serde_json::to_value(record).unwrap_or(Value::Null);
        let record_id = record.get("id").cloned().unwrap_or(Value::Null);
        self.write_text(&format!(
            "SKIPPED: {} (record id: {})",
            message,
            record_id.as_str().unwrap_or("?")
        ))?;
        self.write_json(json!({
            "level": "skip",
            "reason": reason,
            "message": message,
            "record_id": record_id,
            "context": context,
            "record": record,
        }))
    }

    /// Non-fatal anomaly on a record that was still processed (e.g. duplicate reference rows).
    pub fn warn<R: Serialize>(
        &mut self,
        record: &R,
        reason: &str,
        context: Value,
        message: &str,
    ) -> io::Result<()> {
        let record_id = serde_json::to_value(record)
            .ok()
            .and_then(|r| r.get("id").cloned())
            .unwrap_or(Value::Null);
        self.write_text(&format!(
            "WARNING: {} (record id: {})",
            message,
            record_id.as_str().unwrap_or("?")
        ))?;
        self.write_json(json!({
            "level": "warn",
            "reason": reason,
            "message": message,
            "record_id": record_id,
            "context": context,
        }))
    }

    pub fn error(&mut self, message: &str) -> io::Result<()> {
        self.write_text(&format!("ERROR: {}", message))?;
        self.write_json(json!({ "level": "error", "message": message }))
    }

    pub fn record_error<R: Serialize>(&mut self, record: &R, message: &str) -> io::Result<()> {
        let record = serde_json::to_value(record).unwrap_or(Value::Null);
        let record_id = record.get("id").cloned().unwrap_or(Value::Null);
        self.write_text(&format!(
            "ERROR: {} (record id: {})",
            message,
            record_id.as_str().unwrap_or("?")
        ))?;
        self.write_json(json!({
            "level": "error",
            "message": message,
            "record_id": record_id,
            "record": record,
        }))
    }

    pub fn summary(&mut self, inserted: u64, updated: u64, skipped: u64, errors: u64) -> io::Result<()> {
        self.summary_with(inserted, updated, skipped, errors, &[])
    }

    /// Summary with extra task-specific counters appended (e.g. `teach_not_found`).
    pub fn summary_with(
        &mut self,
        inserted: u64,
        updated: u64,
        skipped: u64,
        errors: u64,
        extra: &[(&str, u64)],
    ) -> io::Result<()> {
        let mut message = format!(
            "Summary: inserted: {}, updated: {}, skipped: {}, errors: {}",
            inserted, updated, skipped, errors
        );
        let mut entry = json!({
            "level": "summary",
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
        });
        for (key, count) in extra {
            message.push_str(&format!(", {}: {}", key, count));
            entry[*key] = json!(count);
        }
        entry["message"] = json!(message);
        self.write_text(&message)?;
        self.write_json(entry)
    }

    fn write_text(&mut self, message: &str) -> io::Result<()> {
        writeln!(self.text, "[{}] {}", Local::now().format("%Y-%m-%d %H:%M:%S"), message)?;
        if self.echo {
            println!("{}", message);
        }
        Ok(())
    }

    fn write_json(&mut self, mut entry: Value) -> io::Result<()> {
        if let Value::Object(ref mut map) = entry {
            map.insert("timestamp".into(), json!(Local::now().to_rfc3339()));
            map.insert("sync".into(), json!(self.sync));
        }
        writeln!(self.json, "{}", entry)
    }
}
