use chrono::Utc;
use salvo::async_trait;
use sea_orm::DatabaseConnection;
use std::collections::BTreeMap;

use crate::services::compliance::anomaly::{self, EnsembleConfig, Inputs, loaders, rules::RuleConfig};
use crate::services::compliance::rag::evidence;
use crate::tasks::Task;

pub struct DetectComplianceAnomaliesTask;

#[async_trait]
impl Task for DetectComplianceAnomaliesTask {
    fn name(&self) -> &str {
        "compliance:detect-anomalies"
    }

    fn description(&self) -> &str {
        "Runs rule + per-semester soft-voting (Isolation Forest, LOF, autoencoder) anomaly detection over feeder_master and prints a report (read-only; --top=0.02 sets the ML flag fraction per semester, --weights=1,1,1 the iforest,lof,autoencoder vote weights, --epochs=100 the autoencoder epochs, --samples=5 the rows shown per group, --cite adds the governing regulation text per rule)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let arg = |key: &str| args.iter().find_map(|a| a.strip_prefix(key));
        let top: f64 = arg("--top=").and_then(|v| v.parse().ok()).unwrap_or(0.02);
        let mut cfg = EnsembleConfig::default();
        if let Some(w) = arg("--weights=") {
            let parsed: Vec<f64> = w.split(',').filter_map(|v| v.trim().parse().ok()).collect();
            let weights: [f64; 3] = parsed.try_into().map_err(|_| "--weights expects three numbers, e.g. --weights=1,1,1")?;
            cfg.weights = weights;
        }
        if let Some(e) = arg("--epochs=").and_then(|v| v.parse().ok()) {
            cfg.epochs = e;
        }
        let samples: usize = arg("--samples=").and_then(|v| v.parse().ok()).unwrap_or(5);

        let inputs = Inputs {
            loads: loaders::lecturer_loads(db).await?,
            classes: loaders::class_enrolments(db).await?,
            students: loaders::student_spans(db, Utc::now().date_naive()).await?,
            student_terms: loaders::student_terms(db).await?,
        };
        println!(
            "==> Loaded {} lecturer-semester loads, {} classes, {} students, {} student-semester records",
            inputs.loads.len(),
            inputs.classes.len(),
            inputs.students.len(),
            inputs.student_terms.len()
        );

        let detections = anomaly::detect(&inputs, &RuleConfig::default(), &cfg, top, 42);

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
        if args.iter().any(|a| a == "--cite") {
            println!("\n==> Governing regulations");
            let mut seen = std::collections::HashSet::new();
            for d in detections.iter().filter(|d| d.rule_code.is_some_and(|c| seen.insert(c))) {
                println!("\n{}:", d.rule_code.unwrap_or_default());
                let hits = evidence::regulation_for(db, d, 3).await?;
                if hits.is_empty() {
                    println!("  (no regulation found)");
                }
                for h in hits {
                    let text: String = h.body().split_whitespace().collect::<Vec<_>>().join(" ").chars().take(200).collect();
                    println!("  - {}: {text}", h.citation());
                }
            }
        }
        Ok(())
    }
}
