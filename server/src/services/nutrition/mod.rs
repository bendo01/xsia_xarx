//! Turns a free-text food diary entry (`intake_logs.description`) into nutrient totals.
//!
//! The language model only identifies foods and estimates how much of each was eaten ([`parse`]).
//! Everything numeric comes from TKPI: foods are matched against `foods` ([`matcher`]) and nutrients are
//! computed from `food_nutrients` ([`compute`]), so a total can always be traced back to the table.

pub mod calculate;
pub mod compute;
pub mod matcher;
pub mod parse;
