//! Masked single-line input. gpui-ce's text input has no masking, so this is a minimal
//! one: typing, backspace, and paste (ctrl/cmd+v). No caret movement or selection.

use gpui::{
    ClipboardItem, Context, EventEmitter, FocusHandle, Focusable, IntoElement, KeyDownEvent,
    Render, Window, colors::Colors, div, prelude::*,
};

pub struct Submit;

pub struct PasswordField {
    value: String,
    visible: bool,
    focus: FocusHandle,
}

impl EventEmitter<Submit> for PasswordField {}

impl PasswordField {
    pub fn new(cx: &mut Context<Self>) -> Self {
        Self { value: String::new(), visible: false, focus: cx.focus_handle() }
    }

    pub fn value(&self) -> &str {
        &self.value
    }
}

impl Focusable for PasswordField {
    fn focus_handle(&self, _cx: &gpui::App) -> FocusHandle {
        self.focus.clone()
    }
}

impl Render for PasswordField {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let colors = Colors::for_appearance(window);
        let focused = self.focus.is_focused(window);
        let shown = if self.visible {
            self.value.clone()
        } else {
            "•".repeat(self.value.chars().count())
        };
        let empty = self.value.is_empty();

        div()
            .flex()
            .items_center()
            .gap_2()
            .w_full()
            .px_3()
            .py_2()
            .rounded_lg()
            .border_1()
            .border_color(if focused { colors.selected } else { colors.border })
            .bg(colors.container)
            .child(
                div()
                    .id("password-input")
                    .flex_1()
                    .track_focus(&self.focus)
                    .cursor_text()
                    .text_color(if empty { colors.disabled } else { colors.text })
                    .on_key_down(cx.listener(|this, ev: &KeyDownEvent, _w, cx| {
                        let ks = &ev.keystroke;
                        let m = &ks.modifiers;
                        match ks.key.as_str() {
                            "enter" => cx.emit(Submit),
                            "backspace" => {
                                this.value.pop();
                            }
                            "v" if m.control || m.platform => {
                                if let Some(text) = cx.read_from_clipboard().and_then(|c| c.text())
                                {
                                    this.value.push_str(text.lines().next().unwrap_or(""));
                                }
                            }
                            _ if m.control || m.platform || m.alt => return,
                            _ => match &ks.key_char {
                                Some(ch) => this.value.push_str(ch),
                                None => return,
                            },
                        }
                        cx.notify();
                    }))
                    .child(if empty {
                        "Kata sandi".to_string()
                    } else {
                        shown + if focused { "▏" } else { "" }
                    }),
            )
            .child(
                div()
                    .id("password-toggle")
                    .text_sm()
                    .text_color(colors.disabled)
                    .cursor_pointer()
                    .child(if self.visible { "Sembunyikan" } else { "Tampilkan" })
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.visible = !this.visible;
                        cx.notify();
                    })),
            )
    }
}

// Silence unused import on platforms without clipboard text helpers.
#[allow(unused)]
fn _use(_: ClipboardItem) {}
