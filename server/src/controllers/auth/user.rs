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
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::auth::user as entity_mod;
use crate::config::jwt::{create_token, JwtConfig};
use crate::jobs::email::EmailJob;
use apalis_redis::RedisStorage;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use apalis::prelude::Storage;
use chrono::Duration;

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
    let mut storage = depot.get_typed::<RedisStorage<EmailJob>>().map_err(|_| {
        StatusError::internal_server_error().brief("Redis storage missing")
    })?.clone();

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
    let verification_token = generate_random_token(32);
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
    let verify_url = format!("http://localhost:3000/auth/verify?token={}", verification_token);
    let job = EmailJob {
        to: payload.email.clone(),
        subject: "Welcome! Please verify your email".to_string(),
        body: format!("Please verify your email by clicking the following link:\n{}", verify_url),
    };

    storage.push(job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

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

    let user_resp = UserResponse {
        id: user.id,
        pid: user.pid,
        email: user.email.clone(),
        password: "".to_string(),
        api_key: user.api_key.clone(),
        name: user.name.clone(),
        individual_id: user.individual_id,
        is_active: user.is_active,
        current_role_id: user.current_role_id,
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

    let user_resp = UserResponse {
        id: user.id,
        pid: user.pid,
        email: user.email.clone(),
        password: "".to_string(),
        api_key: user.api_key.clone(),
        name: user.name.clone(),
        individual_id: user.individual_id,
        is_active: user.is_active,
        current_role_id: user.current_role_id,
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
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let mut storage = depot.get_typed::<RedisStorage<EmailJob>>().map_err(|_| {
        StatusError::internal_server_error().brief("Redis storage missing")
    })?.clone();

    let payload: ForgotPasswordRequest = req.parse_json().await.map_err(|e| {
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
        let reset_token = generate_random_token(32);
        let now = Utc::now().naive_utc();

        let mut active_model = existing.into_active_model();
        active_model.reset_token = Set(Some(reset_token.clone()));
        active_model.reset_sent_at = Set(Some(now));
        active_model.updated_at = Set(now);

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let reset_url = format!("http://localhost:3000/auth/reset?token={}", reset_token);
        let job = EmailJob {
            to: payload.email.clone(),
            subject: "Password Reset Request".to_string(),
            body: format!("You requested a password reset. Click the link to reset your password:\n{}", reset_url),
        };

        storage.push(job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    }

    // Always return success even if email not found to prevent user enumeration
    Ok(Json(MessageResponse {
        message: "If an account with that email exists, a password reset link has been sent.".to_string(),
    }))
}

#[endpoint(tags("Auth - Reset Password"), status_codes(200, 400, 500))]
pub async fn reset_password(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
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

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
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
    }))
}

#[endpoint(tags("Auth - Resend Verification"), status_codes(200, 400, 500))]
pub async fn resend_verification_mail(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let mut storage = depot.get_typed::<RedisStorage<EmailJob>>().map_err(|_| {
        StatusError::internal_server_error().brief("Redis storage missing")
    })?.clone();

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

        let verification_token = generate_random_token(32);
        let now = Utc::now().naive_utc();

        let mut active_model = existing.into_active_model();
        active_model.email_verification_token = Set(Some(verification_token.clone()));
        active_model.email_verification_sent_at = Set(Some(now));
        active_model.updated_at = Set(now);

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let verify_url = format!("http://localhost:3000/auth/verify?token={}", verification_token);
        let job = EmailJob {
            to: payload.email.clone(),
            subject: "Verify your email".to_string(),
            body: format!("Please verify your email by clicking the following link:\n{}", verify_url),
        };

        storage.push(job).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    }

    Ok(Json(MessageResponse {
        message: "If an unverified account with that email exists, a verification link has been sent.".to_string(),
    }))
}

