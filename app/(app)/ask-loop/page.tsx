"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Loader2,
  Bot,
  User,
  Calendar,
  TrendingUp,
  Compass,
  History,
  MessageSquare,
} from "lucide-react";

type UserMessage = {
  id?: string;
  role: "user";
  text: string;
  createdAt: string;
};

type AssistantStructured =
  | { type: "feedback"; id: string; customer?: string | null; sentiment?: string | null; theme?: string | null; content: string; date: string }
  | { type: "stats"; total?: number; positive?: number; negative?: number; neutral?: number }
  | { type: "list"; items: Array<Record<string, any>> }
  | { type: "summary"; summary: string }
  | { type: "recommendation"; recommendation: string }
  | { type: "unknown"; message: string };

type AssistantMessage = {
  id?: string;
  role: "assistant";
  structured?: AssistantStructured;
  text?: string;
  createdAt: string;
};

type ChatItem = UserMessage | AssistantMessage;

const SUGGESTED = [
  "Total Feedback",
  "Positive Feedback",
  "Negative Feedback",
  "Latest Feedback",
  "Payment Issues",
  "Login Issues",
  "Dashboard Problems",
  "Customer Support",
  "Generate Summary",
  "AI Recommendations",
];

export default function AskLoopPage() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; question: string; answer: string; createdAt: string }>>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load history + welcome message on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.workspaceId) {
      fetch(`/api/chat/history?workspaceId=${user.workspaceId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.success && Array.isArray(d.history)) {
            setHistory(
              d.history.map((h: any) => ({
                id: h.id,
                question: h.question,
                answer: h.answer,
                createdAt: h.createdAt,
              }))
            );
          }
        })
        .catch(console.error);
    }

    setMessages([
      {
        role: "assistant",
        text: "👋 Hi! I am **Ask LOOP**, your automated analyst. Ask me questions about customer sentiment, feedback themes, or statistics — and I will query your workspace database in real time.",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function pushUser(text: string): UserMessage {
    const msg: UserMessage = { role: "user", text, createdAt: new Date().toISOString() };
    setMessages((s) => [...s, msg]);
    return msg;
  }

  function pushAssistant(structured: AssistantStructured | null, text?: string): AssistantMessage {
    const msg: AssistantMessage = {
      role: "assistant",
      structured: structured ?? undefined,
      text: text ?? undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((s) => [...s, msg]);
    return msg;
  }

  async function sendMessage(prompt?: string) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const workspaceId = user?.workspaceId;
    const text = (prompt ?? input).trim();
    if (!text || !workspaceId || loading) return;

    pushUser(text);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, workspaceId }),
      });
      const data = await res.json();

      if (data?.success) {
        const structured = data.result ?? null;

        if (typeof data.answer === "string" && data.answer.trim()) {
          pushAssistant(null, data.answer);
        } else if (structured) {
          pushAssistant(structured as AssistantStructured, undefined);
        } else {
          pushAssistant({ type: "unknown", message: "No results matched your query." });
        }

        // Persist to history
        try {
          await fetch("/api/chat/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId,
              question: text,
              answer: data.answer || JSON.stringify(data.result || data),
            }),
          });
          const h = await fetch(`/api/chat/history?workspaceId=${workspaceId}`).then((r) => r.json());
          if (h?.success) setHistory(h.history || []);
        } catch (err) {
          console.error("Failed to save history", err);
        }
      } else {
        pushAssistant({ type: "unknown", message: data?.message || "No response received." });
      }
    } catch (err) {
      console.error(err);
      pushAssistant({ type: "unknown", message: "An error occurred while compiling analysis." });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  }

  function startNewChat() {
    setMessages([
      {
        role: "assistant",
        text: "👋 Workspace session reset. Ask me a customer insights question to begin.",
        createdAt: new Date().toISOString(),
      },
    ]);
    setSelectedHistoryId(null);
    setInput("");
  }

  function loadHistoryItem(id: string) {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setSelectedHistoryId(id);
    setMessages([
      { role: "user", text: item.question, createdAt: item.createdAt },
      { role: "assistant", text: item.answer, createdAt: item.createdAt },
    ] as ChatItem[]);
  }

  async function deleteHistoryItem(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/history?id=${id}`, { method: "DELETE" });
      setHistory((h) => h.filter((x) => x.id !== id));
      if (selectedHistoryId === id) startNewChat();
    } catch (err) {
      console.error(err);
    }
  }

  function getSentimentPill(sentiment?: string | null) {
    const s = sentiment?.toUpperCase() || "NEUTRAL";
    if (s === "POSITIVE") return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (s === "NEGATIVE") return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
    return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
  }

  function renderAssistant(m: AssistantMessage, idx: number) {
    if (m.structured?.type === "feedback") {
      const f = m.structured;
      return (
        <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-500/20">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Customer Reference</p>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{f.customer || "Unspecified Customer"}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getSentimentPill(f.sentiment)}`}>
              {f.sentiment || "NEUTRAL"}
            </span>
          </div>
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2 text-xs">
            <p className="leading-relaxed text-slate-700 dark:text-zinc-300 font-medium">"{f.content}"</p>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 dark:text-zinc-500 pt-1.5 font-semibold uppercase tracking-wider">
              {f.theme && <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{f.theme}</span>}
              <span className="flex items-center gap-1 ml-auto">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {new Date(f.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (m.structured?.type === "stats") {
      const s = m.structured;
      return (
        <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">Workspace Statistics Summary</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{s.total ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 p-3 text-center">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Positive</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{s.positive ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 p-3 text-center">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Negative</p>
              <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">{s.negative ?? 0}</p>
            </div>
          </div>
        </div>
      );
    }

    if (m.structured?.type === "list") {
      const list = m.structured.items || [];
      return (
        <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-500" />
              <span>Matched Query Records</span>
            </p>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">{list.length} matches found</span>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {list.slice(0, 5).map((it: any, i: number) => (
              <div key={i} className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">{it.customer || "Record"}</span>
                  {it.sentiment && (
                    <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getSentimentPill(it.sentiment)}`}>
                      {it.sentiment}
                    </span>
                  )}
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 font-semibold line-clamp-2">"{it.content || it.theme}"</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (m.structured?.type === "summary") {
      return (
        <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 border-l-4 border-l-indigo-500 rounded-2xl p-5 shadow-sm max-w-2xl">
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Workspace Summary Insight</p>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-medium">{(m.structured as any).summary}</p>
        </div>
      );
    }

    if (m.structured?.type === "recommendation") {
      return (
        <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm max-w-2xl">
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Recommended Actions</p>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-medium">{(m.structured as any).recommendation}</p>
        </div>
      );
    }

    // Default: rich markdown render
    return (
      <div key={idx} className="prose dark:prose-invert max-w-none text-xs text-slate-800 dark:text-zinc-200 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {m.text || ""}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[calc(100vh-73px)]">

      {/* ── Left: Chat History Pane ── */}
      <aside className="border-r border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-5 flex flex-col justify-between max-h-[calc(100vh-73px)] sticky top-[73px]">
        <div className="space-y-5 overflow-hidden flex flex-col flex-1">

          {/* New Chat button */}
          <button
            onClick={startNewChat}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>

          {/* History list */}
          <div className="space-y-3 overflow-hidden flex flex-col flex-1">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <History className="h-3.5 w-3.5" />
              <span>Question History</span>
            </h3>

            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
              {history.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <MessageSquare className="h-6 w-6 text-slate-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No history yet</p>
                </div>
              ) : (
                history.map((h) => {
                  const isSelected = selectedHistoryId === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => loadHistoryItem(h.id)}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer text-xs font-medium border transition-all duration-200 ${
                        isSelected
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "border-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <span className="line-clamp-1 flex-1 pr-1">{h.question}</span>
                      <button
                        onClick={(e) => deleteHistoryItem(h.id, e)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors shrink-0"
                        title="Delete chat log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer tag */}
        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <Bot className="h-4 w-4 text-slate-500" />
          <span>Ask LOOP Agent v3.5</span>
        </div>
      </aside>

      {/* ── Right: Main Chat Interface ── */}
      <section className="flex flex-col max-h-[calc(100vh-73px)]">

        {/* Header bar */}
        <div className="border-b border-slate-200 dark:border-zinc-800 px-6 py-4 bg-white/70 dark:bg-zinc-950/70 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Ask LOOP</h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">AI-powered customer insights analyst</p>
          </div>
        </div>

        {/* Messages feed */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
                {/* Bot avatar */}
                {!isUser && (
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center border border-indigo-500/20 shadow-sm shadow-indigo-600/10 self-start shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`max-w-[75%] ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md shadow-indigo-600/10 text-xs font-semibold leading-relaxed"
                      : "space-y-3"
                  }`}
                >
                  {isUser ? (m as UserMessage).text : renderAssistant(m as AssistantMessage, i)}
                </div>

                {/* User avatar */}
                {isUser && (
                  <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center border border-slate-800 shadow-sm self-start shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center border border-indigo-500/20 shadow-sm self-start shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-5 py-3.5 shadow-sm flex items-center">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 p-4 sm:p-6 space-y-4 shrink-0">
          <div className="relative flex items-center">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query database… e.g. Show me total feedback counts, or list positive Survey reviews"
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl py-3.5 pl-4 pr-14 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:border-indigo-500 outline-none resize-none h-14 min-h-[56px] shadow-sm max-h-36 transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="absolute right-3.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Quick suggestion chips */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={loading}
                className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-3 py-1 rounded-full transition-all disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}