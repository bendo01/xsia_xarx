use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::campaign::transaction::teaches::{
    CreateTeachRequest, TeachQuery, TeachResponse, PaginatedTeachResponse,
    UpdateTeachRequest, LecturerAssignedTeachResponse,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::campaign::transaction::teaches as entity_mod;

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 500))]
pub async fn list_teaches(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedTeachResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: TeachQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }
    if let Some(activity_id) = query.activity_id {
        select = select.filter(entity_mod::Column::ActivityId.eq(activity_id));
    }
    if let Some(teach_decree_id) = query.teach_decree_id {
        select = select.filter(entity_mod::Column::TeachDecreeId.eq(teach_decree_id));
    }
    if let Some(course_id) = query.course_id {
        select = select.filter(entity_mod::Column::CourseId.eq(course_id));
    }
    if let Some(lecturer_id) = query.lecturer_id {
        let teach_ids: Vec<Uuid> = crate::models::academic::campaign::transaction::teach_lecturers::Entity::find()
            .filter(crate::models::academic::campaign::transaction::teach_lecturers::Column::LecturerId.eq(lecturer_id))
            .filter(crate::models::academic::campaign::transaction::teach_lecturers::Column::DeletedAt.is_null())
            .select_only()
            .column(crate::models::academic::campaign::transaction::teach_lecturers::Column::TeachId)
            .into_tuple::<Uuid>()
            .all(db)
            .await
            .unwrap_or_default();
        select = select.filter(entity_mod::Column::Id.is_in(teach_ids));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let (counts, feeder_counts): (HashMap<Uuid, i64>, HashMap<Uuid, i64>) = if items.is_empty() {
        (HashMap::new(), HashMap::new())
    } else {
        let teach_ids: Vec<Uuid> = items.iter().map(|i| i.id).collect();
        let feeder_ids: Vec<Uuid> = items.iter().filter_map(|i| i.feeder_id).collect();

        let da_counts: HashMap<Uuid, i64> = crate::models::academic::student::campaign::detail_activities::Entity::find()
            .filter(crate::models::academic::student::campaign::detail_activities::Column::TeachId.is_in(teach_ids))
            .filter(crate::models::academic::student::campaign::detail_activities::Column::DeletedAt.is_null())
            .select_only()
            .column(crate::models::academic::student::campaign::detail_activities::Column::TeachId)
            .column_as(crate::models::academic::student::campaign::detail_activities::Column::Id.count(), "count")
            .group_by(crate::models::academic::student::campaign::detail_activities::Column::TeachId)
            .into_tuple::<(Option<Uuid>, i64)>()
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .filter_map(|(tid, count)| tid.map(|id| (id, count)))
            .collect();

        let pk_counts: HashMap<Uuid, i64> = if feeder_ids.is_empty() {
            HashMap::new()
        } else {
            crate::models::feeder::master::peserta_kelas_kuliah::Entity::find()
                .filter(crate::models::feeder::master::peserta_kelas_kuliah::Column::IdKelasKuliah.is_in(feeder_ids))
                .filter(crate::models::feeder::master::peserta_kelas_kuliah::Column::DeletedAt.is_null())
                .select_only()
                .column(crate::models::feeder::master::peserta_kelas_kuliah::Column::IdKelasKuliah)
                .column_as(crate::models::feeder::master::peserta_kelas_kuliah::Column::Id.count(), "count")
                .group_by(crate::models::feeder::master::peserta_kelas_kuliah::Column::IdKelasKuliah)
                .into_tuple::<(Option<Uuid>, i64)>()
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .filter_map(|(fid, count)| fid.map(|id| (id, count)))
                .collect()
        };

        (da_counts, pk_counts)
    };

    let data = items.into_iter().map(|item| {
        let enrolled_count = counts.get(&item.id).copied()
            .or_else(|| item.feeder_id.and_then(|fid| feeder_counts.get(&fid).copied()))
            .unwrap_or(0);

        TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,
            enrolled_count: Some(enrolled_count),
        }
    }).collect();

    Ok(Json(PaginatedTeachResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 404, 500))]
pub async fn get_teache(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<TeachResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Teach not found"))?;

    let enrolled_count = crate::models::academic::student::campaign::detail_activities::Entity::find()
        .filter(crate::models::academic::student::campaign::detail_activities::Column::TeachId.eq(item.id))
        .filter(crate::models::academic::student::campaign::detail_activities::Column::DeletedAt.is_null())
        .count(db)
        .await
        .unwrap_or(0);

    Ok(Json(TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,
            enrolled_count: Some(enrolled_count as i64),
    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 500))]
pub async fn create_teache(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<TeachResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateTeachRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        class_code_id: Set(payload.class_code_id),
        course_id: Set(payload.course_id),
        activity_id: Set(payload.activity_id),
        description: Set(payload.description),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        practice_start_date: Set(payload.practice_start_date),
        practice_end_date: Set(payload.practice_end_date),
        curriculum_detail_id: Set(payload.curriculum_detail_id),
        teach_decree_id: Set(payload.teach_decree_id),
        is_lecturer_credit_sum_problem: Set(payload.is_lecturer_credit_sum_problem),
        is_lock: Set(payload.is_lock),
        encounter_category_id: Set(payload.encounter_category_id),
        scope_id: Set(payload.scope_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        max_member: Set(payload.max_member),
        feeder_id: Set(payload.feeder_id),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,
            enrolled_count: Some(0),
        }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 404, 500))]
pub async fn update_teache(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<TeachResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateTeachRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Teach not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(class_code_id) = payload.class_code_id {
            active_model.class_code_id = Set(class_code_id);
        }
    if let Some(course_id) = payload.course_id {
            active_model.course_id = Set(course_id);
        }
    if let Some(activity_id) = payload.activity_id {
            active_model.activity_id = Set(Some(activity_id));
        }
    if let Some(description) = payload.description {
            active_model.description = Set(Some(description));
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    if let Some(practice_start_date) = payload.practice_start_date {
            active_model.practice_start_date = Set(Some(practice_start_date));
        }
    if let Some(practice_end_date) = payload.practice_end_date {
            active_model.practice_end_date = Set(Some(practice_end_date));
        }
    if let Some(curriculum_detail_id) = payload.curriculum_detail_id {
            active_model.curriculum_detail_id = Set(Some(curriculum_detail_id));
        }
    if let Some(teach_decree_id) = payload.teach_decree_id {
            active_model.teach_decree_id = Set(teach_decree_id);
        }
    if let Some(is_lecturer_credit_sum_problem) = payload.is_lecturer_credit_sum_problem {
            active_model.is_lecturer_credit_sum_problem = Set(Some(is_lecturer_credit_sum_problem));
        }
    if let Some(is_lock) = payload.is_lock {
            active_model.is_lock = Set(Some(is_lock));
        }
    if let Some(encounter_category_id) = payload.encounter_category_id {
            active_model.encounter_category_id = Set(Some(encounter_category_id));
        }
    if let Some(scope_id) = payload.scope_id {
            active_model.scope_id = Set(Some(scope_id));
        }
    if let Some(max_member) = payload.max_member {
            active_model.max_member = Set(Some(max_member));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let enrolled_count = crate::models::academic::student::campaign::detail_activities::Entity::find()
            .filter(crate::models::academic::student::campaign::detail_activities::Column::TeachId.eq(item.id))
            .filter(crate::models::academic::student::campaign::detail_activities::Column::DeletedAt.is_null())
            .count(db)
            .await
            .unwrap_or(0);

        Ok(Json(TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,
            enrolled_count: Some(enrolled_count as i64),
        }))
}
#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 404, 500))]
pub async fn delete_teache(
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
            .ok_or_else(|| StatusError::not_found().brief("Teach not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Teach deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 500))]
pub async fn get_teaches_by_lecturer(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<LecturerAssignedTeachResponse>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .or_else(|| req.param::<String>("lecturer_id"))
        .or_else(|| req.query::<String>("lecturer_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id or lecturer_id"))?;

    let lecturer_id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    // Check if the passed ID is direct lecturer.id or individual_id
    let resolved_lecturer_id = if let Some(lecturer) = crate::models::academic::lecturer::master::lecturers::Entity::find_by_id(lecturer_id)
        .filter(crate::models::academic::lecturer::master::lecturers::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    {
        lecturer.id
    } else if let Some(lecturer) = crate::models::academic::lecturer::master::lecturers::Entity::find()
        .filter(crate::models::academic::lecturer::master::lecturers::Column::IndividualId.eq(lecturer_id))
        .filter(crate::models::academic::lecturer::master::lecturers::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    {
        lecturer.id
    } else {
        lecturer_id
    };

    // 1. Fetch teach_lecturers for this lecturer
    let teach_lecturers = crate::models::academic::campaign::transaction::teach_lecturers::Entity::find()
        .filter(crate::models::academic::campaign::transaction::teach_lecturers::Column::LecturerId.eq(resolved_lecturer_id))
        .filter(crate::models::academic::campaign::transaction::teach_lecturers::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if teach_lecturers.is_empty() {
        return Ok(Json(vec![]));
    }

    let teach_ids: Vec<Uuid> = teach_lecturers.iter().map(|tl| tl.teach_id).collect();

    // 2. Fetch teaches
    let teaches = entity_mod::Entity::find()
        .filter(entity_mod::Column::Id.is_in(teach_ids))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let teaches_map: HashMap<Uuid, entity_mod::Model> = teaches
        .into_iter()
        .map(|t| (t.id, t))
        .collect();

    // Collect related IDs
    let course_ids: Vec<Uuid> = teaches_map.values().map(|t| t.course_id).collect();
    let class_code_ids: Vec<Uuid> = teaches_map.values().map(|t| t.class_code_id).collect();
    let activity_ids: Vec<Uuid> = teaches_map.values().filter_map(|t| t.activity_id).collect();

    // 3. Fetch courses
    let courses_map: HashMap<Uuid, crate::models::academic::course::master::courses::Model> = if course_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::course::master::courses::Entity::find()
            .filter(crate::models::academic::course::master::courses::Column::Id.is_in(course_ids))
            .filter(crate::models::academic::course::master::courses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|c| (c.id, c))
            .collect()
    };

    // 4. Fetch class codes
    let class_codes_map: HashMap<Uuid, crate::models::academic::campaign::transaction::class_codes::Model> = if class_code_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::campaign::transaction::class_codes::Entity::find()
            .filter(crate::models::academic::campaign::transaction::class_codes::Column::Id.is_in(class_code_ids))
            .filter(crate::models::academic::campaign::transaction::class_codes::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|cc| (cc.id, cc))
            .collect()
    };

    // 5. Fetch activities
    let activities = if activity_ids.is_empty() {
        Vec::new()
    } else {
        crate::models::academic::campaign::transaction::activities::Entity::find()
            .filter(crate::models::academic::campaign::transaction::activities::Column::Id.is_in(activity_ids))
            .filter(crate::models::academic::campaign::transaction::activities::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    };

    let academic_year_ids: Vec<Uuid> = activities.iter().map(|a| a.academic_year_id).collect();
    let activities_map: HashMap<Uuid, crate::models::academic::campaign::transaction::activities::Model> = activities
        .into_iter()
        .map(|a| (a.id, a))
        .collect();

    // 6. Fetch academic years
    let academic_years_map: HashMap<Uuid, crate::models::academic::general::reference::academic_years::Model> = if academic_year_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::general::reference::academic_years::Entity::find()
            .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(academic_year_ids))
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|ay| (ay.id, ay))
            .collect()
    };

    // 7. Assemble response items
    let mut results = Vec::with_capacity(teach_lecturers.len());
    for tl in teach_lecturers {
        let teach = teaches_map.get(&tl.teach_id);
        let course = teach.and_then(|t| courses_map.get(&t.course_id));
        let class_code = teach.and_then(|t| class_codes_map.get(&t.class_code_id));
        let activity = teach.and_then(|t| t.activity_id.and_then(|aid| activities_map.get(&aid)));
        let academic_year = activity.and_then(|a| academic_years_map.get(&a.academic_year_id));

        let credit = tl.credit
            .map(|d| d.to_string().parse::<f64>().unwrap_or(0.0))
            .filter(|&c| c > 0.0)
            .or_else(|| course.map(|c| c.total_credit))
            .unwrap_or(0.0);

        let course_name = course
            .map(|c| c.name.clone())
            .or_else(|| teach.and_then(|t| t.name.as_ref().map(|n| format!("Mata Kuliah ({})", n))))
            .unwrap_or_else(|| "Mata Kuliah".to_string());

        let class_name = class_code
            .map(|cc| cc.name.clone())
            .or_else(|| class_code.and_then(|cc| cc.alphabet_code.as_ref().map(|ac| format!("Kelas {}", ac))))
            .unwrap_or_else(|| "Kelas".to_string());

        let class_capacity = class_code.and_then(|cc| cc.capacity).or_else(|| teach.and_then(|t| t.max_member));

        let academic_year_name = academic_year
            .map(|ay| ay.name.clone())
            .or_else(|| academic_year.map(|ay| ay.code.to_string()));

        results.push(LecturerAssignedTeachResponse {
            teach_lecturer_id: tl.id,
            teach_id: tl.teach_id,
            lecturer_id: tl.lecturer_id,
            planning: tl.planning,
            realization: tl.realization,
            credit,
            is_lecturer_home_base: tl.is_lecturer_home_base,
            role_name: tl.name,

            teach_name: teach.and_then(|t| t.name.clone()),
            description: teach.and_then(|t| t.description.clone()),
            start_date: teach.and_then(|t| t.start_date),
            end_date: teach.and_then(|t| t.end_date),
            max_member: teach.and_then(|t| t.max_member),
            activity_id: teach.and_then(|t| t.activity_id),
            activity_name: activity.map(|a| a.name.clone()),
            academic_year_id: activity.map(|a| a.academic_year_id),
            academic_year_name,
            academic_year_code: academic_year.map(|ay| ay.code),

            course_id: teach.map(|t| t.course_id).unwrap_or_default(),
            course_code: course.map(|c| c.code.clone()),
            course_name: Some(course_name),
            course_total_credit: course.map(|c| c.total_credit),
            course_lecture_credit: course.map(|c| c.lecture_credit),
            course_practice_credit: course.map(|c| c.practice_credit),

            class_code_id: teach.map(|t| t.class_code_id).unwrap_or_default(),
            class_name: Some(class_name),
            class_alphabet_code: class_code.and_then(|cc| cc.alphabet_code.clone()),
            class_capacity,
        });
    }

    // Sort latest academic year first, then course name
    results.sort_by(|a, b| {
        let code_a = a.academic_year_code.unwrap_or(0);
        let code_b = b.academic_year_code.unwrap_or(0);
        if code_a != code_b {
            return code_b.cmp(&code_a);
        }
        let year_a = a.academic_year_name.as_deref().unwrap_or("");
        let year_b = b.academic_year_name.as_deref().unwrap_or("");
        let year_cmp = year_b.cmp(year_a);
        if year_cmp != std::cmp::Ordering::Equal {
            return year_cmp;
        }
        let name_a = a.course_name.as_deref().unwrap_or("");
        let name_b = b.course_name.as_deref().unwrap_or("");
        name_a.cmp(name_b)
    });

    Ok(Json(results))
}
