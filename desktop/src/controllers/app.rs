use crate::models::Session;
use gpui::Context;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Route {
    Login,
    Dashboard,
}

/// Owns navigation and the current session.
pub struct AppController {
    pub route: Route,
    pub session: Option<Session>,
}

impl AppController {
    pub fn new() -> Self {
        Self { route: Route::Login, session: None }
    }

    pub fn sign_in(&mut self, session: Session, cx: &mut Context<Self>) {
        self.session = Some(session);
        self.route = Route::Dashboard;
        cx.notify();
    }

    pub fn sign_out(&mut self, cx: &mut Context<Self>) {
        self.session = None;
        self.route = Route::Login;
        cx.notify();
    }
}
