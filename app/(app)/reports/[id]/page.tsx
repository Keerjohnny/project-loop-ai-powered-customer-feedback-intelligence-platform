"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

type CountItem = {
  count: number;
};

type ChannelCount = CountItem & {
  channel: string;
};

type ThemeCount = CountItem & {
  theme: string;
};

type ThemeTrend = {
  theme: string;
  previousPeriodCount: number;
  currentPeriodCount: number;
  percentageChange: number;
  trend: "up" | "down" | "flat";
};

type FeedbackVolumePoint = {
  date: string;
  count: number;
};

type CustomerQuote = {
  id: string;
  customer: string;
  quote: string;
  sentiment?: string | null;
  theme?: string | null;
  channel?: string | null;
};

type FeedbackTableRow = {
  id: string;
  customer: string;
  channel: string;
  content: string;
  sentiment?: string | null;
  theme?: string | null;
  summary?: string | null;
  recommendation?: string | null;
  createdAt: string;
};

type ReportContent = {
  coverPage?: {
    company?: string;
    workspace?: string;
    generatedBy?: string;
    generatedByEmail?: string;
    date?: string;
    reportType?: string;
  };
  totalFeedback?: number;
  positive?: number;
  negative?: number;
  neutral?: number;
  channels?: ChannelCount[];
  themes?: ThemeCount[];
  topThemes?: ThemeCount[];
  themeTrends?: ThemeTrend[];
  feedbackVolume?: FeedbackVolumePoint[];
  customerQuotes?: CustomerQuote[];
  executiveSummary?: string;
  keyFindings?: string[];
  recommendedActions?: string[];
  aiSummary?: string;
  aiRecommendation?: string;
  positiveFeedback?: Array<{ id: string; content: string; channel: string; sentiment?: string | null }>;
  complaints?: Array<{ id: string; content: string; channel: string; sentiment?: string | null }>;
  appendix?: {
    feedbackTable?: FeedbackTableRow[];
  };
};

type Report = {
  id: string;
  title: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  contentJson: ReportContent;
  generatedBy?: {
    name: string;
    email: string;
  };
};

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b"];

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString();
}

function formatTrend(value: ThemeTrend) {
  if (value.trend === "up") return `^ +${value.percentageChange}%`;
  if (value.trend === "down") return `v ${value.percentageChange}%`;
  return `-> ${value.percentageChange}%`;
}

function asList(value?: string[] | null) {
  return Array.isArray(value) ? value : [];
}

export default function ReportDetailsPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        const data = await res.json();

        if (data.success) {
          setReport(data.report);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadReport();
    }
  }, [params.id]);

  const pieData = useMemo(() => {
    if (!report?.contentJson) return [];

    return [
      { name: "Positive", value: report.contentJson.positive || 0, color: PIE_COLORS[0] },
      { name: "Negative", value: report.contentJson.negative || 0, color: PIE_COLORS[1] },
      { name: "Neutral", value: report.contentJson.neutral || 0, color: PIE_COLORS[2] },
    ];
  }, [report]);

  async function svgElementToPngDataUrl(svgElement: SVGSVGElement, width: number, height: number) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.width = width;
    img.height = height;

    return new Promise<string>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Unable to get canvas context."));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (event) => {
        URL.revokeObjectURL(url);
        reject(event);
      };
      img.src = url;
    });
  }

  async function getChartImage(chartId: string, width: number, height: number) {
    const chartRoot = document.getElementById(chartId);
    if (!chartRoot) return null;

    const svg = chartRoot.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return null;

    return svgElementToPngDataUrl(svg, width, height);
  }

  async function handlePdfDownload() {
    if (!report) return;

    const content = report.contentJson;
    const safeFileName = (report.title || "voice-of-customer-report").toLowerCase().replaceAll(" ", "-");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 42;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const addHeading = (text: string) => {
      ensureSpace(30);
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(14);
      pdf.text(text, margin, y);
      y += 22;
    };

    const addText = (text: string, fontSize = 10) => {
      const lines = pdf.splitTextToSize(text, maxLineWidth) as string[];
      ensureSpace(lines.length * fontSize * 1.4);
      pdf.setFontSize(fontSize);
      pdf.setTextColor(51, 65, 85);
      pdf.text(lines, margin, y);
      y += lines.length * fontSize * 1.4 + 6;
    };

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 190, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("Voice of Customer Report", margin, 72);
    pdf.setFontSize(13);
    pdf.text(content.coverPage?.company || "Project LOOP", margin, 105);
    pdf.text(`Workspace: ${content.coverPage?.workspace || "Workspace"}`, margin, 128);
    pdf.text(`Generated By: ${content.coverPage?.generatedBy || report.generatedBy?.name || "Unknown"}`, margin, 151);
    pdf.text(`Date: ${formatDate(content.coverPage?.date || report.createdAt)}`, margin, 174);

    y = 225;
    addHeading("Executive Summary");
    addText(content.executiveSummary || content.aiSummary || "No executive summary available.");

    addHeading("Overall Statistics");
    [
      `Total Feedback: ${content.totalFeedback ?? 0}`,
      `Positive: ${content.positive ?? 0}`,
      `Negative: ${content.negative ?? 0}`,
      `Neutral: ${content.neutral ?? 0}`,
      `Period: ${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`,
    ].forEach((item) => addText(item));

    addHeading("Key Findings");
    asList(content.keyFindings).forEach((item) => addText(`- ${item}`));

    const chartWidth = pageWidth - margin * 2;
    const chartHeight = 155;
    const charts = [
      ["chart-volume", "Feedback Volume"],
      ["chart-sentiment", "Sentiment Pie"],
      ["chart-themes", "Top Themes"],
      ["chart-channels", "Channel Distribution"],
    ] as const;

    for (const [chartId, title] of charts) {
      const image = await getChartImage(chartId, 760, 280);
      if (image) {
        ensureSpace(chartHeight + 40);
        addHeading(title);
        pdf.addImage(image, "PNG", margin, y, chartWidth, chartHeight);
        y += chartHeight + 16;
      }
    }

    addHeading("Theme Trends");
    (content.themeTrends || []).slice(0, 8).forEach((item) => {
      addText(`${item.theme}: current ${item.currentPeriodCount}, previous ${item.previousPeriodCount}, change ${formatTrend(item)}`);
    });

    addHeading("Customer Quotes");
    (content.customerQuotes || []).slice(0, 6).forEach((item) => {
      addText(`"${item.quote}" - ${item.customer} (${item.theme || "General"})`);
    });

    addHeading("AI Recommendations");
    asList(content.recommendedActions).forEach((item) => addText(`- ${item}`));

    addHeading("Appendix: Feedback Table");
    (content.appendix?.feedbackTable || []).forEach((item) => {
      addText(`${formatDate(item.createdAt)} | ${item.customer} | ${item.channel} | ${item.sentiment || "N/A"} | ${item.theme || "General"} | ${item.content}`, 8);
    });

    pdf.save(`${safeFileName}.pdf`);
  }

  function handleExcelDownload() {
    if (!report) return;

    const content = report.contentJson;
    const workbook = XLSX.utils.book_new();
    const summaryRows = [
      ["Voice of Customer Report"],
      ["Company", content.coverPage?.company || "Project LOOP"],
      ["Workspace", content.coverPage?.workspace || "Workspace"],
      ["Generated By", content.coverPage?.generatedBy || report.generatedBy?.name || "Unknown"],
      ["Generated Date", formatDate(content.coverPage?.date || report.createdAt)],
      ["Period", `${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`],
      [],
      ["Metric", "Value"],
      ["Total Feedback", content.totalFeedback ?? 0],
      ["Positive", content.positive ?? 0],
      ["Negative", content.negative ?? 0],
      ["Neutral", content.neutral ?? 0],
      ["Executive Summary", content.executiveSummary || content.aiSummary || ""],
    ];

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(content.appendix?.feedbackTable || []), "Feedback Table");
    XLSX.writeFile(workbook, `${report.title.replace(/\s+/g, "-").toLowerCase() || "report"}.xlsx`);
  }

  if (loading) {
    return <div className="p-8 text-slate-600">Loading report details...</div>;
  }

  if (!report) {
    return <div className="p-8 text-slate-600">Report not found.</div>;
  }

  const content = report.contentJson;
  const topThemes = content.topThemes || content.themes || [];
  const feedbackRows = content.appendix?.feedbackTable || [];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Executive Management Report</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">{report.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/reports/download?id=${report.id}`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
              Download JSON
            </a>
            <button onClick={handlePdfDownload} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Download PDF
            </button>
            <button onClick={handleExcelDownload} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Export Excel
            </button>
          </div>
        </div>

        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">{content.coverPage?.company || "Project LOOP"}</p>
          <h2 className="mt-3 text-4xl font-semibold">Voice of Customer Report</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-slate-400">Workspace</p>
              <p className="mt-1 font-medium">{content.coverPage?.workspace || "Workspace"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Generated By</p>
              <p className="mt-1 font-medium">{content.coverPage?.generatedBy || report.generatedBy?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Date</p>
              <p className="mt-1 font-medium">{formatDate(content.coverPage?.date || report.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Period</p>
              <p className="mt-1 font-medium">{formatDate(report.periodStart)} - {formatDate(report.periodEnd)}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Executive Summary</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{content.executiveSummary || content.aiSummary || "No executive summary available."}</p>
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-900">Key Findings</h3>
              {asList(content.keyFindings).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No key findings were generated.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {asList(content.keyFindings).map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Overall Statistics</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Feedback</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{content.totalFeedback ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Positive</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">{content.positive ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Negative</p>
                <p className="mt-1 text-2xl font-semibold text-rose-900">{content.negative ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-sm text-amber-700">Neutral</p>
                <p className="mt-1 text-2xl font-semibold text-amber-900">{content.neutral ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div id="chart-volume" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Feedback Volume</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={content.feedbackVolume || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div id="chart-sentiment" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Sentiment Breakdown</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div id="chart-themes" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Top Themes</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topThemes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="theme" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div id="chart-channels" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Channel Distribution</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={content.channels || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="channel" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Theme Trends</h2>
            <div className="mt-4 space-y-2">
              {(content.themeTrends || []).length === 0 ? (
                <p className="text-sm text-slate-500">No theme trend data available.</p>
              ) : (
                content.themeTrends?.map((item) => (
                  <div key={item.theme} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{item.theme}</p>
                      <p className="text-slate-500">Previous {item.previousPeriodCount} / Current {item.currentPeriodCount}</p>
                    </div>
                    <span className={item.trend === "up" ? "text-emerald-600" : item.trend === "down" ? "text-rose-600" : "text-slate-500"}>
                      {formatTrend(item)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">AI Recommendations</h2>
            {asList(content.recommendedActions).length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{content.aiRecommendation || "No recommendations available."}</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {asList(content.recommendedActions).map((item) => (
                  <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Customer Quotes</h2>
          {(content.customerQuotes || []).length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No customer quotes available.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {content.customerQuotes?.map((item) => (
                <blockquote key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-700">&quot;{item.quote}&quot;</p>
                  <footer className="mt-3 text-xs text-slate-500">
                    {item.customer} - {item.theme || "General"} - {item.sentiment || "N/A"}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Appendix: Feedback Table</h2>
          {feedbackRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No feedback rows available.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Channel</th>
                    <th className="px-3 py-3">Sentiment</th>
                    <th className="px-3 py-3">Theme</th>
                    <th className="px-3 py-3">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedbackRows.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{item.customer}</td>
                      <td className="px-3 py-3 text-slate-600">{item.channel}</td>
                      <td className="px-3 py-3 text-slate-600">{item.sentiment || "N/A"}</td>
                      <td className="px-3 py-3 text-slate-600">{item.theme || "General"}</td>
                      <td className="px-3 py-3 text-slate-600">{item.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-start">
          <Link href="/reports" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Back to reports
          </Link>
        </div>
      </div>
    </main>
  );
}
