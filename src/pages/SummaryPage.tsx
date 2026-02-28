import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import {
  BarChart3,
  Clock,
  Monitor,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Globe,
  ArrowLeft,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  subDays,
  addDays,
  eachDayOfInterval,
} from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { statsApi, type AppUsageStats, type DomainUsageStats } from "@/services/tauri-api";
import { formatDuration, stringToColor } from "@/lib/utils";

type TimeRangeType = "day" | "week" | "month";

// Known browser app names that support domain tracking
const KNOWN_BROWSERS = [
  "Google Chrome",
  "Safari",
  "Arc",
  "Microsoft Edge",
  "Brave Browser",
  "Firefox",
  "Opera",
  "Vivaldi",
];

// Daily stats for each day
interface DailyStats {
  date: Date;
  dateLabel: string;
  dayLabel: string;
  totalDuration: number;
  apps: Record<string, number>;
}

// Custom Tooltip for Daily Chart
const DailyChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-slate-600 dark:text-slate-400" style={{ color: entry.color }}>
            {entry.name}: {formatDuration(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg shadow-lg text-sm z-50">
        <p className="font-medium text-slate-900 dark:text-slate-100">{data.app}</p>
        <p className="text-slate-500 dark:text-slate-400">
          {formatDuration(data.totalDuration)}
        </p>
      </div>
    );
  }
  return null;
};

export function SummaryPage() {
  const { t, i18n } = useTranslation("summary");
  const locale = i18n.language === "zh-CN" ? zhCN : enUS;

  const [rangeType, setRangeType] = useState<TimeRangeType>("day");
  const [baseDate, setBaseDate] = useState(new Date());
  const [stats, setStats] = useState<AppUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Week view specific state
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showAppSelector, setShowAppSelector] = useState(false);

  // Domain drill-down state
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [domainStats, setDomainStats] = useState<DomainUsageStats[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);

  // Calculate date range based on type
  const dateRange = useMemo(() => {
    switch (rangeType) {
      case "day":
        return {
          start: startOfDay(baseDate).getTime(),
          end: endOfDay(baseDate).getTime(),
          label: format(baseDate, "PPPP", { locale }),
        };
      case "week":
        return {
          start: startOfWeek(baseDate, { weekStartsOn: 1 }).getTime(),
          end: endOfWeek(baseDate, { weekStartsOn: 1 }).getTime(),
          label: `${t("range.week")} ${format(startOfWeek(baseDate, { weekStartsOn: 1 }), "PP", { locale })} - ${format(endOfWeek(baseDate, { weekStartsOn: 1 }), "PP", { locale })}`,
        };
      case "month":
        return {
          start: startOfMonth(baseDate).getTime(),
          end: endOfMonth(baseDate).getTime(),
          label: format(baseDate, "MMMM yyyy", { locale }),
        };
    }
  }, [rangeType, baseDate, locale, t]);

  // Fetch stats when date range changes
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await statsApi.getAppUsageStats(dateRange.start, dateRange.end);
        setStats(data);

        // For week view, also fetch daily breakdown
        if (rangeType === "week") {
          const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

          const dailyData: DailyStats[] = await Promise.all(
            days.map(async (day) => {
              const dayStart = startOfDay(day).getTime();
              const dayEnd = endOfDay(day).getTime();
              const dayStats = await statsApi.getAppUsageStats(dayStart, dayEnd);

              const apps: Record<string, number> = {};
              dayStats.forEach(s => {
                apps[s.app] = s.totalDuration;
              });

              return {
                date: day,
                dateLabel: format(day, "M/d", { locale }),
                dayLabel: format(day, "EEE", { locale }),
                totalDuration: dayStats.reduce((sum, s) => sum + s.totalDuration, 0),
                apps,
              };
            })
          );

          setDailyStats(dailyData);

          // Auto-select top 3 apps if none selected
          if (selectedApps.length === 0 && data.length > 0) {
            setSelectedApps(data.slice(0, 3).map(s => s.app));
          }
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [dateRange, rangeType, baseDate, locale]);

  // Calculate summary stats
  const totalTime = stats.reduce((acc, s) => acc + s.totalDuration, 0);
  const appsUsed = stats.length;
  const topApp = stats[0];

  // Navigate date range
  const handlePrev = () => {
    switch (rangeType) {
      case "day":
        setBaseDate(subDays(baseDate, 1));
        break;
      case "week":
        setBaseDate(subDays(baseDate, 7));
        break;
      case "month":
        setBaseDate(subDays(startOfMonth(baseDate), 1));
        break;
    }
  };

  const handleNext = () => {
    switch (rangeType) {
      case "day":
        setBaseDate(addDays(baseDate, 1));
        break;
      case "week":
        setBaseDate(addDays(baseDate, 7));
        break;
      case "month":
        setBaseDate(addDays(endOfMonth(baseDate), 1));
        break;
    }
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  // Handle clicking on a browser app to show domain breakdown
  const handleAppClick = async (appName: string) => {
    // Only handle browsers
    if (!KNOWN_BROWSERS.includes(appName)) {
      return;
    }

    // Toggle if clicking same app
    if (expandedApp === appName) {
      setExpandedApp(null);
      setDomainStats([]);
      return;
    }

    setExpandedApp(appName);
    setLoadingDomains(true);

    try {
      const domains = await statsApi.getDomainUsageStats(
        dateRange.start,
        dateRange.end,
        appName
      );
      setDomainStats(domains);
    } catch (error) {
      console.error("Failed to fetch domain stats:", error);
      setDomainStats([]);
    } finally {
      setLoadingDomains(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-900 pb-4 -mx-6 px-6 pt-0">
        <h1 className="text-2xl font-bold mb-4 pt-2">{t("title")}</h1>

        {/* Date Range Controls */}
        <Card className="shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrev}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-base font-medium w-72 text-center">
                  {dateRange.label}
                </span>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  {t("range.today")}
                </Button>
              </div>

              {/* Range Type Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <Button
                  variant={rangeType === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRangeType("day")}
                >
                  {t("range.day")}
                </Button>
                <Button
                  variant={rangeType === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRangeType("week")}
                >
                  {t("range.week")}
                </Button>
                <Button
                  variant={rangeType === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRangeType("month")}
                >
                  {t("range.month")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{t("stats.totalActive")}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isLoading ? "..." : formatDuration(totalTime)}
                </h3>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{t("stats.appsUsed")}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isLoading ? "..." : appsUsed}
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-500">
                <Monitor className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all md:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 mb-1">{t("stats.mostUsedApp")}</p>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate pr-4" title={topApp?.app}>
                    {isLoading ? "..." : topApp?.app || "No Data"}
                  </h3>
                  {topApp && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      {topApp.percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end pl-4 border-l border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {isLoading ? "..." : (topApp ? formatDuration(topApp.totalDuration) : "-")}
                  </span>
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-md text-amber-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs text-slate-400">{t("stats.activityTime")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week-specific Charts */}
      {rangeType === "week" && (
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : dailyStats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <p>No data available</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          if (value === 0) return '0';
                          const hrs = Math.floor(value / 3600000);
                          return hrs > 0 ? `${hrs}h` : `${Math.floor(value / 60000)}m`;
                        }}
                      />
                      <Tooltip content={<DailyChartTooltip />} />
                      <Bar
                        dataKey="totalDuration"
                        name="Total"
                        fill="#374151"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Day labels below */}
                  <div className="flex justify-around mt-1 px-12">
                    {dailyStats.map((d) => (
                      <span key={d.dateLabel} className="text-xs text-slate-400">{d.dayLabel}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Apps Daily Trend */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  App Daily Trend
                </CardTitle>
                {/* App Selector */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAppSelector(!showAppSelector)}
                    className="flex items-center gap-2"
                  >
                    Select Apps ({selectedApps.length})
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAppSelector ? 'rotate-180' : ''}`} />
                  </Button>

                  {showAppSelector && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <p className="text-xs text-slate-500 px-2 py-1 mb-1">Select apps to compare (max 5)</p>
                        {stats.slice(0, 10).map((app) => (
                          <button
                            key={app.app}
                            onClick={() => {
                              if (selectedApps.includes(app.app)) {
                                setSelectedApps(selectedApps.filter(a => a !== app.app));
                              } else if (selectedApps.length < 5) {
                                setSelectedApps([...selectedApps, app.app]);
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedApps.includes(app.app) ? 'bg-slate-100 dark:bg-slate-700' : ''
                              }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: app.color || stringToColor(app.app) }}
                            />
                            <span className="flex-1 truncate">{app.app}</span>
                            {selectedApps.includes(app.app) && (
                              <Check className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : dailyStats.length === 0 || selectedApps.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <p>{selectedApps.length === 0 ? 'Select apps to view trend' : 'No data available'}</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          if (value === 0) return '0';
                          const hrs = Math.floor(value / 3600000);
                          return hrs > 0 ? `${hrs}h` : `${Math.floor(value / 60000)}m`;
                        }}
                      />
                      <Tooltip content={<DailyChartTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>}
                      />
                      {selectedApps.map((appName) => {
                        const appStat = stats.find(s => s.app === appName);
                        const color = appStat?.color || stringToColor(appName);
                        return (
                          <Bar
                            key={appName}
                            dataKey={`apps.${appName}`}
                            name={appName}
                            fill={color}
                            radius={[2, 2, 0, 0]}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("charts.appUsage")}</span>
              {expandedApp && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExpandedApp(null);
                    setDomainStats([]);
                  }}
                  className="text-xs"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : stats.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No data available for this period</p>
                </div>
              </div>
            ) : expandedApp ? (
              /* Domain breakdown view */
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-sm">{expandedApp} - Domains</span>
                </div>
                {loadingDomains ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
                  </div>
                ) : domainStats.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No domain data available
                  </div>
                ) : (
                  domainStats.slice(0, 10).map((domain) => (
                    <div key={domain.domain} className="flex items-center gap-3">
                      <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{domain.domain}</div>
                        <div className="text-xs text-slate-500">
                          {formatDuration(domain.totalDuration)} · {domain.pageCount} pages
                        </div>
                      </div>
                      <div className="w-20">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all bg-blue-500"
                            style={{ width: `${domain.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm text-slate-500">
                        {domain.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* App list view */
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                {stats.slice(0, 10).map((stat) => {
                  const isBrowser = KNOWN_BROWSERS.includes(stat.app);
                  return (
                    <div
                      key={stat.app}
                      className={`flex items-center gap-3 ${isBrowser ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}`}
                      onClick={() => handleAppClick(stat.app)}
                    >
                      {/* App color indicator */}
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: stat.color || stringToColor(stat.app),
                        }}
                      />
                      {/* App name */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-1">
                          {stat.app}
                          {isBrowser && <Globe className="w-3 h-3 text-slate-400" />}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDuration(stat.totalDuration)}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-24">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${stat.percentage}%`,
                              backgroundColor: stat.color || stringToColor(stat.app),
                            }}
                          />
                        </div>
                      </div>
                      {/* Percentage */}
                      <div className="w-12 text-right text-sm text-slate-500">
                        {stat.percentage.toFixed(1)}%
                      </div>
                      {/* Browser indicator */}
                      {isBrowser && (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t("charts.usageBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : stats.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start tracking to see your usage breakdown</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  {/* Donut Chart */}
                  <div className="relative w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.slice(0, 10) as any[]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="totalDuration"
                        >
                          {stats.slice(0, 10).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || stringToColor(entry.app)}
                              className="transition-opacity hover:opacity-80 cursor-pointer"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatDuration(totalTime)}
                      </span>
                      <span className="text-xs text-slate-500">{t("footer.totalTracked")}</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2 max-h-52 overflow-y-auto scrollbar-hide">
                    {stats.slice(0, 10).map((stat) => (
                      <div key={stat.app} className="py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {/* Color dot */}
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: stat.color || stringToColor(stat.app),
                            }}
                          />
                          {/* App name - full width, no truncation */}
                          <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {stat.app}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 ml-4.5 pl-0.5 text-xs text-slate-500">
                          <span>{formatDuration(stat.totalDuration)}</span>
                          <span className="font-medium">{stat.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm">
                  <div>
                    <span className="text-slate-500">{t("footer.totalTracked")}:</span>{" "}
                    <span className="font-medium">{formatDuration(totalTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("footer.applications")}:</span>{" "}
                    <span className="font-medium">{appsUsed}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
