use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, LogicalPosition, LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// ── Browser URL ───────────────────────────────────────────────────────────────

#[tauri::command]
async fn get_browser_url() -> Option<String> {
    get_browser_url_impl()
}

#[cfg(target_os = "macos")]
fn get_browser_url_impl() -> Option<String> {
    let browsers = [
        r#"tell application "Google Chrome" to get URL of active tab of front window"#,
        r#"tell application "Microsoft Edge" to get URL of active tab of front window"#,
        r#"tell application "Safari" to get URL of current tab of front window"#,
    ];
    for script in &browsers {
        if let Ok(out) = std::process::Command::new("osascript")
            .args(["-e", script])
            .output()
        {
            if out.status.success() {
                let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !url.is_empty() && url.starts_with("http") {
                    return Some(url);
                }
            }
        }
    }
    None
}

#[cfg(not(target_os = "macos"))]
fn get_browser_url_impl() -> Option<String> {
    None
}

// ── Window commands ───────────────────────────────────────────────────────────

#[tauri::command]
fn hide_overlay(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("overlay") {
        let _ = w.hide();
    }
}

#[tauri::command]
fn resize_overlay_to_card(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("overlay") {
        if let Ok(Some(monitor)) = w.primary_monitor() {
            let size = monitor.size();
            let scale = monitor.scale_factor();
            let screen_w = size.width as f64 / scale;
            let screen_h = size.height as f64 / scale;
            let win_h = 620.0_f64;
            let card_win_w = 460.0_f64;
            let _ = w.set_size(LogicalSize::new(card_win_w, win_h));
            let _ = w.set_position(LogicalPosition::new(screen_w - card_win_w, screen_h - win_h - 80.0));
            let _ = w.set_ignore_cursor_events(false);
        }
    }
}

#[tauri::command]
fn restore_overlay_size(app: tauri::AppHandle) {
    position_overlay(&app);
    if let Some(w) = app.get_webview_window("overlay") {
        let _ = w.set_ignore_cursor_events(true);
    }
}

#[tauri::command]
fn open_settings(app: tauri::AppHandle) {
    let _ = app.show(); // bring app to foreground in accessory mode
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.show();
        let _ = w.set_focus();
    } else {
        let _ = WebviewWindowBuilder::new(
            &app,
            "settings",
            WebviewUrl::App("settings.html".into()),
        )
        .title("OdinSight Settings")
        .inner_size(900.0, 700.0)
        .min_inner_size(700.0, 500.0)
        .resizable(true)
        .center()
        .build();
    }
}

// ── Overlay positioning ───────────────────────────────────────────────────────

fn position_overlay(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("overlay") {
        if let Ok(Some(monitor)) = w.primary_monitor() {
            let size = monitor.size();
            let scale = monitor.scale_factor();
            let screen_w = size.width as f64 / scale;
            let screen_h = size.height as f64 / scale;
            let win_h = 620.0_f64;
            let _ = w.set_size(LogicalSize::new(screen_w, win_h));
            let _ = w.set_position(LogicalPosition::new(0.0, screen_h - win_h - 80.0));
        }
    }
}

fn show_overlay(app: &tauri::AppHandle, mode: &str) {
    position_overlay(app);
    if let Some(w) = app.get_webview_window("overlay") {
        let _ = w.set_ignore_cursor_events(true);
        let _ = w.emit("set-mode", mode);
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn toggle_overlay(app: &tauri::AppHandle, mode: &str) {
    if let Some(w) = app.get_webview_window("overlay") {
        if w.is_visible().unwrap_or(false) {
            let _ = w.emit("toggle-mode", mode);
        } else {
            show_overlay(app, mode);
        }
    }
}

// ── App entry point ───────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            position_overlay(&app.handle());

            // Global shortcuts
            let h1 = app.handle().clone();
            let h2 = app.handle().clone();

            app.global_shortcut().on_shortcut(
                Shortcut::new(Some(Modifiers::ALT), Code::KeyD),
                move |_app, _sc, ev| {
                    if ev.state() == ShortcutState::Pressed {
                        toggle_overlay(&h1, "echowrite");
                    }
                },
            )?;

            app.global_shortcut().on_shortcut(
                Shortcut::new(Some(Modifiers::ALT), Code::KeyN),
                move |_app, _sc, ev| {
                    if ev.state() == ShortcutState::Pressed {
                        toggle_overlay(&h2, "notes");
                    }
                },
            )?;

            // System tray
            let echowrite_item = MenuItemBuilder::new("EchoWrite  (Alt+D)").id("echowrite").build(app)?;
            let notes_item = MenuItemBuilder::new("Notes  (Alt+N)").id("notes").build(app)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let settings_item = MenuItemBuilder::new("Settings").id("settings").build(app)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItemBuilder::new("Quit OdinSight").id("quit").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&echowrite_item)
                .item(&notes_item)
                .item(&sep1)
                .item(&settings_item)
                .item(&sep2)
                .item(&quit_item)
                .build()?;

            let ah = app.handle().clone();
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("OdinSight")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(move |_tray, event| match event.id().as_ref() {
                    "quit" => std::process::exit(0),
                    "settings" => open_settings(ah.clone()),
                    "echowrite" => show_overlay(&ah, "echowrite"),
                    "notes" => show_overlay(&ah, "notes"),
                    _ => {}
                })
                .build(app)?;

            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_browser_url,
            hide_overlay,
            open_settings,
            resize_overlay_to_card,
            restore_overlay_size,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
