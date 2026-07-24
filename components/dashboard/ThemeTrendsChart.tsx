"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

type ThemeTrend = {
  theme: string;
  currentPeriodCount: number;
  previousPeriodCount: number;
  percentageChange: number;
  trend: "up" | "down" | "flat";
};

type Props = {
  data: ThemeTrend[];
};

function formatChange(value: number) {
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}

export default function ThemeTrendsChart({ data }: Props) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs shadow-xl text-white">
          <p className="font-semibold text-slate-200 mb-1">{payload[0].payload.theme}</p>
          <div className="space-y-0.5">
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Current Period:</span>
              <span className="font-bold">{payload.find((p: any) => p.dataKey === "currentPeriodCount")?.value || 0}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Previous Period:</span>
              <span className="font-bold">{payload.find((p: any) => p.dataKey === "previousPeriodCount")?.value || 0}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Theme Volume Shifts</h2>
            <p className="text-xxs text-slate-500 dark:text-zinc-400">Comparing current vs previous 30-day feedback metrics</p>
          </div>
        </div>
        <Link 
          href="/theme-trends" 
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5 group transition-colors"
        >
          <span>Analysis panel</span>
          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-sm text-slate-400 dark:text-zinc-500">
          No theme trend shifts detected yet
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="theme" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc", opacity: 0.5 }} />
              <Bar dataKey="previousPeriodCount" radius={[5, 5, 0, 0]} fill="#cbd5e1" barSize={16} />
              <Bar dataKey="currentPeriodCount" radius={[5, 5, 0, 0]} fill="#6366f1" barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 ? (
        <div className="mt-6 grid gap-2.5">
          {data.slice(0, 3).map((item) => {
            const isUp = item.trend === "up";
            const isDown = item.trend === "down";
            
            return (
              <div key={item.theme} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-850 px-4 py-2.5 text-xs">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{item.theme}</span>
                <span className={`inline-flex items-center gap-1 font-bold ${
                  isUp 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : isDown 
                    ? "text-rose-600 dark:text-rose-400" 
                    : "text-slate-500"
                }`}>
                  {isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : isDown ? (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  <span>{formatChange(item.percentageChange)}</span>
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
