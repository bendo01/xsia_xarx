//! Name normalisation for Indonesian academic names.

const TITLES: &[&str] = &[
    "dr", "drs", "dra", "prof", "ir", "h", "hj", "s", "st", "se", "sh", "skom", "skom", "sp", "spd",
    "sksi", "mt", "msi", "mm", "mpd", "mkom", "msc", "phd", "mag", "kom", "si", "pd", "ph", "d",
];

/// Lowercase ASCII-fold, drop punctuation, academic titles and doubled spaces.
pub fn normalize_name(raw: &str) -> String {
    let cleaned: String = raw
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == ' ' || c == '.' || c == ',' { c } else { ' ' })
        .collect();
    cleaned
        .split(|c: char| c == ' ' || c == ',')
        .map(|t| t.replace('.', ""))
        .filter(|t| !t.is_empty() && !TITLES.contains(&t.as_str()))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Tokens sorted alphabetically, so "budi santoso" == "santoso budi".
pub fn token_sort(name: &str) -> String {
    let mut tokens: Vec<&str> = name.split_whitespace().collect();
    tokens.sort_unstable();
    tokens.join(" ")
}

/// Keep digits only (NIM/NIK/NIDN sometimes carry spaces or dots).
pub fn digits(raw: &str) -> String {
    raw.chars().filter(char::is_ascii_digit).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_titles_and_punctuation() {
        assert_eq!(normalize_name("Dr. Budi Santoso, S.Kom., M.T."), "budi santoso");
        assert_eq!(normalize_name("  SITI   Aminah "), "siti aminah");
    }

    #[test]
    fn token_sort_is_order_independent() {
        assert_eq!(token_sort("budi santoso"), token_sort("santoso budi"));
    }

    #[test]
    fn digits_only() {
        assert_eq!(digits("12.34 56"), "123456");
    }
}
