use chrono::Utc;
use salvo::async_trait;
use sea_orm::DatabaseConnection;
use std::collections::BTreeMap;

use crate::services::compliance::anomaly::{self, Inputs, loaders, rules::RuleConfig};
use crate::tasks::Task;

pub struct DetectComplianceAnomaliesTask;

#[async_trait]
impl Task for DetectComplianceAnomaliesTask {
    fn name(&self) -> &str {
        "compliance:detect-anomalies"
    }

    fn description(&self) -> &str {
        "Runs rule + Isolation Forest/LOF anomaly detection over feeder_master and prints a report (read-only; --top=0.02 sets the ML flag fraction, --samples=5 the rows shown per group)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let arg = |key: &str| args.iter().find_map(|a| a.strip_prefix(key));
        let top: f64 = arg("--top=").and_then(|v| v.parse().ok()).unwrap_or(0.02);
        let samples: usize = arg("--samples=").and_then(|v| v.parse().ok()).unwrap_or(5);

        let inputs = Inputs {
            loads: loaders::lecturer_loads(db).await?,
            classes: loaders::class_enrolments(db).await?,
            students: loaders::student_spans(db, Utc::now().date_naive()).await?,
        };
        println!(
            "==> Loaded {} lecturer-semester loads, {} classes, {} students",
            inputs.loads.len(),
            inputs.classes.len(),
            inputs.students.len()
        );

        let detections = anomaly::detect(&inputs, &RuleConfig::default(), top, 42);

        let mut groups: BTreeMap<(String, String), Vec<&anomaly::Detection>> = BTreeMap::new();
        for d in &detections {
            let key = d.rule_code.map_or_else(|| d.detector.to_owned(), str::to_owned);
            groups.entry((d.entity_type.to_owned(), key)).or_default().push(d);
        }
        println!("==> {} detections", detections.len());
        for ((entity, key), items) in &groups {
            println!("\n{entity} / {key}: {}", items.len());
            for d in items.iter().take(samples) {
                println!("  {} score={:.3} {} {}", d.entity_id, d.score, d.severity.as_str(), d.evidence);
            }
        }
        Ok(())
    }
}
