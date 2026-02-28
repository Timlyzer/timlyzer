import { useEffect, useRef, useCallback } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { TimelineTrack } from "./TimelineTrack";
import { TimeRuler } from "./TimeRuler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { format, subDays, addDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Radio,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui";
import { formatDuration } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { zhCN, enUS } from "date-fns/locale";

export function Timeline() {
  const { t, i18n } = useTranslation("timeline");
  const locale = i18n.language === "zh-CN" ? zhCN : enUS;
  const {
    timeRange,
    visibleRange,
    timeItems,
    isLoading,
    selectedItem,
    liveView,
    setTimeRange,
    setSelectedItem,
    setLiveView,
    fetchTimeItems,
    syncLatestItems,
    zoomIn,
    zoomOut,
    resetZoom,
    panLeft,
    panRight,
    handleWheel,
  } = useTimelineStore();

  const trackContainerRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    fetchTimeItems();
  }, [fetchTimeItems]);

  // Periodic sync when live view is enabled
  useEffect(() => {
    if (!liveView) return;

    const interval = setInterval(() => {
      syncLatestItems();
    }, 5000);

    return () => clearInterval(interval);
  }, [liveView, syncLatestItems]);

  // Handle wheel events for zoom
  const handleWheelEvent = useCallback(
    (e: WheelEvent) => {
      // Cmd/Ctrl + scroll = zoom
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleWheel(e.deltaY, 0);
      }
      // Shift + scroll or trackpad horizontal = pan
      else if (e.shiftKey || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        handleWheel(0, e.deltaX || e.deltaY);
      }
    },
    [handleWheel]
  );

  useEffect(() => {
    const container = trackContainerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => container.removeEventListener("wheel", handleWheelEvent);
  }, [handleWheelEvent]);

  const handlePrevDay = () => {
    const [start, end] = timeRange;
    setTimeRange([subDays(start, 1).getTime(), subDays(end, 1).getTime()]);
  };

  const handleNextDay = () => {
    const [start, end] = timeRange;
    setTimeRange([addDays(start, 1).getTime(), addDays(end, 1).getTime()]);
  };

  const handleToday = () => {
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const todayEnd = new Date(now).setHours(23, 59, 59, 999);
    setTimeRange([todayStart, todayEnd]);
    resetZoom();
  };

  // Calculate totals
  const totalOnlineTime = timeItems.statusItems
    .filter((item) => item.app === "ONLINE")
    .reduce((acc, item) => acc + (item.endDate - item.beginDate), 0);

  // Calculate visible duration for display
  const visibleDuration = visibleRange[1] - visibleRange[0];
  const visibleHours = visibleDuration / (1000 * 60 * 60);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-base">
                {format(timeRange[0], "PPPP", { locale })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom and View Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border-r pr-2 mr-2 border-slate-200 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomOut}
                  title={t("controls.zoomOut")}
                  className="h-8 w-8"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-center">
                  {visibleHours.toFixed(1)}h {t("controls.view")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomIn}
                  title={t("controls.zoomIn")}
                  className="h-8 w-8"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetZoom}
                  title={t("controls.resetZoom")}
                  className="h-8 w-8"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>

              {/* Pan Controls */}
              <div className="flex items-center gap-1 border-r pr-2 mr-2 border-slate-200 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={panLeft}
                  title={t("controls.panLeft")}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={panRight}
                  title={t("controls.panRight")}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* View Mode */}
              <Button variant="outline" size="sm" onClick={handleToday}>
                {t("controls.today")}
              </Button>
              <Button
                variant={liveView ? "default" : "outline"}
                size="sm"
                onClick={() => setLiveView(!liveView)}
                className="gap-1"
              >
                <Radio className="w-3 h-3" />
                {t("controls.live")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : (
            <div className="space-y-1" ref={trackContainerRef}>
              <TimeRuler visibleRange={visibleRange} />

              <TimelineTrack
                label={t("tracks.task")}
                items={timeItems.logItems}
                visibleRange={visibleRange}
                onItemClick={setSelectedItem}
                selectedItemId={selectedItem?.id}
              />

              <TimelineTrack
                label={t("tracks.status")}
                items={timeItems.statusItems}
                visibleRange={visibleRange}
                onItemClick={setSelectedItem}
                selectedItemId={selectedItem?.id}
              />

              <TimelineTrack
                label={t("tracks.app")}
                items={timeItems.appItems}
                visibleRange={visibleRange}
                onItemClick={setSelectedItem}
                selectedItemId={selectedItem?.id}
              />

              {/* Hint for zoom/pan */}
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                {t("tips")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatDuration(totalOnlineTime)}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{t("stats.onlineToday")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {timeItems.appItems.length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{t("stats.appSwitches")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {timeItems.logItems.length}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{t("stats.tasksLogged")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("selected.title")}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t("selected.app")}:</span>{" "}
                <span className="font-medium">{selectedItem.app}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t("selected.itemTitle")}:</span>{" "}
                <span className="font-medium truncate block w-full">
                  {selectedItem.title}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t("selected.start")}:</span>{" "}
                <span className="font-medium">
                  {format(selectedItem.beginDate, "HH:mm:ss")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t("selected.end")}:</span>{" "}
                <span className="font-medium">
                  {format(selectedItem.endDate, "HH:mm:ss")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t("selected.duration")}:</span>{" "}
                <span className="font-medium">
                  {formatDuration(selectedItem.endDate - selectedItem.beginDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t("selected.type")}:</span>{" "}
                <span className="font-medium">{selectedItem.taskName}</span>
              </div>
              {selectedItem.url && (
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400">{t("selected.url")}:</span>{" "}
                  <span className="font-medium truncate block">{selectedItem.url}</span>
                </div>
              )}
              {selectedItem.color && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">{t("selected.color")}:</span>
                  <div
                    className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: selectedItem.color }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
