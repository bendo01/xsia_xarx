use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set, TransactionTrait, QuerySelect,
};
use sea_orm::sea_query::{extension::postgres::PgExpr, Expr};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::campaign::student_activities::{
    CreateStudentActivityRequest, StudentActivityQuery, StudentActivityResponse,
    PaginatedStudentActivityResponse, UpdateStudentActivityRequest, StudentActivityOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::academic::student::campaign::student_activities as entity_mod;
use crate::services::pdf::institution_092010::student::activity::plan::activity_plan as Institution092010StudentActivityPlan;
use crate::services::pdf::institution_092010::student::activity::result::activity_result as Institution092010StudentActivityResult;
use crate::middleware::auth::auth_user_id;
use crate::services::auth::data_scope::DataScope;

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedStudentActivityResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let scope = DataScope::resolve(db, depot).await?;

    let query: StudentActivityQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = scope.apply(entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null()));

    let search_term = query.search.as_ref().or(query.q.as_ref());
    if let Some(search) = search_term {
        let trimmed = search.trim();
        if !trimmed.is_empty() {
            let search_pattern = format!("%{}%", trimmed);
            let matching_student_ids: Vec<Uuid> = crate::models::academic::student::master::students::Entity::find()
                .filter(
                    Condition::any()
                        .add(Expr::col(crate::models::academic::student::master::students::Column::Name).ilike(search_pattern.clone()))
                        .add(Expr::col(crate::models::academic::student::master::students::Column::Code).ilike(search_pattern.clone()))
                )
                .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|s| s.id)
                .collect();

            let mut cond = Condition::any()
                .add(Expr::col(entity_mod::Column::Name).ilike(search_pattern));
            if !matching_student_ids.is_empty() {
                cond = cond.add(entity_mod::Column::StudentId.is_in(matching_student_ids));
            }
            select = select.filter(cond);
        }
    } else if let Some(ref name) = query.name {
        let trimmed = name.trim();
        if !trimmed.is_empty() {
            let search_pattern = format!("%{}%", trimmed);
            select = select.filter(Expr::col(entity_mod::Column::Name).ilike(search_pattern));
        }
    }

    if let Some(student_id) = query.student_id {
        select = select.filter(entity_mod::Column::StudentId.eq(student_id));
    }

    if let Some(unit_id) = query.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
    } else if let Some(institution_id) = query.institution_id {
        let matching_unit_ids: Vec<Uuid> = crate::models::institution::master::units::Entity::find()
            .filter(crate::models::institution::master::units::Column::InstitutionId.eq(institution_id))
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|u| u.id)
            .collect();

        if matching_unit_ids.is_empty() {
            select = select.filter(entity_mod::Column::UnitId.eq(Uuid::nil()));
        } else {
            select = select.filter(entity_mod::Column::UnitId.is_in(matching_unit_ids));
        }
    }

    if let Some(status_id) = query.status_id {
        select = select.filter(entity_mod::Column::StatusId.eq(status_id));
    }

    if let Some(academic_year_id) = query.academic_year_id {
        let matching_ua_ids: Vec<Uuid> = crate::models::academic::campaign::transaction::activities::Entity::find()
            .filter(crate::models::academic::campaign::transaction::activities::Column::AcademicYearId.eq(academic_year_id))
            .filter(crate::models::academic::campaign::transaction::activities::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|ua| ua.id)
            .collect();

        if matching_ua_ids.is_empty() {
            select = select.filter(entity_mod::Column::UnitActivityId.eq(Uuid::nil()));
        } else {
            select = select.filter(entity_mod::Column::UnitActivityId.is_in(matching_ua_ids));
        }
    }

    let sort_by = query.sort_by.as_deref().unwrap_or("created_at");
    let sort_dir = query.sort_dir.as_deref().unwrap_or("desc");
    let paginator = match (sort_by, sort_dir) {
        ("name", "asc") => select.order_by_asc(entity_mod::Column::Name),
        ("name", "desc") => select.order_by_desc(entity_mod::Column::Name),
        ("created_at", "asc") => select.order_by_asc(entity_mod::Column::CreatedAt),
        _ => select.order_by_desc(entity_mod::Column::CreatedAt).order_by_asc(entity_mod::Column::Name),
    }.paginate(db, page_size);

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

    let student_ids: Vec<Uuid> = items.iter().map(|item| item.student_id).collect();
    let students_map: std::collections::HashMap<Uuid, (String, String, Uuid)> = if student_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        crate::models::academic::student::master::students::Entity::find()
            .filter(crate::models::academic::student::master::students::Column::Id.is_in(student_ids))
            .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|s| (s.id, (s.name, s.code, s.unit_id)))
            .collect()
    };

    let mut all_unit_ids: Vec<Uuid> = items.iter().filter_map(|item| item.unit_id).collect();
    for (_, _, u_id) in students_map.values() {
        if *u_id != Uuid::nil() && !all_unit_ids.iter().any(|id| id == u_id) {
            all_unit_ids.push(*u_id);
        }
    }
    let units_map: std::collections::HashMap<Uuid, (String, String)> = if all_unit_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        crate::models::institution::master::units::Entity::find()
            .filter(crate::models::institution::master::units::Column::Id.is_in(all_unit_ids))
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|u| (u.id, (u.name.unwrap_or_default(), u.code.unwrap_or_default())))
            .collect()
    };

    let status_ids: Vec<Uuid> = items.iter().map(|item| item.status_id).collect();
    let statuses_map: std::collections::HashMap<Uuid, String> = if status_ids.is_empty() {
        std::collections::HashMap::new()
    } else {
        crate::models::academic::student::reference::statuses::Entity::find()
            .filter(crate::models::academic::student::reference::statuses::Column::Id.is_in(status_ids))
            .filter(crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|s| (s.id, s.name))
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

    let mut running_total_credit = 0.0;
    let mut running_graded_credit = 0.0;
    let mut running_weighted_sum = 0.0;

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

        let current_sem_sks = total_credit.unwrap_or(0.0);
        let current_graded_sks = if graded_sks > 0.0 { graded_sks } else { current_sem_sks };
        let current_weighted = if weighted_sum > 0.0 { weighted_sum } else { cumulative_index * current_graded_sks };

        running_total_credit += current_sem_sks;
        running_graded_credit += current_graded_sks;
        running_weighted_sum += current_weighted;

        let computed_ipk = if running_graded_credit > 0.0 {
            running_weighted_sum / running_graded_credit
        } else {
            cumulative_index
        };

        let grand_total_credit = if item.grand_total_credit.unwrap_or(0.0) > 0.0 && item.grand_total_credit.unwrap_or(0.0) != total_credit.unwrap_or(0.0) {
            item.grand_total_credit
        } else if running_total_credit > 0.0 {
            Some(running_total_credit)
        } else {
            total_credit
        };

        let grand_cumulative_index = if item.grand_cumulative_index > 0.0 && (item.grand_cumulative_index - cumulative_index).abs() > 0.0001 {
            item.grand_cumulative_index
        } else if computed_ipk > 0.0 {
            computed_ipk
        } else {
            cumulative_index
        };

        let (std_name, std_code, std_unit_id) = students_map
            .get(&item.student_id)
            .cloned()
            .unwrap_or((String::new(), String::new(), Uuid::nil()));
        let eff_unit_id = item.unit_id.unwrap_or(std_unit_id);
        let (u_name, u_code) = units_map
            .get(&eff_unit_id)
            .cloned()
            .unwrap_or((String::new(), String::new()));
        let st_name = statuses_map.get(&item.status_id).cloned();

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
            unit_id: item.unit_id.or(if eff_unit_id != Uuid::nil() { Some(eff_unit_id) } else { None }),
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
            student_name: if !std_name.is_empty() { Some(std_name) } else { None },
            student_code: if !std_code.is_empty() { Some(std_code) } else { None },
            unit_name: if !u_name.is_empty() { Some(u_name) } else { None },
            unit_code: if !u_code.is_empty() { Some(u_code) } else { None },
            status_name: st_name,
            ..Default::default()
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

pub async fn load_full_student_activities(
    db: &DatabaseConnection,
    items: Vec<entity_mod::Model>,
) -> Result<Vec<StudentActivityResponse>, StatusError> {
    if items.is_empty() {
        return Ok(Vec::new());
    }

    let unit_activity_ids: Vec<Uuid> = items.iter().map(|item| item.unit_activity_id).filter(|id| *id != Uuid::nil()).collect();
    let status_ids: Vec<Uuid> = items.iter().map(|item| item.status_id).filter(|id| *id != Uuid::nil()).collect();
    let resign_status_ids: Vec<Uuid> = items.iter().filter_map(|item| item.resign_status_id).filter(|id| *id != Uuid::nil()).collect();
    let unit_ids: Vec<Uuid> = items.iter().filter_map(|item| item.unit_id).filter(|id| *id != Uuid::nil()).collect();
    let finance_ids: Vec<Uuid> = items.iter().filter_map(|item| item.finance_id).filter(|id| *id != Uuid::nil()).collect();
    let activity_ids: Vec<Uuid> = items.iter().map(|item| item.id).collect();

    // 1. Unit activities & Academic years
    let unit_activities_map = if unit_activity_ids.is_empty() {
        HashMap::new()
    } else {
        let uas = crate::models::academic::campaign::transaction::activities::Entity::find()
            .filter(crate::models::academic::campaign::transaction::activities::Column::Id.is_in(unit_activity_ids))
            .filter(crate::models::academic::campaign::transaction::activities::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default();

        let ay_ids: Vec<Uuid> = uas.iter().map(|ua| ua.academic_year_id).filter(|id| *id != Uuid::nil()).collect();
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
        let ay_map: HashMap<Uuid, (i32, String)> = ays
            .iter()
            .map(|ay| (ay.id, (ay.code, ay.name.clone())))
            .collect();
        let ay_ref_map: HashMap<Uuid, crate::dtos::common::reference::ReferenceResponse> = ays
            .into_iter()
            .map(|ay| (ay.id, crate::dtos::common::reference::ReferenceResponse {
                id: ay.id,
                code: ay.code,
                alphabet_code: String::new(),
                name: ay.name,
                created_at: ay.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: ay.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: ay.deleted_at,
                sync_at: ay.sync_at,
                created_by: ay.created_by,
                updated_by: ay.updated_by,
            }))
            .collect();

        let ua_unit_ids: Vec<Uuid> = uas.iter().map(|ua| ua.unit_id).filter(|id| *id != Uuid::nil()).collect();
        let ua_units_map: HashMap<Uuid, String> = if ua_unit_ids.is_empty() {
            HashMap::new()
        } else {
            crate::models::institution::master::units::Entity::find()
                .filter(crate::models::institution::master::units::Column::Id.is_in(ua_unit_ids))
                .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|u| (u.id, u.name.unwrap_or_default()))
                .collect()
        };

        let ua_map: HashMap<Uuid, (crate::dtos::academic::campaign::transaction::activities::ActivityResponse, Option<crate::dtos::common::reference::ReferenceResponse>)> = uas
            .into_iter()
            .map(|ua| {
                let ay_name = ay_map.get(&ua.academic_year_id).map(|(_, n)| n.clone());
                let ay_ref = ay_ref_map.get(&ua.academic_year_id).cloned();
                let u_name = ua_units_map.get(&ua.unit_id).cloned();
                let resp = crate::dtos::academic::campaign::transaction::activities::ActivityResponse {
                    id: ua.id,
                    name: ua.name,
                    week_quantity: ua.week_quantity,
                    student_target: ua.student_target,
                    candidate_number: ua.candidate_number,
                    candidate_pass: ua.candidate_pass,
                    became_student: ua.became_student,
                    transfer_student: ua.transfer_student,
                    total_class_member: ua.total_class_member,
                    start_date: ua.start_date,
                    end_date: ua.end_date,
                    start_transaction: ua.start_transaction,
                    end_transaction: ua.end_transaction,
                    unit_id: ua.unit_id,
                    academic_year_id: ua.academic_year_id,
                    is_active: ua.is_active,
                    feeder_id: ua.feeder_id,
                    created_at: ua.created_at,
                    updated_at: ua.updated_at,
                    deleted_at: ua.deleted_at,
                    sync_at: ua.sync_at,
                    created_by: ua.created_by,
                    updated_by: ua.updated_by,
                    unit_name: u_name,
                    academic_year_name: ay_name,
                };
                (ua.id, (resp, ay_ref))
            })
            .collect();

        ua_map
    };

    // 2. Statuses
    let statuses_map: HashMap<Uuid, crate::dtos::common::reference::ReferenceResponse> = if status_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::statuses::Entity::find()
            .filter(crate::models::academic::student::reference::statuses::Column::Id.is_in(status_ids))
            .filter(crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|s| (s.id, crate::dtos::common::reference::ReferenceResponse {
                id: s.id,
                code: s.code,
                alphabet_code: s.alphabet_code.unwrap_or_default(),
                name: s.name,
                created_at: s.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: s.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: s.deleted_at.map(|d| d.naive_utc()),
                sync_at: s.sync_at,
                created_by: s.created_by,
                updated_by: s.updated_by,
            }))
            .collect()
    };

    // 3. Resign statuses
    let resign_statuses_map: HashMap<Uuid, crate::dtos::common::reference::ReferenceResponse> = if resign_status_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::resign_statuses::Entity::find()
            .filter(crate::models::academic::student::reference::resign_statuses::Column::Id.is_in(resign_status_ids))
            .filter(crate::models::academic::student::reference::resign_statuses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|rs| (rs.id, crate::dtos::common::reference::ReferenceResponse {
                id: rs.id,
                code: rs.code,
                alphabet_code: rs.alphabet_code.unwrap_or_default(),
                name: rs.name,
                created_at: rs.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: rs.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: rs.deleted_at.map(|d| d.naive_utc()),
                sync_at: rs.sync_at,
                created_by: rs.created_by,
                updated_by: rs.updated_by,
            }))
            .collect()
    };

    // 4. Units
    let units_map: HashMap<Uuid, crate::dtos::institution::master::units::UnitResponse> = if unit_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::institution::master::units::Entity::find()
            .filter(crate::models::institution::master::units::Column::Id.is_in(unit_ids))
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|u| (u.id, crate::dtos::institution::master::units::UnitResponse {
                id: u.id,
                code: u.code,
                name: u.name,
                is_active: u.is_active,
                unit_type_id: u.unit_type_id,
                institution_id: u.institution_id,
                parent_id: u.parent_id,
                education_id: u.education_id,
                feeder_id: u.feeder_id,
                lft: u.lft,
                rght: u.rght,
                created_at: u.created_at,
                updated_at: u.updated_at,
                sync_at: u.sync_at,
                deleted_at: u.deleted_at,
                created_by: u.created_by,
                updated_by: u.updated_by,
                ..Default::default()
            }))
            .collect()
    };

    // 5. Finances
    let finances_map: HashMap<Uuid, crate::dtos::common::reference::ReferenceResponse> = if finance_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::finances::Entity::find()
            .filter(crate::models::academic::student::reference::finances::Column::Id.is_in(finance_ids))
            .filter(crate::models::academic::student::reference::finances::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|f| (f.id, crate::dtos::common::reference::ReferenceResponse {
                id: f.id,
                code: f.code,
                alphabet_code: f.alphabet_code.unwrap_or_default(),
                name: f.name,
                created_at: f.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: f.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: f.deleted_at.map(|d| d.naive_utc()),
                sync_at: f.sync_at,
                created_by: f.created_by,
                updated_by: f.updated_by,
            }))
            .collect()
    };

    // 6. Detail activities
    let mut details_by_activity: HashMap<Uuid, Vec<crate::dtos::academic::student::campaign::detail_activities::DetailActivityResponse>> = HashMap::new();
    let mut activity_totals: HashMap<Uuid, (f64, f64, f64)> = HashMap::new();
    if !activity_ids.is_empty() {
        let detail_models = crate::models::academic::student::campaign::detail_activities::Entity::find()
            .filter(crate::models::academic::student::campaign::detail_activities::Column::ActivityId.is_in(activity_ids.clone()))
            .filter(crate::models::academic::student::campaign::detail_activities::Column::DeletedAt.is_null())
            .order_by_asc(crate::models::academic::student::campaign::detail_activities::Column::CuriculumDetailSequence)
            .order_by_asc(crate::models::academic::student::campaign::detail_activities::Column::CreatedAt)
            .all(db)
            .await
            .unwrap_or_default();

        if !detail_models.is_empty() {
            let (grades_map, courses_map, teaches_map, teach_lecturers_map, students_map) =
                crate::controllers::academic::student::campaign::detail_activities::load_relations_for_detail_activities(
                    db,
                    &detail_models,
                ).await?;

            for da in detail_models {
                let act_id = da.activity_id;
                let cred = da.credit.or_else(|| courses_map.get(&da.course_id).map(|c| c.total_credit)).unwrap_or(0.0);
                let grade_val = da.grade_id.and_then(|gid| grades_map.get(&gid).map(|g| g.grade));
                let entry = activity_totals.entry(act_id).or_insert((0.0, 0.0, 0.0));
                entry.0 += cred;
                if let Some(g) = grade_val {
                    entry.1 += cred;
                    entry.2 += g * cred;
                }

                let resp = crate::controllers::academic::student::campaign::detail_activities::map_model_to_response(
                    da,
                    &grades_map,
                    &courses_map,
                    &teaches_map,
                    &teach_lecturers_map,
                    &students_map,
                );
                details_by_activity.entry(act_id).or_default().push(resp);
            }
        }
    }

    // Sort student activities chronologically by academic year code before calculating running totals
    let mut items = items;
    items.sort_by(|a, b| {
        let code_a = unit_activities_map
            .get(&a.unit_activity_id)
            .and_then(|(_, ay)| ay.as_ref().map(|r| r.code))
            .unwrap_or(0);
        let code_b = unit_activities_map
            .get(&b.unit_activity_id)
            .and_then(|(_, ay)| ay.as_ref().map(|r| r.code))
            .unwrap_or(0);
        if code_a != code_b {
            code_a.cmp(&code_b)
        } else {
            a.created_at.cmp(&b.created_at)
        }
    });

    let mut running_total_credit = 0.0;
    let mut running_graded_credit = 0.0;
    let mut running_weighted_sum = 0.0;

    let result = items.into_iter().map(|item| {
        let (ua_opt, ay_ref_opt) = unit_activities_map.get(&item.unit_activity_id).cloned().unzip();
        let academic_year_name = ua_opt.as_ref().and_then(|u| u.academic_year_name.clone());
        let st_opt = statuses_map.get(&item.status_id).cloned();
        let status_name = st_opt.as_ref().map(|s| s.name.clone());
        let rs_opt = item.resign_status_id.and_then(|id| resign_statuses_map.get(&id).cloned());
        let resign_status_name = rs_opt.as_ref().map(|r| r.name.clone());
        let u_opt = item.unit_id.and_then(|id| units_map.get(&id).cloned());
        let unit_name = u_opt.as_ref().and_then(|u| u.name.clone());
        let unit_code = u_opt.as_ref().and_then(|u| u.code.clone());
        let fin_opt = item.finance_id.and_then(|id| finances_map.get(&id).cloned());
        let finance_name = fin_opt.as_ref().map(|f| f.name.clone());
        let details = details_by_activity.remove(&item.id).unwrap_or_default();

        let (calc_sks, graded_sks, weighted_sum) = activity_totals.get(&item.id).copied().unwrap_or((0.0, 0.0, 0.0));
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

        let current_sem_sks = total_credit.unwrap_or(0.0);
        let current_graded_sks = if graded_sks > 0.0 { graded_sks } else { current_sem_sks };
        let current_weighted = if weighted_sum > 0.0 { weighted_sum } else { cumulative_index * current_graded_sks };

        running_total_credit += current_sem_sks;
        running_graded_credit += current_graded_sks;
        running_weighted_sum += current_weighted;

        let computed_ipk = if running_graded_credit > 0.0 {
            running_weighted_sum / running_graded_credit
        } else {
            cumulative_index
        };

        let grand_total_credit = if item.grand_total_credit.unwrap_or(0.0) > 0.0 && item.grand_total_credit.unwrap_or(0.0) != total_credit.unwrap_or(0.0) {
            item.grand_total_credit
        } else if running_total_credit > 0.0 {
            Some(running_total_credit)
        } else {
            total_credit
        };

        let grand_cumulative_index = if item.grand_cumulative_index > 0.0 && (item.grand_cumulative_index - cumulative_index).abs() > 0.0001 {
            item.grand_cumulative_index
        } else if computed_ipk > 0.0 {
            computed_ipk
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
            academic_year: ay_ref_opt.flatten(),
            academic_year_name,
            student_name: None,
            student_code: None,
            unit_name,
            unit_code,
            status_name,
            resign_status_name,
            finance_name,
            student: None,
            unit_activity: ua_opt,
            status: st_opt,
            resign_status: rs_opt,
            unit: u_opt,
            finance: fin_opt,
            detail_activities: Some(details),
        }
    }).collect();

    Ok(result)
}

pub async fn find_student_activities_by_student_id(
    db: &DatabaseConnection,
    student_id: Uuid,
) -> Result<Vec<StudentActivityResponse>, StatusError> {
    let items = entity_mod::Entity::find()
        .filter(entity_mod::Column::StudentId.eq(student_id))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .order_by_asc(entity_mod::Column::CreatedAt)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    load_full_student_activities(db, items).await
}

pub async fn find_student_activity_response_by_id(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<Option<StudentActivityResponse>, StatusError> {
    let item = match entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    {
        Some(item) => item,
        None => return Ok(None),
    };

    let student_id = item.student_id;
    let mut responses = load_full_student_activities(db, vec![item]).await?;
    let mut res = match responses.pop() {
        Some(r) => r,
        None => return Ok(None),
    };

    if student_id != Uuid::nil()
        && let Ok(Some(std)) = crate::controllers::academic::student::master::students::find_student_response_by_id_ext(db, student_id, false).await {
            res.student_name = Some(std.name.clone());
            res.student_code = Some(std.code.clone());
            if res.unit.is_none() && std.unit.is_some() {
                res.unit_id = Some(std.unit_id);
                res.unit_name = std.unit_name.clone();
                res.unit_code = std.unit_code.clone();
                res.unit = std.unit.clone();
            }
            res.student = Some(std);
        }

    Ok(Some(res))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let scope = DataScope::resolve(db, depot).await?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    if !scope.is_visible::<entity_mod::Entity, _>(db, id).await? {
        return Err(StatusError::not_found().brief("StudentActivity not found"));
    }

    let res = find_student_activity_response_by_id(db, id)
        .await?
        .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

    Ok(Json(res))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 500))]
pub async fn store(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;
        let scope = DataScope::resolve(db, depot).await?;

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
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
        feeder_id: Set(payload.feeder_id),
        finance_id: Set(payload.finance_id),
        finance_fee: Set(payload.finance_fee),
    };

        let txn = db.begin().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        let item = active_model.insert(&txn).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        scope.ensure_visible::<entity_mod::Entity, _>(&txn, item.id).await?;
        txn.commit().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let res = find_student_activity_response_by_id(db, item.id)
            .await?
            .ok_or_else(|| StatusError::internal_server_error().brief("Failed to load created student activity"))?;

        Ok(Json(res))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn update(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;
        let scope = DataScope::resolve(db, depot).await?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateStudentActivityRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = scope.apply(entity_mod::Entity::find_by_id(id))
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
    active_model.updated_by = Set(auth_user_id(depot));

        let txn = db.begin().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        let item = active_model.update(&txn).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        scope.ensure_visible::<entity_mod::Entity, _>(&txn, item.id).await?;
        txn.commit().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let res = find_student_activity_response_by_id(db, item.id)
            .await?
            .ok_or_else(|| StatusError::internal_server_error().brief("Failed to load updated student activity"))?;

        Ok(Json(res))
}
#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn delete(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;
        let scope = DataScope::resolve(db, depot).await?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let existing = scope.apply(entity_mod::Entity::find_by_id(id))
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

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
    let scope = DataScope::resolve(db, depot).await?;

    let id_str = req
        .param::<String>("id")
        .or_else(|| req.param::<String>("activity_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    if !scope.is_visible::<entity_mod::Entity, _>(db, id).await? {
        return Err(StatusError::not_found().brief("StudentActivity not found"));
    }

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
    let scope = DataScope::resolve(db, depot).await?;

    let id_str = req
        .param::<String>("id")
        .or_else(|| req.param::<String>("activity_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    if !scope.is_visible::<entity_mod::Entity, _>(db, id).await? {
        return Err(StatusError::not_found().brief("StudentActivity not found"));
    }

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

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: StudentActivityOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            select = select.filter(entity_mod::Column::Name.contains(search_trimmed));
        }
    }

    if let Some(student_id) = payload.student_id {
        select = select.filter(entity_mod::Column::StudentId.eq(student_id));
    }

    if let Some(unit_id) = payload.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
    }

    let items = select
        .order_by_asc(entity_mod::Column::Name)
        .limit(100)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: item.name.unwrap_or_default(),
        })
        .collect();

    Ok(Json(data))
}
