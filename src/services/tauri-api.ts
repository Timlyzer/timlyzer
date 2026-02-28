import { invoke } from "@tauri-apps/api/core";
import type {
  TrackItem,
  TrackItemType,
  SearchParams,
  SearchResult,
} from "@/types";

// ============================================================================
// Types for Tracking API
// ============================================================================

/**
 * System state enum
 */
export type SystemState = "ONLINE" | "IDLE" | "OFFLINE";

/**
 * Window information from active window detection
 */
export interface WindowInfo {
  appName: string;
  title: string;
  processId: number;
  url?: string;
}

/**
 * Tracking status
 */
export interface TrackingStatus {
  isRunning: boolean;
  isPaused: boolean;
  currentState: SystemState;
  currentApp?: string;
  currentTitle?: string;
}

/**
 * App usage statistics
 */
export interface AppUsageStats {
  app: string;
  totalDuration: number;
  percentage: number;
  color?: string;
}

// ============================================================================
// Track Item API - Communication with Tauri backend
// ============================================================================

export const trackItemApi = {
  /**
   * Find all items for a day
   */
  findAllDayItems: async (
    from: number,
    to: number,
    taskName: TrackItemType
  ): Promise<TrackItem[]> => {
    try {
      return await invoke<TrackItem[]>("find_all_day_items", {
        from,
        to,
        taskName,
      });
    } catch (error) {
      console.error("findAllDayItems error:", error);
      return [];
    }
  },

  /**
   * Create a new track item
   */
  createTrackItem: async (trackItem: TrackItem): Promise<TrackItem | null> => {
    try {
      return await invoke<TrackItem>("create_track_item", { trackItem });
    } catch (error) {
      console.error("createTrackItem error:", error);
      return null;
    }
  },

  /**
   * Update an existing track item
   */
  updateTrackItem: async (trackItem: TrackItem): Promise<TrackItem | null> => {
    try {
      return await invoke<TrackItem>("update_track_item", { trackItem });
    } catch (error) {
      console.error("updateTrackItem error:", error);
      return null;
    }
  },

  /**
   * Delete track items by IDs
   */
  deleteByIds: async (ids: number[]): Promise<void> => {
    try {
      await invoke("delete_by_ids", { ids });
    } catch (error) {
      console.error("deleteByIds error:", error);
    }
  },

  /**
   * Search track items
   */
  searchItems: async (params: SearchParams): Promise<SearchResult> => {
    try {
      return await invoke<SearchResult>("search_items", {
        from: params.from,
        to: params.to,
        taskName: params.taskName,
        searchStr: params.searchStr,
        limit: params.limit,
        offset: params.offset,
      });
    } catch (error) {
      console.error("searchItems error:", error);
      return { data: [], total: 0 };
    }
  },

  /**
   * Update track item color
   */
  updateTrackItemColor: async (
    appName: string,
    color: string
  ): Promise<void> => {
    try {
      await invoke("update_track_item_color", { appName, color });
    } catch (error) {
      console.error("updateTrackItemColor error:", error);
    }
  },
};

// ============================================================================
// Tracking API - Controls for time tracking
// ============================================================================

export const trackingApi = {
  /**
   * Get current active window info
   */
  getCurrentWindow: async (): Promise<WindowInfo | null> => {
    try {
      return await invoke<WindowInfo>("get_current_window");
    } catch (error) {
      console.error("getCurrentWindow error:", error);
      return null;
    }
  },

  /**
   * Get tracking status
   */
  getStatus: async (): Promise<TrackingStatus | null> => {
    try {
      return await invoke<TrackingStatus>("get_tracking_status");
    } catch (error) {
      console.error("getStatus error:", error);
      return null;
    }
  },

  /**
   * Start tracking
   */
  start: async (): Promise<void> => {
    try {
      await invoke("start_tracking");
    } catch (error) {
      console.error("startTracking error:", error);
    }
  },

  /**
   * Stop tracking
   */
  stop: async (): Promise<void> => {
    try {
      await invoke("stop_tracking");
    } catch (error) {
      console.error("stopTracking error:", error);
    }
  },

  /**
   * Pause tracking
   */
  pause: async (): Promise<void> => {
    try {
      await invoke("pause_tracking");
    } catch (error) {
      console.error("pauseTracking error:", error);
    }
  },

  /**
   * Resume tracking
   */
  resume: async (): Promise<void> => {
    try {
      await invoke("resume_tracking");
    } catch (error) {
      console.error("resumeTracking error:", error);
    }
  },

  /**
   * Get current idle time in seconds
   */
  getIdleTime: async (): Promise<number> => {
    try {
      return await invoke<number>("get_idle_time_command");
    } catch (error) {
      console.error("getIdleTime error:", error);
      return 0;
    }
  },
};

// ============================================================================
// Statistics API
// ============================================================================

/**
 * Domain usage statistics for browser breakdown
 */
export interface DomainUsageStats {
  domain: string;
  totalDuration: number;
  percentage: number;
  pageCount: number;
}

export const statsApi = {
  /**
   * Get app usage statistics for a time range
   */
  getAppUsageStats: async (
    from: number,
    to: number
  ): Promise<AppUsageStats[]> => {
    try {
      return await invoke<AppUsageStats[]>("get_app_usage_stats", { from, to });
    } catch (error) {
      console.error("getAppUsageStats error:", error);
      return [];
    }
  },

  /**
   * Get domain usage statistics for a specific browser app
   */
  getDomainUsageStats: async (
    from: number,
    to: number,
    appName: string
  ): Promise<DomainUsageStats[]> => {
    try {
      return await invoke<DomainUsageStats[]>("get_domain_usage_stats", {
        from,
        to,
        appName,
      });
    } catch (error) {
      console.error("getDomainUsageStats error:", error);
      return [];
    }
  },
};

// ============================================================================
// Settings API
// ============================================================================

export interface AppSettings {
  theme: string;
  autoStart: boolean;
  closeAction: string;
  pollingInterval: number;
  idleThreshold: number;
  trackUrls: boolean;
}

export interface TrackedApp {
  name: string;
  color?: string;
  totalTime: number;
}

export interface DatabaseInfo {
  path: string;
  sizeBytes: number;
}

export interface ClearResult {
  itemsDeleted: number;
}

export interface ExportResult {
  success: boolean;
  itemsExported: number;
  filePath: string;
}

export const settingsApi = {
  /**
   * Get application settings
   */
  getSettings: async (): Promise<AppSettings> => {
    try {
      return await invoke<AppSettings>("get_settings");
    } catch (error) {
      console.error("getSettings error:", error);
      return {
        theme: "system",
        autoStart: false,
        closeAction: "minimize",
        pollingInterval: 3,
        idleThreshold: 300,
        trackUrls: false,
      };
    }
  },

  /**
   * Save application settings
   */
  saveSettings: async (settings: AppSettings): Promise<void> => {
    try {
      await invoke("save_settings", { settings });
    } catch (error) {
      console.error("saveSettings error:", error);
    }
  },

  /**
   * Get all tracked apps
   */
  getTrackedApps: async (): Promise<TrackedApp[]> => {
    try {
      return await invoke<TrackedApp[]>("get_tracked_apps");
    } catch (error) {
      console.error("getTrackedApps error:", error);
      return [];
    }
  },

  /**
   * Get database info
   */
  getDatabaseInfo: async (): Promise<DatabaseInfo | null> => {
    try {
      return await invoke<DatabaseInfo>("get_database_info");
    } catch (error) {
      console.error("getDatabaseInfo error:", error);
      return null;
    }
  },

  /**
   * Clear data before a specific date
   */
  clearDataBefore: async (beforeDate: number): Promise<ClearResult | null> => {
    try {
      return await invoke<ClearResult>("clear_data_before", { beforeDate });
    } catch (error) {
      console.error("clearDataBefore error:", error);
      return null;
    }
  },
};

// ============================================================================
// Export API
// ============================================================================

export const exportApi = {
  /**
   * Export data to CSV
   */
  exportToCsv: async (
    from: number,
    to: number,
    filePath: string,
    taskName?: string
  ): Promise<ExportResult | null> => {
    try {
      return await invoke<ExportResult>("export_to_csv", {
        from,
        to,
        taskName,
        filePath,
      });
    } catch (error) {
      console.error("exportToCsv error:", error);
      return null;
    }
  },

  /**
   * Export data to JSON
   */
  exportToJson: async (
    from: number,
    to: number,
    filePath: string,
    taskName?: string
  ): Promise<ExportResult | null> => {
    try {
      return await invoke<ExportResult>("export_to_json", {
        from,
        to,
        taskName,
        filePath,
      });
    } catch (error) {
      console.error("exportToJson error:", error);
      return null;
    }
  },
};

// ============================================================================
// App control API
// ============================================================================

export const appApi = {
  /**
   * Get app version
   */
  getVersion: async (): Promise<string> => {
    try {
      return await invoke<string>("get_app_version");
    } catch (error) {
      console.error("getVersion error:", error);
      return "unknown";
    }
  },

  /**
   * Start tracking (legacy - use trackingApi.start instead)
   */
  startTracking: async (): Promise<void> => {
    return trackingApi.start();
  },

  /**
   * Stop tracking (legacy - use trackingApi.stop instead)
   */
  stopTracking: async (): Promise<void> => {
    return trackingApi.stop();
  },
};
