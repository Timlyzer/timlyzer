pub mod commands;
pub mod database;
pub mod services;
pub mod tray;

use database::Database;
use services::TrackerService;
use std::sync::{Arc, Mutex};
use tauri::Manager;

/// Application state - shared across all commands
pub struct AppState {
    /// Database connection (wrapped in Mutex for thread-safe access)
    pub db: Mutex<Database>,
    /// Tracker service for automatic time tracking
    pub tracker: Arc<TrackerService>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Get app data directory
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");

            // Initialize database
            let db_path = app_dir.join("timlyzer.db");
            let db =
                Database::new(db_path.to_str().unwrap()).expect("Failed to initialize database");
            log::info!("Database initialized at: {:?}", db_path);

            // Create database Arc for tracker
            let db_arc = Arc::new(Mutex::new(
                Database::new(db_path.to_str().unwrap())
                    .expect("Failed to initialize database for tracker"),
            ));

            // Create tracker service
            let tracker = Arc::new(TrackerService::new(Arc::clone(&db_arc)));

            // Start the tracker automatically
            tracker.start(app.handle().clone());
            log::info!("Tracker service started");

            // Setup system tray
            if let Err(e) = tray::setup_tray(app) {
                log::error!("Failed to setup tray: {}", e);
            }

            // Manage application state
            app.manage(AppState {
                db: Mutex::new(db),
                tracker,
            });

            log::info!("Timlyzer initialized successfully");

            Ok(())
        })
        .on_window_event(|window, event| {
            // Handle close request - minimize to tray instead of closing
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent the default close behavior
                api.prevent_close();
                // Hide the window instead
                let _ = window.hide();
                log::info!("Window hidden to tray");
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Database commands
            commands::find_all_day_items,
            commands::create_track_item,
            commands::update_track_item,
            commands::delete_by_ids,
            commands::search_items,
            commands::update_track_item_color,
            commands::get_app_version,
            // Tracking commands
            commands::get_current_window,
            commands::get_tracking_status,
            commands::start_tracking,
            commands::stop_tracking,
            commands::pause_tracking,
            commands::resume_tracking,
            commands::get_idle_time_command,
            // Statistics commands
            commands::get_app_usage_stats,
            commands::get_domain_usage_stats,
            // Settings commands
            commands::get_settings,
            commands::save_settings,
            commands::get_tracked_apps,
            commands::get_database_info,
            commands::clear_data_before,
            // Export commands
            commands::export_to_csv,
            commands::export_to_json,
            commands::update_tray_menu,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
