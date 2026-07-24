"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

type Props = {
  positive: number;
  negative: number;
  neutral: number;
};

const COLORS = ["#10b981", "#f43f5e", "#f59e0b"];

export default function SentimentChart({ positive, negative, neutral }: Props) {
  const data = [
    { name: "Positive", value: positive || 0, color: COLORS[0] },
    { name: "Negative", value: negative || 0, color: COLORS[1] },
    { name: "Neutral", value: neutral || 0, color: COLORS[2] },
  ];

  const total = positive + negative + neutral;

  // Custom tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs shadow-xl text-white">
          <p className="font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.color }}></span>
            {item.name}
          </p>
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
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <PieIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Sentiment Distribution</h2>
            <p className="text-xxs text-slate-500 dark:text-zinc-400">Proportional breakdown of customer mood</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-400">Total Analyzed</p>
          <p className="text-base font-extrabold text-slate-900 dark:text-zinc-50">{total}</p>
        </div>
      </div>

      <div className="h-72 flex items-center justify-center relative">
        {total === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl w-full h-full flex flex-col justify-center items-center">
            <p className="text-sm text-slate-400 dark:text-zinc-500 font-medium">No feedback record analyzed yet</p>
            <p className="text-xxs text-slate-400 dark:text-zinc-500 mt-0.5">Capture user reviews to show sentiment graph</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                cx="50%"
                cy="50%"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 pl-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}