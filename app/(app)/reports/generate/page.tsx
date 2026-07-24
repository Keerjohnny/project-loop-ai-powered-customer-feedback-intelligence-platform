"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GenerateReportPage() {
  const router = useRouter();

  const [reportType, setReportType] = useState("Weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateReport() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.workspaceId || !user.id) {
      setError("User information not found.");
      return;
    }

    if (reportType === "Custom") {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates.");
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        setError("Start date cannot be after end date.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: user.workspaceId,
          generatedById: user.id,
          reportType,
          startDate,
          endDate,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Report generation failed.");
        return;
      }

      router.push("/reports");
    } catch (error) {
      console.error(error);
      setError("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Generate Report</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create a professional report</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a report period and generate a summary stored in your workspace history.</p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
              <option value="Custom">Custom Date Range</option>
            </select>
          </div>

          {reportType === "Custom" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>
          )}

          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div> : null}

          <button onClick={generateReport} disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </main>
  );
}