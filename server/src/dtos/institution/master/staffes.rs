use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};

use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};

pub async fn list_staffes_by_unit(
    db: &DatabaseConnection,
    unit_id: Uuid,
) -> Result<Vec<StaffResponse>, sea_orm::DbErr> {
    let items = crate::models::institution::master::staffes::Entity::find()
        .filter(crate::models::institution::master::staffes::Column::UnitId.eq(unit_id))
        .filter(crate::models::institution::master::staffes::Column::DeletedAt.is_null())
        .order_by_asc(crate::models::institution::master::staffes::Column::Name)
        .all(db)
        .await?;

    let data = items
        .into_iter()
        .map(|item| StaffResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            start_date: item.start_date,
            end_date: item.end_date,
            employee_id: item.employee_id,
            unit_id: item.unit_id,
            position_type_id: item.position_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
        })
        .collect();

    Ok(data)
}
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct StaffQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub unit_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct StaffResponse {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: Option<String>,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub employee_id: Uuid,
    pub unit_id: Uuid,
    pub position_type_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateStaffRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub employee_id: Uuid,
    pub unit_id: Uuid,
    pub position_type_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateStaffRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub start_date: Option<NaiveDate>,
    /// Absent keeps the end date, `null` clears it (reopens the appointment)
    #[serde(default, deserialize_with = "nullable")]
    #[salvo(schema(value_type = Option<NaiveDate>))]
    pub end_date: Option<Option<NaiveDate>>,
    pub employee_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    /// Absent keeps the position type, `null` clears it (revokes the staff role)
    #[serde(default, deserialize_with = "nullable")]
    #[salvo(schema(value_type = Option<Uuid>))]
    pub position_type_id: Option<Option<Uuid>>,
}

/// Tells an explicit `null` (`Some(None)`) apart from an absent field (`None`, via `#[serde(default)]`)
fn nullable<'de, D, T>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: Deserialize<'de>,
{
    Option::<T>::deserialize(deserializer).map(Some)
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedStaffResponse {
    pub data: Vec<StaffResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct StaffOptionRequest {
    pub search: Option<String>,
    pub unit_id: Option<Uuid>,
    pub employee_id: Option<Uuid>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn update_request_tells_null_apart_from_absent() {
        let absent: UpdateStaffRequest = serde_json::from_str("{}").unwrap();
        assert_eq!(absent.position_type_id, None);
        assert_eq!(absent.end_date, None);

        let cleared: UpdateStaffRequest =
            serde_json::from_str(r#"{"position_type_id": null, "end_date": null}"#).unwrap();
        assert_eq!(cleared.position_type_id, Some(None));
        assert_eq!(cleared.end_date, Some(None));

        let id = Uuid::now_v7();
        let set: UpdateStaffRequest =
            serde_json::from_str(&format!(r#"{{"position_type_id": "{id}", "end_date": "2026-12-31"}}"#)).unwrap();
        assert_eq!(set.position_type_id, Some(Some(id)));
        assert_eq!(set.end_date, Some(NaiveDate::from_ymd_opt(2026, 12, 31)));
    }
}
