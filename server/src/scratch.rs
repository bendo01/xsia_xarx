use chrono::{Datelike, Utc};
pub fn get_year() -> i32 { Utc::now().year() }
