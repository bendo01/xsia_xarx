use std::collections::{BTreeSet, HashMap};
use std::path::PathBuf;
use std::str::FromStr;

use chrono::Utc;
use salvo::async_trait;
use sea_orm::entity::prelude::Decimal;
use sea_orm::sea_query::OnConflict;
use sea_orm::{
    ActiveModelTrait, ConnectionTrait, DatabaseConnection, EntityTrait, Iterable, Set,
    TransactionTrait,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::models::person::nutritional_intake::{
    analysis_method, code_history, correction, food, food_group, food_nutrient, local_dish,
    nutrient, source,
};
use crate::tasks::Task;

const DEFAULT_FILE: &str = "../tkpi/data/tkpi.json";
/// Rows per INSERT; Postgres allows 65535 bind parameters per statement.
const CHUNK: usize = 500;

/// Path of the JSON produced by `tkpi/scripts/xlsx_to_json.py`; override with `TKPI_DATA`
fn default_file() -> PathBuf {
    PathBuf::from(std::env::var("TKPI_DATA").unwrap_or_else(|_| DEFAULT_FILE.to_string()))
}

/// Stable id derived from the natural key, so re-runs update the same rows
fn id_for(kind: &str, key: &str) -> Uuid {
    Uuid::new_v5(&Uuid::NAMESPACE_URL, format!("xsia:tkpi:{kind}:{key}").as_bytes())
}

fn dec(v: f64) -> Option<Decimal> {
    Decimal::from_str(&v.to_string()).ok()
}

#[derive(Deserialize)]
struct Data {
    food_groups: Vec<GroupRow>,
    nutrients: Vec<NutrientRow>,
    analysis_methods: Vec<MethodRow>,
    foods: Vec<FoodRow>,
    local_dishes: Vec<DishRow>,
    code_history: Vec<HistoryRow>,
    corrections: Vec<CorrectionRow>,
}

#[derive(Deserialize)]
struct GroupRow {
    position: i32,
    name: String,
    raw_code: String,
    processed_code: String,
}

#[derive(Deserialize)]
struct NutrientRow {
    name: String,
    tagname: String,
    unit: Option<String>,
    decimal_places: i32,
}

#[derive(Deserialize)]
struct MethodRow {
    tagname: String,
    name: String,
}

#[derive(Deserialize)]
struct FoodRow {
    code: String,
    name: String,
    group_position: i32,
    kind: Option<String>,
    source: Option<String>,
    edible_portion: Option<f64>,
    species: Option<String>,
    genus: Option<String>,
    family: Option<String>,
    english_name: Option<String>,
    nutrients: HashMap<String, f64>,
}

#[derive(Deserialize)]
struct DishRow {
    food_code: String,
    name: String,
    description: Option<String>,
}

#[derive(Deserialize)]
struct HistoryRow {
    food_code: String,
    old_code: String,
}

#[derive(Deserialize)]
struct CorrectionRow {
    food_code: String,
    tagname: String,
    original_value: Option<f64>,
    corrected_value: Option<f64>,
}

/// Batched upsert on the primary key; later duplicates of an id win
async fn upsert<E, A>(
    db: &impl ConnectionTrait,
    rows: Vec<(Uuid, A)>,
    id_col: E::Column,
    update_cols: Vec<E::Column>,
) -> Result<usize, Box<dyn std::error::Error>>
where
    E: EntityTrait,
    A: ActiveModelTrait<Entity = E> + Send,
{
    let mut unique: Vec<(Uuid, A)> = Vec::with_capacity(rows.len());
    let mut index: HashMap<Uuid, usize> = HashMap::new();
    for (id, row) in rows {
        match index.get(&id) {
            Some(&i) => unique[i] = (id, row),
            None => {
                index.insert(id, unique.len());
                unique.push((id, row));
            }
        }
    }
    let total = unique.len();
    let mut models: Vec<A> = unique.into_iter().map(|(_, a)| a).collect();
    while !models.is_empty() {
        let chunk: Vec<A> = models.drain(..models.len().min(CHUNK)).collect();
        E::insert_many(chunk)
            .on_conflict(OnConflict::column(id_col).update_columns(update_cols.clone()).to_owned())
            .exec(db)
            .await?;
    }
    Ok(total)
}

pub struct SeedTkpiTask;

#[async_trait]
impl Task for SeedTkpiTask {
    fn name(&self) -> &str {
        "nutritional-intake:seed-tkpi"
    }

    fn description(&self) -> &str {
        "Seeds TKPI 2020 (food groups, nutrients, foods, food nutrients, local dishes, code history, corrections) from tkpi/data/tkpi.json (arg 1 or TKPI_DATA to override). Idempotent."
    }

    async fn run(
        &self,
        db: &DatabaseConnection,
        args: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        let path = args.first().map(PathBuf::from).unwrap_or_else(default_file);
        println!("Reading {}", path.display());
        let raw = std::fs::read_to_string(&path).map_err(|e| {
            format!("cannot read {} ({e}); generate it with tkpi/scripts/xlsx_to_json.py", path.display())
        })?;
        let data: Data = serde_json::from_str(&raw)?;
        let now = Utc::now().naive_utc();

        let txn = db.begin().await?;

        // food groups
        let group_ids: HashMap<i32, Uuid> = data
            .food_groups
            .iter()
            .map(|g| (g.position, id_for("food_group", &g.position.to_string())))
            .collect();
        let rows = data
            .food_groups
            .iter()
            .map(|g| {
                let id = group_ids[&g.position];
                (
                    id,
                    food_group::ActiveModel {
                        id: Set(id),
                        name: Set(g.name.clone()),
                        position: Set(g.position),
                        raw_code: Set(Some(g.raw_code.clone())),
                        processed_code: Set(Some(g.processed_code.clone())),
                        created_at: Set(now),
                        updated_at: Set(now),
                        deleted_at: Set(None),
                        ..Default::default()
                    },
                )
            })
            .collect();
        let n = upsert::<food_group::Entity, _>(
            &txn,
            rows,
            food_group::Column::Id,
            vec![
                food_group::Column::Name,
                food_group::Column::Position,
                food_group::Column::RawCode,
                food_group::Column::ProcessedCode,
                food_group::Column::UpdatedAt,
                food_group::Column::DeletedAt,
            ],
        )
        .await?;
        println!("food_groups: {n}");

        // nutrients
        let nutrient_ids: HashMap<&str, Uuid> = data
            .nutrients
            .iter()
            .map(|n| (n.tagname.as_str(), id_for("nutrient", &n.tagname)))
            .collect();
        let rows = data
            .nutrients
            .iter()
            .map(|n| {
                let id = nutrient_ids[n.tagname.as_str()];
                (
                    id,
                    nutrient::ActiveModel {
                        id: Set(id),
                        name: Set(n.name.clone()),
                        tagname: Set(n.tagname.clone()),
                        unit: Set(n.unit.clone()),
                        decimal_places: Set(n.decimal_places),
                        created_at: Set(now),
                        updated_at: Set(now),
                        deleted_at: Set(None),
                        ..Default::default()
                    },
                )
            })
            .collect();
        let n = upsert::<nutrient::Entity, _>(
            &txn,
            rows,
            nutrient::Column::Id,
            vec![
                nutrient::Column::Name,
                nutrient::Column::Tagname,
                nutrient::Column::Unit,
                nutrient::Column::DecimalPlaces,
                nutrient::Column::UpdatedAt,
                nutrient::Column::DeletedAt,
            ],
        )
        .await?;
        println!("nutrients: {n}");

        // sources
        let source_names: BTreeSet<&str> =
            data.foods.iter().filter_map(|f| f.source.as_deref()).collect();
        let source_ids: HashMap<&str, Uuid> =
            source_names.iter().map(|s| (*s, id_for("source", s))).collect();
        let rows = source_names
            .iter()
            .map(|s| {
                let id = source_ids[s];
                (
                    id,
                    source::ActiveModel {
                        id: Set(id),
                        name: Set((*s).to_string()),
                        created_at: Set(now),
                        updated_at: Set(now),
                        deleted_at: Set(None),
                        ..Default::default()
                    },
                )
            })
            .collect();
        let n = upsert::<source::Entity, _>(
            &txn,
            rows,
            source::Column::Id,
            vec![source::Column::Name, source::Column::UpdatedAt, source::Column::DeletedAt],
        )
        .await?;
        println!("sources: {n}");

        // analysis methods
        let rows = data
            .analysis_methods
            .iter()
            .filter_map(|m| {
                let nutrient_id = *nutrient_ids.get(m.tagname.as_str())?;
                let id = id_for("analysis_method", &m.tagname);
                Some((
                    id,
                    analysis_method::ActiveModel {
                        id: Set(id),
                        nutrient_id: Set(nutrient_id),
                        name: Set(m.name.clone()),
                        created_at: Set(now),
                        updated_at: Set(now),
                        deleted_at: Set(None),
                        ..Default::default()
                    },
                ))
            })
            .collect();
        let n = upsert::<analysis_method::Entity, _>(
            &txn,
            rows,
            analysis_method::Column::Id,
            vec![
                analysis_method::Column::NutrientId,
                analysis_method::Column::Name,
                analysis_method::Column::UpdatedAt,
                analysis_method::Column::DeletedAt,
            ],
        )
        .await?;
        println!("analysis_methods: {n}");

        // foods
        let food_id = |code: &str| id_for("food", code);
        let mut rows = Vec::with_capacity(data.foods.len());
        for f in &data.foods {
            let group_id = *group_ids
                .get(&f.group_position)
                .ok_or_else(|| format!("food {} has unknown group {}", f.code, f.group_position))?;
            let id = food_id(&f.code);
            rows.push((
                id,
                food::ActiveModel {
                    id: Set(id),
                    food_group_id: Set(group_id),
                    source_id: Set(f.source.as_deref().map(|s| source_ids[s])),
                    code: Set(f.code.clone()),
                    name: Set(f.name.clone()),
                    kind: Set(f.kind.clone()),
                    edible_portion: Set(f.edible_portion.and_then(dec)),
                    species: Set(f.species.clone()),
                    genus: Set(f.genus.clone()),
                    family: Set(f.family.clone()),
                    english_name: Set(f.english_name.clone()),
                    created_at: Set(now),
                    updated_at: Set(now),
                    deleted_at: Set(None),
                    ..Default::default()
                },
            ));
        }
        let n = upsert::<food::Entity, _>(
            &txn,
            rows,
            food::Column::Id,
            food::Column::iter()
                .filter(|c| {
                    !matches!(
                        c,
                        food::Column::Id
                            | food::Column::CreatedAt
                            | food::Column::CreatedBy
                            | food::Column::SyncAt
                            | food::Column::UpdatedBy
                    )
                })
                .collect(),
        )
        .await?;
        println!("foods: {n}");

        // food nutrients
        let mut rows = Vec::new();
        for f in &data.foods {
            for (tag, value) in &f.nutrients {
                let Some(&nutrient_id) = nutrient_ids.get(tag.as_str()) else {
                    return Err(format!("food {} has unknown nutrient {tag}", f.code).into());
                };
                let id = id_for("food_nutrient", &format!("{}:{tag}", f.code));
                rows.push((
                    id,
                    food_nutrient::ActiveModel {
                        id: Set(id),
                        food_id: Set(food_id(&f.code)),
                        nutrient_id: Set(nutrient_id),
                        value: Set(dec(*value)),
                        created_at: Set(now),
                        updated_at: Set(now),
                        deleted_at: Set(None),
                        ..Default::default()
                    },
                ));
            }
        }
        let n = upsert::<food_nutrient::Entity, _>(
            &txn,
            rows,
            food_nutrient::Column::Id,
            vec![
                food_nutrient::Column::Value,
                food_nutrient::Column::UpdatedAt,
                food_nutrient::Column::DeletedAt,
            ],
        )
        .await?;
        println!("food_nutrients: {n}");

        // local dishes
        let rows = data
            .local_dishes
            .iter()
            .map(|d| {
                let id = id_for("local_dish", &format!("{}:{}", d.food_code, d.name));
                (
                    id,
                    local_dish::ActiveModel {
                        id: Set(id),
                        food_id: Set(food_id(&d.food_code)),
                        name: Set(d.name.clone()),
                        description: Set(d.description.clone()),
                        created_at: Set(now),
                        updated_at: Set(now),
                        deleted_at: Set(None),
                        ..Default::default()
                    },
                )
            })
            .collect();
        let n = upsert::<local_dish::Entity, _>(
            &txn,
            rows,
            local_dish::Column::Id,
            vec![
                local_dish::Column::Name,
                local_dish::Column::Description,
                local_dish::Column::UpdatedAt,
                local_dish::Column::DeletedAt,
            ],
        )
        .await?;
        println!("local_dishes: {n}");

        // code history
        let rows = data
            .code_history
            .iter()
            .map(|h| {
                let id = id_for("code_history", &format!("{}:{}", h.food_code, h.old_code));
                (
                    id,
                    code_history::ActiveModel {
                        id: Set(id),
                        food_id: Set(food_id(&h.food_code)),
                        old_code: Set(h.old_code.clone()),
                        created_at: Set(now),
                        updated_at: Set(now),
                        deleted_at: Set(None),
                        ..Default::default()
                    },
                )
            })
            .collect();
        let n = upsert::<code_history::Entity, _>(
            &txn,
            rows,
            code_history::Column::Id,
            vec![code_history::Column::UpdatedAt, code_history::Column::DeletedAt],
        )
        .await?;
        println!("code_histories: {n}");

        // corrections
        let mut rows = Vec::new();
        for c in &data.corrections {
            let Some(&nutrient_id) = nutrient_ids.get(c.tagname.as_str()) else {
                return Err(format!("correction for {} has unknown nutrient {}", c.food_code, c.tagname).into());
            };
            let id = id_for("correction", &format!("{}:{}", c.food_code, c.tagname));
            rows.push((
                id,
                correction::ActiveModel {
                    id: Set(id),
                    food_id: Set(food_id(&c.food_code)),
                    nutrient_id: Set(nutrient_id),
                    original_value: Set(c.original_value.and_then(dec)),
                    corrected_value: Set(c.corrected_value.and_then(dec)),
                    created_at: Set(now),
                    updated_at: Set(now),
                    deleted_at: Set(None),
                    ..Default::default()
                },
            ));
        }
        let n = upsert::<correction::Entity, _>(
            &txn,
            rows,
            correction::Column::Id,
            vec![
                correction::Column::OriginalValue,
                correction::Column::CorrectedValue,
                correction::Column::UpdatedAt,
                correction::Column::DeletedAt,
            ],
        )
        .await?;
        println!("corrections: {n}");

        txn.commit().await?;
        println!("TKPI seeding complete");
        Ok(())
    }
}
