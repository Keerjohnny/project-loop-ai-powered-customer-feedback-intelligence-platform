"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Radio } from "lucide-react";

type Props = {
  data: Array<{ channel: string; count: number }>;
};

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];

export default function ChannelChart({ data }: Props) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  // Custom tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs shadow-xl text-white">
          <p className="font-semibold">{item.name}</p>
          <p className="text-slate-400 mt-0.5">
            Count: <span className="font-bold text-white">{item.value}</span> ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Radio className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Channel Distribution</h2>
            <p className="text-xxs text-slate-500 dark:text-zinc-400">Volume tracking across feedback ingestion sources</p>
          </div>
        </div>
      </div>

      <div className="h-72">
        {data.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl w-full h-full flex flex-col justify-center items-center">
            <p className="text-sm text-slate-400 dark:text-zinc-500 font-medium">No channel data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="channel" 
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
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
