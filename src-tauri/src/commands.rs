use crate::database::TrackItem;
use crate::services::{get_active_window, get_idle_time, TrackingStatus, WindowInfo};
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

// ============================================================================
// Database Commands
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub data: Vec<TrackItem>,
    pub total: i64,
    pub total_duration: Option<i64>,
}

/// Find all items for a specific day
#[tauri::command]
pub fn find_all_day_items(
    state: State<AppState>,
    from: i64,
    to: i64,
    task_name: String,
) -> Result<Vec<TrackItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.find_all_day_items(from, to, &task_name)
        .map_err(|e| e.to_string())
}

/// Create a new track item
#[tauri::command]
pub fn create_track_item(
    state: State<AppState>,
    track_item: TrackItem,
) -> Result<TrackItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_track_item(&track_item).map_err(|e| e.to_string())
}

/// Update an existing track item
#[tauri::command]
pub fn update_track_item(
    state: State<AppState>,
    track_item: TrackItem,
) -> Result<TrackItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_track_item(&track_item).map_err(|e| e.to_string())
}

/// Delete track items by IDs
#[tauri::command]
pub fn delete_by_ids(state: State<AppState>, ids: Vec<i64>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_by_ids(&ids).map_err(|e| e.to_string())
}

/// Search track items
#[tauri::command]
pub fn search_items(
    state: State<AppState>,
    from: i64,
    to: i64,
    task_name: Option<String>,
    search_str: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<SearchResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (data, total) = db
        .search_items(
            from,
            to,
            task_name.as_deref(),
            search_str.as_deref(),
            limit.unwrap_or(50),
            offset.unwrap_or(0),
        )
        .map_err(|e| e.to_string())?;

    // Calculate total duration
    let total_duration: i64 = data
        .iter()
        .map(|item| item.end_date - item.begin_date)
        .sum();

    Ok(SearchResult {
        data,
        total,
        total_duration: Some(total_duration),
    })
}

/// Update track item color
#[tauri::command]
pub fn update_track_item_color(
    state: State<AppState>,
    app_name: String,
    color: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_track_item_color(&app_name, &color)
        .map_err(|e| e.to_string())
}

/// Get app version
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// ============================================================================
// Tracking Commands
// ============================================================================

/// Get the currently active window
#[tauri::command]
pub fn get_current_window() -> Result<WindowInfo, String> {
    get_active_window()
}

/// Get the current tracking status
#[tauri::command]
pub fn get_tracking_status(state: State<AppState>) -> TrackingStatus {
    let tracker = &state.tracker;

    // Try to get current window info
    let (current_app, current_title) = get_active_window()
        .map(|w| (Some(w.app_name), Some(w.title)))
        .unwrap_or((None, None));

    TrackingStatus {
        is_running: tracker.is_running(),
        is_paused: tracker.is_paused(),
        current_state: tracker.get_system_state(),
        current_app,
        current_title,
    }
}

/// Start tracking
#[tauri::command]
pub fn start_tracking(state: State<AppState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    state.tracker.start(app_handle);
    Ok(())
}

/// Stop tracking
#[tauri::command]
pub fn stop_tracking(state: State<AppState>) -> Result<(), String> {
    state.tracker.stop();
    Ok(())
}

/// Pause tracking
#[tauri::command]
pub fn pause_tracking(state: State<AppState>) -> Result<(), String> {
    state.tracker.pause();
    Ok(())
}

/// Resume tracking
#[tauri::command]
pub fn resume_tracking(state: State<AppState>) -> Result<(), String> {
    state.tracker.resume();
    Ok(())
}

/// Get current idle time in seconds
#[tauri::command]
pub fn get_idle_time_command() -> f64 {
    get_idle_time().as_secs_f64()
}

// ============================================================================
// Statistics Commands (for Summary page)
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUsageStats {
    pub app: String,
    pub total_duration: i64,
    pub percentage: f64,
    pub color: Option<String>,
}

/// Get app usage statistics for a time range
#[tauri::command]
pub fn get_app_usage_stats(
    state: State<AppState>,
    from: i64,
    to: i64,
) -> Result<Vec<AppUsageStats>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get all AppTrackItems for the time range
    let items = db
        .find_all_day_items(from, to, "AppTrackItem")
        .map_err(|e| e.to_string())?;

    // Aggregate by app name
    let mut app_durations: std::collections::HashMap<String, (i64, Option<String>)> =
        std::collections::HashMap::new();

    for item in &items {
        let duration = item.end_date - item.begin_date;
        let entry = app_durations
            .entry(item.app.clone())
            .or_insert((0, item.color.clone()));
        entry.0 += duration;
    }

    // Calculate total and percentages
    let total_duration: i64 = app_durations.values().map(|(d, _)| d).sum();

    let mut stats: Vec<AppUsageStats> = app_durations
        .into_iter()
        .map(|(app, (duration, color))| {
            let percentage = if total_duration > 0 {
                (duration as f64 / total_duration as f64) * 100.0
            } else {
                0.0
            };
            AppUsageStats {
                app,
                total_duration: duration,
                percentage,
                color,
            }
        })
        .collect();

    // Sort by duration descending
    stats.sort_by(|a, b| b.total_duration.cmp(&a.total_duration));

    Ok(stats)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DomainUsageStats {
    pub domain: String,
    pub total_duration: i64,
    pub percentage: f64,
    pub page_count: i64,
}

/// Get domain usage statistics for a specific browser app
#[tauri::command]
pub fn get_domain_usage_stats(
    state: State<AppState>,
    from: i64,
    to: i64,
    app_name: String,
) -> Result<Vec<DomainUsageStats>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get all AppTrackItems for the time range
    let items = db
        .find_all_day_items(from, to, "AppTrackItem")
        .map_err(|e| e.to_string())?;

    // Filter by app name and aggregate by domain
    let mut domain_durations: std::collections::HashMap<String, (i64, i64)> =
        std::collections::HashMap::new();

    for item in &items {
        if item.app != app_name {
            continue;
        }

        let domain = item.domain.clone().unwrap_or_else(|| "Other".to_string());
        let duration = item.end_date - item.begin_date;
        let entry = domain_durations.entry(domain).or_insert((0, 0));
        entry.0 += duration;
        entry.1 += 1; // page count
    }

    // Calculate total and percentages
    let total_duration: i64 = domain_durations.values().map(|(d, _)| d).sum();

    let mut stats: Vec<DomainUsageStats> = domain_durations
        .into_iter()
        .map(|(domain, (duration, page_count))| {
            let percentage = if total_duration > 0 {
                (duration as f64 / total_duration as f64) * 100.0
            } else {
                0.0
            };
            DomainUsageStats {
                domain,
                total_duration: duration,
                percentage,
                page_count,
            }
        })
        .collect();

    // Sort by duration descending
    stats.sort_by(|a, b| b.total_duration.cmp(&a.total_duration));

    Ok(stats)
}

// ============================================================================
// Settings Commands
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub auto_start: bool,
    pub close_action: String,  // "minimize" | "ask" | "quit"
    pub polling_interval: u64, // seconds
    pub idle_threshold: u64,   // seconds
    pub track_urls: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            auto_start: false,
            close_action: "minimize".to_string(),
            polling_interval: 3,
            idle_threshold: 300,
            track_urls: false,
        }
    }
}

/// Get application settings
#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<AppSettings, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_settings().map_err(|e| e.to_string())
}

/// Save application settings
#[tauri::command]
pub fn save_settings(state: State<AppState>, settings: AppSettings) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_settings(&settings).map_err(|e| e.to_string())
}

/// Get all tracked apps (for color management)
#[tauri::command]
pub fn get_tracked_apps(state: State<AppState>) -> Result<Vec<TrackedApp>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_tracked_apps().map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackedApp {
    pub name: String,
    pub color: Option<String>,
    pub total_time: i64,
}

/// Get database info
#[tauri::command]
pub fn get_database_info(app: tauri::AppHandle) -> Result<DatabaseInfo, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("timlyzer.db");

    let size = std::fs::metadata(&db_path).map(|m| m.len()).unwrap_or(0);

    Ok(DatabaseInfo {
        path: db_path.to_string_lossy().to_string(),
        size_bytes: size,
    })
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseInfo {
    pub path: String,
    pub size_bytes: u64,
}

/// Clear data before a specific date
#[tauri::command]
pub fn clear_data_before(state: State<AppState>, before_date: i64) -> Result<ClearResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let deleted = db
        .clear_data_before(before_date)
        .map_err(|e| e.to_string())?;

    Ok(ClearResult {
        items_deleted: deleted,
    })
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClearResult {
    pub items_deleted: i64,
}

// ============================================================================
// Export Commands
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub success: bool,
    pub items_exported: i64,
    pub file_path: String,
}

/// Export data to CSV
#[tauri::command]
pub fn export_to_csv(
    state: State<AppState>,
    from: i64,
    to: i64,
    task_name: Option<String>,
    file_path: String,
) -> Result<ExportResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get items
    let items = if let Some(tn) = &task_name {
        db.find_all_day_items(from, to, tn)
            .map_err(|e| e.to_string())?
    } else {
        let mut all = Vec::new();
        all.extend(
            db.find_all_day_items(from, to, "AppTrackItem")
                .map_err(|e| e.to_string())?,
        );
        all.extend(
            db.find_all_day_items(from, to, "StatusTrackItem")
                .map_err(|e| e.to_string())?,
        );
        all.extend(
            db.find_all_day_items(from, to, "LogTrackItem")
                .map_err(|e| e.to_string())?,
        );
        all.sort_by(|a, b| a.begin_date.cmp(&b.begin_date));
        all
    };

    // Generate CSV content
    let mut csv_content = String::from("id,app,title,taskName,beginDate,endDate,duration,color\n");

    for item in &items {
        let duration = item.end_date - item.begin_date;
        csv_content.push_str(&format!(
            "{},\"{}\",\"{}\",\"{}\",{},{},{},{}\n",
            item.id.unwrap_or(0),
            item.app.replace("\"", "\"\""),
            item.title.replace("\"", "\"\""),
            item.task_name,
            item.begin_date,
            item.end_date,
            duration,
            item.color.as_deref().unwrap_or("")
        ));
    }

    // Write to file
    std::fs::write(&file_path, csv_content).map_err(|e| e.to_string())?;

    Ok(ExportResult {
        success: true,
        items_exported: items.len() as i64,
        file_path,
    })
}

/// Export data to JSON
#[tauri::command]
pub fn export_to_json(
    state: State<AppState>,
    from: i64,
    to: i64,
    task_name: Option<String>,
    file_path: String,
) -> Result<ExportResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get items
    let items = if let Some(tn) = &task_name {
        db.find_all_day_items(from, to, tn)
            .map_err(|e| e.to_string())?
    } else {
        let mut all = Vec::new();
        all.extend(
            db.find_all_day_items(from, to, "AppTrackItem")
                .map_err(|e| e.to_string())?,
        );
        all.extend(
            db.find_all_day_items(from, to, "StatusTrackItem")
                .map_err(|e| e.to_string())?,
        );
        all.extend(
            db.find_all_day_items(from, to, "LogTrackItem")
                .map_err(|e| e.to_string())?,
        );
        all.sort_by(|a, b| a.begin_date.cmp(&b.begin_date));
        all
    };

    // Calculate total duration
    let total_duration: i64 = items.iter().map(|i| i.end_date - i.begin_date).sum();

    // Create export object
    let export_data = serde_json::json!({
        "exportDate": chrono::Utc::now().to_rfc3339(),
        "dateRange": {
            "from": from,
            "to": to
        },
        "totalItems": items.len(),
        "totalDuration": total_duration,
        "items": items
    });

    // Write to file
    let json_content = serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json_content).map_err(|e| e.to_string())?;

    Ok(ExportResult {
        success: true,
        items_exported: items.len() as i64,
        file_path,
    })
}
// ============================================================================
// System Commands
// ============================================================================

/// Update tray menu with translations
#[tauri::command]
pub fn update_tray_menu(
    app_handle: tauri::AppHandle,
    translations: crate::tray::TrayTranslations,
) -> Result<(), String> {
    crate::tray::update_tray_menu(&app_handle, translations)
}
