"use client";

import { MessageSquare, Calendar } from "lucide-react";

type Props = {
  items: Array<{
    id: string;
    content: string;
    channel: string;
    sentiment?: string | null;
    theme?: string | null;
    summary?: string | null;
    recommendation?: string | null;
    createdAt: string;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecentFeedback({ items }: Props) {
  const latestItems = items.slice(0, 5);

  const getSentimentBadge = (sentiment?: string | null) => {
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
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Recent Feedback</h2>
            <p className="text-xxs text-slate-500 dark:text-zinc-400">Latest incoming reviews uploaded to this workspace</p>
          </div>
        </div>
      </div>

      {latestItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
          No feedback records captured yet
        </div>
      ) : (
        <div className="space-y-3.5">
          {latestItems.map((item) => (
            <div 
              key={item.id} 
              className="rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40 p-4 hover:border-slate-200 dark:hover:border-zinc-800 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-zinc-200">
                    "{item.content}"
                  </p>
                  <div className="flex items-center gap-2.5 text-xxs text-slate-450 dark:text-zinc-500 font-medium">
                    <span className="bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded font-bold">{item.channel}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase tracking-wider ${getSentimentBadge(item.sentiment)}`}>
                  {item.sentiment || "NEUTRAL"}
                </span>
              </div>

              {/* Tag Badges */}
              {(item.theme || item.summary) && (
                <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-zinc-850 pt-2.5">
                  {item.theme && (
                    <span className="rounded-md bg-indigo-550/10 px-2.5 py-0.5 text-xxs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                      {item.theme}
                    </span>
                  )}
                  {item.summary && (
                    <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xxs font-semibold text-slate-650 dark:text-zinc-400 line-clamp-1 flex-1">
                      {item.summary}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}