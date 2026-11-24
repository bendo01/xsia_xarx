use crate::controllers::AuthController;
use crate::views::password_field::{PasswordField, Submit};
use gpui::{AppContext, 
    App, Context, Entity, FontWeight, Subscription, Window, colors::Colors, div, prelude::*, px,
    rgb_to_hsla,
};
use gpui_ce_elements::editable_text::{EditableTextState, StringStorage, text_input};

pub struct LoginView {
    auth: Entity<AuthController>,
    email: Entity<EditableTextState>,
    password: Entity<PasswordField>,
    _subs: Vec<Subscription>,
}

impl LoginView {
    pub fn new(auth: Entity<AuthController>, cx: &mut Context<Self>) -> Self {
        let email = cx.new(|cx| EditableTextState::new(StringStorage::default(), cx));
        let password = cx.new(PasswordField::new);
        let subs = vec![
            cx.observe(&auth, |_, _, cx| cx.notify()),
            cx.subscribe(&password, |this, _, _: &Submit, cx| this.submit(cx)),
        ];
        Self { auth, email, password, _subs: subs }
    }

    fn submit(&mut self, cx: &mut Context<Self>) {
        let email = self.email.read(cx).as_str().to_string();
        let password = self.password.read(cx).value().to_string();
        self.auth.update(cx, |a, cx| a.login(email, password, cx));
    }
}

impl Render for LoginView {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl gpui::IntoElement {
        let colors = Colors::for_appearance(window);
        let state = self.auth.read(cx).state.clone();

        let mut card = div()
            .w_full()
            .max_w(px(420.))
            .p_8()
            .flex()
            .flex_col()
            .gap_4()
            .rounded_lg()
            .border_1()
            .border_color(colors.border)
            .bg(colors.container)
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap_1()
                    .child(div().text_2xl().font_weight(FontWeight::BOLD).child("Masuk"))
                    .child(
                        div()
                            .text_sm()
                            .text_color(colors.disabled)
                            .child("Sistem Informasi Akademik"),
                    ),
            );

        if let Some(err) = state.error.clone() {
            card = card.child(
                div()
                    .id("login-error")
                    .flex()
                    .items_center()
                    .gap_2()
                    .p_3()
                    .rounded_md()
                    .border_1()
                    .border_color(gpui::red())
                    .text_sm()
                    .text_color(gpui::red())
                    .child(div().flex_1().child(err))
                    .child(div().id("dismiss").cursor_pointer().child("✕").on_click(
                        cx.listener(|this, _, _, cx| {
                            this.auth.update(cx, |a, cx| a.dismiss_error(cx))
                        }),
                    )),
            );
        }

        card.child(
            div()
                .flex()
                .flex_col()
                .gap_1()
                .child(div().text_sm().child("Email"))
                .child(
                    text_input("login-email")
                        .state(self.email.downgrade())
                        .placeholder("nama@kampus.ac.id")
                        .placeholder_color(colors.disabled)
                        .caret_color(rgb_to_hsla(colors.text))
                        .caret_blink_interval_500ms()
                        .w_full()
                        .min_h_auto()
                        .max_h_auto()
                        .whitespace_nowrap()
                        .px_3()
                        .py_2()
                        .rounded_lg()
                        .border_1()
                        .border_color(colors.border)
                        .bg(colors.background),
                ),
        )
        .child(
            div()
                .flex()
                .flex_col()
                .gap_1()
                .child(div().text_sm().child("Kata sandi"))
                .child(self.password.clone()),
        )
        .child(
            div()
                .id("login-submit")
                .flex()
                .justify_center()
                .px_4()
                .py_2()
                .rounded_lg()
                .bg(colors.selected)
                .text_color(colors.selected_text)
                .when(state.loading, |d| d.opacity(0.6))
                .when(!state.loading, |d| {
                    d.cursor_pointer()
                        .hover(|s| s.opacity(0.9))
                        .on_click(cx.listener(|this, _, _, cx| this.submit(cx)))
                })
                .child(if state.loading { "Memproses..." } else { "Masuk" }),
        )
        .into_centered(colors)
    }
}

/// Wraps a card in a full-window centered container.
trait IntoCentered: gpui::IntoElement + Sized {
    fn into_centered(self, colors: Colors) -> gpui::Div {
        div()
            .size_full()
            .flex()
            .items_center()
            .justify_center()
            .p_6()
            .bg(colors.background)
            .text_color(colors.text)
            .child(self)
    }
}
impl<T: gpui::IntoElement> IntoCentered for T {}

#[allow(unused)]
fn _app(_: &App) {}
