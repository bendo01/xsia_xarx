use crate::controllers::AppController;
use crate::models::LoginRequest;
use crate::services::api;
use gpui::{AppContext, Context, Entity, Task};

#[derive(Debug, Clone, Default)]
pub struct AuthState {
    pub loading: bool,
    pub error: Option<String>,
}

/// Handles the login flow and reports the outcome to the `AppController`.
pub struct AuthController {
    pub state: AuthState,
    app: Entity<AppController>,
    task: Option<Task<()>>,
}

impl AuthController {
    pub fn new(app: Entity<AppController>) -> Self {
        Self { state: AuthState::default(), app, task: None }
    }

    pub fn dismiss_error(&mut self, cx: &mut Context<Self>) {
        self.state.error = None;
        cx.notify();
    }

    pub fn login(&mut self, email: String, password: String, cx: &mut Context<Self>) {
        if self.state.loading {
            return;
        }
        if email.trim().is_empty() || password.is_empty() {
            self.state.error = Some("Email dan kata sandi wajib diisi".into());
            cx.notify();
            return;
        }
        self.state = AuthState { loading: true, error: None };
        cx.notify();

        let req = LoginRequest { email, password };
        let app = self.app.clone();
        self.task = Some(cx.spawn(async move |this, cx| {
            let result = cx.background_spawn(async move { api::login(&req) }).await;
            this.update(cx, |this, cx| {
                this.state.loading = false;
                match result {
                    Ok(res) => app.update(cx, |app, cx| app.sign_in(res.into(), cx)),
                    Err(msg) => this.state.error = Some(msg),
                }
                cx.notify();
            })
            .ok();
        }));
    }
}
