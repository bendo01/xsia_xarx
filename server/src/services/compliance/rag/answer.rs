//! Prompt for answering a question from retrieved regulation chunks. The model is told to use only the
//! numbered context and to cite it, so an answer can be checked against the sources it was given.

use super::Hit;
use crate::services::ai::generation::LlmKind;

/// Characters of a chunk's text put in the prompt; a CPU model slows down with every extra prompt token
pub const DEFAULT_BODY_CHARS: usize = 800;

const SYSTEM: &str = "Kamu adalah asisten regulasi pendidikan tinggi Indonesia. \
Jawab dalam Bahasa Indonesia, singkat dan tepat, HANYA berdasarkan KONTEKS yang diberikan. \
Gunakan sumber yang memuat jawabannya dan abaikan sumber yang tidak relevan. \
Setiap pernyataan harus diikuti nomor sumbernya, misalnya [1]. \
Hanya jika tidak ada satu pun sumber yang memuat jawabannya, katakan dengan satu kalimat bahwa informasinya tidak ditemukan dalam basis pengetahuan. \
Jangan menambahkan pengetahuan di luar KONTEKS.";

/// Added only when a source is revoked: with a small model, a rule that never applies still leaks into the answer
const REVOKED_RULE: &str = " Sumber yang berstatus DICABUT sudah tidak berlaku; jika kamu merujuknya, katakan bahwa peraturan itu sudah dicabut.";

/// First `max` characters of `text`, cut on a word boundary where possible
fn clip(text: &str, max: usize) -> String {
    if text.chars().count() <= max {
        return text.to_owned();
    }
    let cut: String = text.chars().take(max).collect();
    let cut = cut.rsplit_once(char::is_whitespace).map_or(cut.as_str(), |(head, _)| head);
    format!("{}...", cut.trim_end())
}

/// Chat prompt in the format of `kind` (Qwen ChatML or Gemma turns): system instructions, the numbered
/// context, then the question.
pub fn build_prompt(kind: LlmKind, question: &str, hits: &[Hit], max_body_chars: usize) -> String {
    let mut context = String::new();
    for (i, hit) in hits.iter().enumerate() {
        let status = if hit.status == "active" { "berlaku" } else { "DICABUT" };
        context.push_str(&format!(
            "[{}] {} (status: {status})\n{}\n\n",
            i + 1,
            hit.citation(),
            clip(hit.body(), max_body_chars)
        ));
    }
    if context.is_empty() {
        context.push_str("(tidak ada konteks yang ditemukan)\n\n");
    }
    let question = question.trim();
    let system = if hits.iter().any(|h| h.status != "active") { format!("{SYSTEM}{REVOKED_RULE}") } else { SYSTEM.to_owned() };
    match kind {
        LlmKind::Qwen => format!(
            "<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\nKONTEKS:\n{context}PERTANYAAN: {question}<|im_end|>\n<|im_start|>assistant\n"
        ),
        // Gemma has no system role, so the instructions open the user turn
        LlmKind::Gemma => format!(
            "<bos><start_of_turn>user\n{system}\n\nKONTEKS:\n{context}PERTANYAAN: {question}<end_of_turn>\n<start_of_turn>model\n"
        ),
    }
}

#[cfg(test)]
mod tests {
    use uuid::Uuid;

    use super::*;

    fn hit(status: &str, heading: &str, content: &str) -> Hit {
        Hit {
            chunk_id: Uuid::nil(),
            regulation_id: Uuid::nil(),
            regulation: "PP No 37 2009".into(),
            number: Some("37".into()),
            year: Some(2009),
            status: status.into(),
            heading: Some(heading.into()),
            content: content.into(),
            score: 1.0,
        }
    }

    #[test]
    fn numbers_sources_and_marks_revoked_ones() {
        let hits = vec![hit("active", "Pasal 10", "Pasal 10\n\nDosen wajib mengajar."), hit("revoked", "Pasal 2", "Pasal 2\n\nIsi lama.")];
        let prompt = build_prompt(LlmKind::Qwen, "Apa kewajiban dosen?", &hits, DEFAULT_BODY_CHARS);
        assert!(prompt.contains("[1] PP No 37 2009, Pasal 10 (status: berlaku)\nDosen wajib mengajar."));
        assert!(prompt.contains("[2] PP No 37 2009, Pasal 2 (status: DICABUT)\nIsi lama."));
        assert!(prompt.ends_with("<|im_start|>assistant\n"));
        assert!(prompt.contains("PERTANYAAN: Apa kewajiban dosen?"));
    }

    #[test]
    fn gemma_prompt_uses_gemma_turns() {
        let prompt = build_prompt(LlmKind::Gemma, "Apa kewajiban dosen?", &[hit("active", "Pasal 10", "Pasal 10\n\nDosen wajib mengajar.")], DEFAULT_BODY_CHARS);
        assert!(prompt.starts_with("<bos><start_of_turn>user\n"));
        assert!(prompt.ends_with("<end_of_turn>\n<start_of_turn>model\n"));
        assert!(prompt.contains("PERTANYAAN: Apa kewajiban dosen?"));
    }

    #[test]
    fn clips_long_chunks_on_a_word_boundary() {
        let text = "satu dua tiga empat lima enam";
        assert_eq!(clip(text, 14), "satu dua tiga...");
        assert_eq!(clip(text, 100), text);
    }

    #[test]
    fn says_so_when_nothing_was_retrieved() {
        assert!(build_prompt(LlmKind::Qwen, "x", &[], 100).contains("tidak ada konteks"));
    }

    /// Needs the Qwen model files; run with `cargo test -- --ignored --nocapture` to read the answers
    #[test]
    #[ignore]
    fn model_answers_from_the_context_and_admits_ignorance() {
        use crate::services::ai::generation::{GenParams, LlmService};

        let hits = vec![hit(
            "active",
            "Pasal 52",
            "Pasal 52\n\nPeraturan Menteri ini mulai berlaku pada tanggal diundangkan. Prosedur pendirian perguruan tinggi swasta \
             dilakukan melalui OSS dengan memenuhi komitmen yang disyaratkan, lalu Kementerian memverifikasi dokumen paling lama \
             30 (tiga puluh) hari kerja.",
        )];
        let llm = LlmService::global(LlmKind::Qwen).unwrap();
        let ask = |q: &str| {
            let stats = llm
                .generate(&build_prompt(LlmKind::Qwen, q, &hits, DEFAULT_BODY_CHARS), &GenParams { max_new_tokens: 120, ..Default::default() }, |_| true)
                .unwrap();
            println!("Q: {q}\nA: {}\n({} prompt tokens, {} ms prompt, {} tokens, {} ms)\n", stats.text.trim(), stats.prompt_tokens, stats.prompt_ms, stats.new_tokens, stats.generation_ms);
            stats.text
        };
        let answer = ask("Berapa lama Kementerian memverifikasi dokumen pendirian PTS?");
        assert!(answer.contains("30"), "expected the 30 working days from the context: {answer}");
        ask("Berapa besar tunjangan profesi dosen?");
    }
}
