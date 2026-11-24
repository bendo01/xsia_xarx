use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct Role {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub name: String,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct User {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub email: String,
    #[serde(default)]
    pub current_role_id: Option<String>,
    #[serde(default)]
    pub individual_id: Option<String>,
    #[serde(default)]
    pub roles: Vec<Role>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    #[serde(default)]
    pub user: User,
}
