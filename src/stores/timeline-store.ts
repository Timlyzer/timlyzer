import { create } from "zustand";
import { startOfDay, endOfDay, subHours, addHours } from "date-fns";
import type { TrackItem, TimelineState } from "@/types";
import { trackItemApi } from "@/services/tauri-api";

interface TimelineStore {
  // State
  timeRange: [number, number];
  visibleRange: [number, number];
  timeItems: TimelineState;
  isLoading: boolean;
  selectedItem: TrackItem | null;
  liveView: boolean;
  zoomLevel: number; // 1 = 2 hours visible, 0.5 = 4 hours, 2 = 1 hour

  // Actions
  setTimeRange: (range: [number, number]) => void;
  setVisibleRange: (range: [number, number]) => void;
  setSelectedItem: (item: TrackItem | null) => void;
  setLiveView: (enabled: boolean) => void;
  fetchTimeItems: () => Promise<void>;
  syncLatestItems: () => Promise<void>;
  
  // Zoom and pan actions
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  panLeft: () => void;
  panRight: () => void;
  handleWheel: (deltaY: number, deltaX: number) => void;
}

const now = Date.now();
const todayStart = startOfDay(now).getTime();
const todayEnd = endOfDay(now).getTime();
const defaultVisibleStart = subHours(now, 1).getTime();
const defaultVisibleEnd = addHours(now, 1).getTime();

// Zoom constants
const MIN_ZOOM = 0.25; // 4 hours visible
const MAX_ZOOM = 4; // 30 mins visible
const ZOOM_STEP = 0.25;
const BASE_VISIBLE_HOURS = 2; // At zoom level 1, show 2 hours

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  // Initial state
  timeRange: [todayStart, todayEnd],
  visibleRange: [defaultVisibleStart, defaultVisibleEnd],
  timeItems: {
    appItems: [],
    statusItems: [],
    logItems: [],
  },
  isLoading: false,
  selectedItem: null,
  liveView: true,
  zoomLevel: 1,

  // Actions
  setTimeRange: (range) => {
    set({ timeRange: range });
    get().fetchTimeItems();
  },

  setVisibleRange: (range) => set({ visibleRange: range }),

  setSelectedItem: (item) => set({ selectedItem: item }),

  setLiveView: (enabled) => {
    set({ liveView: enabled });
    if (enabled) {
      // When enabling live view, reset visible range to current time
      const now = Date.now();
      const { zoomLevel } = get();
      const halfDuration = (BASE_VISIBLE_HOURS * 60 * 60 * 1000) / (2 * zoomLevel);
      set({
        visibleRange: [now - halfDuration, now + halfDuration],
      });
    }
  },

  fetchTimeItems: async () => {
    const { timeRange } = get();
    set({ isLoading: true });

    try {
      const [appItems, statusItems, logItems] = await Promise.all([
        trackItemApi.findAllDayItems(timeRange[0], timeRange[1], "AppTrackItem"),
        trackItemApi.findAllDayItems(
          timeRange[0],
          timeRange[1],
          "StatusTrackItem"
        ),
        trackItemApi.findAllDayItems(timeRange[0], timeRange[1], "LogTrackItem"),
      ]);

      set({
        timeItems: { appItems, statusItems, logItems },
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch time items:", error);
      set({ isLoading: false });
    }
  },

  syncLatestItems: async () => {
    const { liveView, timeRange, zoomLevel } = get();
    if (!liveView) return;

    try {
      const now = Date.now();
      const [appItems, statusItems, logItems] = await Promise.all([
        trackItemApi.findAllDayItems(timeRange[0], timeRange[1], "AppTrackItem"),
        trackItemApi.findAllDayItems(
          timeRange[0],
          timeRange[1],
          "StatusTrackItem"
        ),
        trackItemApi.findAllDayItems(timeRange[0], timeRange[1], "LogTrackItem"),
      ]);

      // Calculate visible range based on zoom level
      const halfDuration = (BASE_VISIBLE_HOURS * 60 * 60 * 1000) / (2 * zoomLevel);

      set({
        timeItems: { appItems, statusItems, logItems },
        visibleRange: [now - halfDuration, now + halfDuration],
      });
    } catch (error) {
      console.error("Failed to sync latest items:", error);
    }
  },

  // Zoom functions
  zoomIn: () => {
    const { zoomLevel, visibleRange } = get();
    const newZoom = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
    if (newZoom === zoomLevel) return;

    // Zoom towards center
    const center = (visibleRange[0] + visibleRange[1]) / 2;
    const halfDuration = (BASE_VISIBLE_HOURS * 60 * 60 * 1000) / (2 * newZoom);

    set({
      zoomLevel: newZoom,
      visibleRange: [center - halfDuration, center + halfDuration],
    });
  },

  zoomOut: () => {
    const { zoomLevel, visibleRange, timeRange } = get();
    const newZoom = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
    if (newZoom === zoomLevel) return;

    // Zoom from center
    const center = (visibleRange[0] + visibleRange[1]) / 2;
    const halfDuration = (BASE_VISIBLE_HOURS * 60 * 60 * 1000) / (2 * newZoom);

    // Clamp to day boundaries
    let newStart = center - halfDuration;
    let newEnd = center + halfDuration;
    if (newStart < timeRange[0]) {
      newStart = timeRange[0];
      newEnd = newStart + halfDuration * 2;
    }
    if (newEnd > timeRange[1]) {
      newEnd = timeRange[1];
      newStart = newEnd - halfDuration * 2;
    }

    set({
      zoomLevel: newZoom,
      visibleRange: [newStart, newEnd],
    });
  },

  resetZoom: () => {
    const now = Date.now();
    set({
      zoomLevel: 1,
      visibleRange: [subHours(now, 1).getTime(), addHours(now, 1).getTime()],
      liveView: true,
    });
  },

  panLeft: () => {
    const { visibleRange, timeRange } = get();
    const duration = visibleRange[1] - visibleRange[0];
    const panAmount = duration * 0.25; // Pan by 25% of visible range
    
    let newStart = visibleRange[0] - panAmount;
    let newEnd = visibleRange[1] - panAmount;
    
    // Clamp to day start
    if (newStart < timeRange[0]) {
      newStart = timeRange[0];
      newEnd = newStart + duration;
    }
    
    set({ 
      visibleRange: [newStart, newEnd],
      liveView: false, // Disable live view when panning
    });
  },

  panRight: () => {
    const { visibleRange, timeRange } = get();
    const duration = visibleRange[1] - visibleRange[0];
    const panAmount = duration * 0.25;
    
    let newStart = visibleRange[0] + panAmount;
    let newEnd = visibleRange[1] + panAmount;
    
    // Clamp to day end
    if (newEnd > timeRange[1]) {
      newEnd = timeRange[1];
      newStart = newEnd - duration;
    }
    
    set({ 
      visibleRange: [newStart, newEnd],
      liveView: false,
    });
  },

  handleWheel: (deltaY: number, deltaX: number) => {
    const { visibleRange, timeRange } = get();
    const duration = visibleRange[1] - visibleRange[0];
    
    // Horizontal scroll = pan
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const panAmount = (deltaX / 100) * duration * 0.1;
      let newStart = visibleRange[0] + panAmount;
      let newEnd = visibleRange[1] + panAmount;
      
      // Clamp
      if (newStart < timeRange[0]) {
        newStart = timeRange[0];
        newEnd = newStart + duration;
      }
      if (newEnd > timeRange[1]) {
        newEnd = timeRange[1];
        newStart = newEnd - duration;
      }
      
      set({ 
        visibleRange: [newStart, newEnd],
        liveView: false,
      });
    } else {
      // Vertical scroll = zoom (with Ctrl/Cmd key, handled by component)
      // This function handles trackpad pinch zoom
      if (deltaY > 0) {
        get().zoomOut();
      } else if (deltaY < 0) {
        get().zoomIn();
      }
    }
  },
}));
