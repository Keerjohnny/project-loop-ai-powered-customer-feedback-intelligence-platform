"use client";

import { Sparkles, TrendingUp, Compass, PieChart, Activity } from "lucide-react";

type Props = {
  insights: {
    summary: string;
    topTheme: string;
    topChannel: string;
    recentFeedbackCount: number;
    negativeFeedbackCount: number;
    recommendations: string[];
  };
};

export default function AIInsights({ insights }: Props) {
  const positivePercent = Math.round(insights.recentFeedbackCount > 0 ? 100 : 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative colored glow ball */}
      <div className="absolute top-[-30%] right-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none"></div>

      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">AI Analyst Insights</h2>
              <p className="text-xxs text-slate-400">Groq intelligence briefing</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xxs font-semibold text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>Live Analysis</span>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="mt-5 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
          <p className="text-xs leading-relaxed text-slate-200 font-medium">
            {insights.summary}
          </p>
        </div>

        {/* Breakdown Grid */}
        <div className="mt-5 grid gap-3 grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xxs text-slate-400 font-bold uppercase tracking-wider">
              <Compass className="h-3 w-3 text-slate-500" />
              <span>Top Theme</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-100">{insights.topTheme}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xxs text-slate-400 font-bold uppercase tracking-wider">
              <Activity className="h-3 w-3 text-slate-500" />
              <span>Top Channel</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-100">{insights.topChannel}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xxs text-slate-400 font-bold uppercase tracking-wider">
              <PieChart className="h-3 w-3 text-slate-500" />
              <span>Confidence</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-100">{positivePercent}%</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xxs text-rose-400/80 font-bold uppercase tracking-wider">
              <TrendingUp className="h-3 w-3 text-rose-500" />
              <span>Volatile Items</span>
            </div>
            <p className="mt-1 text-sm font-bold text-rose-400">{insights.negativeFeedbackCount} records</p>
          </div>
        </div>
      </div>

      {/* Recommendations Banner */}
      <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 items-start">
        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-300">Action Plan Suggestion</p>
          <p className="mt-0.5 text-xxs text-emerald-100/90 leading-relaxed font-medium">
            {insights.recommendations[0] || "No actions needed: customer sentiments indicate normal operating thresholds."}
          </p>
        </div>
      </div>
    </div>
  );
}