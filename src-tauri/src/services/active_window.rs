// Active Window Detection Module
// 活动窗口检测模块

use serde::{Deserialize, Serialize};
use std::process::Command;

/// Information about the currently active window
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    /// Application name (e.g., "Google Chrome", "Visual Studio Code")
    pub app_name: String,
    /// Window title
    pub title: String,
    /// Process ID
    pub process_id: u32,
    /// Optional URL (for browsers)
    pub url: Option<String>,
    /// Optional domain extracted from URL
    pub domain: Option<String>,
}

impl WindowInfo {
    pub fn new(app_name: String, title: String, process_id: u32) -> Self {
        Self {
            app_name,
            title,
            process_id,
            url: None,
            domain: None,
        }
    }
}

/// List of known browser app names
const KNOWN_BROWSERS: &[&str] = &[
    "Google Chrome",
    "Safari",
    "Arc",
    "Microsoft Edge",
    "Brave Browser",
    "Firefox",
    "Opera",
    "Vivaldi",
];

/// Check if an app is a known browser
fn is_browser(app_name: &str) -> bool {
    KNOWN_BROWSERS.contains(&app_name)
}

/// Get the URL from a browser using AppleScript (macOS only)
#[cfg(target_os = "macos")]
fn get_browser_url(app_name: &str) -> Option<String> {
    let script = match app_name {
        "Google Chrome" => {
            r#"tell application "Google Chrome" to return URL of active tab of front window"#
        }
        "Safari" => r#"tell application "Safari" to return URL of front document"#,
        "Arc" => r#"tell application "Arc" to return URL of active tab of front window"#,
        "Microsoft Edge" => {
            r#"tell application "Microsoft Edge" to return URL of active tab of front window"#
        }
        "Brave Browser" => {
            r#"tell application "Brave Browser" to return URL of active tab of front window"#
        }
        "Firefox" => {
            // Firefox doesn't support AppleScript well, try via accessibility
            return None;
        }
        "Opera" => r#"tell application "Opera" to return URL of active tab of front window"#,
        "Vivaldi" => r#"tell application "Vivaldi" to return URL of active tab of front window"#,
        _ => return None,
    };

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    if output.status.success() {
        let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !url.is_empty() && url.starts_with("http") {
            Some(url)
        } else {
            None
        }
    } else {
        log::debug!(
            "AppleScript failed for {}: {}",
            app_name,
            String::from_utf8_lossy(&output.stderr)
        );
        None
    }
}

#[cfg(not(target_os = "macos"))]
fn get_browser_url(_app_name: &str) -> Option<String> {
    // URL extraction not implemented for non-macOS platforms
    None
}

/// Extract domain from a URL
fn extract_domain(url: &str) -> Option<String> {
    // Simple domain extraction without external crate
    // Expected format: https://sub.domain.com/path
    let url = url.trim();

    // Remove protocol
    let without_protocol = if let Some(pos) = url.find("://") {
        &url[pos + 3..]
    } else {
        url
    };

    // Get the host part (before first /)
    let host = if let Some(pos) = without_protocol.find('/') {
        &without_protocol[..pos]
    } else {
        without_protocol
    };

    // Remove port if present
    let host = if let Some(pos) = host.find(':') {
        &host[..pos]
    } else {
        host
    };

    if host.is_empty() {
        None
    } else {
        Some(host.to_lowercase())
    }
}

/// Get the currently active window information
///
/// Uses the `active-win-pos-rs` crate for cross-platform support
/// For browsers, also attempts to fetch the current URL
pub fn get_active_window() -> Result<WindowInfo, String> {
    match active_win_pos_rs::get_active_window() {
        Ok(window) => {
            let mut info = WindowInfo {
                app_name: window.app_name.clone(),
                title: window.title,
                process_id: window.process_id as u32,
                url: None,
                domain: None,
            };

            // If it's a browser, try to get the URL
            if is_browser(&window.app_name) {
                if let Some(url) = get_browser_url(&window.app_name) {
                    info.domain = extract_domain(&url);
                    info.url = Some(url);
                }
            }

            log::debug!(
                "Active window: {} - {} (url: {:?}, domain: {:?})",
                info.app_name,
                info.title,
                info.url,
                info.domain
            );
            Ok(info)
        }
        Err(()) => {
            log::warn!("Failed to get active window");
            Err("Failed to get active window".to_string())
        }
    }
}

/// Check if two windows are the same (same app and title)
pub fn is_same_window(a: &WindowInfo, b: &WindowInfo) -> bool {
    a.app_name == b.app_name && a.title == b.title
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_window_info_new() {
        let info = WindowInfo::new("Test App".to_string(), "Test Title".to_string(), 1234);
        assert_eq!(info.app_name, "Test App");
        assert_eq!(info.title, "Test Title");
        assert_eq!(info.process_id, 1234);
        assert!(info.url.is_none());
    }

    #[test]
    fn test_is_same_window() {
        let a = WindowInfo::new("App".to_string(), "Title".to_string(), 1);
        let b = WindowInfo::new("App".to_string(), "Title".to_string(), 2);
        let c = WindowInfo::new("Other".to_string(), "Title".to_string(), 1);

        assert!(is_same_window(&a, &b));
        assert!(!is_same_window(&a, &c));
    }
}
