// State Monitor Module
// 系统状态监控模块

use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::RwLock;
use std::time::Duration;

/// System state types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum SystemState {
    /// User is actively using the computer
    Online,
    /// Computer is idle (no input for threshold duration)
    Idle,
    /// Computer was offline/sleeping
    Offline,
}

impl std::fmt::Display for SystemState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SystemState::Online => write!(f, "ONLINE"),
            SystemState::Idle => write!(f, "IDLE"),
            SystemState::Offline => write!(f, "OFFLINE"),
        }
    }
}

/// State monitor for tracking system idle state
pub struct StateMonitor {
    /// Current system state
    current_state: RwLock<SystemState>,
    /// Idle threshold in seconds
    idle_threshold_secs: AtomicU64,
    /// Last state change timestamp (milliseconds)
    last_state_change: AtomicU64,
}

impl StateMonitor {
    /// Create a new state monitor with default idle threshold (5 minutes)
    pub fn new() -> Self {
        Self::with_threshold(Duration::from_secs(300)) // 5 minutes
    }

    /// Create a new state monitor with custom idle threshold
    pub fn with_threshold(threshold: Duration) -> Self {
        Self {
            current_state: RwLock::new(SystemState::Online),
            idle_threshold_secs: AtomicU64::new(threshold.as_secs()),
            last_state_change: AtomicU64::new(chrono::Utc::now().timestamp_millis() as u64),
        }
    }

    /// Get current system state
    pub fn get_state(&self) -> SystemState {
        *self.current_state.read().unwrap()
    }

    /// Set idle threshold in seconds
    pub fn set_idle_threshold(&self, seconds: u64) {
        self.idle_threshold_secs.store(seconds, Ordering::SeqCst);
        log::info!("Idle threshold set to {} seconds", seconds);
    }

    /// Get idle threshold in seconds
    pub fn get_idle_threshold(&self) -> u64 {
        self.idle_threshold_secs.load(Ordering::SeqCst)
    }

    /// Get last state change timestamp
    pub fn get_last_state_change(&self) -> i64 {
        self.last_state_change.load(Ordering::SeqCst) as i64
    }

    /// Update state based on current idle time
    /// Returns true if state changed
    pub fn update(&self, idle_time: Duration) -> bool {
        let threshold = Duration::from_secs(self.idle_threshold_secs.load(Ordering::SeqCst));
        let current = self.get_state();

        let new_state = if idle_time >= threshold {
            SystemState::Idle
        } else {
            SystemState::Online
        };

        if current != new_state {
            *self.current_state.write().unwrap() = new_state;
            self.last_state_change.store(
                chrono::Utc::now().timestamp_millis() as u64,
                Ordering::SeqCst,
            );
            log::info!("System state changed: {:?} -> {:?}", current, new_state);
            true
        } else {
            false
        }
    }

    /// Set state to offline (e.g., when system is sleeping)
    pub fn set_offline(&self) {
        let current = self.get_state();
        if current != SystemState::Offline {
            *self.current_state.write().unwrap() = SystemState::Offline;
            self.last_state_change.store(
                chrono::Utc::now().timestamp_millis() as u64,
                Ordering::SeqCst,
            );
            log::info!("System state changed to OFFLINE");
        }
    }

    /// Set state back to online
    pub fn set_online(&self) {
        let current = self.get_state();
        if current != SystemState::Online {
            *self.current_state.write().unwrap() = SystemState::Online;
            self.last_state_change.store(
                chrono::Utc::now().timestamp_millis() as u64,
                Ordering::SeqCst,
            );
            log::info!("System state changed to ONLINE");
        }
    }
}

impl Default for StateMonitor {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Idle Time Detection (Platform-specific)
// ============================================================================

/// Get system idle time
///
/// Returns the duration since last user input (keyboard/mouse)
#[cfg(target_os = "macos")]
pub fn get_idle_time() -> Duration {
    get_idle_time_iokit().unwrap_or(Duration::ZERO)
}

#[cfg(target_os = "macos")]
fn get_idle_time_iokit() -> Option<Duration> {
    // IOKit-based idle time detection
    use core_foundation::base::TCFType;
    use core_foundation::number::CFNumber;
    use core_foundation::string::CFString;
    use std::ffi::c_void;

    #[link(name = "IOKit", kind = "framework")]
    extern "C" {
        fn IOServiceGetMatchingService(mainPort: u32, matching: *const c_void) -> u32;
        fn IOServiceMatching(name: *const i8) -> *mut c_void;
        fn IORegistryEntryCreateCFProperty(
            entry: u32,
            key: *const c_void,
            allocator: *const c_void,
            options: u32,
        ) -> *const c_void;
        fn IOObjectRelease(object: u32) -> i32;
    }

    unsafe {
        let matching = IOServiceMatching(c"IOHIDSystem".as_ptr());
        if matching.is_null() {
            log::warn!("Failed to create IOHIDSystem matching dictionary");
            return None;
        }

        let service = IOServiceGetMatchingService(0, matching);
        if service == 0 {
            log::warn!("Failed to get IOHIDSystem service");
            return None;
        }

        let key = CFString::new("HIDIdleTime");
        let property = IORegistryEntryCreateCFProperty(
            service,
            key.as_concrete_TypeRef() as *const c_void,
            std::ptr::null(),
            0,
        );

        IOObjectRelease(service);

        if property.is_null() {
            log::warn!("Failed to get HIDIdleTime property");
            return None;
        }

        // Property is a CFNumber containing nanoseconds
        let cf_number = CFNumber::wrap_under_get_rule(property as *const _);
        let nanoseconds: i64 = cf_number.to_i64()?;

        Some(Duration::from_nanos(nanoseconds as u64))
    }
}

#[cfg(target_os = "windows")]
pub fn get_idle_time() -> Duration {
    use std::mem::size_of;

    #[repr(C)]
    struct LASTINPUTINFO {
        cb_size: u32,
        dw_time: u32,
    }

    #[link(name = "user32")]
    extern "system" {
        fn GetLastInputInfo(plii: *mut LASTINPUTINFO) -> i32;
        fn GetTickCount() -> u32;
    }

    unsafe {
        let mut info = LASTINPUTINFO {
            cb_size: size_of::<LASTINPUTINFO>() as u32,
            dw_time: 0,
        };

        if GetLastInputInfo(&mut info) != 0 {
            let current_tick = GetTickCount();
            let idle_ms = current_tick.wrapping_sub(info.dw_time);
            Duration::from_millis(idle_ms as u64)
        } else {
            Duration::ZERO
        }
    }
}

#[cfg(target_os = "linux")]
pub fn get_idle_time() -> Duration {
    // For Linux, we would use X11's XScreenSaver extension
    // This is a simplified implementation
    // In production, use the `x11` crate

    // Try to read from /proc or use XScreenSaver
    Duration::ZERO
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
pub fn get_idle_time() -> Duration {
    Duration::ZERO
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_monitor_default() {
        let monitor = StateMonitor::new();
        assert_eq!(monitor.get_state(), SystemState::Online);
        assert_eq!(monitor.get_idle_threshold(), 300);
    }

    #[test]
    fn test_state_monitor_update() {
        let monitor = StateMonitor::with_threshold(Duration::from_secs(60));

        // Should stay online when idle time < threshold
        assert!(!monitor.update(Duration::from_secs(30)));
        assert_eq!(monitor.get_state(), SystemState::Online);

        // Should change to idle when idle time >= threshold
        assert!(monitor.update(Duration::from_secs(61)));
        assert_eq!(monitor.get_state(), SystemState::Idle);

        // Should change back to online
        assert!(monitor.update(Duration::from_secs(0)));
        assert_eq!(monitor.get_state(), SystemState::Online);
    }

    #[test]
    fn test_set_offline_online() {
        let monitor = StateMonitor::new();

        monitor.set_offline();
        assert_eq!(monitor.get_state(), SystemState::Offline);

        monitor.set_online();
        assert_eq!(monitor.get_state(), SystemState::Online);
    }
}
