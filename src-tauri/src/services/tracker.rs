// Tracker Service Module
// 核心追踪服务模块

use crate::database::{Database, TrackItem};
use crate::services::{get_active_window, get_idle_time, StateMonitor, SystemState, WindowInfo};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Tracker configuration
#[derive(Debug, Clone)]
pub struct TrackerConfig {
    /// Polling interval in seconds (default: 3)
    pub polling_interval: u64,
    /// Idle threshold in seconds (default: 300 = 5 minutes)
    pub idle_threshold: u64,
    /// Whether to track URLs (for browsers)
    pub track_urls: bool,
}

impl Default for TrackerConfig {
    fn default() -> Self {
        Self {
            polling_interval: 3,
            idle_threshold: 300,
            track_urls: false,
        }
    }
}

/// Current tracking state
#[derive(Debug, Clone, Default)]
struct TrackingState {
    /// Currently tracked window
    current_window: Option<WindowInfo>,
    /// Current AppTrackItem being built
    current_app_item: Option<TrackItem>,
    /// Current StatusTrackItem being built
    current_status_item: Option<TrackItem>,
    /// Last tracking time
    last_track_time: i64,
}

/// Tracker service for automatic time tracking
pub struct TrackerService {
    /// Reference to database
    db: Arc<Mutex<Database>>,
    /// State monitor for idle detection
    state_monitor: Arc<StateMonitor>,
    /// Tracker configuration
    config: RwLock<TrackerConfig>,
    /// Current tracking state
    state: RwLock<TrackingState>,
    /// Whether tracking is running
    is_running: Arc<AtomicBool>,
    /// Whether tracking is paused
    is_paused: Arc<AtomicBool>,
}

impl TrackerService {
    /// Create a new tracker service
    pub fn new(db: Arc<Mutex<Database>>) -> Self {
        let config = TrackerConfig::default();
        let state_monitor = Arc::new(StateMonitor::with_threshold(Duration::from_secs(
            config.idle_threshold,
        )));

        Self {
            db,
            state_monitor,
            config: RwLock::new(config),
            state: RwLock::new(TrackingState::default()),
            is_running: Arc::new(AtomicBool::new(false)),
            is_paused: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Get whether tracking is running
    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }

    /// Get whether tracking is paused
    pub fn is_paused(&self) -> bool {
        self.is_paused.load(Ordering::SeqCst)
    }

    /// Get current system state
    pub fn get_system_state(&self) -> SystemState {
        self.state_monitor.get_state()
    }

    /// Update configuration
    pub fn update_config(&self, config: TrackerConfig) {
        self.state_monitor.set_idle_threshold(config.idle_threshold);
        *self.config.write().unwrap() = config;
        log::info!("Tracker config updated");
    }

    /// Start the tracking loop
    pub fn start(&self, app_handle: AppHandle) {
        if self.is_running.swap(true, Ordering::SeqCst) {
            log::warn!("Tracker is already running");
            return;
        }

        log::info!("Starting tracker service");

        let db = Arc::clone(&self.db);
        let state_monitor = Arc::clone(&self.state_monitor);
        let config = self.config.read().unwrap().clone();

        // Clone flags for the async task
        let is_running = Arc::clone(&self.is_running);
        let is_paused = Arc::clone(&self.is_paused);

        // Store references for stopping
        // Note: In a real implementation, we'd need a way to signal the task to stop

        tauri::async_runtime::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(config.polling_interval));

            // Initialize tracking state
            let mut current_window: Option<WindowInfo> = None;
            let mut current_app_item: Option<TrackItem> = None;
            let mut current_status_item: Option<TrackItem> = None;
            let mut last_state = SystemState::Online;

            loop {
                interval.tick().await;

                // Check if we should stop
                if !is_running.load(Ordering::SeqCst) {
                    break;
                }

                // Check if paused
                if is_paused.load(Ordering::SeqCst) {
                    // If we were tracking, save and clear state
                    if let Some(mut item) = current_app_item.take() {
                        let now = chrono::Utc::now().timestamp_millis();
                        item.end_date = now;
                        if let Err(e) = save_track_item(&db, &item) {
                            log::error!("Failed to save app item directly before pause: {}", e);
                        }
                    }
                    if let Some(mut item) = current_status_item.take() {
                        let now = chrono::Utc::now().timestamp_millis();
                        item.end_date = now;
                        if let Err(e) = save_track_item(&db, &item) {
                            log::error!("Failed to save status item before pause: {}", e);
                        }
                    }
                    current_window = None;
                    // Update frontend state
                    let _ = app_handle.emit("tracking-paused", ());
                    continue;
                }

                let now = chrono::Utc::now().timestamp_millis();

                // Check idle state
                let idle_time = get_idle_time();
                let state_changed = state_monitor.update(idle_time);
                let current_state = state_monitor.get_state();

                // Handle state changes
                if state_changed || last_state != current_state {
                    // Save current status item if exists
                    if let Some(mut item) = current_status_item.take() {
                        item.end_date = now;
                        if let Err(e) = save_track_item(&db, &item) {
                            log::error!("Failed to save status item: {}", e);
                        }
                    }

                    // Create new status item
                    current_status_item = Some(TrackItem {
                        id: None,
                        app: current_state.to_string(),
                        task_name: "StatusTrackItem".to_string(),
                        title: current_state.to_string(),
                        url: None,
                        domain: None,
                        color: Some(state_to_color(current_state)),
                        begin_date: now,
                        end_date: now,
                    });

                    // Emit event to frontend
                    let _ = app_handle.emit("state-changed", current_state);

                    last_state = current_state;
                }

                // Update status item end time
                if let Some(ref mut item) = current_status_item {
                    item.end_date = now;
                }

                // Only track app when not idle
                if current_state == SystemState::Online {
                    match get_active_window() {
                        Ok(window) => {
                            // Filter out system windows like loginwindow
                            if window.app_name == "loginwindow"
                                || window.app_name == "ScreenSaverEngine"
                            {
                                // If we entered login screen, close current app item
                                if let Some(mut item) = current_app_item.take() {
                                    item.end_date = now;
                                    if let Err(e) = save_track_item(&db, &item) {
                                        log::error!(
                                            "Failed to save app item on system window: {}",
                                            e
                                        );
                                    }
                                    let _ = app_handle.emit("track-item-saved", &item);
                                }
                                current_window = None;
                                continue;
                            }

                            let window_changed = current_window
                                .as_ref()
                                .map(|w| w.app_name != window.app_name || w.title != window.title)
                                .unwrap_or(true);

                            if window_changed {
                                // Save current app item if exists
                                if let Some(mut item) = current_app_item.take() {
                                    item.end_date = now;
                                    if let Err(e) = save_track_item(&db, &item) {
                                        log::error!("Failed to save app item: {}", e);
                                    }
                                    // Emit event to frontend
                                    let _ = app_handle.emit("track-item-saved", &item);
                                }

                                // Get color for this app
                                let color = get_app_color(&db, &window.app_name);

                                // Create new app item
                                current_app_item = Some(TrackItem {
                                    id: None,
                                    app: window.app_name.clone(),
                                    task_name: "AppTrackItem".to_string(),
                                    title: window.title.clone(),
                                    url: window.url.clone(),
                                    domain: window.domain.clone(),
                                    color,
                                    begin_date: now,
                                    end_date: now,
                                });

                                // Emit window change event
                                let _ = app_handle.emit("window-changed", &window);

                                current_window = Some(window);
                            } else {
                                // Update end time
                                if let Some(ref mut item) = current_app_item {
                                    item.end_date = now;
                                }
                            }
                        }
                        Err(e) => {
                            log::debug!("Could not get active window: {}", e);
                        }
                    }
                } else {
                    // System is idle, save current app item
                    if let Some(mut item) = current_app_item.take() {
                        item.end_date = now;
                        if let Err(e) = save_track_item(&db, &item) {
                            log::error!("Failed to save app item on idle: {}", e);
                        }
                    }
                    current_window = None;
                }
            }
        });
    }

    /// Pause tracking
    pub fn pause(&self) {
        self.is_paused.store(true, Ordering::SeqCst);
        log::info!("Tracker paused");
    }

    /// Resume tracking
    pub fn resume(&self) {
        self.is_paused.store(false, Ordering::SeqCst);
        log::info!("Tracker resumed");
    }

    /// Stop tracking
    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
        log::info!("Tracker stopped");
    }
}

/// Get color for an app from the database
fn get_app_color(db: &Arc<Mutex<Database>>, app_name: &str) -> Option<String> {
    db.lock()
        .ok()
        .and_then(|db| db.get_app_color(app_name).ok().flatten())
}

/// Save a track item to the database
fn save_track_item(db: &Arc<Mutex<Database>>, item: &TrackItem) -> Result<(), String> {
    // Only save if duration is meaningful (> 1 second)
    if item.end_date - item.begin_date < 1000 {
        return Ok(());
    }

    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_track_item(item)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// Get color for system state
fn state_to_color(state: SystemState) -> String {
    match state {
        SystemState::Online => "#22c55e".to_string(),  // green
        SystemState::Idle => "#f59e0b".to_string(),    // amber
        SystemState::Offline => "#6b7280".to_string(), // gray
    }
}

/// Tracking status for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackingStatus {
    pub is_running: bool,
    pub is_paused: bool,
    pub current_state: SystemState,
    pub current_app: Option<String>,
    pub current_title: Option<String>,
}

use serde::{Deserialize, Serialize};
