//! Nutrient arithmetic. TKPI lists every value per 100 g of the food as eaten, so an item's nutrient is
//! `value * grams / 100`. The grams come from what the user ate, so the edible portion (BDD) is not applied again.

use std::collections::{BTreeMap, HashMap};

use serde_json::{Value, json};

#[derive(Debug, Clone)]
pub struct NutrientInfo {
    pub name: String,
    pub unit: Option<String>,
    pub decimal_places: i32,
}

/// Rounds to `places` decimals
pub fn round(value: f64, places: i32) -> f64 {
    let factor = 10f64.powi(places.clamp(0, 6));
    (value * factor).round() / factor
}

/// Nutrients of `grams` of a food whose per-100 g values are `per_100g` (tagname -> value)
pub fn scale(per_100g: &BTreeMap<String, f64>, grams: f64) -> BTreeMap<String, f64> {
    per_100g.iter().map(|(tag, v)| (tag.clone(), v * grams / 100.0)).collect()
}

/// Sums the items' nutrients into the JSON stored in `intake_logs.totals`:
/// `{"nutrients": {TAG: {"name", "unit", "value"}}, "items": n, "matched": n, "unmatched": [..], "no_grams": [..]}`
pub fn totals(
    items: &[BTreeMap<String, f64>],
    info: &HashMap<String, NutrientInfo>,
    matched: usize,
    unmatched: &[String],
    no_grams: &[String],
) -> Value {
    let mut sum: BTreeMap<&str, f64> = BTreeMap::new();
    for item in items {
        for (tag, v) in item {
            *sum.entry(tag.as_str()).or_default() += v;
        }
    }
    let nutrients: serde_json::Map<String, Value> = sum
        .into_iter()
        .map(|(tag, v)| {
            let (name, unit, places) = info
                .get(tag)
                .map_or((tag.to_owned(), None, 1), |i| (i.name.clone(), i.unit.clone(), i.decimal_places));
            (tag.to_owned(), json!({ "name": name, "unit": unit, "value": round(v, places) }))
        })
        .collect();
    json!({
        "nutrients": nutrients,
        "items": items.len() + unmatched.len() + no_grams.len(),
        "matched": matched,
        "unmatched": unmatched,
        "no_grams": no_grams,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn per_100g(pairs: &[(&str, f64)]) -> BTreeMap<String, f64> {
        pairs.iter().map(|(t, v)| ((*t).to_owned(), *v)).collect()
    }

    #[test]
    fn scales_per_100g_values_to_the_portion() {
        let n = scale(&per_100g(&[("ENERC", 357.0), ("PROCNT", 8.4)]), 200.0);
        assert_eq!(n["ENERC"], 714.0);
        assert!((n["PROCNT"] - 16.8).abs() < 1e-9);
    }

    #[test]
    fn sums_items_and_rounds_to_the_nutrient_decimals() {
        let info = HashMap::from([
            ("ENERC".to_owned(), NutrientInfo { name: "Energi".into(), unit: Some("Kal".into()), decimal_places: 0 }),
            ("PROCNT".to_owned(), NutrientInfo { name: "Protein".into(), unit: Some("g".into()), decimal_places: 1 }),
        ]);
        let items = vec![scale(&per_100g(&[("ENERC", 357.0), ("PROCNT", 8.4)]), 200.0), scale(&per_100g(&[("ENERC", 100.0), ("PROCNT", 1.04)]), 55.0)];
        let t = totals(&items, &info, 2, &["kerupuk".to_owned()], &[]);
        assert_eq!(t["nutrients"]["ENERC"]["value"], 769.0);
        assert_eq!(t["nutrients"]["PROCNT"]["value"], 17.4);
        assert_eq!(t["nutrients"]["ENERC"]["unit"], "Kal");
        assert_eq!(t["items"], 3);
        assert_eq!(t["unmatched"][0], "kerupuk");
    }

    #[test]
    fn rounds_half_away_from_zero() {
        assert_eq!(round(2.345, 2), 2.35);
        assert_eq!(round(0.5, 0), 1.0);
    }
}
