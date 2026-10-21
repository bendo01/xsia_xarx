use salvo::async_trait;
use sea_orm::DatabaseConnection;

use crate::services::compliance::rag::retrieve::{self, Options};
use crate::tasks::Task;

pub struct RetrieveRegulationsTask;

#[async_trait]
impl Task for RetrieveRegulationsTask {
    fn name(&self) -> &str {
        "compliance:retrieve"
    }

    fn description(&self) -> &str {
        "Hybrid-searches the regulation knowledge base: compliance:retrieve \"question\" [--k=5] [--revoked] (no LLM)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let query = args.iter().filter(|a| !a.starts_with("--")).cloned().collect::<Vec<_>>().join(" ");
        if query.trim().is_empty() {
            println!("usage: compliance:retrieve \"question\" [--k=5] [--revoked]");
            return Ok(());
        }
        let top_k = args.iter().find_map(|a| a.strip_prefix("--k=")).and_then(|v| v.parse().ok()).unwrap_or(5);
        let include_revoked = args.iter().any(|a| a == "--revoked");

        let hits = retrieve::search(db, &query, Options { top_k, include_revoked, ..Options::default() }).await?;
        println!("==> {} hit(s) for: {query}", hits.len());
        for (i, h) in hits.iter().enumerate() {
            let text: String = h.body().split_whitespace().collect::<Vec<_>>().join(" ");
            let text: String = text.chars().take(260).collect();
            println!("\n{}. [{:.4}] {}{}\n   {text}", i + 1, h.score, h.citation(), if h.status == "active" { "" } else { " (revoked)" });
        }
        Ok(())
    }
}
