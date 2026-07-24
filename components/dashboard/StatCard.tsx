"use client";

import { MessageSquare, Smile, Frown, Meh } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
};

export default function StatCard({ title, value }: Props) {
  // Theme styling based on card type
  const getTheme = (t: string) => {
    const clean = t.toLowerCase();
    if (clean.includes("total")) {
      return {
        bg: "bg-white dark:bg-zinc-900",
        border: "border-slate-200 dark:border-zinc-800",
        accent: "from-blue-500 to-indigo-500",
        text: "text-blue-600 dark:text-blue-400",
        icon: MessageSquare,
      };
    }
    if (clean.includes("positive")) {
      return {
        bg: "bg-white dark:bg-zinc-900",
        border: "border-slate-200 dark:border-zinc-800",
        accent: "from-emerald-400 to-teal-500",
        text: "text-emerald-600 dark:text-emerald-400",
        icon: Smile,
      };
    }
    if (clean.includes("negative")) {
      return {
        bg: "bg-white dark:bg-zinc-900",
        border: "border-slate-200 dark:border-zinc-800",
        accent: "from-rose-400 to-red-500",
        text: "text-rose-600 dark:text-rose-400",
        icon: Frown,
      };
    }
    // Neutral or fallback
    return {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-slate-200 dark:border-zinc-800",
      accent: "from-amber-400 to-orange-500",
      text: "text-amber-600 dark:text-amber-400",
      icon: Meh,
    };
  };

  const theme = getTheme(title);
  const Icon = theme.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-6 shadow-sm hover:shadow-md transition-all duration-300 group`}>
      {/* Decorative gradient corner splash */}
      <div className={`absolute top-0 right-0 h-16 w-16 bg-gradient-to-br ${theme.accent} opacity-5 group-hover:opacity-10 rounded-bl-full transition-all duration-300`}></div>

      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>

        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 group-hover:scale-105 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${theme.text}`} />
        </div>
      </div>

      <div className="mt-4 flex items-center text-xxs text-slate-400 dark:text-zinc-500 font-medium">
        <span className={`${theme.text} font-bold mr-1`}>Live</span>
        <span>statistics stream</span>
      </div>
    </div>
  );
}