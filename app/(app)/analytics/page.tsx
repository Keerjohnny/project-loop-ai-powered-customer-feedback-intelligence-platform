"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { TrendingUp, BarChart3, Filter, Sparkles, Loader2, Calendar } from "lucide-react";

type Feedback = {
  id: string;
  customerLabel: string;
  channel: string;
  content: string;
  status: string;
  sentiment: string | null;
  sentimentScore: number | null;
  theme: string | null;
  createdAt: string;
};

type FilterState = {
  sentiment: string;
  channel: string;
  theme: string;
  search: string;
};

const PIE_COLORS = ["#10b981", "#f43f5e", "#f59e0b"];

export default function AnalyticsPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    sentiment: "ALL",
    channel: "ALL",
    theme: "ALL",
    search: "",
  });

  const [workspaceId] = useState(() => {
    if (typeof window === "undefined") return "";
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return "";
    try {
      return JSON.parse(storedUser)?.workspaceId || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (!workspaceId) return;

    async function loadFeedback() {
      setLoading(true);
      try {
        const res = await fetch(`/api/feedback?workspaceId=${workspaceId}`);
        const data = await res.json();
        if (data.success) {
          setFeedbacks(data.feedback || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadFeedback();
  }, [workspaceId]);

  // Unique list options
  const channelsList = useMemo(() => {
    const list = new Set(feedbacks.map((f) => f.channel));
    return Array.from(list);
  }, [feedbacks]);

  const themesList = useMemo(() => {
    const list = new Set(feedbacks.map((f) => f.theme).filter(Boolean));
    return Array.from(list) as string[];
  }, [feedbacks]);

  // Filtered feedbacks
  const filteredData = useMemo(() => {
    return feedbacks.filter((item) => {
      const matchSentiment =
        filters.sentiment === "ALL" ||
        item.sentiment?.toUpperCase() === filters.sentiment;
      const matchChannel =
        filters.channel === "ALL" || item.channel === filters.channel;
      const matchTheme =
        filters.theme === "ALL" || item.theme === filters.theme;
      const matchSearch =
        !filters.search ||
        item.content.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.customerLabel.toLowerCase().includes(filters.search.toLowerCase());

      return matchSentiment && matchChannel && matchTheme && matchSearch;
    });
  }, [feedbacks, filters]);

  // Metrics computation
  const stats = useMemo(() => {
    const total = filteredData.length;
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let sumScore = 0;
    let scoredCount = 0;

    filteredData.forEach((f) => {
      const s = f.sentiment?.toUpperCase() || "NEUTRAL";
      if (s === "POSITIVE") positive++;
      else if (s === "NEGATIVE") negative++;
      else neutral++;

      if (typeof f.sentimentScore === "number") {
        sumScore += f.sentimentScore;
        scoredCount++;
      }
    });

    const averageScore = scoredCount > 0 ? (sumScore / scoredCount).toFixed(2) : "0.0";

    return { total, positive, negative, neutral, averageScore };
  }, [filteredData]);

  // Chart 1: Volume over time (grouped by day)
  const volumeChartData = useMemo(() => {
    const counts: Record<string, { Date: string; Positive: number; Negative: number; Neutral: number; Total: number }> = {};
    
    filteredData.forEach((f) => {
      const d = new Date(f.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" });
      const s = f.sentiment?.toUpperCase() || "NEUTRAL";
      
      if (!counts[d]) {
        counts[d] = { Date: d, Positive: 0, Negative: 0, Neutral: 0, Total: 0 };
      }
      
      counts[d].Total++;
      if (s === "POSITIVE") counts[d].Positive++;
      else if (s === "NEGATIVE") counts[d].Negative++;
      else counts[d].Neutral++;
    });

    // Sort chronologically by converting Date back to compare index
    return Object.values(counts).sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
  }, [filteredData]);

  // Chart 2: Channel distribution
  const channelChartData = useMemo(() => {
    const counts: Record<string, { name: string; Positive: number; Negative: number; Neutral: number }> = {};
    
    filteredData.forEach((f) => {
      const c = f.channel;
      const s = f.sentiment?.toUpperCase() || "NEUTRAL";
      
      if (!counts[c]) {
        counts[c] = { name: c, Positive: 0, Negative: 0, Neutral: 0 };
      }
      
      if (s === "POSITIVE") counts[c].Positive++;
      else if (s === "NEGATIVE") counts[c].Negative++;
      else counts[c].Neutral++;
    });

    return Object.values(counts);
  }, [filteredData]);

  // Chart 3: Theme distribution
  const themeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((f) => {
      const t = f.theme || "General/Unassigned";
      counts[t] = (counts[t] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Explore sentiment distributions, channel performance, and theme frequencies.</p>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interactive Insights Engine</span>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
          <Filter className="h-4 w-4 text-slate-450" />
          <span>Filter Records ({filteredData.length} matches)</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search</label>
            <input
              type="text"
              placeholder="Search text or customer..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-450 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sentiment</label>
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters((prev) => ({ ...prev, sentiment: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-slate-850 dark:text-zinc-350 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEGATIVE">Negative</option>
              <option value="NEUTRAL">Neutral</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters((prev) => ({ ...prev, channel: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-slate-850 dark:text-zinc-350 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="ALL">All Ingestion Sources</option>
              {channelsList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Theme Class</label>
            <select
              value={filters.theme}
              onChange={(e) => setFilters((prev) => ({ ...prev, theme: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-slate-850 dark:text-zinc-350 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="ALL">All Categories</option>
              {themesList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-450">Assembling interactive analytics charts...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4">
          <p className="text-sm text-slate-400 font-semibold">No feedback records found to analyze.</p>
        </div>
      ) : (
        <>
          {/* Summary Stat Widgets */}
          <div className="grid gap-4 md:grid-cols-5">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Filtered Records</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Positive Sentiment</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.positive}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Negative Sentiment</p>
              <p className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-450">{stats.negative}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Neutral Sentiment</p>
              <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.neutral}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm bg-gradient-to-br from-indigo-50/20 dark:from-indigo-950/10">
              <p className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Avg Sentiment Score</p>
              <p className="mt-2 text-2xl font-extrabold text-indigo-650 dark:text-indigo-455">{stats.averageScore}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Chart 1: Volume shifts over time */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Volume Trend over Time</h3>
                    <p className="text-xxs text-slate-500 dark:text-zinc-400">Chronological feedback activity timeline</p>
                  </div>
                </div>
              </div>
              <div className="h-72">
                {volumeChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No chronological datapoints available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="Date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                        labelStyle={{ fontWeight: "bold" }}
                      />
                      <Area type="monotone" dataKey="Total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#totalColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Channel Ingestion Stacked Bar */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <BarChart3 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Channel Performance</h3>
                    <p className="text-xxs text-slate-500 dark:text-zinc-400">Sentiment distribution grouped by ingestion source</p>
                  </div>
                </div>
              </div>
              <div className="h-72">
                {channelChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No channel groupings available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                      />
                      <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }} />
                      <Bar dataKey="Positive" stackId="a" fill="#10b981" barSize={24} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" barSize={24} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Negative" stackId="a" fill="#f43f5e" barSize={24} radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Theme Categories share */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm xl:col-span-2">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">Theme Breakdown & Frequencies</h3>
                <p className="text-xxs text-slate-500 dark:text-zinc-400">Distribution share of intelligence categories identified by model clustering</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 items-center">
                <div className="h-64 flex justify-center items-center">
                  {themeChartData.length === 0 ? (
                    <p className="text-xs text-slate-400">No themes categorised.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={themeChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          cx="50%"
                          cy="50%"
                        >
                          {themeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Legend list details */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {themeChartData.map((item, idx) => {
                    const pct = stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.name} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-850 px-4 py-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-450 dark:text-zinc-550">{item.value} reviews ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}