"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileSpreadsheet, ArrowLeft, UploadCloud, Loader2 } from "lucide-react";

export default function UploadFeedbackPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert("Please select a CSV file.");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("Please log in before uploading CSV feedback.");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch {
      alert("Unable to read login data. Please log in again.");
      return;
    }

    if (!user?.workspaceId) {
      alert("Workspace information is missing. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", user.workspaceId);

    setLoading(true);

    try {
      const res = await fetch("/api/feedback/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (!data.success) {
        alert(data.message || "Failed to process CSV file.");
        return;
      }

      alert(`${data.count} feedback records imported successfully.`);
      router.push("/feedback");
    } catch (error) {
      console.error(error);
      alert("CSV import failed.");
      setLoading(false);
    }
  }

  // Handle drag and drop visuals
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
      } else {
        alert("Only CSV files are supported.");
      }
    }
  };

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
            Import Feedback CSV
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Ingest bulk records using CSV datasets. Make sure your file has a <code>content</code> column for feedback texts, and optional <code>customerLabel</code> / <code>channel</code> columns.
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Uploader Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 transition-all duration-200 relative overflow-hidden ${
              dragActive 
                ? "border-indigo-500 bg-indigo-500/5" 
                : "border-slate-200 hover:border-slate-350 dark:border-zinc-800 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50"
            }`}
          >
            {file ? (
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{file.name}</p>
                  <p className="text-xxs text-slate-400 dark:text-zinc-500">{(file.size / 1024).toFixed(1)} KB &bull; CSV file format</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xxs font-bold text-rose-500 hover:underline pt-2.5 block mx-auto"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-850 dark:text-zinc-300">
                    Drag and drop your spreadsheet here, or <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">browse files</span>
                  </p>
                  <p className="text-xxs text-slate-450 dark:text-zinc-500">Supported formats: CSV (.csv) up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white py-3.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-emerald-650/10 transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4.5 w-4.5" />
            )}
            <span>{loading ? "Importing records..." : "Import CSV File"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}