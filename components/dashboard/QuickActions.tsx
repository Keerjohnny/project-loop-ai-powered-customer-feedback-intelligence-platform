"use client";

import Link from "next/link";
import { MessageSquarePlus, FileSpreadsheet, Sparkles, FileBarChart2 } from "lucide-react";

const actions = [
  { 
    label: "Add Feedback", 
    href: "/feedback/add", 
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 border-blue-150 dark:border-blue-900/30",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900/20",
    icon: MessageSquarePlus 
  },
  { 
    label: "Upload CSV", 
    href: "/feedback/upload", 
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-150 dark:border-emerald-900/30",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/20",
    icon: FileSpreadsheet 
  },
  { 
    label: "Analyze Platform", 
    href: "/feedback", 
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 border-purple-150 dark:border-purple-900/30",
    hover: "hover:bg-purple-100 dark:hover:bg-purple-900/20",
    icon: Sparkles 
  },
  { 
    label: "Generate Reports", 
    href: "/reports/generate", 
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-150 dark:border-indigo-900/30",
    hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/20",
    icon: FileBarChart2 
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Quick Actions</h2>
      <p className="text-xxs text-slate-500 dark:text-zinc-400 mt-0.5 mb-6">Common workflows executed in this workspace</p>

      <div className="grid grid-cols-2 gap-3.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 group ${action.color} ${action.hover}`}
            >
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 self-start shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-zinc-50">{action.label}</p>
                <p className="text-xxs text-slate-400 dark:text-zinc-500">Access flow &rarr;</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}