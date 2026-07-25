use salvo::oapi::OpenApi;
use salvo::oapi::swagger_ui::SwaggerUi;
use salvo::prelude::*;

pub mod age_classification;
pub mod blood_type;
pub mod dto;
pub mod eye_color;
pub mod gender;
pub mod hair_color;
pub mod hair_type;
pub mod identification_type;
pub mod income;
pub mod marital_status;
pub mod occupation;
pub mod profession;
pub mod relative_type;
pub mod religion;

#[macro_export]
macro_rules! impl_reference_controller {
    (
                $entity_path:path,
        $tag:expr,
        $item_name:expr,
        $list_fn:ident,
        $get_fn:ident,
        $create_fn:ident,
        $update_fn:ident,
        $delete_fn:ident
    ) => {
        use chrono::Utc;
        use salvo::prelude::*;
        use sea_orm::{
            ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
            PaginatorTrait, QueryFilter, QueryOrder, Set,
        };
        use uuid::Uuid;
        use validator::Validate;

        use $crate::controllers::person::reference::dto::{
            CreateReferenceRequest, MessageResponse, PaginatedReferenceResponse, ReferenceQuery,
            ReferenceResponse, UpdateReferenceRequest,
        };
        use $entity_path as entity_mod;

        #[endpoint(tags($tag), status_codes(200, 500))]
        pub async fn $list_fn(
            req: &mut Request,
            depot: &mut Depot,
        ) -> Result<Json<PaginatedReferenceResponse>, StatusError> {
            let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
                StatusError::internal_server_error().brief("Database connection missing")
            })?;

            let query: ReferenceQuery = req.parse_queries().unwrap_or_default();
            let page = query.page.unwrap_or(1);
            let page_size = query.page_size.unwrap_or(10);

            let mut select =
                entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

            if let Some(ref name) = query.name {
                select = select.filter(entity_mod::Column::Name.contains(name));
            }
            if let Some(code) = query.code {
                select = select.filter(entity_mod::Column::Code.eq(code));
            }

            let paginator = select
                .order_by_asc(entity_mod::Column::Code)
                .paginate(db, page_size);

            let total = paginator
                .num_items()
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let total_pages = (total as f64 / page_size as f64).ceil() as u64;

            let items = paginator
                .fetch_page(page.saturating_sub(1))
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

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

            Ok(Json(PaginatedReferenceResponse {
                data,
                total,
                page,
                page_size,
                total_pages,
            }))
        }

        #[endpoint(tags($tag), status_codes(200, 400, 404, 500))]
        pub async fn $get_fn(
            req: &mut Request,
            depot: &mut Depot,
        ) -> Result<Json<ReferenceResponse>, StatusError> {
            let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
                StatusError::internal_server_error().brief("Database connection missing")
            })?;

            let id_str = req
                .param::<String>("id")
                .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;

            let id = Uuid::parse_str(&id_str)
                .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

            let item = entity_mod::Entity::find_by_id(id)
                .filter(entity_mod::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
                .ok_or_else(|| {
                    StatusError::not_found().brief(format!("{} not found", $item_name))
                })?;

            Ok(Json(ReferenceResponse {
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
            }))
        }

        #[endpoint(tags($tag), status_codes(200, 400, 500))]
        pub async fn $create_fn(
            req: &mut Request,
            depot: &mut Depot,
        ) -> Result<Json<ReferenceResponse>, StatusError> {
            let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
                StatusError::internal_server_error().brief("Database connection missing")
            })?;

            let payload: CreateReferenceRequest = req.parse_json().await.map_err(|e| {
                StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
            })?;

            payload
                .validate()
                .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

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

            let item = active_model
                .insert(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            Ok(Json(ReferenceResponse {
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
            }))
        }

        #[endpoint(tags($tag), status_codes(200, 400, 404, 500))]
        pub async fn $update_fn(
            req: &mut Request,
            depot: &mut Depot,
        ) -> Result<Json<ReferenceResponse>, StatusError> {
            let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
                StatusError::internal_server_error().brief("Database connection missing")
            })?;

            let id_str = req
                .param::<String>("id")
                .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;

            let id = Uuid::parse_str(&id_str)
                .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

            let payload: UpdateReferenceRequest = req.parse_json().await.map_err(|e| {
                StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
            })?;

            payload
                .validate()
                .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

            let existing = entity_mod::Entity::find_by_id(id)
                .filter(entity_mod::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
                .ok_or_else(|| {
                    StatusError::not_found().brief(format!("{} not found", $item_name))
                })?;

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

            let item = active_model
                .update(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            Ok(Json(ReferenceResponse {
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
            }))
        }

        #[endpoint(tags($tag), status_codes(200, 400, 404, 500))]
        pub async fn $delete_fn(
            req: &mut Request,
            depot: &mut Depot,
        ) -> Result<Json<MessageResponse>, StatusError> {
            let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
                StatusError::internal_server_error().brief("Database connection missing")
            })?;

            let id_str = req
                .param::<String>("id")
                .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;

            let id = Uuid::parse_str(&id_str)
                .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

            let existing = entity_mod::Entity::find_by_id(id)
                .filter(entity_mod::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
                .ok_or_else(|| {
                    StatusError::not_found().brief(format!("{} not found", $item_name))
                })?;

            let now = Utc::now().naive_utc();
            let mut active_model = existing.into_active_model();
            active_model.deleted_at = Set(Some(now));
            active_model.updated_at = Set(now);

            active_model
                .update(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            Ok(Json(MessageResponse {
                message: format!("{} deleted successfully", $item_name),
            }))
        }
    };
}

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
        .push(SwaggerUi::new("/api/v1/api-docs/openapi.json").into_router("swagger-ui"))
}

pub fn docs() -> OpenApi {
    let ref_router = Router::with_path("reference");
    OpenApi::new("Person Reference API", "1.0.0").merge_router(&ref_router)
}
