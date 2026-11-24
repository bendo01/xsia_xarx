use crate::controllers::AppController;
use gpui::{Context, Entity, FontWeight, Subscription, Window, colors::Colors, div, prelude::*};

/// Empty dashboard: a header with the user name and a sign-out button.
pub struct DashboardView {
    app: Entity<AppController>,
    _sub: Subscription,
}

impl DashboardView {
    pub fn new(app: Entity<AppController>, cx: &mut Context<Self>) -> Self {
        let sub = cx.observe(&app, |_, _, cx| cx.notify());
        Self { app, _sub: sub }
    }
}

impl Render for DashboardView {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let colors = Colors::for_appearance(window);
        let (name, role) = match &self.app.read(cx).session {
            Some(s) => (
                s.user.name.clone(),
                s.active_role_name().unwrap_or("-").to_string(),
            ),
            None => (String::new(), String::new()),
        };

        div()
            .size_full()
            .flex()
            .flex_col()
            .bg(colors.background)
            .text_color(colors.text)
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_between()
                    .px_6()
                    .py_3()
                    .border_b_1()
                    .border_color(colors.border)
                    .child(div().text_lg().font_weight(FontWeight::SEMIBOLD).child("Dashboard"))
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap_3()
                            .child(
                                div()
                                    .flex()
                                    .flex_col()
                                    .items_end()
                                    .child(div().text_sm().child(name))
                                    .child(div().text_xs().text_color(colors.disabled).child(role)),
                            )
                            .child(
                                div()
                                    .id("sign-out")
                                    .px_3()
                                    .py_1()
                                    .rounded_lg()
                                    .border_1()
                                    .border_color(colors.border)
                                    .cursor_pointer()
                                    .hover(|s| s.opacity(0.8))
                                    .child("Keluar")
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.app.update(cx, |a, cx| a.sign_out(cx))
                                    })),
                            ),
                    ),
            )
            .child(div().flex_1())
    }
}
