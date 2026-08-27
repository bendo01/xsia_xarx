use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::campaign::detail_activities::{
    CreateDetailActivityRequest, DetailActivityQuery, DetailActivityResponse, PaginatedDetailActivityResponse,
    UpdateDetailActivityRequest,
};
use crate::dtos::academic::campaign::transaction::grades::GradeResponse;
use crate::dtos::academic::course::master::courses::CourseResponse;
use crate::dtos::academic::campaign::transaction::teaches::TeachResponse;
use crate::dtos::academic::campaign::transaction::teach_lecturers::TeachLecturerResponse;
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::campaign::detail_activities as entity_mod;

async fn load_relations_for_detail_activities(
    db: &DatabaseConnection,
    items: &[entity_mod::Model],
) -> Result<(
    HashMap<Uuid, GradeResponse>,
    HashMap<Uuid, CourseResponse>,
    HashMap<Uuid, TeachResponse>,
    HashMap<Uuid, Vec<TeachLecturerResponse>>,
), StatusError> {
    let grade_ids: Vec<Uuid> = items.iter().filter_map(|i| i.grade_id).collect();
    let course_ids: Vec<Uuid> = items.iter().map(|i| i.course_id).collect();
    let teach_ids: Vec<Uuid> = items.iter().filter_map(|i| i.teach_id).collect();

    let grades_map: HashMap<Uuid, GradeResponse> = if grade_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::campaign::transaction::grades::Entity::find()
            .filter(crate::models::academic::campaign::transaction::grades::Column::Id.is_in(grade_ids))
            .filter(crate::models::academic::campaign::transaction::grades::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|g| (g.id, GradeResponse {
                id: g.id,
                code: g.code,
                alphabet_code: g.alphabet_code,
                name: g.name,
                grade: g.grade,
                minimum: g.minimum,
                maximum: g.maximum,
                start_date: g.start_date,
                end_date: g.end_date,
                unit_id: g.unit_id,
                created_at: g.created_at,
                updated_at: g.updated_at,
                deleted_at: g.deleted_at,
                sync_at: g.sync_at,
                created_by: g.created_by,
                updated_by: g.updated_by,
                feeder_id: g.feeder_id,
            }))
            .collect()
    };

    let courses_map: HashMap<Uuid, CourseResponse> = if course_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::course::master::courses::Entity::find()
            .filter(crate::models::academic::course::master::courses::Column::Id.is_in(course_ids))
            .filter(crate::models::academic::course::master::courses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|c| (c.id, CourseResponse {
                id: c.id,
                code: c.code,
                name: c.name,
                implementation_method: c.implementation_method,
                total_credit: c.total_credit,
                lecture_credit: c.lecture_credit,
                practice_credit: c.practice_credit,
                field_practice_credit: c.field_practice_credit,
                simulation_credit: c.simulation_credit,
                has_unit: c.has_unit,
                has_syllabus: c.has_syllabus,
                has_material: c.has_material,
                has_practice: c.has_practice,
                has_dictation: c.has_dictation,
                group_id: c.group_id,
                variety_id: c.variety_id,
                unit_id: c.unit_id,
                competence_id: c.competence_id,
                feeder_course_group_id: c.feeder_course_group_id,
                feeder_course_type_id: c.feeder_course_type_id,
                feeder_course_id: c.feeder_course_id,
                start_date: c.start_date,
                end_date: c.end_date,
                created_at: c.created_at,
                updated_at: c.updated_at,
                deleted_at: c.deleted_at,
                sync_at: c.sync_at,
                created_by: c.created_by,
                updated_by: c.updated_by,
            }))
            .collect()
    };

    let teaches_map: HashMap<Uuid, TeachResponse> = if teach_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::campaign::transaction::teaches::Entity::find()
            .filter(crate::models::academic::campaign::transaction::teaches::Column::Id.is_in(teach_ids.clone()))
            .filter(crate::models::academic::campaign::transaction::teaches::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|t| (t.id, TeachResponse {
                id: t.id,
                name: t.name,
                class_code_id: t.class_code_id,
                course_id: t.course_id,
                activity_id: t.activity_id,
                description: t.description,
                start_date: t.start_date,
                end_date: t.end_date,
                practice_start_date: t.practice_start_date,
                practice_end_date: t.practice_end_date,
                curriculum_detail_id: t.curriculum_detail_id,
                teach_decree_id: t.teach_decree_id,
                is_lecturer_credit_sum_problem: t.is_lecturer_credit_sum_problem,
                is_lock: t.is_lock,
                encounter_category_id: t.encounter_category_id,
                scope_id: t.scope_id,
                created_at: t.created_at,
                updated_at: t.updated_at,
                deleted_at: t.deleted_at,
                sync_at: t.sync_at,
                created_by: t.created_by,
                updated_by: t.updated_by,
                max_member: t.max_member,
                feeder_id: t.feeder_id,
            }))
            .collect()
    };

    let teach_lecturers_map: HashMap<Uuid, Vec<TeachLecturerResponse>> = if teach_ids.is_empty() {
        HashMap::new()
    } else {
        let lecturers = crate::models::academic::campaign::transaction::teach_lecturers::Entity::find()
            .filter(crate::models::academic::campaign::transaction::teach_lecturers::Column::TeachId.is_in(teach_ids))
            .filter(crate::models::academic::campaign::transaction::teach_lecturers::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let lecturer_ids: Vec<Uuid> = lecturers.iter().map(|l| l.lecturer_id).collect();
        let lecturers_map: HashMap<Uuid, String> = if lecturer_ids.is_empty() {
            HashMap::new()
        } else {
            crate::models::academic::lecturer::master::lecturers::Entity::find()
                .filter(crate::models::academic::lecturer::master::lecturers::Column::Id.is_in(lecturer_ids))
                .filter(crate::models::academic::lecturer::master::lecturers::Column::DeletedAt.is_null())
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
                .into_iter()
                .filter_map(|l| l.name.map(|name| (l.id, name)))
                .collect()
        };

        let mut map: HashMap<Uuid, Vec<TeachLecturerResponse>> = HashMap::new();
        for item in lecturers {
            let name = item.name.or_else(|| lecturers_map.get(&item.lecturer_id).cloned());
            map.entry(item.teach_id).or_default().push(TeachLecturerResponse {
                id: item.id,
                name,
                planning: item.planning,
                realization: item.realization,
                credit: item.credit,
                is_lecturer_home_base: item.is_lecturer_home_base,
                lecturer_id: item.lecturer_id,
                teach_id: item.teach_id,
                created_at: item.created_at,
                updated_at: item.updated_at,
                deleted_at: item.deleted_at,
                sync_at: item.sync_at,
                created_by: item.created_by,
                updated_by: item.updated_by,
                feeder_id: item.feeder_id,
            });
        }
        map
    };

    Ok((grades_map, courses_map, teaches_map, teach_lecturers_map))
}

fn map_model_to_response(
    item: entity_mod::Model,
    grades_map: &HashMap<Uuid, GradeResponse>,
    courses_map: &HashMap<Uuid, CourseResponse>,
    teaches_map: &HashMap<Uuid, TeachResponse>,
    teach_lecturers_map: &HashMap<Uuid, Vec<TeachLecturerResponse>>,
) -> DetailActivityResponse {
    let grade = item.grade_id.and_then(|gid| grades_map.get(&gid).cloned());
    let course = courses_map.get(&item.course_id).cloned();
    let teach = item.teach_id.and_then(|tid| teaches_map.get(&tid).cloned());
    let teach_lecturers = item.teach_id.and_then(|tid| teach_lecturers_map.get(&tid).cloned());

    DetailActivityResponse {
        id: item.id,
        mark: item.mark,
        credit: item.credit,
        grade_id: item.grade_id,
        course_id: item.course_id,
        activity_id: item.activity_id,
        teach_id: item.teach_id,
        is_lock: item.is_lock,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        feeder_id: item.feeder_id,
        name: item.name,
        feeder_grade_id: item.feeder_grade_id,
        curiculum_detail_sequence: item.curiculum_detail_sequence,
        grade,
        course,
        teach,
        teach_lecturers,
    }
}

#[endpoint(tags("Academic - Student - Campaign - DetailActivity"), status_codes(200, 500))]
pub async fn list_detail_activities(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedDetailActivityResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: DetailActivityQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }
    if let Some(activity_id) = query.activity_id {
        select = select.filter(entity_mod::Column::ActivityId.eq(activity_id));
    }
    if let Some(course_id) = query.course_id {
        select = select.filter(entity_mod::Column::CourseId.eq(course_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let (grades_map, courses_map, teaches_map, teach_lecturers_map) =
        load_relations_for_detail_activities(db, &items).await?;

    let data = items.into_iter().map(|item| {
        map_model_to_response(item, &grades_map, &courses_map, &teaches_map, &teach_lecturers_map)
    }).collect();

    Ok(Json(PaginatedDetailActivityResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Campaign - DetailActivity"), status_codes(200, 400, 404, 500))]
pub async fn get_detail_activitie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DetailActivityResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("DetailActivity not found"))?;

    let (grades_map, courses_map, teaches_map, teach_lecturers_map) =
        load_relations_for_detail_activities(db, std::slice::from_ref(&item)).await?;

    Ok(Json(map_model_to_response(
        item,
        &grades_map,
        &courses_map,
        &teaches_map,
        &teach_lecturers_map,
    )))
}

#[endpoint(tags("Academic - Student - Campaign - DetailActivity"), status_codes(200, 400, 500))]
pub async fn create_detail_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DetailActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateDetailActivityRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        mark: Set(payload.mark),
        credit: Set(payload.credit),
        grade_id: Set(payload.grade_id),
        course_id: Set(payload.course_id),
        activity_id: Set(payload.activity_id),
        teach_id: Set(payload.teach_id),
        is_lock: Set(payload.is_lock),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        feeder_id: Set(payload.feeder_id),
        name: Set(payload.name),
        feeder_grade_id: Set(payload.feeder_grade_id),
        curiculum_detail_sequence: Set(payload.curiculum_detail_sequence),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let (grades_map, courses_map, teaches_map, teach_lecturers_map) =
            load_relations_for_detail_activities(db, std::slice::from_ref(&item)).await?;

        Ok(Json(map_model_to_response(
            item,
            &grades_map,
            &courses_map,
            &teaches_map,
            &teach_lecturers_map,
        )))
}

#[endpoint(tags("Academic - Student - Campaign - DetailActivity"), status_codes(200, 400, 404, 500))]
pub async fn update_detail_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DetailActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateDetailActivityRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("DetailActivity not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(mark) = payload.mark {
            active_model.mark = Set(Some(mark));
        }
    if let Some(credit) = payload.credit {
            active_model.credit = Set(Some(credit));
        }
    if let Some(grade_id) = payload.grade_id {
            active_model.grade_id = Set(Some(grade_id));
        }
    if let Some(course_id) = payload.course_id {
            active_model.course_id = Set(course_id);
        }
    if let Some(activity_id) = payload.activity_id {
            active_model.activity_id = Set(activity_id);
        }
    if let Some(teach_id) = payload.teach_id {
            active_model.teach_id = Set(Some(teach_id));
        }
    if let Some(is_lock) = payload.is_lock {
            active_model.is_lock = Set(Some(is_lock));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(feeder_grade_id) = payload.feeder_grade_id {
            active_model.feeder_grade_id = Set(Some(feeder_grade_id));
        }
    if let Some(curiculum_detail_sequence) = payload.curiculum_detail_sequence {
            active_model.curiculum_detail_sequence = Set(Some(curiculum_detail_sequence));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let (grades_map, courses_map, teaches_map, teach_lecturers_map) =
            load_relations_for_detail_activities(db, std::slice::from_ref(&item)).await?;

        Ok(Json(map_model_to_response(
            item,
            &grades_map,
            &courses_map,
            &teaches_map,
            &teach_lecturers_map,
        )))
}
#[endpoint(tags("Academic - Student - Campaign - DetailActivity"), status_codes(200, 400, 404, 500))]
pub async fn delete_detail_activitie(
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
            .ok_or_else(|| StatusError::not_found().brief("DetailActivity not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "DetailActivity deleted successfully".to_string(),
        }))
}
