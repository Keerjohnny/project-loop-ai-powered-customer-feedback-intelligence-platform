"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  ArrowRight, 
  Download, 
  Loader2,
  FileBarChart
} from "lucide-react";

type Report = {
  id: string;
  title: string;
  createdAt: string;
  generatedBy: {
    name: string;
    email: string;
  };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadReports = async (currentPage = 1) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.workspaceId) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/reports?workspaceId=${user.workspaceId}&search=${encodeURIComponent(search)}&page=${currentPage}&limit=6`);
      const data = await res.json();

      if (data.success) {
        setReports(data.reports || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(page);
  }, [page]);

  // Run search when query changes
  useEffect(() => {
    setPage(1);
    loadReports(1);
  }, [search]);

  const filteredReports = useMemo(() => {
    if (filter === "All") return reports;
    return reports.filter((report) => report.title.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, reports]);

  const latestReport = reports[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-550 tracking-tight">Reports Hub</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Generate voice of customer briefings, export summaries, and track archive logs.</p>
        </div>

        <Link 
          href="/reports/generate" 
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-4.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Report</span>
        </Link>
      </div>

      {/* Reports metrics cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Generated Reports</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{reports.length}</p>
        </div>
        
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Latest briefing</p>
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-200 line-clamp-1">
            {latestReport?.title || "No report generated yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Search & Filters</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search text..."
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xxs text-slate-800 dark:text-zinc-200 placeholder-slate-450 focus:border-indigo-500 outline-none"
              />
            </div>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)} 
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xxs text-slate-800 dark:text-zinc-300 outline-none"
            >
              <option value="All">All Types</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List Block */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-550" />
            <p className="text-xs font-semibold">Loading reports index...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-850 p-12 text-center text-xs text-slate-450 dark:text-zinc-550 flex flex-col items-center gap-2">
            <FileBarChart className="h-8 w-8 text-slate-400" />
            <p className="font-bold uppercase tracking-wider">No briefing reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                className="flex flex-col gap-4 rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40 p-4 hover:border-slate-200 dark:hover:border-zinc-800 transition-all duration-200 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 self-start border border-indigo-500/10">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-zinc-50">{report.title}</p>
                    <p className="text-xxs text-slate-450 dark:text-zinc-500">
                      Generated by <span className="font-bold text-slate-700 dark:text-zinc-350">{report.generatedBy?.name || "LOOP Agent"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xxs text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider md:ml-auto md:mr-6">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>

                <div className="flex gap-2">
                  <Link 
                    href={`/reports/${report.id}`} 
                    className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xxs font-bold transition-all duration-200"
                  >
                    <span>View Detail</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <a 
                    href={`/api/reports/download?id=${report.id}`} 
                    className="inline-flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg text-xxs font-bold transition-all duration-200"
                  >
                    <Download className="h-3 w-3" />
                    <span>JSON</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-zinc-850 pt-4 text-xs font-semibold text-slate-500">
          <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage((value) => Math.max(1, value - 1))} 
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60 px-3 py-1.5 disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage((value) => value + 1)} 
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60 px-3 py-1.5 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}