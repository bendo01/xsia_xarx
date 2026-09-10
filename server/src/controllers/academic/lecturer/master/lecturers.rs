use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, ModelTrait,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::lecturer::master::lecturers::{
    CreateLecturerRequest, LecturerQuery, LecturerResponse, PaginatedLecturerResponse,
    UpdateLecturerRequest,
};
use crate::dtos::common::reference::{MessageResponse, ReferenceResponse};
use crate::models::academic::lecturer::master::lecturers as entity_mod;

pub async fn load_lecturer_with_relations(
    item: &entity_mod::Model,
    db: &DatabaseConnection,
) -> Result<LecturerResponse, StatusError> {
    // 1. Belongs to: individual
    let individual = item
        .find_related(crate::models::person::master::individual::Entity)
        .filter(crate::models::person::master::individual::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| Box::new(crate::dtos::person::master::individual::IndividualResponse {
            id: m.id,
            code: m.code,
            name: m.name,
            front_title: m.front_title,
            last_title: m.last_title,
            birth_date: m.birth_date,
            birth_place: m.birth_place,
            gender_id: m.gender_id,
            religion_id: m.religion_id,
            occupation_id: m.occupation_id,
            education_id: m.education_id,
            income_id: m.income_id,
            identification_type_id: m.identification_type_id,
            marital_status_id: m.marital_status_id,
            profession_id: m.profession_id,
            age_classification_id: m.age_classification_id,
            is_special_need: m.is_special_need,
            is_social_protection_card_recipient: m.is_social_protection_card_recipient,
            is_deceased: m.is_deceased,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        }));

    // 2. Belongs to: institution
    let institution = if let Some(inst_id) = item.institution_id {
        crate::models::institution::master::institutions::Entity::find_by_id(inst_id)
            .filter(crate::models::institution::master::institutions::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|m| crate::dtos::institution::master::institutions::InstitutionResponse {
                id: m.id,
                code: m.code,
                name: m.name,
                alphabet_code: m.alphabet_code,
                is_active: m.is_active,
                variety_id: m.variety_id,
                category_id: m.category_id,
                country_id: m.country_id,
                parent_id: m.parent_id,
                feeder_id: m.feeder_id,
                academic_year_id: m.academic_year_id,
                created_at: m.created_at,
                updated_at: m.updated_at,
                deleted_at: m.deleted_at,
                sync_at: m.sync_at,
                created_by: m.created_by,
                updated_by: m.updated_by,
            })
    } else {
        None
    };

    // 3. Belongs to: status
    let status = if let Some(sid) = item.status_id {
        crate::models::academic::lecturer::reference::statuses::Entity::find_by_id(sid)
            .filter(crate::models::academic::lecturer::reference::statuses::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|m| ReferenceResponse {
                id: m.id,
                code: m.code,
                alphabet_code: m.alphabet_code.unwrap_or_default(),
                name: m.name,
                created_at: m.created_at.unwrap_or_default(),
                updated_at: m.updated_at.unwrap_or_default(),
                deleted_at: m.deleted_at,
                sync_at: m.sync_at,
                created_by: m.created_by,
                updated_by: m.updated_by,
            })
    } else {
        None
    };

    // 4. Belongs to: contract
    let contract = if let Some(cid) = item.contract_id {
        crate::models::academic::lecturer::reference::contracts::Entity::find_by_id(cid)
            .filter(crate::models::academic::lecturer::reference::contracts::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|m| ReferenceResponse {
                id: m.id,
                code: m.code,
                alphabet_code: m.alphabet_code.unwrap_or_default(),
                name: m.name,
                created_at: m.created_at.unwrap_or_default(),
                updated_at: m.updated_at.unwrap_or_default(),
                deleted_at: m.deleted_at,
                sync_at: m.sync_at,
                created_by: m.created_by,
                updated_by: m.updated_by,
            })
    } else {
        None
    };

    // 5. Belongs to: rank
    let rank = if let Some(rid) = item.rank_id {
        crate::models::academic::lecturer::reference::ranks::Entity::find_by_id(rid)
            .filter(crate::models::academic::lecturer::reference::ranks::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|m| ReferenceResponse {
                id: m.id,
                code: m.code,
                alphabet_code: m.alphabet_code.unwrap_or_default(),
                name: m.name,
                created_at: m.created_at.unwrap_or_default(),
                updated_at: m.updated_at.unwrap_or_default(),
                deleted_at: m.deleted_at,
                sync_at: m.sync_at,
                created_by: m.created_by,
                updated_by: m.updated_by,
            })
    } else {
        None
    };

    // 6. Belongs to: group
    let group = if let Some(gid) = item.group_id {
        crate::models::academic::lecturer::reference::groups::Entity::find_by_id(gid)
            .filter(crate::models::academic::lecturer::reference::groups::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|m| ReferenceResponse {
                id: m.id,
                code: m.code,
                alphabet_code: m.alphabet_code.unwrap_or_default(),
                name: m.name,
                created_at: m.created_at.unwrap_or_default(),
                updated_at: m.updated_at.unwrap_or_default(),
                deleted_at: m.deleted_at,
                sync_at: m.sync_at,
                created_by: m.created_by,
                updated_by: m.updated_by,
            })
    } else {
        None
    };

    // 7. Has many: homebases
    let raw_homebases = item
        .find_related(crate::models::academic::lecturer::transaction::homebases::Entity)
        .filter(crate::models::academic::lecturer::transaction::homebases::Column::DeletedAt.is_null())
        .order_by_desc(crate::models::academic::lecturer::transaction::homebases::Column::CreatedAt)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let unit_ids: Vec<Uuid> = raw_homebases.iter().map(|h| h.unit_id).collect();
    let status_ids: Vec<Uuid> = raw_homebases.iter().map(|h| h.status_id).collect();
    let contract_ids: Vec<Uuid> = raw_homebases.iter().map(|h| h.contract_id).collect();

    let units_map: HashMap<Uuid, crate::models::institution::master::units::Model> = if unit_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::institution::master::units::Entity::find()
            .filter(crate::models::institution::master::units::Column::Id.is_in(unit_ids))
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|u| (u.id, u))
            .collect()
    };

    let statuses_map: HashMap<Uuid, crate::models::academic::lecturer::reference::statuses::Model> = if status_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::lecturer::reference::statuses::Entity::find()
            .filter(crate::models::academic::lecturer::reference::statuses::Column::Id.is_in(status_ids))
            .filter(crate::models::academic::lecturer::reference::statuses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|s| (s.id, s))
            .collect()
    };

    let contracts_map: HashMap<Uuid, crate::models::academic::lecturer::reference::contracts::Model> = if contract_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::lecturer::reference::contracts::Entity::find()
            .filter(crate::models::academic::lecturer::reference::contracts::Column::Id.is_in(contract_ids))
            .filter(crate::models::academic::lecturer::reference::contracts::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|c| (c.id, c))
            .collect()
    };

    let homebases: Vec<crate::dtos::academic::lecturer::transaction::homebases::HomebaseResponse> = raw_homebases
        .into_iter()
        .map(|h| {
            let unit_model = units_map.get(&h.unit_id);
            let status_model = statuses_map.get(&h.status_id);
            let contract_model = contracts_map.get(&h.contract_id);

            let unit_name = unit_model.and_then(|u| u.name.clone());
            let status_name = status_model.map(|s| s.name.clone());
            let contract_name = contract_model.map(|c| c.name.clone());

            let unit_dto = unit_model.map(|u| crate::dtos::institution::master::units::UnitResponse {
                id: u.id,
                code: u.code.clone(),
                name: u.name.clone(),
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
            });

            let status_dto = status_model.map(|s| ReferenceResponse {
                id: s.id,
                code: s.code,
                alphabet_code: s.alphabet_code.clone().unwrap_or_default(),
                name: s.name.clone(),
                created_at: s.created_at.unwrap_or_default(),
                updated_at: s.updated_at.unwrap_or_default(),
                deleted_at: s.deleted_at,
                sync_at: s.sync_at,
                created_by: s.created_by,
                updated_by: s.updated_by,
            });

            let contract_dto = contract_model.map(|c| ReferenceResponse {
                id: c.id,
                code: c.code,
                alphabet_code: c.alphabet_code.clone().unwrap_or_default(),
                name: c.name.clone(),
                created_at: c.created_at.unwrap_or_default(),
                updated_at: c.updated_at.unwrap_or_default(),
                deleted_at: c.deleted_at,
                sync_at: c.sync_at,
                created_by: c.created_by,
                updated_by: c.updated_by,
            });

            crate::dtos::academic::lecturer::transaction::homebases::HomebaseResponse {
                id: h.id,
                lecturer_id: h.lecturer_id,
                unit_id: h.unit_id,
                institution_id: h.institution_id,
                status_id: h.status_id,
                contract_id: h.contract_id,
                created_at: h.created_at,
                updated_at: h.updated_at,
                deleted_at: h.deleted_at,
                sync_at: h.sync_at,
                created_by: h.created_by,
                updated_by: h.updated_by,
                unit_name,
                status_name,
                contract_name,
                unit: unit_dto,
                status: status_dto,
                contract: contract_dto,
            }
        })
        .collect();

    // 8. Has many: academic_ranks
    let raw_academic_ranks = item
        .find_related(crate::models::academic::lecturer::transaction::academic_ranks::Entity)
        .filter(crate::models::academic::lecturer::transaction::academic_ranks::Column::DeletedAt.is_null())
        .order_by_desc(crate::models::academic::lecturer::transaction::academic_ranks::Column::StartDate)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let rank_ids: Vec<Uuid> = raw_academic_ranks.iter().map(|r| r.rank_id).collect();
    let ranks_map: HashMap<Uuid, crate::models::academic::lecturer::reference::ranks::Model> = if rank_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::lecturer::reference::ranks::Entity::find()
            .filter(crate::models::academic::lecturer::reference::ranks::Column::Id.is_in(rank_ids))
            .filter(crate::models::academic::lecturer::reference::ranks::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|r| (r.id, r))
            .collect()
    };

    let academic_ranks: Vec<crate::dtos::academic::lecturer::transaction::academic_ranks::AcademicRankResponse> = raw_academic_ranks
        .into_iter()
        .map(|r| {
            let rank_model = ranks_map.get(&r.rank_id);
            let rank_name = rank_model.map(|rm| rm.name.clone());
            let rank_dto = rank_model.map(|rm| ReferenceResponse {
                id: rm.id,
                code: rm.code,
                alphabet_code: rm.alphabet_code.clone().unwrap_or_default(),
                name: rm.name.clone(),
                created_at: rm.created_at.unwrap_or_default(),
                updated_at: rm.updated_at.unwrap_or_default(),
                deleted_at: rm.deleted_at,
                sync_at: rm.sync_at,
                created_by: rm.created_by,
                updated_by: rm.updated_by,
            });

            crate::dtos::academic::lecturer::transaction::academic_ranks::AcademicRankResponse {
                id: r.id,
                decree_number: r.decree_number,
                decree_date: r.decree_date,
                lecturer_id: r.lecturer_id,
                rank_id: r.rank_id,
                created_at: r.created_at,
                updated_at: r.updated_at,
                deleted_at: r.deleted_at,
                sync_at: r.sync_at,
                created_by: r.created_by,
                updated_by: r.updated_by,
                start_date: r.start_date,
                end_date: r.end_date,
                rank_name,
                rank: rank_dto,
            }
        })
        .collect();

    // 9. Has many: academic_groups
    let raw_academic_groups = item
        .find_related(crate::models::academic::lecturer::transaction::academic_groups::Entity)
        .filter(crate::models::academic::lecturer::transaction::academic_groups::Column::DeletedAt.is_null())
        .order_by_desc(crate::models::academic::lecturer::transaction::academic_groups::Column::StartDate)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let group_ids: Vec<Uuid> = raw_academic_groups.iter().map(|g| g.group_id).collect();
    let groups_map: HashMap<Uuid, crate::models::academic::lecturer::reference::groups::Model> = if group_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::lecturer::reference::groups::Entity::find()
            .filter(crate::models::academic::lecturer::reference::groups::Column::Id.is_in(group_ids))
            .filter(crate::models::academic::lecturer::reference::groups::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|g| (g.id, g))
            .collect()
    };

    let academic_groups: Vec<crate::dtos::academic::lecturer::transaction::academic_groups::AcademicGroupResponse> = raw_academic_groups
        .into_iter()
        .map(|g| {
            let group_model = groups_map.get(&g.group_id);
            let group_name = group_model.map(|gm| gm.name.clone());
            let group_dto = group_model.map(|gm| ReferenceResponse {
                id: gm.id,
                code: gm.code,
                alphabet_code: gm.alphabet_code.clone().unwrap_or_default(),
                name: gm.name.clone(),
                created_at: gm.created_at.unwrap_or_default(),
                updated_at: gm.updated_at.unwrap_or_default(),
                deleted_at: gm.deleted_at,
                sync_at: gm.sync_at,
                created_by: gm.created_by,
                updated_by: gm.updated_by,
            });

            crate::dtos::academic::lecturer::transaction::academic_groups::AcademicGroupResponse {
                id: g.id,
                decree_number: g.decree_number,
                decree_date: g.decree_date,
                lecturer_id: g.lecturer_id,
                group_id: g.group_id,
                created_at: g.created_at,
                updated_at: g.updated_at,
                deleted_at: g.deleted_at,
                sync_at: g.sync_at,
                created_by: g.created_by,
                updated_by: g.updated_by,
                start_date: g.start_date,
                end_date: g.end_date,
                group_name,
                group: group_dto,
            }
        })
        .collect();

    // 10. Has many: teach_lecturers
    let raw_teach_lecturers = item
        .find_related(crate::models::academic::campaign::transaction::teach_lecturers::Entity)
        .filter(crate::models::academic::campaign::transaction::teach_lecturers::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let teach_lecturers: Vec<crate::dtos::academic::campaign::transaction::teach_lecturers::TeachLecturerResponse> = raw_teach_lecturers
        .iter()
        .map(|tl| crate::dtos::academic::campaign::transaction::teach_lecturers::TeachLecturerResponse {
            id: tl.id,
            name: tl.name.clone(),
            code: None,
            planning: tl.planning,
            realization: tl.realization,
            credit: tl.credit,
            is_lecturer_home_base: tl.is_lecturer_home_base,
            lecturer_id: tl.lecturer_id,
            teach_id: tl.teach_id,
            created_at: tl.created_at,
            updated_at: tl.updated_at,
            deleted_at: tl.deleted_at,
            sync_at: tl.sync_at,
            created_by: tl.created_by,
            updated_by: tl.updated_by,
            feeder_id: tl.feeder_id,
            teach: None,
        })
        .collect();

    // 11. Has many: counsellors
    let counsellors: Vec<crate::dtos::academic::student::adviser::counsellors::CounsellorResponse> = item
        .find_related(crate::models::academic::student::adviser::counsellors::Entity)
        .filter(crate::models::academic::student::adviser::counsellors::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|c| crate::dtos::academic::student::adviser::counsellors::CounsellorResponse {
            id: c.id,
            decree_id: c.decree_id,
            student_id: c.student_id,
            lecturer_id: c.lecturer_id,
            created_at: c.created_at,
            updated_at: c.updated_at,
            deleted_at: c.deleted_at,
            sync_at: c.sync_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
        })
        .collect();

    // 12. Has many: advisers
    let advisers: Vec<crate::dtos::academic::student::final_assignment::transaction::advisers::AdviserResponse> = item
        .find_related(crate::models::academic::student::final_assignment::transaction::advisers::Entity)
        .filter(crate::models::academic::student::final_assignment::transaction::advisers::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|a| crate::dtos::academic::student::final_assignment::transaction::advisers::AdviserResponse {
            id: a.id,
            thread: a.thread,
            lecturer_id: a.lecturer_id,
            detail_activity_id: a.detail_activity_id,
            submission_id: a.submission_id,
            adviser_category_id: a.adviser_category_id,
            created_at: a.created_at,
            updated_at: a.updated_at,
            deleted_at: a.deleted_at,
            sync_at: a.sync_at,
            created_by: a.created_by,
            updated_by: a.updated_by,
        })
        .collect();

    // 13. Enriched assigned_teaches (with course, class, academic year)
    let assigned_teaches = if raw_teach_lecturers.is_empty() {
        Vec::new()
    } else {
        let teach_ids: Vec<Uuid> = raw_teach_lecturers.iter().map(|tl| tl.teach_id).collect();
        let teaches = crate::models::academic::campaign::transaction::teaches::Entity::find()
            .filter(crate::models::academic::campaign::transaction::teaches::Column::Id.is_in(teach_ids))
            .filter(crate::models::academic::campaign::transaction::teaches::Column::DeletedAt.is_null())
            .all(db)
            .await
            .unwrap_or_default();

        let teaches_map: HashMap<Uuid, crate::models::academic::campaign::transaction::teaches::Model> = teaches
            .into_iter()
            .map(|t| (t.id, t))
            .collect();

        let course_ids: Vec<Uuid> = teaches_map.values().map(|t| t.course_id).collect();
        let class_code_ids: Vec<Uuid> = teaches_map.values().map(|t| t.class_code_id).collect();
        let activity_ids: Vec<Uuid> = teaches_map.values().filter_map(|t| t.activity_id).collect();

        let courses_map: HashMap<Uuid, crate::models::academic::course::master::courses::Model> = if course_ids.is_empty() {
            HashMap::new()
        } else {
            crate::models::academic::course::master::courses::Entity::find()
                .filter(crate::models::academic::course::master::courses::Column::Id.is_in(course_ids))
                .filter(crate::models::academic::course::master::courses::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|c| (c.id, c))
                .collect()
        };

        let class_codes_map: HashMap<Uuid, crate::models::academic::campaign::transaction::class_codes::Model> = if class_code_ids.is_empty() {
            HashMap::new()
        } else {
            crate::models::academic::campaign::transaction::class_codes::Entity::find()
                .filter(crate::models::academic::campaign::transaction::class_codes::Column::Id.is_in(class_code_ids))
                .filter(crate::models::academic::campaign::transaction::class_codes::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|cc| (cc.id, cc))
                .collect()
        };

        let activities = if activity_ids.is_empty() {
            Vec::new()
        } else {
            crate::models::academic::campaign::transaction::activities::Entity::find()
                .filter(crate::models::academic::campaign::transaction::activities::Column::Id.is_in(activity_ids))
                .filter(crate::models::academic::campaign::transaction::activities::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
        };

        let academic_year_ids: Vec<Uuid> = activities.iter().map(|a| a.academic_year_id).collect();
        let activities_map: HashMap<Uuid, crate::models::academic::campaign::transaction::activities::Model> = activities
            .into_iter()
            .map(|a| (a.id, a))
            .collect();

        let academic_years_map: HashMap<Uuid, crate::models::academic::general::reference::academic_years::Model> = if academic_year_ids.is_empty() {
            HashMap::new()
        } else {
            crate::models::academic::general::reference::academic_years::Entity::find()
                .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(academic_year_ids))
                .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
                .all(db)
                .await
                .unwrap_or_default()
                .into_iter()
                .map(|ay| (ay.id, ay))
                .collect()
        };

        let mut list = Vec::with_capacity(raw_teach_lecturers.len());
        for tl in &raw_teach_lecturers {
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

            list.push(crate::dtos::academic::campaign::transaction::teaches::LecturerAssignedTeachResponse {
                teach_lecturer_id: tl.id,
                teach_id: tl.teach_id,
                lecturer_id: tl.lecturer_id,
                planning: tl.planning,
                realization: tl.realization,
                credit,
                is_lecturer_home_base: tl.is_lecturer_home_base,
                role_name: tl.name.clone(),

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
        list
    };

    // Quick helper names
    let unit_name = homebases.first().and_then(|h| h.unit_name.clone());
    let rank_name = academic_ranks.first().and_then(|r| r.rank_name.clone()).or_else(|| rank.as_ref().map(|r| r.name.clone()));
    let group_name = academic_groups.first().and_then(|g| g.group_name.clone()).or_else(|| group.as_ref().map(|g| g.name.clone()));
    let status_name = homebases.first().and_then(|h| h.status_name.clone()).or_else(|| status.as_ref().map(|s| s.name.clone()));
    let contract_name = homebases.first().and_then(|h| h.contract_name.clone()).or_else(|| contract.as_ref().map(|c| c.name.clone()));

    Ok(LecturerResponse {
        id: item.id,
        code: item.code.clone(),
        name: item.name.clone(),
        individual_id: item.individual_id,
        institution_id: item.institution_id,
        alternative_code: item.alternative_code.clone(),
        accessor_number: item.accessor_number.clone(),
        identification_number: item.identification_number.clone(),
        status_id: item.status_id,
        contract_id: item.contract_id,
        rank_id: item.rank_id,
        start_date: item.start_date,
        end_date: item.end_date,
        front_title: item.front_title.clone(),
        last_title: item.last_title.clone(),
        id_dosen: item.id_dosen,
        group_id: item.group_id,
        nuptk: item.nuptk.clone(),
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,

        individual,
        institution,
        status,
        contract,
        rank,
        group,

        homebases: Some(homebases),
        academic_ranks: Some(academic_ranks),
        academic_groups: Some(academic_groups),
        teach_lecturers: Some(teach_lecturers),
        counsellors: Some(counsellors),
        advisers: Some(advisers),

        assigned_teaches: Some(assigned_teaches),
        unit_name,
        rank_name,
        group_name,
        status_name,
        contract_name,
    })
}

#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 500))]
pub async fn list_lecturers(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedLecturerResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: LecturerQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    if let Some(individual_id) = query.individual_id {
        select = select.filter(entity_mod::Column::IndividualId.eq(individual_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = if query.individual_id.is_some() {
        let mut full_items = Vec::with_capacity(items.len());
        for item in &items {
            full_items.push(load_lecturer_with_relations(item, db).await?);
        }
        full_items
    } else {
        items.into_iter().map(|item| LecturerResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name,
            individual_id: item.individual_id,
            institution_id: item.institution_id,
            alternative_code: item.alternative_code,
            accessor_number: item.accessor_number,
            identification_number: item.identification_number,
            status_id: item.status_id,
            contract_id: item.contract_id,
            rank_id: item.rank_id,
            start_date: item.start_date,
            end_date: item.end_date,
            front_title: item.front_title,
            last_title: item.last_title,
            id_dosen: item.id_dosen,
            group_id: item.group_id,
            nuptk: item.nuptk,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }).collect()
    };

    Ok(Json(PaginatedLecturerResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 404, 500))]
pub async fn get_lecturer(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<LecturerResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Lecturer not found"))?;

    let response = load_lecturer_with_relations(&item, db).await?;
    Ok(Json(response))
}

#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 500))]
pub async fn create_lecturer(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<LecturerResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateLecturerRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
            id_registrasi_dosen: Set(None),
        code: Set(payload.code),
        name: Set(payload.name),
        individual_id: Set(payload.individual_id),
        institution_id: Set(payload.institution_id),
        alternative_code: Set(payload.alternative_code),
        accessor_number: Set(payload.accessor_number),
        identification_number: Set(payload.identification_number),
        status_id: Set(payload.status_id),
        contract_id: Set(payload.contract_id),
        rank_id: Set(payload.rank_id),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        front_title: Set(payload.front_title),
        last_title: Set(payload.last_title),
        id_dosen: Set(payload.id_dosen),
        group_id: Set(payload.group_id),
        nuptk: Set(payload.nuptk),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(LecturerResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name,
            individual_id: item.individual_id,
            institution_id: item.institution_id,
            alternative_code: item.alternative_code,
            accessor_number: item.accessor_number,
            identification_number: item.identification_number,
            status_id: item.status_id,
            contract_id: item.contract_id,
            rank_id: item.rank_id,
            start_date: item.start_date,
            end_date: item.end_date,
            front_title: item.front_title,
            last_title: item.last_title,
            id_dosen: item.id_dosen,
            group_id: item.group_id,
            nuptk: item.nuptk,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }))
}

#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 404, 500))]
pub async fn update_lecturer(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<LecturerResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateLecturerRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Lecturer not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(code);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(individual_id) = payload.individual_id {
            active_model.individual_id = Set(individual_id);
        }
    if let Some(institution_id) = payload.institution_id {
            active_model.institution_id = Set(Some(institution_id));
        }
    if let Some(alternative_code) = payload.alternative_code {
            active_model.alternative_code = Set(Some(alternative_code));
        }
    if let Some(accessor_number) = payload.accessor_number {
            active_model.accessor_number = Set(Some(accessor_number));
        }
    if let Some(identification_number) = payload.identification_number {
            active_model.identification_number = Set(Some(identification_number));
        }
    if let Some(status_id) = payload.status_id {
            active_model.status_id = Set(Some(status_id));
        }
    if let Some(contract_id) = payload.contract_id {
            active_model.contract_id = Set(Some(contract_id));
        }
    if let Some(rank_id) = payload.rank_id {
            active_model.rank_id = Set(Some(rank_id));
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    if let Some(front_title) = payload.front_title {
            active_model.front_title = Set(Some(front_title));
        }
    if let Some(last_title) = payload.last_title {
            active_model.last_title = Set(Some(last_title));
        }
    if let Some(id_dosen) = payload.id_dosen {
            active_model.id_dosen = Set(Some(id_dosen));
        }
    if let Some(group_id) = payload.group_id {
            active_model.group_id = Set(Some(group_id));
        }
    if let Some(nuptk) = payload.nuptk {
            active_model.nuptk = Set(Some(nuptk));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(LecturerResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name,
            individual_id: item.individual_id,
            institution_id: item.institution_id,
            alternative_code: item.alternative_code,
            accessor_number: item.accessor_number,
            identification_number: item.identification_number,
            status_id: item.status_id,
            contract_id: item.contract_id,
            rank_id: item.rank_id,
            start_date: item.start_date,
            end_date: item.end_date,
            front_title: item.front_title,
            last_title: item.last_title,
            id_dosen: item.id_dosen,
            group_id: item.group_id,
            nuptk: item.nuptk,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }))
}
#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 404, 500))]
pub async fn delete_lecturer(
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
            .ok_or_else(|| StatusError::not_found().brief("Lecturer not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Lecturer deleted successfully".to_string(),
        }))
}
