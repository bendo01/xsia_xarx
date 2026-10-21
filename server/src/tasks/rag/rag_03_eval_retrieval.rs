use salvo::async_trait;
use sea_orm::DatabaseConnection;

use crate::services::compliance::rag::eval::{self, GOLD};
use crate::services::compliance::rag::retrieve::{self, Options};
use crate::tasks::Task;

pub struct EvalRetrievalTask;

#[async_trait]
impl Task for EvalRetrievalTask {
    fn name(&self) -> &str {
        "compliance:eval-retrieval"
    }

    fn description(&self) -> &str {
        "Scores retrieval on the built-in gold questions: plain RRF vs reranked (hit@1/3/5, MRR); --verbose lists each question"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let verbose = args.iter().any(|a| a == "--verbose");
        let mut results = Vec::new();
        for rerank in [false, true] {
            let mut ranks = Vec::new();
            for g in GOLD {
                let hits = retrieve::search(db, g.question, Options { top_k: 10, rerank, ..Options::default() }).await?;
                let rank = eval::first_relevant_rank(&hits, g);
                if verbose {
                    println!("{} rank={rank:?}  {}", if rerank { "rerank" } else { "rrf   " }, g.question);
                }
                ranks.push(rank);
            }
            results.push((if rerank { "rerank" } else { "rrf" }, eval::summarize(&ranks)));
        }
        println!("\n{} questions", GOLD.len());
        println!("{:<8} {:>6} {:>6} {:>6} {:>6}", "", "hit@1", "hit@3", "hit@5", "MRR");
        for (name, s) in results {
            println!("{name:<8} {:>6.2} {:>6.2} {:>6.2} {:>6.3}", s.hit_at_1, s.hit_at_3, s.hit_at_5, s.mrr);
        }
        Ok(())
    }
}
