import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "@/types";

interface SettingsStore extends Settings {
  // Actions
  setTheme: (theme: Settings["theme"]) => void;
  setPollingInterval: (interval: number) => void;
  setIdleThreshold: (threshold: number) => void;
  setStartMinimized: (enabled: boolean) => void;
  setStartOnBoot: (enabled: boolean) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Default settings
      theme: "system",
      pollingInterval: 3,
      idleThreshold: 300, // 5 minutes
      startMinimized: false,
      startOnBoot: false,

      // Actions
      setTheme: (theme) => set({ theme }),

      setPollingInterval: (pollingInterval) => set({ pollingInterval }),

      setIdleThreshold: (idleThreshold) => set({ idleThreshold }),

      setStartMinimized: (startMinimized) => set({ startMinimized }),

      setStartOnBoot: (startOnBoot) => set({ startOnBoot }),

      toggleTheme: () => {
        const current = get().theme;
        const next = current === "dark" ? "light" : "dark";
        set({ theme: next });
      },
    }),
    {
      name: "timlyzer-settings",
    }
  )
);
