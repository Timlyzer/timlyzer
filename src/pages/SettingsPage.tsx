import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  ColorPicker,
} from "@/components/ui";
import { useSettingsStore } from "@/stores/settings-store";
import {
  Moon,
  Sun,
  Monitor,
  Activity,
  Database,
  Download,
  Trash2,
  Palette,
  Info,
  FolderOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, formatDuration } from "@/lib/utils";
import {
  settingsApi,
  exportApi,
  trackItemApi,
  autostartApi,
  dockApi,
  type TrackedApp,
  type DatabaseInfo,
  type AppSettings,
} from "@/services/tauri-api";
import { appApi } from "@/services/tauri-api";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir, openUrl } from "@tauri-apps/plugin-opener";

type SettingsTab = "general" | "tracking" | "colors" | "data" | "about";

export function SettingsPage() {
  const { t, i18n } = useTranslation("settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [trackedApps, setTrackedApps] = useState<TrackedApp[]>([]);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [appVersion, setAppVersion] = useState("...");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isMacOS] = useState(() => navigator.userAgent.includes("Macintosh"));

  // Load settings store for theme
  const { theme, setTheme } = useSettingsStore();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const [apps, info, version, settingsData] = await Promise.all([
        settingsApi.getTrackedApps(),
        settingsApi.getDatabaseInfo(),
        appApi.getVersion(),
        settingsApi.getSettings(),
      ]);
      setTrackedApps(apps);
      setDbInfo(info);
      setAppVersion(version);
      setSettings(settingsData);

      // Load autostart status
      const autostart = await autostartApi.isEnabled();
      setAutostartEnabled(autostart);
    };
    loadData();
  }, []);

  // Save settings to backend
  const handleSaveSettings = useCallback(async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await settingsApi.saveSettings(settings);
      setExportMessage(t("messages.saved"));
      setTimeout(() => setExportMessage(""), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  // Update app color
  const handleColorChange = async (appName: string, color: string) => {
    await trackItemApi.updateTrackItemColor(appName, color);
    // Refresh tracked apps
    const apps = await settingsApi.getTrackedApps();
    setTrackedApps(apps);
  };

  // Export data
  const handleExport = async (exportFormat: "csv" | "json") => {
    setIsExporting(true);
    try {
      const now = new Date();
      const from = startOfDay(subDays(now, 30)).getTime();
      const to = endOfDay(now).getTime();

      const defaultName = `timlyzer_export_${format(now, "yyyy-MM-dd")}.${exportFormat}`;

      const filePath = await save({
        defaultPath: defaultName,
        filters: [
          {
            name: exportFormat.toUpperCase(),
            extensions: [exportFormat],
          },
        ],
      });

      if (!filePath) {
        setIsExporting(false);
        return;
      }

      const result = exportFormat === "csv"
        ? await exportApi.exportToCsv(from, to, filePath)
        : await exportApi.exportToJson(from, to, filePath);

      if (result) {
        setExportMessage(t("data.export.success", { count: result.itemsExported, format: exportFormat.toUpperCase() }));
        setTimeout(() => setExportMessage(""), 3000);
      }
    } catch (error) {
      console.error("Export error:", error);
      setExportMessage(t("data.export.failed"));
    } finally {
      setIsExporting(false);
    }
  };

  // Clear old data
  const handleClearData = async (days: number) => {
    const confirmed = confirm(
      t("data.clear.confirm", { days })
    );
    if (!confirmed) return;

    const beforeDate = startOfDay(subDays(new Date(), days)).getTime();
    const result = await settingsApi.clearDataBefore(beforeDate);
    if (result) {
      setExportMessage(t("data.clear.success", { count: result.itemsDeleted }));
      setTimeout(() => setExportMessage(""), 3000);
      // Refresh db info
      const info = await settingsApi.getDatabaseInfo();
      setDbInfo(info);
    }
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Tab navigation
  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "tabs.general", icon: <Sun className="w-4 h-4" /> },
    { id: "tracking", label: "tabs.tracking", icon: <Activity className="w-4 h-4" /> },
    { id: "colors", label: "tabs.colors", icon: <Palette className="w-4 h-4" /> },
    { id: "data", label: "tabs.data", icon: <Database className="w-4 h-4" /> },
    { id: "about", label: "tabs.about", icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Status message */}
      {exportMessage && (
        <div className="mb-4 p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-lg">
          {exportMessage}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                  activeTab === tab.id
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {tab.icon}
                {t(tab.label as any)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Tab */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("appearance.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("appearance.language")}</label>
                  <div className="flex gap-2">
                    <Button
                      variant={i18n.language === "en-US" ? "default" : "outline"}
                      size="sm"
                      onClick={() => i18n.changeLanguage("en-US")}
                      className="gap-2"
                    >
                      <span className="text-xs">🇺🇸</span> English
                    </Button>
                    <Button
                      variant={i18n.language === "zh-CN" ? "default" : "outline"}
                      size="sm"
                      onClick={() => i18n.changeLanguage("zh-CN")}
                      className="gap-2"
                    >
                      <span className="text-xs">🇨🇳</span> 中文
                    </Button>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("appearance.theme")}</label>
                  <div className="flex gap-2">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <Button
                        key={t}
                        variant={theme === t ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme(t)}
                        className="gap-2 capitalize"
                      >
                        {t === "light" && <Sun className="w-4 h-4" />}
                        {t === "dark" && <Moon className="w-4 h-4" />}
                        {t === "system" && <Monitor className="w-4 h-4" />}
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Autostart */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">{t("appearance.autostart")}</div>
                    <div className="text-sm text-slate-500">
                      {t("appearance.autostartDesc")}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const newValue = !autostartEnabled;
                      await autostartApi.setEnabled(newValue);
                      setAutostartEnabled(newValue);
                    }}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      autostartEnabled
                        ? "bg-primary-500 dark:bg-green-500"
                        : "bg-slate-300 dark:bg-slate-600 dark:ring-1 dark:ring-slate-400"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        autostartEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>

                {/* Hide Dock Icon (macOS only) */}
                {isMacOS && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium">{t("appearance.hideDock")}</div>
                      <div className="text-sm text-slate-500">
                        {t("appearance.hideDockDesc")}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!settings) return;
                        const newValue = !settings.hideDock;
                        await dockApi.setVisible(!newValue);
                        const updated = { ...settings, hideDock: newValue };
                        setSettings(updated);
                        await settingsApi.saveSettings(updated);
                      }}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        settings?.hideDock
                          ? "bg-primary-500 dark:bg-green-500"
                          : "bg-slate-300 dark:bg-slate-600 dark:ring-1 dark:ring-slate-400"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          settings?.hideDock ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </label>
                )}

                {/* Close Action */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("appearance.closeAction")}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "minimize", label: t("appearance.minimize") },
                      { value: "ask", label: t("appearance.ask") },
                      { value: "quit", label: t("appearance.quit") },
                    ].map((option) => {
                      const isSelected = settings?.closeAction === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setSettings((s) =>
                              s ? { ...s, closeAction: option.value } : s
                            )
                          }
                          className="flex items-center gap-2 cursor-pointer w-full text-left"
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                              isSelected
                                ? "border-slate-600 dark:border-green-500"
                                : "border-slate-300 dark:border-slate-500"
                            )}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-slate-600 dark:bg-green-500" />
                            )}
                          </div>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tracking Tab */}
          {activeTab === "tracking" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("tracking.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Polling Interval */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("tracking.pollingInterval")}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings?.pollingInterval || 3}
                      onChange={(e) =>
                        setSettings((s) =>
                          s
                            ? { ...s, pollingInterval: Number(e.target.value) }
                            : s
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-20">
                      {settings?.pollingInterval || 3} {t("tracking.seconds")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("tracking.pollingDesc")}
                  </p>
                </div>

                {/* Idle Threshold */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("tracking.idleThreshold")}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="60"
                      max="1800"
                      step="60"
                      value={settings?.idleThreshold || 300}
                      onChange={(e) =>
                        setSettings((s) =>
                          s
                            ? { ...s, idleThreshold: Number(e.target.value) }
                            : s
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-20">
                      {Math.floor((settings?.idleThreshold || 300) / 60)} {t("tracking.minutes")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("tracking.idleDesc")}
                  </p>
                </div>

                {/* Track URLs */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">{t("tracking.trackUrls")}</div>
                    <div className="text-sm text-slate-500">
                      {t("tracking.trackUrlsDesc")}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((s) =>
                        s ? { ...s, trackUrls: !s.trackUrls } : s
                      )
                    }
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      settings?.trackUrls
                        ? "bg-primary-500 dark:bg-green-500"
                        : "bg-slate-300 dark:bg-slate-600 dark:ring-1 dark:ring-slate-400"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        settings?.trackUrls ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>

                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Colors Tab */}
          {activeTab === "colors" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("colors.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {trackedApps.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t("colors.noApps")}</p>
                    <p className="text-sm">
                      {t("colors.desc")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {trackedApps.map((app) => (
                      <div
                        key={app.name}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <ColorPicker
                          color={app.color || "#3b82f6"}
                          onChange={(color) => handleColorChange(app.name, color)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{app.name}</div>
                          <div className="text-xs text-slate-500">
                            {formatDuration(app.totalTime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data Tab */}
          {activeTab === "data" && (
            <div className="space-y-6">
              {/* Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    {t("data.export.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500">
                    {t("data.export.desc")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport("csv")}
                      disabled={isExporting}
                    >
                      {t("data.export.btnCsv")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport("json")}
                      disabled={isExporting}
                    >
                      {t("data.export.btnJson")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Database Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    {t("data.db.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">{t("data.db.location")}:</span>
                      <div className="font-mono text-xs mt-1 truncate" title={dbInfo?.path}>
                        {dbInfo?.path || "..."}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">{t("data.db.size")}:</span>
                      <div className="font-medium mt-1">
                        {dbInfo ? formatBytes(dbInfo.sizeBytes) : "..."}
                      </div>
                    </div>
                  </div>
                  {dbInfo?.path && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => revealItemInDir(dbInfo.path)}
                    >
                      <FolderOpen className="w-4 h-4" />
                      {t("data.db.openLocation")}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Clear Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Trash2 className="w-5 h-5" />
                    {t("data.clear.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500">
                    {t("data.clear.desc")}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => handleClearData(30)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {t("data.clear.btn30")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleClearData(90)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {t("data.clear.btn90")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("about.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <img src="/logo.png" alt="Timlyzer" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
                  <h2 className="text-xl font-bold">Timlyzer</h2>
                  <p className="text-slate-500">{t("about.slogan")}</p>
                  <p className="mt-2 font-mono text-sm">v{appVersion}</p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-medium mb-2">{t("about.features.title")}</h3>
                  <ul className="text-sm text-slate-500 space-y-1">
                    <li>• {t("about.features.auto")}</li>
                    <li>• {t("about.features.window")}</li>
                    <li>• {t("about.features.idle")}</li>
                    <li>• {t("about.features.timeline")}</li>
                    <li>• {t("about.features.stats")}</li>
                    <li>• {t("about.features.export")}</li>
                  </ul>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <button
                    onClick={() => openUrl("https://github.com/Timlyzer/timlyzer")}
                    className="flex items-center justify-center gap-2 w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    {t("about.repo")}
                  </button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 text-center text-sm text-slate-500">
                  <p>{t("about.builtWith")}</p>
                  <p className="mt-2">{t("about.createdBy")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
