use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::campaign::student_activities::{
    CreateStudentActivityRequest, StudentActivityQuery, StudentActivityResponse, PaginatedStudentActivityResponse,
    UpdateStudentActivityRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::campaign::student_activities as entity_mod;
use crate::services::pdf::institution_092010::student::activity::plan::activity_plan as Institution092010StudentActivityPlan;
use crate::services::pdf::institution_092010::student::activity::result::activity_result as Institution092010StudentActivityResult;

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 500))]
pub async fn list_student_activities(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedStudentActivityResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: StudentActivityQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }
    if let Some(student_id) = query.student_id {
        select = select.filter(entity_mod::Column::StudentId.eq(student_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let unit_activity_ids: Vec<Uuid> = items.iter().map(|item| item.unit_activity_id).collect();
    let unit_activities_map: std::collections::HashMap<Uuid, (Uuid, i32, String)> = if unit_activity_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        let uas = crate::models::academic::campaign::transaction::activities::Entity::find()
            .filter(crate::models::academic::campaign::transaction::activities::Column::Id.is_in(unit_activity_ids))
            .filter(crate::models::academic::campaign::transaction::activities::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default();

        let ay_ids: Vec<Uuid> = uas.iter().map(|ua| ua.academic_year_id).collect();
        let ays = if ay_ids.is_empty() {
            vec![]
        } else {
            crate::models::academic::general::reference::academic_years::Entity::find()
                .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(ay_ids))
                .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
        };
        let ay_map: std::collections::HashMap<Uuid, (i32, String)> = ays
            .into_iter()
            .map(|ay| (ay.id, (ay.code, ay.name)))
            .collect();

        uas.into_iter()
            .filter_map(|ua| {
                ay_map.get(&ua.academic_year_id).map(|(code, name)| {
                    (ua.id, (ua.academic_year_id, *code, name.clone()))
                })
            })
            .collect()
    };

    let activity_ids: Vec<Uuid> = items.iter().map(|item| item.id).collect();
    let details_map: std::collections::HashMap<Uuid, (f64, f64, f64)> = if activity_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        let details = crate::models::academic::student::campaign::detail_activities::Entity::find()
            .filter(crate::models::academic::student::campaign::detail_activities::Column::ActivityId.is_in(activity_ids))
            .filter(crate::models::academic::student::campaign::detail_activities::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default();

        let grade_ids: Vec<Uuid> = details.iter().filter_map(|d| d.grade_id).collect();
        let grades_map: std::collections::HashMap<Uuid, f64> = if grade_ids.is_empty() {
            std::collections::HashMap::new()
        } else {
            crate::models::academic::campaign::transaction::grades::Entity::find()
                .filter(crate::models::academic::campaign::transaction::grades::Column::Id.is_in(grade_ids))
                .filter(crate::models::academic::campaign::transaction::grades::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|g| (g.id, g.grade))
                .collect()
        };

        let course_ids: Vec<Uuid> = details.iter().map(|d| d.course_id).collect();
        let courses_map: std::collections::HashMap<Uuid, f64> = if course_ids.is_empty() {
            std::collections::HashMap::new()
        } else {
            crate::models::academic::course::master::courses::Entity::find()
                .filter(crate::models::academic::course::master::courses::Column::Id.is_in(course_ids))
                .filter(crate::models::academic::course::master::courses::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|c| (c.id, c.total_credit))
                .collect()
        };

        let mut acc_map: std::collections::HashMap<Uuid, (f64, f64, f64)> = std::collections::HashMap::new();
        for d in details {
            let cred = d.credit.or_else(|| courses_map.get(&d.course_id).copied()).unwrap_or(0.0);
            let grade_opt = d.grade_id.and_then(|gid| grades_map.get(&gid).copied());
            let entry = acc_map.entry(d.activity_id).or_insert((0.0, 0.0, 0.0));
            entry.0 += cred;
            if let Some(g) = grade_opt {
                entry.1 += cred;
                entry.2 += g * cred;
            }
        }
        acc_map
    };

    let data = items.into_iter().map(|item| {
        let (ay_id, ay_code, ay_name) = unit_activities_map.get(&item.unit_activity_id).cloned().unwrap_or((Uuid::nil(), 0, String::new()));
        let academic_year = if !ay_name.is_empty() {
            Some(crate::dtos::common::reference::ReferenceResponse {
                id: ay_id,
                code: ay_code,
                alphabet_code: String::new(),
                name: ay_name.clone(),
                created_at: chrono::Utc::now().naive_utc(),
                updated_at: chrono::Utc::now().naive_utc(),
                deleted_at: None,
                sync_at: None,
                created_by: None,
                updated_by: None,
            })
        } else {
            None
        };
        let academic_year_name = if !ay_name.is_empty() { Some(ay_name) } else { None };

        let (calc_sks, graded_sks, weighted_sum) = details_map.get(&item.id).copied().unwrap_or((0.0, 0.0, 0.0));
        let calc_ips = if graded_sks > 0.0 { weighted_sum / graded_sks } else { 0.0 };

        let total_credit = if item.total_credit.unwrap_or(0.0) > 0.0 {
            item.total_credit
        } else if calc_sks > 0.0 {
            Some(calc_sks)
        } else {
            item.total_credit
        };

        let cumulative_index = if item.cumulative_index > 0.0 {
            item.cumulative_index
        } else if calc_ips > 0.0 {
            calc_ips
        } else {
            item.cumulative_index
        };

        let grand_total_credit = if item.grand_total_credit.unwrap_or(0.0) > 0.0 {
            item.grand_total_credit
        } else {
            total_credit
        };

        let grand_cumulative_index = if item.grand_cumulative_index > 0.0 {
            item.grand_cumulative_index
        } else {
            cumulative_index
        };

        StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index,
            grand_cumulative_index,
            total_credit,
            grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,
            academic_year,
            academic_year_name,
        }
    }).collect();

    Ok(Json(PaginatedStudentActivityResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn get_student_activitie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

    let (academic_year, academic_year_name) = if let Ok(Some(ua)) = crate::models::academic::campaign::transaction::activities::Entity::find_by_id(item.unit_activity_id)
        .filter(crate::models::academic::campaign::transaction::activities::Column::DeletedAt.is_null())
        .one(db)
        .await
    {
        if let Ok(Some(ay)) = crate::models::academic::general::reference::academic_years::Entity::find_by_id(ua.academic_year_id)
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .one(db)
            .await
        {
            (
                Some(crate::dtos::common::reference::ReferenceResponse {
                    id: ay.id,
                    code: ay.code,
                    alphabet_code: String::new(),
                    name: ay.name.clone(),
                    created_at: ay.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                    updated_at: ay.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                    deleted_at: ay.deleted_at,
                    sync_at: ay.sync_at,
                    created_by: ay.created_by,
                    updated_by: ay.updated_by,
                }),
                Some(ay.name),
            )
        } else {
            (None, None)
        }
    } else {
        (None, None)
    };

    Ok(Json(StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index: item.cumulative_index,
            grand_cumulative_index: item.grand_cumulative_index,
            total_credit: item.total_credit,
            grand_total_credit: item.grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,
            academic_year,
            academic_year_name,
    }))
}#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 500))]
pub async fn create_student_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateStudentActivityRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        cumulative_index: Set(payload.cumulative_index),
        grand_cumulative_index: Set(payload.grand_cumulative_index),
        total_credit: Set(payload.total_credit),
        grand_total_credit: Set(payload.grand_total_credit),
        student_id: Set(payload.student_id),
        unit_activity_id: Set(payload.unit_activity_id),
        status_id: Set(payload.status_id),
        resign_status_id: Set(payload.resign_status_id),
        unit_id: Set(payload.unit_id),
        is_lock: Set(payload.is_lock),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        feeder_id: Set(payload.feeder_id),
        finance_id: Set(payload.finance_id),
        finance_fee: Set(payload.finance_fee),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index: item.cumulative_index,
            grand_cumulative_index: item.grand_cumulative_index,
            total_credit: item.total_credit,
            grand_total_credit: item.grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,
            academic_year: None,
            academic_year_name: None,
        }))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn update_student_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateStudentActivityRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(cumulative_index) = payload.cumulative_index {
            active_model.cumulative_index = Set(cumulative_index);
        }
    if let Some(grand_cumulative_index) = payload.grand_cumulative_index {
            active_model.grand_cumulative_index = Set(grand_cumulative_index);
        }
    if let Some(total_credit) = payload.total_credit {
            active_model.total_credit = Set(Some(total_credit));
        }
    if let Some(grand_total_credit) = payload.grand_total_credit {
            active_model.grand_total_credit = Set(Some(grand_total_credit));
        }
    if let Some(student_id) = payload.student_id {
            active_model.student_id = Set(student_id);
        }
    if let Some(unit_activity_id) = payload.unit_activity_id {
            active_model.unit_activity_id = Set(unit_activity_id);
        }
    if let Some(status_id) = payload.status_id {
            active_model.status_id = Set(status_id);
        }
    if let Some(resign_status_id) = payload.resign_status_id {
            active_model.resign_status_id = Set(Some(resign_status_id));
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(Some(unit_id));
        }
    if let Some(is_lock) = payload.is_lock {
            active_model.is_lock = Set(Some(is_lock));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(finance_id) = payload.finance_id {
            active_model.finance_id = Set(Some(finance_id));
        }
    if let Some(finance_fee) = payload.finance_fee {
            active_model.finance_fee = Set(Some(finance_fee));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index: item.cumulative_index,
            grand_cumulative_index: item.grand_cumulative_index,
            total_credit: item.total_credit,
            grand_total_credit: item.grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,
            academic_year: None,
            academic_year_name: None,
        }))
}
#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn delete_student_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "StudentActivity deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 500))]
pub async fn print_activity_plan(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<(), StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .or_else(|| req.param::<String>("activity_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let pdf_data = match Institution092010StudentActivityPlan::generate_pdf(db, id).await {
        Ok(data) => data,
        Err(e) => return Err(StatusError::internal_server_error().brief(e.to_string())),
    };

    res.headers_mut().insert(
        salvo::http::header::CONTENT_TYPE,
        salvo::http::HeaderValue::from_static("application/pdf"),
    );
    res.headers_mut().insert(
        salvo::http::header::CONTENT_DISPOSITION,
        salvo::http::HeaderValue::from_static("attachment; filename=report.pdf"),
    );
    res.write_body(pdf_data)
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(())
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 500))]
pub async fn print_activity_result(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<(), StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .or_else(|| req.param::<String>("activity_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let pdf_data = match Institution092010StudentActivityResult::generate_pdf(db, id).await {
        Ok(data) => data,
        Err(e) => return Err(StatusError::internal_server_error().brief(e.to_string())),
    };

    res.headers_mut().insert(
        salvo::http::header::CONTENT_TYPE,
        salvo::http::HeaderValue::from_static("application/pdf"),
    );
    res.headers_mut().insert(
        salvo::http::header::CONTENT_DISPOSITION,
        salvo::http::HeaderValue::from_static("attachment; filename=report.pdf"),
    );
    res.write_body(pdf_data)
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(())
}
