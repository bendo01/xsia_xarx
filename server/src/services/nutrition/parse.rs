//! Prompt and answer parsing for the "what did the user eat" extraction.

use serde_json::Value;

use crate::services::ai::generation::LlmKind;

/// Foods this many grams or heavier are not a single serving; the model got the unit wrong
const MAX_GRAMS: f64 = 5000.0;

const SYSTEM: &str = "Kamu adalah asisten gizi Indonesia. Dari catatan makan pengguna, daftarkan SETIAP makanan atau minuman \
yang dimakan beserta perkiraan beratnya dalam gram (berat yang dimakan). \
Jawab HANYA dengan JSON array, tanpa penjelasan, dengan bentuk: \
[{\"name\": \"nasi putih\", \"quantity\": \"1 piring\", \"grams\": 200}]. \
\"name\" adalah nama bahan atau masakan yang umum dalam Bahasa Indonesia (misalnya \"ayam goreng\", \"tempe goreng\", \"teh manis\"). \
\"quantity\" adalah jumlah sesuai catatan pengguna. \"grams\" adalah angka perkiraan gram; untuk minuman 1 ml dihitung 1 gram. \
Acuan porsi: 1 piring nasi 200 g, 1 centong nasi 100 g, 1 potong ayam 75 g, 1 butir telur 55 g, 1 potong tempe 25 g, \
1 potong tahu 40 g, 1 buah pisang 75 g, 1 gelas 200 g, 1 sendok makan 15 g, 1 mangkuk sayur 100 g, 1 mangkuk bakso 250 g. \
Jika berat tidak bisa diperkirakan, isi \"grams\" dengan null. Jika tidak ada makanan, jawab [].";

/// Chat prompt in the format of `kind` (Qwen ChatML or Gemma turns)
pub fn build_prompt(kind: LlmKind, description: &str) -> String {
    let description = description.trim();
    match kind {
        LlmKind::Qwen => format!(
            "<|im_start|>system\n{SYSTEM}<|im_end|>\n<|im_start|>user\nCATATAN MAKAN:\n{description}<|im_end|>\n<|im_start|>assistant\n"
        ),
        // Gemma has no system role, so the instructions open the user turn
        LlmKind::Gemma => {
            format!("<bos><start_of_turn>user\n{SYSTEM}\n\nCATATAN MAKAN:\n{description}<end_of_turn>\n<start_of_turn>model\n")
        }
    }
}

/// One food the model found in the diary entry
#[derive(Debug, Clone, PartialEq)]
pub struct ParsedItem {
    pub name: String,
    pub quantity_text: Option<String>,
    pub grams: Option<f64>,
}

fn grams_of(v: &Value) -> Option<f64> {
    let g = match v {
        Value::Number(n) => n.as_f64()?,
        Value::String(s) => s.trim().trim_end_matches('g').trim().replace(',', ".").parse().ok()?,
        _ => return None,
    };
    (g.is_finite() && g > 0.0 && g <= MAX_GRAMS).then_some(g)
}

fn text_of(v: Option<&Value>) -> Option<String> {
    match v? {
        Value::String(s) => Some(s.trim().to_owned()).filter(|s| !s.is_empty()),
        Value::Number(n) => Some(n.to_string()),
        _ => None,
    }
}

/// Reads the model's answer: the first JSON array in `text` (models like to wrap it in prose or a code fence)
pub fn parse_items(text: &str) -> Result<Vec<ParsedItem>, String> {
    let start = text.find('[').ok_or("the answer has no JSON array")?;
    let end = text.rfind(']').filter(|e| *e > start).ok_or("the JSON array is not closed")?;
    let values: Vec<Value> = serde_json::from_str(&text[start..=end]).map_err(|e| format!("invalid JSON: {e}"))?;

    Ok(values
        .iter()
        .filter_map(|v| {
            let name = text_of(v.get("name"))?;
            Some(ParsedItem {
                name,
                quantity_text: text_of(v.get("quantity")),
                grams: v.get("grams").and_then(grams_of),
            })
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_a_plain_array() {
        let items = parse_items(r#"[{"name":"nasi putih","quantity":"1 piring","grams":200},{"name":"teh manis","grams":null}]"#).unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0], ParsedItem { name: "nasi putih".into(), quantity_text: Some("1 piring".into()), grams: Some(200.0) });
        assert_eq!(items[1].grams, None);
    }

    #[test]
    fn reads_an_array_wrapped_in_prose_and_a_code_fence() {
        let items = parse_items("Berikut hasilnya:\n```json\n[{\"name\": \"telur\", \"grams\": \"55 g\"}]\n```\nSemoga membantu.").unwrap();
        assert_eq!(items, vec![ParsedItem { name: "telur".into(), quantity_text: None, grams: Some(55.0) }]);
    }

    #[test]
    fn drops_rows_without_a_name_and_implausible_weights() {
        let items = parse_items(r#"[{"grams":10},{"name":"  "},{"name":"beras","grams":90000},{"name":"roti","grams":-3}]"#).unwrap();
        assert_eq!(items.iter().map(|i| (i.name.as_str(), i.grams)).collect::<Vec<_>>(), vec![("beras", None), ("roti", None)]);
    }

    #[test]
    fn rejects_an_answer_without_an_array() {
        assert!(parse_items("Maaf, saya tidak mengerti.").is_err());
        assert!(parse_items("[{\"name\": ").is_err());
        assert_eq!(parse_items("[]").unwrap(), vec![]);
    }

    #[test]
    fn prompt_matches_the_model_chat_format() {
        let qwen = build_prompt(LlmKind::Qwen, " makan nasi ");
        assert!(qwen.starts_with("<|im_start|>system") && qwen.ends_with("<|im_start|>assistant\n") && qwen.contains("makan nasi<|im_end|>"));
        let gemma = build_prompt(LlmKind::Gemma, "makan nasi");
        assert!(gemma.starts_with("<bos><start_of_turn>user") && gemma.ends_with("<start_of_turn>model\n"));
    }
}
