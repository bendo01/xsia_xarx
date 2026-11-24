use super::user::{LoginResponse, User};

/// The authenticated session. Kept in memory only for now.
#[derive(Debug, Clone)]
pub struct Session {
    pub token: String,
    pub user: User,
}

impl Session {
    /// Name of the role the user is currently acting as, if known.
    pub fn active_role_name(&self) -> Option<&str> {
        let current = self.user.current_role_id.as_deref()?;
        self.user
            .roles
            .iter()
            .find(|r| r.id == current)
            .map(|r| r.name.as_str())
    }
}

impl From<LoginResponse> for Session {
    fn from(r: LoginResponse) -> Self {
        Self { token: r.token, user: r.user }
    }
}
