"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Calendar, 
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronRight
} from "lucide-react";

type Period = 7 | 30 | 90;

type ThemeTrendPoint = {
  date: string;
  count: number;
};

type ThemeTrend = {
  theme: string;
  totalFeedback: number;
  previousPeriodCount: number;
  currentPeriodCount: number;
  percentageChange: number;
  trend: "up" | "down" | "flat";
  lineChart: ThemeTrendPoint[];
};

type ThemeFeedback = {
  id: string;
  customerLabel: string;
  channel: string;
  content: string;
  sentiment: string | null;
  theme: string | null;
  summary: string | null;
  recommendation: string | null;
  createdAt: string;
};

type StoredUser = {
  id?: string;
  workspaceId?: string;
  workspace?: {
    id?: string;
  };
};

const PERIODS: Array<{ label: string; value: Period }> = [
  { label: "Last 7 Days", value: 7 },
  { label: "Last 30 Days", value: 30 },
  { label: "Last 90 Days", value: 90 },
];

function getStoredUser(): StoredUser | null {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? (JSON.parse(storedUser) as StoredUser) : null;
  } catch {
    return null;
  }
}

function formatChange(value: number) {
  return value > 0 ? `+${value}%` : `${value}%`;
}

function Sparkline({ points }: { points: ThemeTrendPoint[] }) {
  const max = Math.max(...points.map((point) => point.count), 1);
  const width = 240;
  const height = 64;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  
  const pointsPath = points.map((point, index) => {
    const x = index * step;
    const y = height - (point.count / max) * (height - 12) - 6;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  
  const linePath = pointsPath.length > 0 ? "M " + pointsPath.join(" L ") : `M 0 ${height / 2} L ${width} ${height / 2}`;
  const areaPath = pointsPath.length > 0 ? `${linePath} L ${width} ${height} L 0 ${height} Z` : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#sparklineGrad)" />}
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ThemeTrendsPage() {
  const [period, setPeriod] = useState<Period>(30);
  const [trends, setTrends] = useState<ThemeTrend[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<ThemeFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTrend = useMemo(
    () => trends.find((item) => item.theme === selectedTheme) ?? trends[0] ?? null,
    [selectedTheme, trends]
  );

  async function fetchTrends(nextPeriod: Period, theme?: string) {
    const user = getStoredUser();
    const workspaceId = user?.workspaceId || user?.workspace?.id;

    if (!workspaceId) {
      setError("Workspace information was not found. Please log in again.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      workspaceId,
      period: String(nextPeriod),
    });

    if (theme) {
      params.set("theme", theme);
    }

    const res = await fetch(`/api/theme-trends?${params.toString()}`, {
      headers: user?.id ? { "x-user-id": user.id } : undefined,
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Unable to load theme trends.");
    }

    return data as {
      trends: ThemeTrend[];
      selectedFeedback: ThemeFeedback[];
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchTrends(period);

        if (cancelled || !data) return;

        const nextTrends = data.trends || [];
        setTrends(nextTrends);
        setSelectedFeedback([]);
        setSelectedTheme(nextTrends[0]?.theme ?? null);
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError(loadError instanceof Error ? loadError.message : "Unable to load theme trends.");
          setTrends([]);
          setSelectedFeedback([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrends();

    return () => {
      cancelled = true;
    };
  }, [period]);

  async function loadThemeFeedback(theme: string) {
    setSelectedTheme(theme);
    setFeedbackLoading(true);
    setError("");

    try {
      const data = await fetchTrends(period, theme);
      setSelectedFeedback(data?.selectedFeedback || []);
    } catch (loadError) {
      console.error(loadError);
      setSelectedFeedback([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load related feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  const getSentimentPill = (sentiment: string | null) => {
    const s = sentiment?.toUpperCase() || "NEUTRAL";
    if (s === "POSITIVE") {
      return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    }
    if (s === "NEGATIVE") {
      return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
    }
    return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Dynamic header control block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Theme Trends Analysis</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Track and compare problem frequencies across workspace time periods.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-zinc-850 p-1.5 rounded-xl gap-1">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                period === item.value
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-350"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-650 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-450">Loading theme trend datasets...</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-3">
          <TrendingUp className="h-10 w-10 text-slate-400 mx-auto" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50">No theme trend shifts detected yet</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-450 max-w-xs mx-auto">
            Once feedback data has been imported and classified, category timelines will populate here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          
          {/* Main Left Side: Themes List and Sparkline */}
          <section className="space-y-6">
            
            <div className="overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="border-b border-slate-250/60 dark:border-zinc-800 px-6 py-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50">All Ingestion Categories</h2>
                <p className="text-xxs text-slate-500 dark:text-zinc-400 mt-0.5">Click theme row to analyze associated client feedback.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-zinc-850 border-b border-slate-200 dark:border-zinc-800">
                      <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Theme Category</th>
                      <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 text-center">Total Volume</th>
                      <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 text-center">Prev Period</th>
                      <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 text-center">Current Period</th>
                      <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 text-center">Percentage Shift</th>
                      <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 text-right">Trend Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {trends.map((item) => {
                      const isActive = selectedTheme === item.theme;
                      const isUp = item.trend === "up";
                      const isDown = item.trend === "down";
                      
                      return (
                        <tr
                          key={item.theme}
                          onClick={() => loadThemeFeedback(item.theme)}
                          className={`cursor-pointer transition hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 ${
                            isActive ? "bg-indigo-50/20 dark:bg-indigo-950/10 border-l-2 border-l-indigo-650" : ""
                          }`}
                        >
                          <td className="p-4 font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-1.5">
                            <span>{item.theme}</span>
                            {isActive && <ChevronRight className="h-4 w-4 text-indigo-500" />}
                          </td>
                          <td className="p-4 text-center font-semibold text-slate-700 dark:text-zinc-350">{item.totalFeedback}</td>
                          <td className="p-4 text-center text-slate-450 dark:text-zinc-500 font-medium">{item.previousPeriodCount}</td>
                          <td className="p-4 text-center text-slate-800 dark:text-zinc-200 font-semibold">{item.currentPeriodCount}</td>
                          <td className={`p-4 text-center font-bold ${
                            isUp 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : isDown 
                              ? "text-rose-600 dark:text-rose-450" 
                              : "text-slate-550 dark:text-zinc-450"
                          }`}>
                            {formatChange(item.percentageChange)}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`inline-flex items-center gap-0.5 font-bold ${
                              isUp 
                                ? "text-emerald-600 dark:text-emerald-400" 
                                : isDown 
                                ? "text-rose-600 dark:text-rose-450" 
                                : "text-slate-500"
                            }`}>
                              {isUp ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : isDown ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Sparkline chart */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50">
                    "{selectedTrend?.theme || "Category"}" Timeline Trend
                  </h2>
                  <p className="text-xxs text-slate-500 dark:text-zinc-400">Daily frequency charts in selected period</p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 p-4">
                <Sparkline points={selectedTrend?.lineChart || []} />
              </div>
            </div>

          </section>

          {/* Right Side: Associated Feedback List */}
          <aside className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col h-fit self-start space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Related Client Reviews</h2>
              <p className="text-xxs text-slate-550 mt-0.5">
                {selectedTheme ? `Filtering by theme Category: "${selectedTheme}"` : "Click theme row to load feed reviews."}
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1.5">
              {feedbackLoading ? (
                <div className="rounded-xl bg-slate-50 dark:bg-zinc-950 p-6 flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                  <p className="text-xxs text-slate-450 dark:text-zinc-500">Retrieving feedback logs...</p>
                </div>
              ) : selectedFeedback.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Select a category row to render reviews list
                </div>
              ) : (
                selectedFeedback.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40 p-4 space-y-3 hover:border-slate-200 dark:hover:border-zinc-800 transition-all duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-zinc-200">{item.customerLabel}</p>
                      <span className="rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-xxs font-semibold text-slate-550 dark:text-zinc-400">
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-medium">"{item.content}"</p>
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-zinc-850 pt-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getSentimentPill(item.sentiment)}`}>
                        {item.sentiment || "NEUTRAL"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider ml-auto">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

        </div>
      )}
    </div>
  );
}
