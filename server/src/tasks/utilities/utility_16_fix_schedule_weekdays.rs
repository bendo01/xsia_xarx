//! `utility:fix-schedule-weekdays`: finds class schedules whose `weekday_id` is not one of the seven
//! weekday ids and (optionally) points them at the right day.
//!
//! Before `general_reference.weekdays` existed, `schedules.weekday_id` was a bare UUID (often the nil
//! UUID), so old rows hold ids that mean nothing now. Which day such an id stood for cannot be known
//! from the data, so this task never guesses: it reports them, and remaps only what you tell it to.
//!
//!   cargo run -- task utility:fix-schedule-weekdays                      # report only
//!   cargo run -- task utility:fix-schedule-weekdays --map <old-uuid>=3 --nil-to 1 --apply
//!
//! `--map OLD=N` sends that stray id to ISO weekday N (1 = Monday .. 7 = Sunday); `--nil-to N` does the
//! same for the nil UUID. Without `--apply` it only shows what it would change.

use std::collections::BTreeMap;

use chrono::Utc;
use salvo::async_trait;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter, Set};
use uuid::Uuid;

use crate::models::academic::campaign::transaction::schedules;
use crate::tasks::utilities::utility_15_seed_weekdays::{WEEKDAYS, weekday_id, weekday_ids};
use crate::tasks::Task;

pub struct FixScheduleWeekdaysTask;

/// How many schedule rows hold each weekday id that is not one of the seven.
pub fn stray_counts(current: &[Uuid], valid: &[Uuid]) -> BTreeMap<Uuid, usize> {
    let mut out = BTreeMap::new();
    for id in current {
        if !valid.contains(id) {
            *out.entry(*id).or_insert(0) += 1;
        }
    }
    out
}

/// `old -> new` pairs to apply: only stray ids with a mapping, and only to a valid weekday.
pub fn plan_remap(stray: &BTreeMap<Uuid, usize>, mappings: &BTreeMap<Uuid, Uuid>, valid: &[Uuid]) -> Vec<(Uuid, Uuid, usize)> {
    stray
        .iter()
        .filter_map(|(old, count)| mappings.get(old).filter(|new| valid.contains(new)).map(|new| (*old, *new, *count)))
        .collect()
}

/// ISO weekday number (1..=7) to its id.
fn id_of_number(n: i32) -> Option<Uuid> {
    WEEKDAYS.iter().find(|d| d.1 == n).map(|d| weekday_id(d.0))
}

/// `--map OLD=N` and `--nil-to N` arguments to a `old -> new` map.
pub fn parse_mappings(args: &[String]) -> Result<BTreeMap<Uuid, Uuid>, String> {
    let mut out = BTreeMap::new();
    let mut it = args.iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--map" => {
                let v = it.next().ok_or("--map needs OLD-UUID=N")?;
                let (old, n) = v.split_once('=').ok_or("--map needs OLD-UUID=N")?;
                let old = Uuid::parse_str(old.trim()).map_err(|_| format!("'{old}' is not a UUID"))?;
                let n: i32 = n.trim().parse().map_err(|_| format!("'{n}' is not a weekday number 1-7"))?;
                out.insert(old, id_of_number(n).ok_or(format!("weekday number {n} is not between 1 and 7"))?);
            }
            "--nil-to" => {
                let n: i32 = it.next().ok_or("--nil-to needs N")?.trim().parse().map_err(|_| "--nil-to needs a weekday number 1-7".to_string())?;
                out.insert(Uuid::nil(), id_of_number(n).ok_or(format!("weekday number {n} is not between 1 and 7"))?);
            }
            _ => {}
        }
    }
    Ok(out)
}

#[async_trait]
impl Task for FixScheduleWeekdaysTask {
    fn name(&self) -> &str {
        "utility:fix-schedule-weekdays"
    }

    fn description(&self) -> &str {
        "Reports schedules whose weekday_id is not one of the seven weekdays; --map OLD=N / --nil-to N [--apply] remaps them (never guesses)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let apply = args.iter().any(|a| a == "--apply");
        let mappings = parse_mappings(args)?;
        let valid = weekday_ids();

        let rows = schedules::Entity::find().filter(schedules::Column::DeletedAt.is_null()).all(db).await?;
        let current: Vec<Uuid> = rows.iter().map(|r| r.weekday_id).collect();
        let stray = stray_counts(&current, &valid);

        println!("schedules: {} rows, {} with a weekday id that is not one of the seven", rows.len(), stray.values().sum::<usize>());
        for (id, count) in &stray {
            let target = mappings.get(id).and_then(|n| WEEKDAYS.iter().find(|d| weekday_id(d.0) == *n)).map(|d| d.3).unwrap_or("(no mapping)");
            println!("  {id}  {count:>5} row(s)  -> {target}");
        }

        let plan = plan_remap(&stray, &mappings, &valid);
        if plan.is_empty() {
            if !stray.is_empty() {
                println!("Nothing to change: pass --map OLD=N (or --nil-to N) with N = 1 (Senin) .. 7 (Minggu), and --apply.");
            }
            return Ok(());
        }
        if !apply {
            println!("Dry run: add --apply to update {} row(s).", plan.iter().map(|p| p.2).sum::<usize>());
            return Ok(());
        }

        let now = Utc::now().naive_utc();
        let mut changed = 0;
        for row in rows {
            if let Some((_, new, _)) = plan.iter().find(|(old, _, _)| *old == row.weekday_id) {
                let mut active = row.into_active_model();
                active.weekday_id = Set(*new);
                active.updated_at = Set(Some(now));
                active.update(db).await?;
                changed += 1;
            }
        }
        println!("Updated {changed} schedule row(s).");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid() -> Vec<Uuid> {
        weekday_ids()
    }

    #[test]
    fn counts_only_ids_outside_the_seven() {
        let v = valid();
        let stray = Uuid::nil();
        let other = Uuid::from_u128(5);
        let current = vec![v[0], stray, stray, other, v[6]];
        let c = stray_counts(&current, &v);
        assert_eq!(c.len(), 2);
        assert_eq!(c[&stray], 2);
        assert_eq!(c[&other], 1);
        assert!(stray_counts(&[v[1], v[2]], &v).is_empty());
    }

    #[test]
    fn remaps_only_mapped_strays_to_valid_days() {
        let v = valid();
        let mut stray = BTreeMap::new();
        stray.insert(Uuid::nil(), 3usize);
        stray.insert(Uuid::from_u128(9), 1usize);
        let mut maps = BTreeMap::new();
        maps.insert(Uuid::nil(), v[2]);
        maps.insert(Uuid::from_u128(77), v[0]); // not a stray id here: ignored
        assert_eq!(plan_remap(&stray, &maps, &v), vec![(Uuid::nil(), v[2], 3)]);
        // a mapping to something that is not one of the seven is refused
        maps.insert(Uuid::nil(), Uuid::from_u128(1));
        assert!(plan_remap(&stray, &maps, &v).is_empty());
    }

    #[test]
    fn parses_map_and_nil_arguments() {
        let v = valid();
        let args: Vec<String> = ["--nil-to", "1", "--map", "00000000-0000-0000-0000-000000000005=7", "--apply"].iter().map(|s| s.to_string()).collect();
        let m = parse_mappings(&args).unwrap();
        assert_eq!(m[&Uuid::nil()], v[0]);
        assert_eq!(m[&Uuid::from_u128(5)], v[6]);
        assert!(parse_mappings(&["--nil-to".into(), "8".into()]).is_err());
        assert!(parse_mappings(&["--map".into(), "nope=1".into()]).is_err());
        assert!(parse_mappings(&["--map".into()]).is_err());
        assert!(parse_mappings(&[]).unwrap().is_empty());
    }
}
