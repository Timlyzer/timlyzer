import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui";
import {
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";
import { trackItemApi } from "@/services/tauri-api";
import type { TrackItem, TrackItemType } from "@/types";
import { formatDuration, stringToColor } from "@/lib/utils";
import { useTranslation, Trans } from "react-i18next";

const PAGE_SIZE = 20;

type DateRangePreset = "today" | "7days" | "30days" | "all";

export function SearchPage() {
  const { t } = useTranslation(["search", "common"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangePreset>("7days");
  const [taskFilter, setTaskFilter] = useState<TrackItemType | "all">("all");
  const [results, setResults] = useState<TrackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Calculate date range values
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return {
          from: startOfDay(now).getTime(),
          to: endOfDay(now).getTime(),
          label: t("dateRange.today"),
        };
      case "7days":
        return {
          from: startOfDay(subDays(now, 7)).getTime(),
          to: endOfDay(now).getTime(),
          label: t("dateRange.7days"),
        };
      case "30days":
        return {
          from: startOfDay(subDays(now, 30)).getTime(),
          to: endOfDay(now).getTime(),
          label: t("dateRange.30days"),
        };
      case "all":
        return {
          from: 0,
          to: endOfDay(now).getTime(),
          label: t("dateRange.all"),
        };
    }
  }, [dateRange, t]);

  // Search function
  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);

    const { from, to } = getDateRange();

    try {
      const result = await trackItemApi.searchItems({
        from,
        to,
        taskName: taskFilter === "all" ? undefined : taskFilter,
        searchStr: searchQuery || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      setResults(result.data);
      setTotal(result.total);
      setTotalDuration(result.totalDuration || 0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, searchQuery, taskFilter, page]);

  // Search on enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1);
      handleSearch();
    }
  };

  // Reload when page changes
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [page]);

  // Calculate pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Delete item
  const handleDelete = async (id: number) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      await trackItemApi.deleteByIds([id]);
      // Refresh results
      handleSearch();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-slate-500">{t("subtitle")}</p>
      </div>

      {/* Search Bar Section */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative group z-10">
          <div className="absolute inset-0 bg-slate-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl" />
          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 p-1.5 pl-4">
            <SearchIcon className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={t("placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full bg-transparent border-none !border-none !ring-0 !shadow-none !outline-none focus:outline-none focus:ring-0 px-3 py-2 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 my-auto shrink-0">
              <div className="relative flex items-center">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
                  className="appearance-none bg-transparent pl-3 !pr-14 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-0 !border-none !ring-0 !shadow-none cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <option value="today">{t("dateRange.today")}</option>
                  <option value="7days">{t("dateRange.7days")}</option>
                  <option value="30days">{t("dateRange.30days")}</option>
                  <option value="all">{t("dateRange.all")}</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4 text-slate-500 -rotate-90" />
                </div>
              </div>
            </div>

            <Button
              onClick={() => { setPage(1); handleSearch(); }}
              className="ml-2 rounded-xl px-6"
            >
              {t("button")}
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex justify-center gap-2 mt-4">
          {[
            { label: t("filters.all"), value: "all" },
            { label: t("filters.apps"), value: "AppTrackItem" },
            { label: t("filters.tasks"), value: "LogTrackItem" },
            { label: t("filters.status"), value: "StatusTrackItem" },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setTaskFilter(type.value as TrackItemType | "all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${taskFilter === type.value
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {hasSearched && (
          <div className="flex items-center justify-between text-sm text-slate-500 px-2">
            <span>
              <Trans
                i18nKey="results"
                ns="search"
                count={total}
                values={{ count: total, duration: formatDuration(totalDuration) }}
                components={{ bold: <strong /> }}
              />
            </span>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span>
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4" />
            <p className="text-slate-500">Searching your timeline...</p>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-20 opacity-50 select-none">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <SearchIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t("ready.title")}</h3>
            <p className="text-slate-500 mt-1">{t("ready.desc")}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 select-none">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <SearchIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t("noResults.title")}</h3>
            <p className="text-slate-500 mt-1">{t("noResults.desc")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
              >
                {/* Time Block */}
                <div className="flex flex-col items-center min-w-[4rem] text-center border-r border-slate-100 dark:border-slate-700 pr-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {format(item.beginDate, "MMM d")}
                  </span>
                  <span className="text-lg font-mono font-medium text-slate-700 dark:text-slate-200">
                    {format(item.beginDate, "HH:mm")}
                  </span>
                </div>

                {/* App Icon/Color */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ backgroundColor: `${item.color || stringToColor(item.app)}20` }} // 20% opacity background
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || stringToColor(item.app) }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.app}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 tracking-wider">
                      {item.taskName?.replace("TrackItem", "") || "APP"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {item.title || "No description"}
                  </p>
                </div>

                {/* Duration & Actions */}
                <div className="flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-700/50">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {formatDuration(item.endDate - item.beginDate)}
                    </div>
                    <div className="text-xs text-slate-400">{t("duration")}</div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      item.id && handleDelete(item.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
