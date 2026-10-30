//! Rank fusion and duplicate removal; pure functions, no database.

use std::collections::HashMap;
use std::hash::Hash;

/// Reciprocal Rank Fusion (Cormack et al., 2009): each list contributes `1 / (k + rank)` per item,
/// rank starting at 1. Returns items by descending fused score; ties keep first-seen order.
pub fn rrf<K: Hash + Eq + Clone>(lists: &[Vec<K>], k: f64) -> Vec<(K, f64)> {
    let mut order: Vec<K> = Vec::new();
    let mut scores: HashMap<K, f64> = HashMap::new();
    for list in lists {
        for (i, item) in list.iter().enumerate() {
            let entry = scores.entry(item.clone()).or_insert_with(|| {
                order.push(item.clone());
                0.0
            });
            *entry += 1.0 / (k + (i + 1) as f64);
        }
    }
    let mut out: Vec<(K, f64)> = order
        .into_iter()
        .map(|key| {
            let s = scores[&key];
            (key, s)
        })
        .collect();
    out.sort_by(|a, b| b.1.total_cmp(&a.1)); // stable: ties stay in first-seen order
    out
}

const STOPWORDS: &[&str] = &[
    "yang",
    "dan",
    "dengan",
    "untuk",
    "dari",
    "pada",
    "atau",
    "apa",
    "berapa",
    "adalah",
    "dalam",
    "itu",
    "ini",
    "oleh",
    "ke",
    "di",
    "the",
    "of",
    "is",
    "a",
    "an",
    "apakah",
    "pengertian",
    "definisi",
    "dimaksud",
    "berdasarkan",
    "menurut",
    "tentang",
    "bagaimana",
    "jelaskan",
    "sebutkan",
    "sesuai",
    "sebagaimana",
    "seperti",
    "terdapat",
];

/// Degree abbreviations that questions use but regulations spell out ("program sarjana"), so neither the
/// embedding nor the keyword match would otherwise connect "S1" with the article about it
const DEGREE_ALIASES: &[(&str, &str)] = &[
    ("d1", "program diploma satu"),
    ("d2", "program diploma dua"),
    ("d3", "program diploma tiga"),
    ("d4", "program diploma empat"),
    ("s1", "program sarjana"),
    ("s2", "program magister"),
    ("s3", "program doktor"),
];

/// The question with each whole-word degree abbreviation (`S1`, `d3`, ...) replaced by the regulation's wording
pub fn expand_aliases(query: &str) -> String {
    let mut out = String::with_capacity(query.len() + 16);
    let mut word = String::new();
    let flush = |word: &mut String, out: &mut String| {
        if word.is_empty() {
            return;
        }
        let lower = word.to_lowercase();
        match DEGREE_ALIASES.iter().find(|(abbr, _)| *abbr == lower) {
            Some((_, full)) => out.push_str(full),
            None => out.push_str(word),
        }
        word.clear();
    };
    for c in query.chars() {
        if c.is_alphanumeric() {
            word.push(c);
        } else {
            flush(&mut word, &mut out);
            out.push(c);
        }
    }
    flush(&mut word, &mut out);
    out
}

/// Search terms of a question: lowercase alphanumerics, minus stop words and one/two-letter words
/// (numbers are kept, since limits such as `16` matter).
pub fn query_terms(query: &str) -> Vec<String> {
    let mut seen = std::collections::HashSet::new();
    query
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|t| !t.is_empty())
        .filter(|t| {
            t.chars().all(|c| c.is_ascii_digit())
                || (t.chars().count() >= 3 && !STOPWORDS.contains(t))
        })
        .filter(|t| seen.insert((*t).to_owned()))
        .map(str::to_owned)
        .collect()
}

/// A regulation named in a question, e.g. "undang undang nomor 12 tahun 2012"
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Reference {
    /// Abbreviation used in archive names (`UU`, `PP`, `Perpres`), when the question names the kind
    pub kind: Option<&'static str>,
    pub number: String,
    pub year: u16,
}

fn kind_of(words: &[&str]) -> Option<(&'static str, usize)> {
    match words {
        [.., "undang", "undang"] => Some(("UU", 2)),
        [.., "uu"] => Some(("UU", 1)),
        [.., "peraturan", "pemerintah"] => Some(("PP", 2)),
        [.., "pp"] => Some(("PP", 1)),
        [.., "peraturan", "presiden"] => Some(("Perpres", 2)),
        [.., "perpres"] => Some(("Perpres", 1)),
        _ => None,
    }
}

/// Splits a question into the regulation it cites ("... nomor 12 tahun 2012") and the rest of the question.
/// The citation words would otherwise match the "Mengingat" lists of every regulation that cites it.
/// Returns `None` unless both a number and a year follow `nomor`/`no`/`tahun`.
pub fn extract_reference(query: &str) -> Option<(Reference, String)> {
    let lower = query.to_lowercase();
    let words: Vec<&str> = lower
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| !w.is_empty())
        .collect();
    let at = (0..words.len().saturating_sub(3)).find(|&i| {
        matches!(words[i], "nomor" | "no")
            && words[i + 1].chars().all(|c| c.is_ascii_digit())
            && words[i + 2] == "tahun"
            && words[i + 3].len() == 4
            && words[i + 3].chars().all(|c| c.is_ascii_digit())
    })?;
    let number = words[at + 1].trim_start_matches('0');
    let reference_start = kind_of(&words[..at]).map_or((None, at), |(k, n)| (Some(k), at - n));
    let reference = Reference {
        kind: reference_start.0,
        number: if number.is_empty() {
            "0".to_owned()
        } else {
            number.to_owned()
        },
        year: words[at + 3].parse().ok()?,
    };
    let rest: Vec<&str> = words[..reference_start.1]
        .iter()
        .chain(&words[at + 4..])
        .copied()
        .collect();
    Some((reference, rest.join(" ")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn items_in_both_lists_beat_items_in_one() {
        let fused = rrf(&[vec!["a", "b", "c"], vec!["c", "d"]], 60.0);
        let keys: Vec<_> = fused.iter().map(|x| x.0).collect();
        assert_eq!(keys[0], "c"); // rank 3 + rank 1 beats rank 1 alone
        assert_eq!(keys.len(), 4);
        assert!(fused.windows(2).all(|w| w[0].1 >= w[1].1));
    }

    #[test]
    fn filler_words_do_not_count_as_terms() {
        assert_eq!(
            query_terms("apa definisi mahasiswa sesuai dengan"),
            vec!["mahasiswa"]
        );
    }

    #[test]
    fn single_list_keeps_order_and_ties_are_stable() {
        let fused = rrf(&[vec![1, 2, 3]], 60.0);
        assert_eq!(fused.iter().map(|x| x.0).collect::<Vec<_>>(), vec![1, 2, 3]);
        let tie = rrf(&[vec!["x"], vec!["y"]], 60.0);
        assert_eq!(tie[0].0, "x");
    }

    #[test]
    fn empty_input_is_empty() {
        assert!(rrf::<u8>(&[], 60.0).is_empty());
        assert!(rrf::<u8>(&[vec![]], 60.0).is_empty());
    }

    #[test]
    fn query_terms_drop_stopwords_but_keep_numbers() {
        assert_eq!(
            query_terms("Berapa beban SKS dosen paling banyak 16 SKS per semester?"),
            vec![
                "beban", "sks", "dosen", "paling", "banyak", "16", "per", "semester"
            ]
        );
        assert!(query_terms("di ke a").is_empty());
        assert_eq!(
            query_terms("apakah pengertian dari mahasiswa berdasarkan"),
            vec!["mahasiswa"]
        );
    }

    #[test]
    fn degree_abbreviations_are_spelled_out_as_whole_words() {
        assert_eq!(
            expand_aliases("berapakah waktu tempuh mahasiswa S1?"),
            "berapakah waktu tempuh mahasiswa program sarjana?"
        );
        assert_eq!(
            expand_aliases("syarat d3 dan S2"),
            "syarat program diploma tiga dan program magister"
        );
        // part of a longer word or number: left alone
        assert_eq!(expand_aliases("pasal s10 dan abs1"), "pasal s10 dan abs1");
    }

    #[test]
    fn reference_is_split_from_the_question() {
        let (r, rest) = extract_reference(
            "apakah yang dimaksud dengan mahasiswa pada undang undang nomor 12 tahun 2012",
        )
        .unwrap();
        assert_eq!(
            r,
            Reference {
                kind: Some("UU"),
                number: "12".into(),
                year: 2012
            }
        );
        assert_eq!(rest, "apakah yang dimaksud dengan mahasiswa pada");
        let (r, rest) =
            extract_reference("Apa isi PP No. 04 Tahun 2014 tentang beban dosen?").unwrap();
        assert_eq!((r.kind, r.number.as_str(), r.year), (Some("PP"), "4", 2014));
        assert_eq!(rest, "apa isi tentang beban dosen");
        assert!(extract_reference("Berapa beban dosen tahun 2012?").is_none());
        assert!(extract_reference("nomor 12 tahun").is_none());
    }
}
