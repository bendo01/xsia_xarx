use std::collections::{BTreeMap, HashMap};
use std::str::FromStr;

use anyhow::{Context, Result, bail};
use chrono::Utc;
use sea_orm::entity::prelude::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter, Set,
    TransactionTrait, sea_query::Expr,
};
use serde_json::json;
use uuid::Uuid;

use super::compute::{self, NutrientInfo};
use super::matcher::find_food;
use super::parse::{build_prompt, parse_items};
use crate::models::person::nutritional_intake::{food_nutrient, intake_log, intake_log_item, nutrient};
use crate::services::ai::generation::{GenParams, LlmKind, LlmService};

pub const STATUS_PENDING: &str = "pending";
pub const STATUS_PROCESSING: &str = "processing";
pub const STATUS_CALCULATED: &str = "calculated";
pub const STATUS_FAILED: &str = "failed";

fn dec(v: f64) -> Option<Decimal> {
    Decimal::from_str(&v.to_string()).ok()
}

/// Calculates the nutrients of one diary entry and stores the items and totals.
/// Does nothing when the entry no longer exists. On error the entry is left `processing`;
/// the caller decides whether to retry or [`mark_failed`].
pub async fn calculate(db: &DatabaseConnection, log_id: Uuid, kind: LlmKind) -> Result<()> {
    let Some(log) = intake_log::Entity::find_by_id(log_id)
        .filter(intake_log::Column::DeletedAt.is_null())
        .one(db)
        .await?
    else {
        return Ok(());
    };

    let mut active = log.clone().into_active_model();
    active.status = Set(STATUS_PROCESSING.to_owned());
    active.error_message = Set(None);
    active.updated_at = Set(Utc::now().naive_utc());
    active.update(db).await?;

    // 1. The language model reads the entry. Loading it and generating are CPU bound.
    let prompt = build_prompt(kind, &log.description);
    let params = GenParams { temperature: 0.0, top_p: 0.9, max_new_tokens: 600 };
    let stats = tokio::task::spawn_blocking(move || LlmService::global(kind)?.generate(&prompt, &params, |_| true))
        .await
        .context("generation task panicked")??;
    let parsed = parse_items(&stats.text).map_err(anyhow::Error::msg).context("cannot read the model's answer")?;
    if parsed.is_empty() {
        bail!("no food found in the entry");
    }

    // 2. TKPI supplies the numbers
    let nutrients: HashMap<Uuid, (String, NutrientInfo)> = nutrient::Entity::find()
        .filter(nutrient::Column::DeletedAt.is_null())
        .all(db)
        .await?
        .into_iter()
        .map(|n| (n.id, (n.tagname, NutrientInfo { name: n.name, unit: n.unit, decimal_places: n.decimal_places })))
        .collect();
    let info: HashMap<String, NutrientInfo> = nutrients.values().map(|(tag, i)| (tag.clone(), i.clone())).collect();

    let now = Utc::now().naive_utc();
    let mut rows = Vec::with_capacity(parsed.len());
    let mut scaled: Vec<BTreeMap<String, f64>> = Vec::new();
    let (mut matched, mut unmatched, mut no_grams) = (0usize, Vec::new(), Vec::new());

    for item in &parsed {
        let food = find_food(db, &item.name).await?;
        let mut item_nutrients = None;
        if let Some(food) = &food {
            let values = food_nutrient::Entity::find()
                .filter(food_nutrient::Column::FoodId.eq(food.id))
                .filter(food_nutrient::Column::DeletedAt.is_null())
                .all(db)
                .await?;
            let per_100g: BTreeMap<String, f64> = values
                .iter()
                .filter_map(|v| {
                    let tag = &nutrients.get(&v.nutrient_id)?.0;
                    Some((tag.clone(), v.value.as_ref()?.to_string().parse().ok()?))
                })
                .collect();
            match item.grams {
                Some(grams) => {
                    matched += 1;
                    let n = compute::scale(&per_100g, grams);
                    let rounded: BTreeMap<String, f64> = n
                        .iter()
                        .map(|(t, v)| (t.clone(), compute::round(*v, info.get(t).map_or(1, |i| i.decimal_places))))
                        .collect();
                    item_nutrients = Some(serde_json::to_value(rounded)?);
                    scaled.push(n);
                }
                None => no_grams.push(item.name.clone()),
            }
        } else {
            unmatched.push(item.name.clone());
        }

        rows.push(intake_log_item::ActiveModel {
            id: Set(Uuid::new_v4()),
            intake_log_id: Set(log.id),
            food_id: Set(food.as_ref().map(|f| f.id)),
            raw_name: Set(item.name.clone()),
            quantity_text: Set(item.quantity_text.clone()),
            grams: Set(item.grams.and_then(dec)),
            edible_portion: Set(food.as_ref().and_then(|f| f.edible_portion)),
            nutrients: Set(item_nutrients),
            created_at: Set(now),
            updated_at: Set(now),
            deleted_at: Set(None),
            ..Default::default()
        });
    }

    let totals = compute::totals(&scaled, &info, matched, &unmatched, &no_grams);

    // 3. Replace the previous result in one go
    let txn = db.begin().await?;
    intake_log_item::Entity::update_many()
        .col_expr(intake_log_item::Column::DeletedAt, Expr::value(now))
        .col_expr(intake_log_item::Column::UpdatedAt, Expr::value(now))
        .filter(intake_log_item::Column::IntakeLogId.eq(log.id))
        .filter(intake_log_item::Column::DeletedAt.is_null())
        .exec(&txn)
        .await?;
    intake_log_item::Entity::insert_many(rows).exec(&txn).await?;

    let mut done = log.into_active_model();
    done.status = Set(STATUS_CALCULATED.to_owned());
    done.llm_model = Set(Some(kind.label().to_owned()));
    done.llm_raw_response = Set(Some(json!({
        "text": stats.text,
        "prompt_tokens": stats.prompt_tokens,
        "new_tokens": stats.new_tokens,
        "finish_reason": stats.finish_reason,
    })));
    done.totals = Set(Some(totals));
    done.error_message = Set(None);
    done.calculated_at = Set(Some(now));
    done.updated_at = Set(now);
    done.update(&txn).await?;
    txn.commit().await?;
    Ok(())
}

/// Records that the calculation gave up
pub async fn mark_failed(db: &DatabaseConnection, log_id: Uuid, message: &str) -> Result<()> {
    if let Some(log) = intake_log::Entity::find_by_id(log_id).one(db).await? {
        let mut active = log.into_active_model();
        active.status = Set(STATUS_FAILED.to_owned());
        active.error_message = Set(Some(message.chars().take(2000).collect()));
        active.updated_at = Set(Utc::now().naive_utc());
        active.update(db).await?;
    }
    Ok(())
}
