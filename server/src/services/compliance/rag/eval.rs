//! Retrieval evaluation against a hand-checked gold set: a hit is relevant when it comes from the
//! named regulation and its text contains the marker phrase (robust to wrong `Pasal` labels).

use super::Hit;

pub struct Gold {
    pub question: &'static str,
    /// Acceptable answers: (regulation number, year, marker phrase in the chunk)
    pub relevant: &'static [(&'static str, i16, &'static str)],
}

/// Each entry was checked against the stored chunks.
pub const GOLD: &[Gold] = &[
    Gold { question: "Berapa beban kerja dosen paling banyak dalam SKS per semester?", relevant: &[("37", 2009, "16 (enam belas)"), ("14", 2005, "16 (enam belas)")] },
    Gold { question: "Berapa SKS maksimal beban belajar mahasiswa pada semester tiga dan seterusnya?", relevant: &[("39", 2025, "24 (dua puluh empat)")] },
    Gold { question: "Berapa batas maksimal beban kerja dosen dalam EWMP?", relevant: &[("7", 2020, "1,5 (satu koma lima) EWMP"), ("51", 2018, "1,5 (satu koma lima) EWMP")] },
    Gold { question: "Apa syarat dosen tetap?", relevant: &[("52", 2025, "bekerja penuh waktu"), ("44", 2024, "bekerja penuh waktu")] },
    Gold { question: "Apa sanksi administratif bagi perguruan tinggi yang melanggar?", relevant: &[("7", 2020, "Sanksi Administratif dikenakan")] },
    Gold { question: "Apa saja siklus kegiatan SPMI?", relevant: &[("39", 2025, "siklus kegiatan")] },
    Gold { question: "Siapa yang menetapkan rentang masa studi mahasiswa?", relevant: &[("39", 2025, "rentang Masa Studi")] },
    Gold { question: "Apa yang dimaksud dengan Pangkalan Data Pendidikan Tinggi?", relevant: &[("39", 2025, "kumpulan data penyelenggaraan pendidikan tinggi")] },
];

fn norm(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ").to_lowercase()
}

pub fn is_relevant(hit: &Hit, gold: &Gold) -> bool {
    let content = norm(&hit.content);
    gold.relevant.iter().any(|(num, year, marker)| {
        hit.number.as_deref() == Some(*num) && hit.year == Some(*year) && content.contains(&norm(marker))
    })
}

/// 1-based rank of the first relevant hit.
pub fn first_relevant_rank(hits: &[Hit], gold: &Gold) -> Option<usize> {
    hits.iter().position(|h| is_relevant(h, gold)).map(|i| i + 1)
}

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Summary {
    pub hit_at_1: f64,
    pub hit_at_3: f64,
    pub hit_at_5: f64,
    pub mrr: f64,
}

/// Hit@k and mean reciprocal rank from per-question first-relevant ranks (`None` = not found).
pub fn summarize(ranks: &[Option<usize>]) -> Summary {
    if ranks.is_empty() {
        return Summary::default();
    }
    let n = ranks.len() as f64;
    let hit = |k: usize| ranks.iter().filter(|r| r.is_some_and(|r| r <= k)).count() as f64 / n;
    Summary {
        hit_at_1: hit(1),
        hit_at_3: hit(3),
        hit_at_5: hit(5),
        mrr: ranks.iter().map(|r| r.map_or(0.0, |r| 1.0 / r as f64)).sum::<f64>() / n,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn summarize_computes_hit_rates_and_mrr() {
        let s = summarize(&[Some(1), Some(4), None, Some(2)]);
        assert_eq!(s.hit_at_1, 0.25);
        assert_eq!(s.hit_at_3, 0.5);
        assert_eq!(s.hit_at_5, 0.75);
        assert!((s.mrr - (1.0 + 0.25 + 0.0 + 0.5) / 4.0).abs() < 1e-9);
        assert_eq!(summarize(&[]), Summary::default());
    }

    #[test]
    fn relevance_needs_regulation_and_marker() {
        let hit = |number: &str, year, content: &str| Hit {
            chunk_id: uuid::Uuid::nil(),
            regulation_id: uuid::Uuid::nil(),
            regulation: "R".into(),
            number: Some(number.into()),
            year: Some(year),
            status: "active".into(),
            heading: None,
            content: content.into(),
            score: 0.0,
        };
        let g = &GOLD[0];
        assert!(is_relevant(&hit("37", 2009, "paling banyak 16\n(enam belas) SKS"), g));
        assert!(!is_relevant(&hit("37", 2009, "paling banyak 24"), g));
        assert!(!is_relevant(&hit("38", 2009, "16 (enam belas)"), g));
    }
}
