/**
 * Track item types
 */
export type TrackItemType = "AppTrackItem" | "StatusTrackItem" | "LogTrackItem";

/**
 * System state types
 */
export type SystemState = "Online" | "Idle" | "Offline";

/**
 * Base track item interface
 */
export interface TrackItem {
  id?: number;
  app: string;
  taskName: TrackItemType;
  title: string;
  url?: string;
  domain?: string;
  color?: string;
  beginDate: number; // timestamp in ms
  endDate: number; // timestamp in ms
}

/**
 * App track item - automatically tracked active window
 */
export interface AppTrackItem extends TrackItem {
  taskName: "AppTrackItem";
}

/**
 * Status track item - system state (online/idle/offline)
 */
export interface StatusTrackItem extends TrackItem {
  taskName: "StatusTrackItem";
  app: SystemState;
}

/**
 * Log track item - manually created task
 */
export interface LogTrackItem extends TrackItem {
  taskName: "LogTrackItem";
}

/**
 * Timeline state containing all track items
 */
export interface TimelineState {
  appItems: TrackItem[];
  statusItems: TrackItem[];
  logItems: TrackItem[];
}

/**
 * App settings for customizing app colors
 */
export interface AppSetting {
  id?: number;
  name: string;
  color?: string;
}

/**
 * General settings
 */
export interface Settings {
  theme: "light" | "dark" | "system";
  pollingInterval: number; // in seconds
  idleThreshold: number; // in seconds
  startMinimized: boolean;
  startOnBoot: boolean;
}

/**
 * Active window info from system
 */
export interface ActiveWindow {
  app: string;
  title: string;
  url?: string;
  domain?: string;
}

/**
 * Search parameters
 */
export interface SearchParams {
  from: number;
  to: number;
  taskName?: TrackItemType;
  searchStr?: string;
  limit?: number;
  offset?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  data: TrackItem[];
  total: number;
  totalDuration?: number;
}
