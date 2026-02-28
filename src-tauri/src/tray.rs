// System Tray Module
// 系统托盘模块

use crate::AppState;
use serde::Deserialize;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Manager, Runtime,
};

#[derive(Debug, Deserialize)]
pub struct TrayTranslations {
    pub tracking_enabled: String,
    pub open: String,
    pub summary: String,
    pub quit: String,
}

impl Default for TrayTranslations {
    fn default() -> Self {
        Self {
            tracking_enabled: "Tracking Enabled".to_string(),
            open: "Open Timlyzer".to_string(),
            summary: "Today's Summary".to_string(),
            quit: "Quit".to_string(),
        }
    }
}

fn create_menu<R: Runtime>(app: &AppHandle<R>, trans: &TrayTranslations) -> tauri::Result<Menu<R>> {
    let toggle_item = CheckMenuItem::with_id(
        app,
        "toggle_tracking",
        &trans.tracking_enabled,
        true,
        true,
        None::<&str>,
    )?;
    let open_item = MenuItem::with_id(app, "open", &trans.open, true, None::<&str>)?;
    let summary_item = MenuItem::with_id(app, "summary", &trans.summary, true, None::<&str>)?;
    let separator = MenuItem::with_id(app, "sep1", "───────────", false, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", &trans.quit, true, None::<&str>)?;

    Menu::with_items(
        app,
        &[
            &toggle_item,
            &separator,
            &open_item,
            &summary_item,
            &separator,
            &quit_item,
        ],
    )
}

/// Setup the system tray
pub fn setup_tray(app: &tauri::App) -> Result<TrayIcon, tauri::Error> {
    let menu = create_menu(app.handle(), &TrayTranslations::default())?;

    // Build tray icon
    let tray = TrayIconBuilder::with_id("main")
        .icon(tauri::image::Image::from_bytes(include_bytes!("../icons/tray-icon.png")).unwrap())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle_tracking" => {
                let state = app.state::<AppState>();
                if state.tracker.is_paused() {
                    state.tracker.resume();
                } else {
                    state.tracker.pause();
                }
            }
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "summary" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    // Navigate to summary page - we'll emit an event
                    let _ = window.eval("window.location.assign('/summary')");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .tooltip("Timlyzer - Time Tracking")
        .build(app)?;

    log::info!("System tray initialized");

    Ok(tray)
}

/// Update tray menu translations
pub fn update_tray_menu(app: &AppHandle, trans: TrayTranslations) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main") {
        let menu = create_menu(app, &trans).map_err(|e| e.to_string())?;
        tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Tray icon not found".to_string())
    }
}
