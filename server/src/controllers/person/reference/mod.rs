use salvo::oapi::swagger_ui::SwaggerUi;
use salvo::oapi::OpenApi;
use salvo::prelude::*;

pub mod dto;

macro_rules! impl_reference_controller {
    (
        $mod_name:ident,
        $entity_path:path,
        $tag:expr,
        $item_name:expr,
        $list_fn:ident,
        $get_fn:ident,
        $create_fn:ident,
        $update_fn:ident,
        $delete_fn:ident
    ) => {
        pub mod $mod_name {
            use chrono::Utc;
            use salvo::prelude::*;
            use sea_orm::{
                ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
                PaginatorTrait, QueryFilter, QueryOrder, Set,
            };
            use uuid::Uuid;

            use $entity_path as entity_mod;
            use $crate::controllers::person::reference::dto::{
                CreateReferenceRequest, MessageResponse, PaginatedReferenceResponse, ReferenceQuery,
                ReferenceResponse, UpdateReferenceRequest,
            };

            #[endpoint(
                tags($tag),
                status_codes(200, 400, 500)
            )]
            pub async fn $list_fn(
                req: &mut Request,
                depot: &mut Depot,
                res: &mut Response,
            ) {
                let db = match depot.get_typed::<DatabaseConnection>() {
                    Ok(db) => db,
                    Err(_) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: "Database connection missing in depot".to_string(),
                        }));
                        return;
                    }
                };

                let query: ReferenceQuery = req.parse_queries().unwrap_or(ReferenceQuery {
                    page: None,
                    page_size: None,
                    name: None,
                    code: None,
                });

                let page = query.page.unwrap_or(1);
                let page_size = query.page_size.unwrap_or(10);

                let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

                if let Some(ref name) = query.name {
                    select = select.filter(entity_mod::Column::Name.contains(name));
                }
                if let Some(code) = query.code {
                    select = select.filter(entity_mod::Column::Code.eq(code));
                }

                let paginator = select.order_by_asc(entity_mod::Column::Code).paginate(db, page_size);

                let total = match paginator.num_items().await {
                    Ok(t) => t,
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                        return;
                    }
                };

                let total_pages = (total as f64 / page_size as f64).ceil() as u64;

                let items = match paginator.fetch_page(page.saturating_sub(1)).await {
                    Ok(items) => items,
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                        return;
                    }
                };

                let data = items
                    .into_iter()
                    .map(|item| ReferenceResponse {
                        id: item.id,
                        code: item.code,
                        alphabet_code: item.alphabet_code,
                        name: item.name,
                        created_at: item.created_at,
                        updated_at: item.updated_at,
                        deleted_at: item.deleted_at,
                        sync_at: item.sync_at,
                        created_by: item.created_by,
                        updated_by: item.updated_by,
                    })
                    .collect();

                res.render(Json(PaginatedReferenceResponse {
                    data,
                    total,
                    page,
                    page_size,
                    total_pages,
                }));
            }

            #[endpoint(
                tags($tag),
                status_codes(200, 404, 500)
            )]
            pub async fn $get_fn(
                req: &mut Request,
                depot: &mut Depot,
                res: &mut Response,
            ) {
                let db = match depot.get_typed::<DatabaseConnection>() {
                    Ok(db) => db,
                    Err(_) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: "Database connection missing in depot".to_string(),
                        }));
                        return;
                    }
                };

                let id_str = match req.param::<String>("id") {
                    Some(id) => id,
                    None => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: "Missing parameter id".to_string(),
                        }));
                        return;
                    }
                };

                let id = match Uuid::parse_str(&id_str) {
                    Ok(id) => id,
                    Err(_) => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: "Invalid UUID format".to_string(),
                        }));
                        return;
                    }
                };

                match entity_mod::Entity::find_by_id(id)
                    .filter(entity_mod::Column::DeletedAt.is_null())
                    .one(db)
                    .await
                {
                    Ok(Some(item)) => {
                        res.render(Json(ReferenceResponse {
                            id: item.id,
                            code: item.code,
                            alphabet_code: item.alphabet_code,
                            name: item.name,
                            created_at: item.created_at,
                            updated_at: item.updated_at,
                            deleted_at: item.deleted_at,
                            sync_at: item.sync_at,
                            created_by: item.created_by,
                            updated_by: item.updated_by,
                        }));
                    }
                    Ok(None) => {
                        res.status_code(StatusCode::NOT_FOUND);
                        res.render(Json(MessageResponse {
                            message: format!("{} not found", $item_name),
                        }));
                    }
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                    }
                }
            }

            #[endpoint(
                tags($tag),
                status_codes(201, 400, 500)
            )]
            pub async fn $create_fn(
                req: &mut Request,
                depot: &mut Depot,
                res: &mut Response,
            ) {
                let db = match depot.get_typed::<DatabaseConnection>() {
                    Ok(db) => db,
                    Err(_) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: "Database connection missing in depot".to_string(),
                        }));
                        return;
                    }
                };

                let payload: CreateReferenceRequest = match req.parse_json().await {
                    Ok(p) => p,
                    Err(e) => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: format!("Invalid JSON payload: {}", e),
                        }));
                        return;
                    }
                };

                let now = Utc::now().naive_utc();
                let new_id = Uuid::new_v4();

                let active_model = entity_mod::ActiveModel {
                    id: Set(new_id),
                    code: Set(payload.code),
                    alphabet_code: Set(payload.alphabet_code),
                    name: Set(payload.name),
                    created_at: Set(now),
                    updated_at: Set(now),
                    deleted_at: Set(None),
                    sync_at: Set(None),
                    created_by: Set(None),
                    updated_by: Set(None),
                };

                match active_model.insert(db).await {
                    Ok(item) => {
                        res.status_code(StatusCode::CREATED);
                        res.render(Json(ReferenceResponse {
                            id: item.id,
                            code: item.code,
                            alphabet_code: item.alphabet_code,
                            name: item.name,
                            created_at: item.created_at,
                            updated_at: item.updated_at,
                            deleted_at: item.deleted_at,
                            sync_at: item.sync_at,
                            created_by: item.created_by,
                            updated_by: item.updated_by,
                        }));
                    }
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                    }
                }
            }

            #[endpoint(
                tags($tag),
                status_codes(200, 400, 404, 500)
            )]
            pub async fn $update_fn(
                req: &mut Request,
                depot: &mut Depot,
                res: &mut Response,
            ) {
                let db = match depot.get_typed::<DatabaseConnection>() {
                    Ok(db) => db,
                    Err(_) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: "Database connection missing in depot".to_string(),
                        }));
                        return;
                    }
                };

                let id_str = match req.param::<String>("id") {
                    Some(id) => id,
                    None => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: "Missing parameter id".to_string(),
                        }));
                        return;
                    }
                };

                let id = match Uuid::parse_str(&id_str) {
                    Ok(id) => id,
                    Err(_) => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: "Invalid UUID format".to_string(),
                        }));
                        return;
                    }
                };

                let payload: UpdateReferenceRequest = match req.parse_json().await {
                    Ok(p) => p,
                    Err(e) => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: format!("Invalid JSON payload: {}", e),
                        }));
                        return;
                    }
                };

                let existing = match entity_mod::Entity::find_by_id(id)
                    .filter(entity_mod::Column::DeletedAt.is_null())
                    .one(db)
                    .await
                {
                    Ok(Some(item)) => item,
                    Ok(None) => {
                        res.status_code(StatusCode::NOT_FOUND);
                        res.render(Json(MessageResponse {
                            message: format!("{} not found", $item_name),
                        }));
                        return;
                    }
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                        return;
                    }
                };

                let now = Utc::now().naive_utc();
                let mut active_model = existing.into_active_model();

                if let Some(code) = payload.code {
                    active_model.code = Set(code);
                }
                if let Some(alphabet_code) = payload.alphabet_code {
                    active_model.alphabet_code = Set(alphabet_code);
                }
                if let Some(name) = payload.name {
                    active_model.name = Set(name);
                }
                active_model.updated_at = Set(now);

                match active_model.update(db).await {
                    Ok(item) => {
                        res.render(Json(ReferenceResponse {
                            id: item.id,
                            code: item.code,
                            alphabet_code: item.alphabet_code,
                            name: item.name,
                            created_at: item.created_at,
                            updated_at: item.updated_at,
                            deleted_at: item.deleted_at,
                            sync_at: item.sync_at,
                            created_by: item.created_by,
                            updated_by: item.updated_by,
                        }));
                    }
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                    }
                }
            }

            #[endpoint(
                tags($tag),
                status_codes(200, 400, 404, 500)
            )]
            pub async fn $delete_fn(
                req: &mut Request,
                depot: &mut Depot,
                res: &mut Response,
            ) {
                let db = match depot.get_typed::<DatabaseConnection>() {
                    Ok(db) => db,
                    Err(_) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: "Database connection missing in depot".to_string(),
                        }));
                        return;
                    }
                };

                let id_str = match req.param::<String>("id") {
                    Some(id) => id,
                    None => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: "Missing parameter id".to_string(),
                        }));
                        return;
                    }
                };

                let id = match Uuid::parse_str(&id_str) {
                    Ok(id) => id,
                    Err(_) => {
                        res.status_code(StatusCode::BAD_REQUEST);
                        res.render(Json(MessageResponse {
                            message: "Invalid UUID format".to_string(),
                        }));
                        return;
                    }
                };

                let existing = match entity_mod::Entity::find_by_id(id)
                    .filter(entity_mod::Column::DeletedAt.is_null())
                    .one(db)
                    .await
                {
                    Ok(Some(item)) => item,
                    Ok(None) => {
                        res.status_code(StatusCode::NOT_FOUND);
                        res.render(Json(MessageResponse {
                            message: format!("{} not found", $item_name),
                        }));
                        return;
                    }
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                        return;
                    }
                };

                let now = Utc::now().naive_utc();
                let mut active_model = existing.into_active_model();
                active_model.deleted_at = Set(Some(now));
                active_model.updated_at = Set(now);

                match active_model.update(db).await {
                    Ok(_) => {
                        res.render(Json(MessageResponse {
                            message: format!("{} deleted successfully", $item_name),
                        }));
                    }
                    Err(e) => {
                        res.status_code(StatusCode::INTERNAL_SERVER_ERROR);
                        res.render(Json(MessageResponse {
                            message: e.to_string(),
                        }));
                    }
                }
            }
        }
    };
}

impl_reference_controller!(
    age_classification,
    crate::models::person::reference::age_classification,
    "Person Reference - Age Classification",
    "Age classification",
    list_age_classifications,
    get_age_classification,
    create_age_classification,
    update_age_classification,
    delete_age_classification
);

impl_reference_controller!(
    blood_type,
    crate::models::person::reference::blood_type,
    "Person Reference - Blood Type",
    "Blood type",
    list_blood_types,
    get_blood_type,
    create_blood_type,
    update_blood_type,
    delete_blood_type
);

impl_reference_controller!(
    eye_color,
    crate::models::person::reference::eye_color,
    "Person Reference - Eye Color",
    "Eye color",
    list_eye_colors,
    get_eye_color,
    create_eye_color,
    update_eye_color,
    delete_eye_color
);

impl_reference_controller!(
    gender,
    crate::models::person::reference::gender,
    "Person Reference - Gender",
    "Gender",
    list_genders,
    get_gender,
    create_gender,
    update_gender,
    delete_gender
);

impl_reference_controller!(
    hair_color,
    crate::models::person::reference::hair_color,
    "Person Reference - Hair Color",
    "Hair color",
    list_hair_colors,
    get_hair_color,
    create_hair_color,
    update_hair_color,
    delete_hair_color
);

impl_reference_controller!(
    hair_type,
    crate::models::person::reference::hair_type,
    "Person Reference - Hair Type",
    "Hair type",
    list_hair_types,
    get_hair_type,
    create_hair_type,
    update_hair_type,
    delete_hair_type
);

impl_reference_controller!(
    identification_type,
    crate::models::person::reference::identification_type,
    "Person Reference - Identification Type",
    "Identification type",
    list_identification_types,
    get_identification_type,
    create_identification_type,
    update_identification_type,
    delete_identification_type
);

impl_reference_controller!(
    income,
    crate::models::person::reference::income,
    "Person Reference - Income",
    "Income",
    list_incomes,
    get_income,
    create_income,
    update_income,
    delete_income
);

impl_reference_controller!(
    marital_status,
    crate::models::person::reference::marital_status,
    "Person Reference - Marital Status",
    "Marital status",
    list_marital_statuses,
    get_marital_status,
    create_marital_status,
    update_marital_status,
    delete_marital_status
);

impl_reference_controller!(
    occupation,
    crate::models::person::reference::occupation,
    "Person Reference - Occupation",
    "Occupation",
    list_occupations,
    get_occupation,
    create_occupation,
    update_occupation,
    delete_occupation
);

impl_reference_controller!(
    profession,
    crate::models::person::reference::profession,
    "Person Reference - Profession",
    "Profession",
    list_professions,
    get_profession,
    create_profession,
    update_profession,
    delete_profession
);

impl_reference_controller!(
    relative_type,
    crate::models::person::reference::relative_type,
    "Person Reference - Relative Type",
    "Relative type",
    list_relative_types,
    get_relative_type,
    create_relative_type,
    update_relative_type,
    delete_relative_type
);

impl_reference_controller!(
    religion,
    crate::models::person::reference::religion,
    "Person Reference - Religion",
    "Religion",
    list_religions,
    get_religion,
    create_religion,
    update_religion,
    delete_religion
);

pub fn router() -> Router {
    let ref_router = Router::with_path("reference")
        .push(
            Router::with_path("age-classifications")
                .get(age_classification::list_age_classifications)
                .post(age_classification::create_age_classification)
                .push(
                    Router::with_path("{id}")
                        .get(age_classification::get_age_classification)
                        .put(age_classification::update_age_classification)
                        .delete(age_classification::delete_age_classification),
                ),
        )
        .push(
            Router::with_path("blood-types")
                .get(blood_type::list_blood_types)
                .post(blood_type::create_blood_type)
                .push(
                    Router::with_path("{id}")
                        .get(blood_type::get_blood_type)
                        .put(blood_type::update_blood_type)
                        .delete(blood_type::delete_blood_type),
                ),
        )
        .push(
            Router::with_path("eye-colors")
                .get(eye_color::list_eye_colors)
                .post(eye_color::create_eye_color)
                .push(
                    Router::with_path("{id}")
                        .get(eye_color::get_eye_color)
                        .put(eye_color::update_eye_color)
                        .delete(eye_color::delete_eye_color),
                ),
        )
        .push(
            Router::with_path("genders")
                .get(gender::list_genders)
                .post(gender::create_gender)
                .push(
                    Router::with_path("{id}")
                        .get(gender::get_gender)
                        .put(gender::update_gender)
                        .delete(gender::delete_gender),
                ),
        )
        .push(
            Router::with_path("hair-colors")
                .get(hair_color::list_hair_colors)
                .post(hair_color::create_hair_color)
                .push(
                    Router::with_path("{id}")
                        .get(hair_color::get_hair_color)
                        .put(hair_color::update_hair_color)
                        .delete(hair_color::delete_hair_color),
                ),
        )
        .push(
            Router::with_path("hair-types")
                .get(hair_type::list_hair_types)
                .post(hair_type::create_hair_type)
                .push(
                    Router::with_path("{id}")
                        .get(hair_type::get_hair_type)
                        .put(hair_type::update_hair_type)
                        .delete(hair_type::delete_hair_type),
                ),
        )
        .push(
            Router::with_path("identification-types")
                .get(identification_type::list_identification_types)
                .post(identification_type::create_identification_type)
                .push(
                    Router::with_path("{id}")
                        .get(identification_type::get_identification_type)
                        .put(identification_type::update_identification_type)
                        .delete(identification_type::delete_identification_type),
                ),
        )
        .push(
            Router::with_path("incomes")
                .get(income::list_incomes)
                .post(income::create_income)
                .push(
                    Router::with_path("{id}")
                        .get(income::get_income)
                        .put(income::update_income)
                        .delete(income::delete_income),
                ),
        )
        .push(
            Router::with_path("marital-statuses")
                .get(marital_status::list_marital_statuses)
                .post(marital_status::create_marital_status)
                .push(
                    Router::with_path("{id}")
                        .get(marital_status::get_marital_status)
                        .put(marital_status::update_marital_status)
                        .delete(marital_status::delete_marital_status),
                ),
        )
        .push(
            Router::with_path("occupations")
                .get(occupation::list_occupations)
                .post(occupation::create_occupation)
                .push(
                    Router::with_path("{id}")
                        .get(occupation::get_occupation)
                        .put(occupation::update_occupation)
                        .delete(occupation::delete_occupation),
                ),
        )
        .push(
            Router::with_path("professions")
                .get(profession::list_professions)
                .post(profession::create_profession)
                .push(
                    Router::with_path("{id}")
                        .get(profession::get_profession)
                        .put(profession::update_profession)
                        .delete(profession::delete_profession),
                ),
        )
        .push(
            Router::with_path("relative-types")
                .get(relative_type::list_relative_types)
                .post(relative_type::create_relative_type)
                .push(
                    Router::with_path("{id}")
                        .get(relative_type::get_relative_type)
                        .put(relative_type::update_relative_type)
                        .delete(relative_type::delete_relative_type),
                ),
        )
        .push(
            Router::with_path("religions")
                .get(religion::list_religions)
                .post(religion::create_religion)
                .push(
                    Router::with_path("{id}")
                        .get(religion::get_religion)
                        .put(religion::update_religion)
                        .delete(religion::delete_religion),
                ),
        );

    let doc = OpenApi::new("Person Reference API", "1.0.0").merge_router(&ref_router);

    Router::new()
        .push(ref_router)
        .push(doc.into_router("api-docs/openapi.json"))
        .push(SwaggerUi::new("api-docs/openapi.json").into_router("swagger-ui"))
}

pub fn docs() -> OpenApi {
    let ref_router = Router::with_path("reference");
    OpenApi::new("Person Reference API", "1.0.0").merge_router(&ref_router)
}
