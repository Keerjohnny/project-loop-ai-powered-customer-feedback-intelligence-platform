"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Plus, 
  Upload, 
  Sparkles, 
  Loader2, 
  FileSpreadsheet,
  AlertCircle,
  Search
} from "lucide-react";

type Feedback = {
  id: string;
  customerLabel: string;
  channel: string;
  content: string;
  status: string;
  sentiment: string | null;
  sentimentScore: number | null;
  theme: string | null;
  summary: string | null;
  recommendation: string | null;
  createdAt: string;
};

type EditFormState = {
  id: string;
  customerLabel: string;
  channel: string;
  content: string;
};

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [analyzeAllLoading, setAnalyzeAllLoading] = useState(false);
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

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sentiment, setSentiment] = useState("ALL");
  const [channel, setChannel] = useState("ALL");
  const [selectedTheme, setSelectedTheme] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const loadFeedback = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (sentiment !== "ALL") params.append("sentiment", sentiment);
      if (channel !== "ALL") params.append("channel", channel);
      if (selectedTheme !== "ALL") params.append("theme", selectedTheme);
      if (status !== "ALL") params.append("status", status);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFeedbacks(data.feedback);
        if (data.themes) {
          setAvailableThemes(data.themes);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, debouncedSearch, sentiment, channel, selectedTheme, status, startDate, endDate]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  function startEdit(item: Feedback) {
    setEditingId(item.id);
    setEditForm({
      id: item.id,
      customerLabel: item.customerLabel,
      channel: item.channel,
      content: item.content,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function refreshFeedback() {
    await loadFeedback();
  }

  const isFiltered = !!(
    debouncedSearch ||
    sentiment !== "ALL" ||
    channel !== "ALL" ||
    selectedTheme !== "ALL" ||
    status !== "ALL" ||
    startDate ||
    endDate
  );

  const clearFilters = () => {
    setSearch("");
    setSentiment("ALL");
    setChannel("ALL");
    setSelectedTheme("ALL");
    setStatus("ALL");
    setStartDate("");
    setEndDate("");
  };

  async function saveEdit() {
    if (!editForm || !editingId) return;

    const trimmedCustomerLabel = editForm.customerLabel.trim();
    const trimmedContent = editForm.content.trim();

    if (!trimmedCustomerLabel || !trimmedContent) {
      alert("Please fill in all fields.");
      return;
    }

    setActionLoadingId(editingId);

    try {
      const res = await fetch(`/api/feedback/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerLabel: trimmedCustomerLabel,
          channel: editForm.channel,
          content: trimmedContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Update failed");
        return;
      }

      setFeedbacks((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                customerLabel: trimmedCustomerLabel,
                channel: editForm.channel,
                content: trimmedContent,
              }
            : item
        )
      );

      cancelEdit();
    } catch (error) {
      console.error(error);
      alert("Unable to update feedback right now.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteFeedback(id: string) {
    const confirmed = window.confirm("Delete this feedback?");

    if (!confirmed) return;

    setActionLoadingId(id);

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Delete failed");
        return;
      }

      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert("Unable to delete feedback right now.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteAll() {
    if (!workspaceId) {
      alert("Please log in to delete feedback.");
      return;
    }

    const confirmed = window.confirm("Delete all feedback records? This cannot be undone.");
    if (!confirmed) return;

    setAnalyzeAllLoading(true);

    try {
      const res = await fetch("/api/feedback/delete-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message);
        return;
      }

      alert(`Deleted ${data.count} feedback records.`);
      setFeedbacks([]);
    } catch (error) {
      console.error(error);
      alert("Unable to delete all feedback right now.");
    } finally {
      setAnalyzeAllLoading(false);
    }
  }

  async function reanalyzeItem(id: string) {
    setActionLoadingId(id);

    try {
      const res = await fetch("/api/feedback/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedbackId: id }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message);
        return;
      }

      await refreshFeedback();
    } catch (error) {
      console.error(error);
      alert("Unable to reanalyze this feedback right now.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function analyzeAll() {
    if (!workspaceId) {
      alert("Please log in to analyze feedback.");
      return;
    }

    setAnalyzeAllLoading(true);

    try {
      const res = await fetch("/api/feedback/analyze-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message);
        return;
      }

      alert(`Analyzed ${data.count} feedback items.`);
      await refreshFeedback();
    } catch (error) {
      console.error(error);
      alert("Unable to analyze all feedback right now.");
    } finally {
      setAnalyzeAllLoading(false);
    }
  }

  const getSentimentPill = (sentiment: string | null) => {
    const s = sentiment?.toUpperCase() || "NEUTRAL";
    if (s === "POSITIVE") {
      return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10";
    }
    if (s === "NEGATIVE") {
      return "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/10";
    }
    return "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/10";
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "NEW") {
      return "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-500/10";
    }
    if (s === "REVIEWED") {
      return "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-500/10";
    }
    if (s === "ACTIONED") {
      return "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10";
    }
    return "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800";
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header and top-level action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-550 tracking-tight">Feedback Repository</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Ingest, correct, analyze, and cluster user reviews.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/feedback/upload"
            className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <Upload className="h-4 w-4" />
            <span>Upload CSV</span>
          </Link>

          <Link
            href="/feedback/add"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-500 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-550/10 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Feedback</span>
          </Link>

          <button
            type="button"
            onClick={analyzeAll}
            disabled={analyzeAllLoading || feedbacks.length === 0}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-550/10 transition-all duration-200"
          >
            {analyzeAllLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>{analyzeAllLoading ? "Analyzing..." : "Analyze All"}</span>
          </button>

          <button
            type="button"
            onClick={deleteAll}
            disabled={analyzeAllLoading || feedbacks.length === 0}
            className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by customer name, feedback content, theme, tags, date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-450 transition-all duration-200"
            />
          </div>
          
          {/* Clear Filters Button (Only if filtered) */}
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="h-10 px-4 rounded-xl border border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-350 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Sentiment Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Sentiment</label>
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-700 dark:text-zinc-300 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="NEGATIVE">Negative</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-700 dark:text-zinc-300 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Channels</option>
              <option value="Website">Website</option>
              <option value="Email">Email</option>
              <option value="Survey">Survey</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>

          {/* Theme Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Theme</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-700 dark:text-zinc-300 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Themes</option>
              {availableThemes.map((themeName) => (
                <option key={themeName} value={themeName}>
                  {themeName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-700 dark:text-zinc-300 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ACTIONED">Actioned</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-750 dark:text-zinc-300 outline-none focus:border-indigo-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-750 dark:text-zinc-300 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Feedback Grid/Table Area */}
      {loading && feedbacks.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-450">Loading customer feedback records...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        isFiltered ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400">
              <Search className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-550">No feedback found</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-450 max-w-xs mx-auto">
                No feedback items match your current search queries or filter selections.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={clearFilters}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-550">No customer reviews yet</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-450 max-w-xs mx-auto">
                Get started by uploading a CSV spreadsheet, or add a customer review manually.
              </p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <Link href="/feedback/upload" className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 px-4 py-2 rounded-xl text-xs font-semibold">
                Import CSV
              </Link>
              <Link href="/feedback/add" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm">
                Add manually
              </Link>
            </div>
          </div>
        )
      ) : (
        <div className="overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-850 border-b border-slate-200 dark:border-zinc-800">
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Customer</th>
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Channel</th>
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 w-[35%]">Feedback Content</th>
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Status</th>
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Sentiment</th>
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Theme</th>
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Date</th>
                  <th className="p-4 text-xxs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                {feedbacks.map((item) => (
                  <Fragment key={item.id}>
                    {editingId === item.id && editForm ? (
                      <tr className="border-t bg-slate-50/50 dark:bg-zinc-850/30">
                        {/* Edit fields */}
                        <td className="p-3">
                          <input
                            value={editForm.customerLabel}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, customerLabel: e.target.value } : prev
                              )
                            }
                            className="w-full border border-slate-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 rounded-lg p-2 text-xs focus:border-indigo-500 outline-none"
                          />
                        </td>    
                        <td className="p-3">
                          <select
                            value={editForm.channel}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, channel: e.target.value } : prev
                              )
                            }
                            className="w-full border border-slate-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 rounded-lg p-2 text-xs focus:border-indigo-500 outline-none"
                          >
                            <option>Website</option>
                            <option>Email</option>
                            <option>Survey</option>
                            <option>Social Media</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <textarea
                            rows={3}
                            value={editForm.content}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, content: e.target.value } : prev
                              )
                            }
                            className="w-full border border-slate-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 rounded-lg p-2 text-xs focus:border-indigo-500 outline-none resize-y"
                          />
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xxs font-bold uppercase ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xxs font-bold uppercase ${getSentimentPill(item.sentiment)}`}>
                            {item.sentiment ?? "NEUTRAL"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-zinc-400">
                          {item.theme ?? "-"}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-zinc-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={actionLoadingId === item.id}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 disabled:opacity-50 shadow-sm shadow-emerald-500/10"
                            >
                              {actionLoadingId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-zinc-100">{item.customerLabel}</td>
                        <td className="p-4">
                          <span className="bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-400 px-2 py-0.5 rounded font-medium text-xxs">
                            {item.channel}
                          </span>
                        </td>
                        <td className="p-4 text-slate-650 dark:text-zinc-350 leading-relaxed font-medium">{item.content}</td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase tracking-wider ${getSentimentPill(item.sentiment)}`}>
                            {item.sentiment ?? "NEUTRAL"}
                          </span>
                        </td>
                        <td className="p-4">
                          {item.theme ? (
                            <span className="rounded bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 font-bold text-indigo-600 dark:text-indigo-400 text-xxs border border-indigo-500/5">
                              {item.theme}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-500 font-medium">-</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-450 dark:text-zinc-450 font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              type="button"
                              onClick={() => reanalyzeItem(item.id)}
                              disabled={actionLoadingId === item.id}
                              title={item.sentiment ? "Re-run sentiment extraction" : "Run sentiment extraction"}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-indigo-650 dark:text-indigo-400 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 disabled:opacity-50 transition-colors"
                            >
                              {actionLoadingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={actionLoadingId === item.id}
                              title="Edit feedback detail"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 disabled:opacity-50 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFeedback(item.id)}
                              disabled={actionLoadingId === item.id}
                              title="Delete record"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-rose-600 dark:text-rose-450 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 disabled:opacity-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}