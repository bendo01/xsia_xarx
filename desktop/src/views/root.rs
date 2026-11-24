use crate::controllers::{AppController, AuthController, Route};
use crate::views::{dashboard::DashboardView, login::LoginView};
use gpui::{AnyView, Context, Entity, Subscription, Window, div, prelude::*};

/// Picks the view that matches `AppController::route`. Screens are rebuilt on navigation,
/// so a sign-out always returns to a clean login form.
pub struct RootView {
    app: Entity<AppController>,
    current: AnyView,
    shown: Route,
    _sub: Subscription,
}

impl RootView {
    pub fn new(cx: &mut Context<Self>) -> Self {
        let app = cx.new(|_| AppController::new());
        let sub = cx.observe(&app, |this, _, cx| {
            this.sync(cx);
            cx.notify();
        });
        let current = Self::build(Route::Login, &app, cx);
        Self { app, current, shown: Route::Login, _sub: sub }
    }

    fn build(route: Route, app: &Entity<AppController>, cx: &mut Context<Self>) -> AnyView {
        match route {
            Route::Login => {
                let auth = cx.new(|_| AuthController::new(app.clone()));
                cx.new(|cx| LoginView::new(auth, cx)).into()
            }
            Route::Dashboard => cx.new(|cx| DashboardView::new(app.clone(), cx)).into(),
        }
    }

    fn sync(&mut self, cx: &mut Context<Self>) {
        let route = self.app.read(cx).route;
        if route != self.shown {
            self.current = Self::build(route, &self.app, cx);
            self.shown = route;
        }
    }
}

impl Render for RootView {
    fn render(&mut self, _w: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        div().size_full().child(self.current.clone())
    }
}
