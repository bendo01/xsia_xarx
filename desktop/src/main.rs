mod config;
mod controllers;
mod models;
mod services;
mod views;

use gpui::{App, AppContext, Bounds, QuitMode, WindowBounds, WindowOptions, px, size};
use gpui_ce_elements::editable_text::actions::{DEFAULT_INPUT_CONTEXT, default_bindings};
use views::RootView;

fn main() {
    gpui_platform::application()
        .with_quit_mode(QuitMode::LastWindowClosed)
        .run(run);
}

fn run(cx: &mut App) {
    cx.bind_keys(default_bindings().as_keybindings(Some(DEFAULT_INPUT_CONTEXT)));

    let bounds = Bounds::centered(None, size(px(1100.), px(720.)), cx);
    cx.open_window(
        WindowOptions { window_bounds: Some(WindowBounds::Windowed(bounds)), ..Default::default() },
        |_window, cx| cx.new(RootView::new),
    )
    .unwrap();
    cx.activate(true);
}
