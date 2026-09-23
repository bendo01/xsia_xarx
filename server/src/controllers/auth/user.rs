use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::auth::user::{
    CreateUserRequest, UserQuery, UserResponse, PaginatedUserResponse,
    UpdateUserRequest, RegisterRequest, LoginRequest, LoginResponse, SessionLoginResponse,
    ForgotPasswordRequest, ResetPasswordRequest, ResendVerificationRequest,
    AccountAcquisitionRequest, AccountAcquisitionResponse, ForgotPasswordResponse,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::auth::user as entity_mod;
use crate::models::auth::role as role_entity;
use crate::config::jwt::{create_token, JwtConfig};
use crate::jobs::email::{self, EmailJob};
use pgmq::PGMQueueExt;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use chrono::Duration;

pub async fn fetch_user_roles(db: &DatabaseConnection, user_id: Uuid) -> Vec<crate::dtos::auth::role::RoleResponse> {
    let roles = role_entity::Entity::find()
        .filter(role_entity::Column::UserId.eq(user_id))
        .filter(role_entity::Column::DeletedAt.is_null())
        .order_by_asc(role_entity::Column::CreatedAt)
        .all(db)
        .await
        .unwrap_or_default();

    roles.into_iter().map(|item| crate::dtos::auth::role::RoleResponse {
        id: item.id,
        name: item.name,
        user_id: item.user_id,
        position_type_id: item.position_type_id,
        roleable_id: item.roleable_id,
        roleable_type: item.roleable_type,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }).collect()
}

#[endpoint(tags("Auth -  - User"), status_codes(200, 500))]
pub async fn list_user(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedUserResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: UserQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            roles: None,
    }).collect();

    Ok(Json(PaginatedUserResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 404, 500))]
pub async fn get_user(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

    let user_roles = fetch_user_roles(db, item.id).await;

    Ok(Json(UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            roles: Some(user_roles),
    }))
}#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 500))]
pub async fn create_user(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateUserRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        pid: Set(payload.pid),
        email: Set(payload.email),
        password: Set(payload.password),
        api_key: Set(payload.api_key),
        name: Set(payload.name),
        individual_id: Set(payload.individual_id),
        is_active: Set(payload.is_active),
        current_role_id: Set(payload.current_role_id),
        reset_token: Set(payload.reset_token),
        reset_sent_at: Set(payload.reset_sent_at),
        email_verification_token: Set(payload.email_verification_token),
        email_verification_sent_at: Set(payload.email_verification_sent_at),
        email_verified_at: Set(payload.email_verified_at),
        magic_link_token: Set(payload.magic_link_token),
        magic_link_expiration: Set(payload.magic_link_expiration),
        created_at: Set(now),
        updated_at: Set(now),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            roles: None,
        }))
}

#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 404, 500))]
pub async fn update_user(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateUserRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(pid) = payload.pid {
            active_model.pid = Set(pid);
        }
    if let Some(email) = payload.email {
            active_model.email = Set(email);
        }
    if let Some(password) = payload.password {
            active_model.password = Set(password);
        }
    if let Some(api_key) = payload.api_key {
            active_model.api_key = Set(api_key);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(individual_id) = payload.individual_id {
            active_model.individual_id = Set(individual_id);
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(is_active);
        }
    if let Some(current_role_id) = payload.current_role_id {
            active_model.current_role_id = Set(Some(current_role_id));
        }
    if let Some(reset_token) = payload.reset_token {
            active_model.reset_token = Set(Some(reset_token));
        }
    if let Some(reset_sent_at) = payload.reset_sent_at {
            active_model.reset_sent_at = Set(Some(reset_sent_at));
        }
    if let Some(email_verification_token) = payload.email_verification_token {
            active_model.email_verification_token = Set(Some(email_verification_token));
        }
    if let Some(email_verification_sent_at) = payload.email_verification_sent_at {
            active_model.email_verification_sent_at = Set(Some(email_verification_sent_at));
        }
    if let Some(email_verified_at) = payload.email_verified_at {
            active_model.email_verified_at = Set(Some(email_verified_at));
        }
    if let Some(magic_link_token) = payload.magic_link_token {
            active_model.magic_link_token = Set(Some(magic_link_token));
        }
    if let Some(magic_link_expiration) = payload.magic_link_expiration {
            active_model.magic_link_expiration = Set(Some(magic_link_expiration));
        }
    active_model.updated_at = Set(now);

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            roles: None,
        }))
}
#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 404, 500))]
pub async fn delete_user(
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
            .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(now);

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "User deleted successfully".to_string(),
        }))
}

// ==============================================
// Authentication Endpoints
// ==============================================

fn generate_random_token(length: usize) -> String {
    thread_rng()
        .sample_iter(&Alphanumeric)
        .take(length)
        .map(char::from)
        .collect()
}

fn hash_password(password: &str) -> Result<String, StatusError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| StatusError::internal_server_error().brief(format!("Password hashing failed: {}", e)))?
        .to_string();
    Ok(password_hash)
}

fn verify_password(hash: &str, password: &str) -> Result<bool, StatusError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|_| StatusError::internal_server_error().brief("Invalid password hash format"))?;
    Ok(Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok())
}

#[endpoint(tags("Auth - Register"), status_codes(200, 400, 500))]
pub async fn register(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue service missing")
    })?;

    let payload: RegisterRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    // Check if user already exists
    let existing = entity_mod::Entity::find()
        .filter(entity_mod::Column::Email.eq(&payload.email))
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if existing.is_some() {
        return Err(StatusError::bad_request().brief("Email already in use"));
    }

    let hashed_password = hash_password(&payload.password)?;
    let verification_token = Uuid::new_v4().to_string();
    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();
    let new_pid = Uuid::new_v4();
    let api_key = generate_random_token(32);
    let individual_id = payload.individual_id.unwrap_or_else(Uuid::new_v4);

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        pid: Set(new_pid),
        email: Set(payload.email.clone()),
        password: Set(hashed_password),
        api_key: Set(api_key),
        name: Set(payload.name),
        individual_id: Set(individual_id),
        is_active: Set(false),
        current_role_id: Set(None),
        reset_token: Set(None),
        reset_sent_at: Set(None),
        email_verification_token: Set(Some(verification_token.clone())),
        email_verification_sent_at: Set(Some(now)),
        email_verified_at: Set(None),
        magic_link_token: Set(None),
        magic_link_expiration: Set(None),
        created_at: Set(now),
        updated_at: Set(now),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    // Send verification email via queue
    let job = EmailJob {
        to: payload.email.clone(),
        subject: "Welcome! Please verify your email".to_string(),
        body: format!("Please verify your email by entering the following token:\n{}", verification_token),
    };

    email::enqueue_email(queue, &job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Registration successful. Please check your email to verify your account.".to_string(),
    }))
}

#[endpoint(tags("Auth - Verify"), status_codes(200, 400, 500))]
pub async fn verify_email(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let token = req.param::<String>("token").ok_or_else(|| StatusError::bad_request().brief("Missing parameter token"))?;

    let existing = entity_mod::Entity::find()
        .filter(entity_mod::Column::EmailVerificationToken.eq(&token))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::bad_request().brief("Invalid or expired verification token"))?;

    let mut active_model = existing.into_active_model();
    let now = Utc::now().naive_utc();
    active_model.is_active = Set(true);
    active_model.email_verified_at = Set(Some(now));
    active_model.email_verification_token = Set(None);
    active_model.updated_at = Set(now);

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Email verified successfully. You may now login.".to_string(),
    }))
}

#[endpoint(tags("Auth - Login"), status_codes(200, 400, 401, 500))]
pub async fn login(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<LoginResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: LoginRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let user = entity_mod::Entity::find()
        .filter(entity_mod::Column::Email.eq(&payload.email))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::unauthorized().brief("Invalid email or password"))?;

    if !verify_password(&user.password, &payload.password)? {
        return Err(StatusError::unauthorized().brief("Invalid email or password"));
    }

    if !user.is_active {
        return Err(StatusError::unauthorized().brief("Account is not active or verified"));
    }

    let jwt_config = JwtConfig::from_env();
    let token = create_token(user.id, &jwt_config).map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let user_roles = fetch_user_roles(db, user.id).await;
    let mut current_role_id = user.current_role_id;
    if current_role_id.is_none() && !user_roles.is_empty() {
        current_role_id = Some(user_roles[0].id);
    }

    let user_resp = UserResponse {
        id: user.id,
        pid: user.pid,
        email: user.email.clone(),
        password: "".to_string(),
        api_key: user.api_key.clone(),
        name: user.name.clone(),
        individual_id: user.individual_id,
        is_active: user.is_active,
        current_role_id,
        reset_token: None,
        reset_sent_at: user.reset_sent_at,
        email_verification_token: None,
        email_verification_sent_at: user.email_verification_sent_at,
        email_verified_at: user.email_verified_at,
        magic_link_token: None,
        magic_link_expiration: user.magic_link_expiration,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deleted_at: user.deleted_at,
        created_by: user.created_by,
        updated_by: user.updated_by,
        roles: Some(user_roles),
    };

    Ok(Json(LoginResponse {
        token,
        user: user_resp,
    }))
}

#[endpoint(tags("Auth - Login with Session"), status_codes(200, 400, 401, 500))]
pub async fn login_with_session(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<Json<SessionLoginResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: LoginRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let user = entity_mod::Entity::find()
        .filter(entity_mod::Column::Email.eq(&payload.email))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::unauthorized().brief("Invalid email or password"))?;

    if !verify_password(&user.password, &payload.password)? {
        return Err(StatusError::unauthorized().brief("Invalid email or password"));
    }

    if !user.is_active {
        return Err(StatusError::unauthorized().brief("Account is not active or verified"));
    }

    let jwt_config = JwtConfig::from_env();
    let token = create_token(user.id, &jwt_config).map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let session_id = Uuid::new_v4().to_string();

    let cookie = salvo::http::cookie::Cookie::build(("session_id", session_id.clone()))
        .path("/")
        .http_only(true)
        .same_site(salvo::http::cookie::SameSite::Lax)
        .build();
    res.add_cookie(cookie);

    let user_roles = fetch_user_roles(db, user.id).await;
    let mut current_role_id = user.current_role_id;
    if current_role_id.is_none() && !user_roles.is_empty() {
        current_role_id = Some(user_roles[0].id);
    }

    let user_resp = UserResponse {
        id: user.id,
        pid: user.pid,
        email: user.email.clone(),
        password: "".to_string(),
        api_key: user.api_key.clone(),
        name: user.name.clone(),
        individual_id: user.individual_id,
        is_active: user.is_active,
        current_role_id,
        reset_token: None,
        reset_sent_at: user.reset_sent_at,
        email_verification_token: None,
        email_verification_sent_at: user.email_verification_sent_at,
        email_verified_at: user.email_verified_at,
        magic_link_token: None,
        magic_link_expiration: user.magic_link_expiration,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deleted_at: user.deleted_at,
        created_by: user.created_by,
        updated_by: user.updated_by,
        roles: Some(user_roles),
    };

    Ok(Json(SessionLoginResponse {
        session_id,
        token,
        user: user_resp,
        expires_in: 86400,
    }))
}

#[endpoint(tags("Auth - Forgot Password"), status_codes(200, 400, 500))]
pub async fn forgot_password(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ForgotPasswordResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue service missing")
    })?;

    let payload: ForgotPasswordRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let mut phone_number = payload.phone_number.clone();
    if phone_number.starts_with('0') {
        phone_number = format!("62{}", &phone_number[1..]);
    }

    let user = entity_mod::Entity::find()
        .filter(entity_mod::Column::Email.eq(&payload.email))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if let Some(existing) = user {
        let current_user_id = existing.id;
        let now = Utc::now().naive_utc();
        let mut final_role_id = existing.current_role_id;

        {
            let individual_id = existing.individual_id;
            // Check Student by individual_id
            let student = crate::models::academic::student::master::students::Entity::find()
                .filter(crate::models::academic::student::master::students::Column::IndividualId.eq(individual_id))
                .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            if let Some(student) = student {
                // Check/Create Position Type and Role
                let position_type = crate::models::institution::reference::position_type::Entity::find()
                    .filter(crate::models::institution::reference::position_type::Column::Name.eq("Mahasiswa"))
                    .filter(crate::models::institution::reference::position_type::Column::DeletedAt.is_null())
                    .one(db)
                    .await
                    .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

                if let Some(pt) = position_type {
                    let role_exists = role_entity::Entity::find()
                        .filter(role_entity::Column::UserId.eq(current_user_id))
                        .filter(role_entity::Column::RoleableType.eq("App\\Models\\Academic\\Student\\Master\\Student"))
                        .filter(role_entity::Column::RoleableId.eq(student.id))
                        .filter(role_entity::Column::PositionTypeId.eq(pt.id))
                        .filter(role_entity::Column::DeletedAt.is_null())
                        .one(db)
                        .await
                        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

                    let role_id = if let Some(role) = role_exists {
                        role.id
                    } else {
                        let role_active = role_entity::ActiveModel {
                            id: Set(Uuid::new_v4()),
                            name: Set("Mahasiswa".to_string()),
                            user_id: Set(Some(current_user_id)),
                            position_type_id: Set(Some(pt.id)),
                            roleable_id: Set(Some(student.id)),
                            roleable_type: Set(Some("App\\Models\\Academic\\Student\\Master\\Student".to_string())),
                            created_at: Set(now),
                            updated_at: Set(now),
                            deleted_at: Set(None),
                            sync_at: Set(None),
                            created_by: Set(None),
                            updated_by: Set(None),
                        };
                        let saved_role = role_active.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
                        saved_role.id
                    };
                    if final_role_id.is_none() {
                        final_role_id = Some(role_id);
                    }
                }
            }

            // Check Lecturer by individual_id
            let lecturer = crate::models::academic::lecturer::master::lecturers::Entity::find()
                .filter(crate::models::academic::lecturer::master::lecturers::Column::IndividualId.eq(individual_id))
                .filter(crate::models::academic::lecturer::master::lecturers::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            if let Some(lecturer) = lecturer {
                let position_type = crate::models::institution::reference::position_type::Entity::find()
                    .filter(crate::models::institution::reference::position_type::Column::Name.eq("Dosen"))
                    .filter(crate::models::institution::reference::position_type::Column::DeletedAt.is_null())
                    .one(db)
                    .await
                    .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

                if let Some(pt) = position_type {
                    let role_exists = role_entity::Entity::find()
                        .filter(role_entity::Column::UserId.eq(current_user_id))
                        .filter(role_entity::Column::RoleableType.eq("App\\Models\\Academic\\Lecturer\\Master\\Lecturer"))
                        .filter(role_entity::Column::RoleableId.eq(lecturer.id))
                        .filter(role_entity::Column::PositionTypeId.eq(pt.id))
                        .filter(role_entity::Column::DeletedAt.is_null())
                        .one(db)
                        .await
                        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

                    let role_id = if let Some(role) = role_exists {
                        role.id
                    } else {
                        let role_active = role_entity::ActiveModel {
                            id: Set(Uuid::new_v4()),
                            name: Set("Dosen".to_string()),
                            user_id: Set(Some(current_user_id)),
                            position_type_id: Set(Some(pt.id)),
                            roleable_id: Set(Some(lecturer.id)),
                            roleable_type: Set(Some("App\\Models\\Academic\\Lecturer\\Master\\Lecturer".to_string())),
                            created_at: Set(now),
                            updated_at: Set(now),
                            deleted_at: Set(None),
                            sync_at: Set(None),
                            created_by: Set(None),
                            updated_by: Set(None),
                        };
                        let saved_role = role_active.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
                        saved_role.id
                    };
                    if final_role_id.is_none() {
                        final_role_id = Some(role_id);
                    }
                }
            }

            // Check Staff by individual_id
            let employee = crate::models::institution::master::employees::Entity::find()
                .filter(crate::models::institution::master::employees::Column::IndividualId.eq(individual_id))
                .filter(crate::models::institution::master::employees::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            if let Some(employee) = employee {
                let staff = crate::models::institution::master::staffes::Entity::find()
                    .filter(crate::models::institution::master::staffes::Column::EmployeeId.eq(employee.id))
                    .filter(crate::models::institution::master::staffes::Column::DeletedAt.is_null())
                    .one(db)
                    .await
                    .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

                if let Some(staff) = staff {
                    let position_type = crate::models::institution::reference::position_type::Entity::find()
                        .filter(crate::models::institution::reference::position_type::Column::Name.eq("Tendik"))
                        .filter(crate::models::institution::reference::position_type::Column::DeletedAt.is_null())
                        .one(db)
                        .await
                        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

                    if let Some(pt) = position_type {
                        let role_exists = role_entity::Entity::find()
                            .filter(role_entity::Column::UserId.eq(current_user_id))
                            .filter(role_entity::Column::RoleableType.eq("App\\Models\\Institution\\Master\\Staff"))
                            .filter(role_entity::Column::RoleableId.eq(staff.id))
                            .filter(role_entity::Column::PositionTypeId.eq(pt.id))
                            .filter(role_entity::Column::DeletedAt.is_null())
                            .one(db)
                            .await
                            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

                        let role_id = if let Some(role) = role_exists {
                            role.id
                        } else {
                            let role_active = role_entity::ActiveModel {
                                id: Set(Uuid::new_v4()),
                                name: Set("Tendik".to_string()),
                                user_id: Set(Some(current_user_id)),
                                position_type_id: Set(Some(pt.id)),
                                roleable_id: Set(Some(staff.id)),
                                roleable_type: Set(Some("App\\Models\\Institution\\Master\\Staff".to_string())),
                                created_at: Set(now),
                                updated_at: Set(now),
                                deleted_at: Set(None),
                                sync_at: Set(None),
                                created_by: Set(None),
                                updated_by: Set(None),
                            };
                            let saved_role = role_active.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
                            saved_role.id
                        };
                        if final_role_id.is_none() {
                            final_role_id = Some(role_id);
                        }
                    }
                }
            }

            // Find Phone Type with code 1
            let phone_type = crate::models::contact::reference::phone_types::Entity::find()
                .filter(crate::models::contact::reference::phone_types::Column::Code.eq(1))
                .filter(crate::models::contact::reference::phone_types::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let phone_type_id = phone_type.map(|pt| pt.id);

            // Save phone number if not exists
            let phone_exists = crate::models::contact::master::phones::Entity::find()
                .filter(crate::models::contact::master::phones::Column::PhoneNumber.eq(&phone_number))
                .filter(crate::models::contact::master::phones::Column::PhoneableType.eq("App\\Models\\Person\\Master\\Individual"))
                .filter(crate::models::contact::master::phones::Column::PhoneableId.eq(individual_id))
                .filter(crate::models::contact::master::phones::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            if phone_exists.is_none() {
                let phone_active = crate::models::contact::master::phones::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    phone_number: Set(phone_number.clone()),
                    phone_type_id: Set(phone_type_id),
                    phoneable_id: Set(individual_id),
                    phoneable_type: Set("App\\Models\\Person\\Master\\Individual".to_string()),
                    created_at: Set(Some(now)),
                    updated_at: Set(Some(now)),
                    deleted_at: Set(None),
                    sync_at: Set(None),
                    created_by: Set(None),
                    updated_by: Set(None),
                };
                phone_active.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
            }
        }

        let reset_token = Uuid::new_v4().to_string();
        
        let mut active_model = existing.into_active_model();
        active_model.reset_token = Set(Some(reset_token.clone()));
        active_model.reset_sent_at = Set(Some(now));
        active_model.current_role_id = Set(final_role_id);
        active_model.updated_at = Set(now);

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let job = EmailJob {
            to: payload.email.clone(),
            subject: "Password Reset Request".to_string(),
            body: format!("You requested a password reset. Use the following token to reset your password:\n{}", reset_token),
        };

        email::enqueue_email(queue, &job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let wa_text = format!("You requested a password reset. Use the following token to reset your password:\n{}", reset_token);
        
        let wa_config = crate::config::openwa::OpenwaConfig::from_env();
        let wa_sender = crate::services::messenger::openwa::OpenWaSender::new(wa_config);
        if let Err(e) = wa_sender.send_message(&phone_number, &wa_text).await {
            tracing::error!("Failed to send WA message: {}", e);
        }

        let wa_link = format!("https://wa.me/{}?text={}", phone_number, urlencoding::encode(&wa_text));

        return Ok(Json(ForgotPasswordResponse {
            wa_link,
            message: "Password reset link has been sent to your email.".to_string(),
        }));
    }

    // Always return success even if email not found to prevent user enumeration? Wait, they provided NIK and Student Code. 
    // It's probably better to just return the same generic message but without wa_link.
    // Or return an error. Let's return a generic 400 since they must have an account.
    Err(StatusError::bad_request().brief("User not found"))
}

#[endpoint(tags("Auth - Reset Password"), status_codes(200, 400, 500))]
pub async fn reset_password(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ForgotPasswordResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue service missing")
    })?;

    let payload: ResetPasswordRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find()
        .filter(entity_mod::Column::ResetToken.eq(&payload.token))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::bad_request().brief("Invalid or expired reset token"))?;

    if let Some(sent_at) = existing.reset_sent_at {
        let now = Utc::now().naive_utc();
        let diff = now - sent_at;
        if diff > Duration::hours(1) {
            return Err(StatusError::bad_request().brief("Reset token expired"));
        }
    }

    let hashed_password = hash_password(&payload.new_password)?;
    let now = Utc::now().naive_utc();

    let mut active_model = existing.into_active_model();
    active_model.password = Set(hashed_password);
    active_model.reset_token = Set(None);
    active_model.reset_sent_at = Set(None);
    active_model.updated_at = Set(now);

    let updated_user = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    // Send email notification
    let job = EmailJob {
        to: updated_user.email.clone(),
        subject: "Password Reset Successful".to_string(),
        body: "Your password has been successfully reset. If you did not perform this action, please contact support immediately.".to_string(),
    };
    email::enqueue_email(queue, &job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    // Get phone number to create WA link
    let phone = crate::models::contact::master::phones::Entity::find()
        .filter(crate::models::contact::master::phones::Column::PhoneableType.eq("App\\Models\\Person\\Master\\Individual"))
        .filter(crate::models::contact::master::phones::Column::PhoneableId.eq(updated_user.individual_id))
        .filter(crate::models::contact::master::phones::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let wa_link = if let Some(p) = phone {
        let wa_text = "Your password has been successfully reset.";
        let wa_config = crate::config::openwa::OpenwaConfig::from_env();
        let wa_sender = crate::services::messenger::openwa::OpenWaSender::new(wa_config);
        if let Err(e) = wa_sender.send_message(&p.phone_number, wa_text).await {
            tracing::error!("Failed to send WA message: {}", e);
        }
        format!("https://wa.me/{}?text={}", p.phone_number, urlencoding::encode(wa_text))
    } else {
        "".to_string()
    };

    Ok(Json(ForgotPasswordResponse {
        wa_link,
        message: "Password has been successfully reset. You can now login.".to_string(),
    }))
}

#[endpoint(tags("Auth - Current User"), status_codes(200, 401, 500))]
pub async fn current_user(
    depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let current_user_id = depot.get::<Uuid>("current_user_id").copied().map_err(|_| {
        StatusError::unauthorized().brief("Unauthorized")
    })?;

    let item = entity_mod::Entity::find_by_id(current_user_id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

    let user_roles = fetch_user_roles(db, item.id).await;

    Ok(Json(UserResponse {
        id: item.id,
        pid: item.pid,
        email: item.email.clone(),
        password: "".to_string(),
        api_key: item.api_key.clone(),
        name: item.name.clone(),
        individual_id: item.individual_id,
        is_active: item.is_active,
        current_role_id: item.current_role_id,
        reset_token: None,
        reset_sent_at: item.reset_sent_at,
        email_verification_token: None,
        email_verification_sent_at: item.email_verification_sent_at,
        email_verified_at: item.email_verified_at,
        magic_link_token: None,
        magic_link_expiration: item.magic_link_expiration,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        roles: Some(user_roles),
    }))
}

#[endpoint(tags("Auth - Set Current Role"), status_codes(200, 400, 401, 403, 404, 500))]
pub async fn set_current_role(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let current_user_id = depot.get::<Uuid>("current_user_id").copied().map_err(|_| {
        StatusError::unauthorized().brief("Unauthorized")
    })?;

    let role_id_str = req.param::<String>("role_id").ok_or_else(|| {
        StatusError::bad_request().brief("Missing parameter role_id")
    })?;
    let role_id = Uuid::parse_str(&role_id_str).map_err(|_| {
        StatusError::bad_request().brief("Invalid UUID format for role_id")
    })?;

    // Verify role belongs to user
    let user_role = role_entity::Entity::find_by_id(role_id)
        .filter(role_entity::Column::UserId.eq(current_user_id))
        .filter(role_entity::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::forbidden().brief("Role does not belong to the current user"))?;

    let user = entity_mod::Entity::find_by_id(current_user_id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

    let mut active_model = user.into_active_model();
    active_model.current_role_id = Set(Some(user_role.id));
    active_model.updated_at = Set(Utc::now().naive_utc());

    let updated_user = active_model.update(db).await.map_err(|e| {
        StatusError::internal_server_error().brief(e.to_string())
    })?;

    let user_roles = fetch_user_roles(db, updated_user.id).await;

    Ok(Json(UserResponse {
        id: updated_user.id,
        pid: updated_user.pid,
        email: updated_user.email,
        password: "".to_string(),
        api_key: updated_user.api_key,
        name: updated_user.name,
        individual_id: updated_user.individual_id,
        is_active: updated_user.is_active,
        current_role_id: updated_user.current_role_id,
        reset_token: None,
        reset_sent_at: updated_user.reset_sent_at,
        email_verification_token: None,
        email_verification_sent_at: updated_user.email_verification_sent_at,
        email_verified_at: updated_user.email_verified_at,
        magic_link_token: None,
        magic_link_expiration: updated_user.magic_link_expiration,
        created_at: updated_user.created_at,
        updated_at: updated_user.updated_at,
        deleted_at: updated_user.deleted_at,
        created_by: updated_user.created_by,
        updated_by: updated_user.updated_by,
        roles: Some(user_roles),
    }))
}

#[endpoint(tags("Auth - Resend Verification"), status_codes(200, 400, 500))]
pub async fn resend_verification_token(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue service missing")
    })?;

    let payload: ResendVerificationRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let user = entity_mod::Entity::find()
        .filter(entity_mod::Column::Email.eq(&payload.email))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if let Some(existing) = user {
        if existing.is_active {
            return Err(StatusError::bad_request().brief("Account is already verified"));
        }

        let verification_token = Uuid::new_v4().to_string();
        let now = Utc::now().naive_utc();

        let mut active_model = existing.into_active_model();
        active_model.email_verification_token = Set(Some(verification_token.clone()));
        active_model.email_verification_sent_at = Set(Some(now));
        active_model.updated_at = Set(now);

        let updated_user = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let wa_text = format!("Please verify your email by entering the following token:\n{}", verification_token);
        let job = EmailJob {
            to: payload.email.clone(),
            subject: "Verify your email".to_string(),
            body: wa_text.clone(),
        };

        email::enqueue_email(queue, &job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        {
            let individual_id = updated_user.individual_id;
            let phone = crate::models::contact::master::phones::Entity::find()
                .filter(crate::models::contact::master::phones::Column::PhoneableType.eq("App\\Models\\Person\\Master\\Individual"))
                .filter(crate::models::contact::master::phones::Column::PhoneableId.eq(individual_id))
                .filter(crate::models::contact::master::phones::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            if let Some(p) = phone {
                let wa_config = crate::config::openwa::OpenwaConfig::from_env();
                let wa_sender = crate::services::messenger::openwa::OpenWaSender::new(wa_config);
                if let Err(e) = wa_sender.send_message(&p.phone_number, &wa_text).await {
                    tracing::error!("Failed to send WA message: {}", e);
                }
            }
        }
    }

    Ok(Json(MessageResponse {
        message: "If an unverified account with that email exists, a verification link has been sent.".to_string(),
    }))
}

#[endpoint(tags("Auth - Account Acquisition"), status_codes(200, 400, 404, 500))]
pub async fn account_acquisition(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AccountAcquisitionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue service missing")
    })?;

    let payload: AccountAcquisitionRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    // 1. Check Individual by nik
    let individual = crate::models::person::master::individual::Entity::find()
        .filter(crate::models::person::master::individual::Column::Code.eq(&payload.nik))
        .filter(crate::models::person::master::individual::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Individual not found"))?;

    // 2. Check Student by student_code
    let student = crate::models::academic::student::master::students::Entity::find()
        .filter(crate::models::academic::student::master::students::Column::Code.eq(&payload.student_code))
        .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

    // 3. Verify Student belongs to Individual
    if student.individual_id != individual.id {
        return Err(StatusError::bad_request().brief("Student does not match the provided Individual"));
    }

    // 4. Verify Student unit belongs to the specified institution
    let unit = crate::models::institution::master::units::Entity::find_by_id(student.unit_id)
        .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Unit not found for student"))?;

    if unit.institution_id != payload.institution_id {
        return Err(StatusError::bad_request().brief("Student does not belong to the specified institution"));
    }

    // 5. Look up User by email
    let existing_user = entity_mod::Entity::find()
        .filter(entity_mod::Column::Email.eq(&payload.email))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if existing_user.is_some() {
        return Err(StatusError::bad_request().brief("Akun anda sudah ada gunakan fasilitas ubah kata sandi untuk masuk atau hubungi administrator anda jikalau ada kendala"));
    }

    let now = Utc::now().naive_utc();
    let hashed_password = hash_password(&payload.password)?;
    
    let new_id = Uuid::new_v4();
    let new_pid = Uuid::new_v4();
    let api_key = generate_random_token(32);

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        pid: Set(new_pid),
        email: Set(payload.email.clone()),
        password: Set(hashed_password),
        api_key: Set(api_key),
        name: Set(individual.name.clone()),
        individual_id: Set(individual.id),
        is_active: Set(true),
        current_role_id: Set(None),
        reset_token: Set(None),
        reset_sent_at: Set(None),
        email_verification_token: Set(None),
        email_verification_sent_at: Set(None),
        email_verified_at: Set(Some(now)),
        magic_link_token: Set(None),
        magic_link_expiration: Set(None),
        created_at: Set(now),
        updated_at: Set(now),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let saved = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let current_user_id = saved.id;

    // 6. Get position type
    let position_type = crate::models::institution::reference::position_type::Entity::find()
        .filter(crate::models::institution::reference::position_type::Column::Name.eq("Mahasiswa"))
        .filter(crate::models::institution::reference::position_type::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Position type not found"))?;

    // 7. Check/Create Student Role
    let role_exists = role_entity::Entity::find()
        .filter(role_entity::Column::UserId.eq(current_user_id))
        .filter(role_entity::Column::RoleableType.eq("App\\Models\\Academic\\Student\\Master\\Student"))
        .filter(role_entity::Column::RoleableId.eq(student.id))
        .filter(role_entity::Column::PositionTypeId.eq(position_type.id))
        .filter(role_entity::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if role_exists.is_none() {
        let role_active = role_entity::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set("Mahasiswa".to_string()),
            user_id: Set(Some(current_user_id)),
            position_type_id: Set(Some(position_type.id)),
            roleable_id: Set(Some(student.id)),
            roleable_type: Set(Some("App\\Models\\Academic\\Student\\Master\\Student".to_string())),
            created_at: Set(now),
            updated_at: Set(now),
            deleted_at: Set(None),
            sync_at: Set(None),
            created_by: Set(None),
            updated_by: Set(None),
        };
        role_active.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    }

    // 8. Save phone number if not exists
    let phone_exists = crate::models::contact::master::phones::Entity::find()
        .filter(crate::models::contact::master::phones::Column::PhoneNumber.eq(&payload.phone_number))
        .filter(crate::models::contact::master::phones::Column::PhoneableType.eq("App\\Models\\Person\\Master\\Individual"))
        .filter(crate::models::contact::master::phones::Column::PhoneableId.eq(individual.id))
        .filter(crate::models::contact::master::phones::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if phone_exists.is_none() {
        let phone_active = crate::models::contact::master::phones::ActiveModel {
            id: Set(Uuid::new_v4()),
            phone_number: Set(payload.phone_number.clone()),
            phone_type_id: Set(None),
            phoneable_id: Set(individual.id),
            phoneable_type: Set("App\\Models\\Person\\Master\\Individual".to_string()),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            deleted_at: Set(None),
            sync_at: Set(None),
            created_by: Set(None),
            updated_by: Set(None),
        };
        phone_active.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    }

    // 9. Send email and open WA
    let job = EmailJob {
        to: payload.email.clone(),
        subject: "Account Acquisition Successful".to_string(),
        body: "Your account has been successfully created. You can now login.".to_string(),
    };

    email::enqueue_email(queue, &job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let wa_text = "Your account has been successfully created.";
    let wa_config = crate::config::openwa::OpenwaConfig::from_env();
    let wa_sender = crate::services::messenger::openwa::OpenWaSender::new(wa_config);
    if let Err(e) = wa_sender.send_message(&payload.phone_number, wa_text).await {
        tracing::error!("Failed to send WA message: {}", e);
    }

    let wa_link = format!("https://wa.me/{}?text={}", payload.phone_number, urlencoding::encode(wa_text));

    Ok(Json(AccountAcquisitionResponse { 
        wa_link,
        message: "Akun berhasil dibuat.".to_string()
    }))
}

