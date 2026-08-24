use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UserQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UserResponse {
    pub id: Uuid,
    pub pid: Uuid,
    pub email: String,
    pub password: String,
    pub api_key: String,
    pub name: String,
    pub individual_id: Uuid,
    pub is_active: bool,
    pub current_role_id: Option<Uuid>,
    pub reset_token: Option<String>,
    pub reset_sent_at: Option<NaiveDateTime>,
    pub email_verification_token: Option<String>,
    pub email_verification_sent_at: Option<NaiveDateTime>,
    pub email_verified_at: Option<NaiveDateTime>,
    pub magic_link_token: Option<String>,
    pub magic_link_expiration: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateUserRequest {
    pub pid: Uuid,
    pub email: String,
    pub password: String,
    pub api_key: String,
    pub name: String,
    pub individual_id: Uuid,
    pub is_active: bool,
    pub current_role_id: Option<Uuid>,
    pub reset_token: Option<String>,
    pub reset_sent_at: Option<NaiveDateTime>,
    pub email_verification_token: Option<String>,
    pub email_verification_sent_at: Option<NaiveDateTime>,
    pub email_verified_at: Option<NaiveDateTime>,
    pub magic_link_token: Option<String>,
    pub magic_link_expiration: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateUserRequest {
    pub pid: Option<Uuid>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub api_key: Option<String>,
    pub name: Option<String>,
    pub individual_id: Option<Uuid>,
    pub is_active: Option<bool>,
    pub current_role_id: Option<Uuid>,
    pub reset_token: Option<String>,
    pub reset_sent_at: Option<NaiveDateTime>,
    pub email_verification_token: Option<String>,
    pub email_verification_sent_at: Option<NaiveDateTime>,
    pub email_verified_at: Option<NaiveDateTime>,
    pub magic_link_token: Option<String>,
    pub magic_link_expiration: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedUserResponse {
    pub data: Vec<UserResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6))]
    pub password: String,
    pub name: String,
    pub individual_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SessionLoginResponse {
    pub session_id: String,
    pub token: String,
    pub user: UserResponse,
    pub expires_in: u64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct ForgotPasswordRequest {
    #[validate(email)]
    pub email: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct ResetPasswordRequest {
    pub token: String,
    #[validate(length(min = 6))]
    pub new_password: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct ResendVerificationRequest {
    #[validate(email)]
    pub email: String,
}
