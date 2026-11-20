//! Finds the TKPI food a diary item refers to, by name.

use anyhow::Result;
use sea_orm::sea_query::{Expr, ExprTrait, Func};
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, QuerySelect};

use crate::models::person::nutritional_intake::food;

/// Share of the query's words a food name must contain to count as a match
const MIN_SCORE: f64 = 0.6;
/// Foods fetched per lookup; a common word like "ikan" matches many rows
const CANDIDATE_LIMIT: u64 = 300;

const STOPWORDS: &[&str] = &["dan", "dengan", "yang", "di", "ke", "dari", "atau", "sedikit", "porsi"];

/// Lower-case words of `text`, without punctuation or filler words
pub fn tokens(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|t| t.chars().count() >= 2 && !STOPWORDS.contains(t))
        .map(str::to_owned)
        .collect()
}

/// How well `food_name` fits the query words: the share of query words it contains, minus a small penalty for
/// every extra word so "Nasi" beats "Nasi goreng ayam" for the query "nasi". An identical name scores highest.
pub fn score(query: &[String], food_name: &str) -> f64 {
    if query.is_empty() {
        return 0.0;
    }
    let name = tokens(food_name);
    let hits = query.iter().filter(|q| name.iter().any(|n| n == *q)).count();
    if hits == query.len() && name.len() == query.len() {
        return 2.0;
    }
    let extra = name.len().saturating_sub(hits);
    hits as f64 / query.len() as f64 - 0.02 * extra as f64
}

/// Best candidate scoring at least [`MIN_SCORE`]; ties go to the shorter name
pub fn pick<'a>(query: &[String], foods: &'a [food::Model]) -> Option<&'a food::Model> {
    foods
        .iter()
        .map(|f| (score(query, &f.name), f))
        .filter(|(s, _)| *s >= MIN_SCORE)
        .max_by(|(a, fa), (b, fb)| a.total_cmp(b).then(fb.name.len().cmp(&fa.name.len())))
        .map(|(_, f)| f)
}

/// The TKPI food that best matches a food name written by the user or the language model
pub async fn find_food(db: &DatabaseConnection, name: &str) -> Result<Option<food::Model>> {
    let query = tokens(name);
    if query.is_empty() {
        return Ok(None);
    }
    // Candidates share at least one of the longest words (the most specific ones)
    let mut words = query.clone();
    words.sort_by_key(|w| std::cmp::Reverse(w.chars().count()));
    words.truncate(3);

    let mut any = Condition::any();
    for word in &words {
        any = any.add(Expr::expr(Func::lower(Expr::col(food::Column::Name))).like(format!("%{word}%")));
    }
    let candidates = food::Entity::find()
        .filter(food::Column::DeletedAt.is_null())
        .filter(any)
        .limit(CANDIDATE_LIMIT)
        .all(db)
        .await?;
    Ok(pick(&query, &candidates).cloned())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn food(code: &str, name: &str) -> food::Model {
        let now = chrono::Utc::now().naive_utc();
        food::Model {
            id: uuid::Uuid::new_v4(),
            food_group_id: uuid::Uuid::nil(),
            source_id: None,
            code: code.into(),
            name: name.into(),
            kind: None,
            edible_portion: None,
            species: None,
            genus: None,
            family: None,
            english_name: None,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            sync_at: None,
            created_by: None,
            updated_by: None,
        }
    }

    #[test]
    fn tokenizes_without_punctuation_or_fillers() {
        assert_eq!(tokens("Ayam, goreng dengan sambal!"), vec!["ayam", "goreng", "sambal"]);
    }

    #[test]
    fn prefers_the_closest_name() {
        let foods = vec![food("AR001", "Beras giling, mentah"), food("AP100", "Nasi"), food("AP101", "Nasi goreng ayam")];
        assert_eq!(pick(&tokens("nasi"), &foods).unwrap().code, "AP100");
        assert_eq!(pick(&tokens("Nasi goreng ayam"), &foods).unwrap().code, "AP101");
    }

    #[test]
    fn needs_most_of_the_words_to_match() {
        let foods = vec![food("FR001", "Ayam, daging, segar")];
        assert!(pick(&tokens("ayam goreng"), &foods).is_none());
        assert!(pick(&tokens("ayam"), &foods).is_some());
        assert!(pick(&tokens("kerupuk"), &foods).is_none());
    }
}
