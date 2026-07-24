"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as UserIcon, Radio, MessageSquare, ArrowLeft, Save, Loader2 } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
};

export default function AddFeedbackPage() {
  const router = useRouter();

  const [customerLabel, setCustomerLabel] = useState("");
  const [channel, setChannel] = useState("Website");
  const [content, setContent] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(false);

  function getWorkspaceIdFromStorage() {
    if (typeof window === "undefined") return "";

    const storedUser = localStorage.getItem("user");

    if (!storedUser) return "";

    try {
      const user: User = JSON.parse(storedUser);
      return user.workspaceId || "";
    } catch {
      return "";
    }
  }

  useEffect(() => {
    const storedWorkspaceId = getWorkspaceIdFromStorage();

    if (storedWorkspaceId) {
      setWorkspaceId(storedWorkspaceId);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedCustomerLabel = customerLabel.trim();
    const trimmedContent = content.trim();
    const resolvedWorkspaceId = workspaceId || getWorkspaceIdFromStorage();

    if (!trimmedCustomerLabel || !trimmedContent || !resolvedWorkspaceId) {
      alert("Please fill in all fields and make sure you are logged into a workspace.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerLabel: trimmedCustomerLabel,
          channel,
          content: trimmedContent,
          workspaceId: resolvedWorkspaceId,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(data.message || "Failed to add feedback");
        return;
      }

      router.push("/feedback");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving feedback.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top breadcrumb navigation header */}
      <div className="flex items-center gap-2">
        <Link 
          href="/feedback" 
          className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 hover:text-slate-800 hover:border-slate-350 dark:hover:border-zinc-700 transition-all flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs font-semibold text-slate-400 dark:text-zinc-550">Back to Feedback Repository</span>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Add Customer Feedback
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manually enter feedback reviews. Once created, LOOP's text classifier extracts themes and scores sentiments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Customer Name / Identifier
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-zinc-650" />
              <input
                type="text"
                value={customerLabel}
                onChange={(e) => setCustomerLabel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-450 focus:border-indigo-500 outline-none transition-all"
                placeholder="e.g. Acmo Corp / Jane Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Ingestion Channel Source
            </label>
            <div className="relative">
              <Radio className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-zinc-650" />
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-850 dark:text-zinc-350 outline-none focus:border-indigo-500 transition-all"
              >
                <option>Website</option>
                <option>Email</option>
                <option>Survey</option>
                <option>Social Media</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Feedback Content / Text
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-4 h-5 w-5 text-slate-400 dark:text-zinc-650" />
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-xs text-slate-850 dark:text-zinc-250 placeholder-slate-450 focus:border-indigo-500 outline-none resize-none transition-all"
                placeholder="Enter customer message verbatim..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white py-3.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all duration-200 mt-2"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Save className="h-4.5 w-4.5" />
            )}
            <span>{loading ? "Saving feedback..." : "Save Feedback"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}