"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Sparkles } from "lucide-react";

type User = {
  name: string;
  email: string;
  role: string;
  workspaceName?: string;
  workspace?: {
    name?: string;
  };
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    localStorage.removeItem("user");
    router.push("/signin");
  };

  // Dynamic Title Map
  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Dashboard Overview";
    if (path.startsWith("/feedback")) return "Feedback Repository";
    if (path.startsWith("/analytics")) return "Analytics Hub";
    if (path.startsWith("/theme-trends")) return "Theme Trends";
    if (path.startsWith("/reports")) return "Executive Reports";
    if (path.startsWith("/chat")) return "Ask LOOP AI";
    if (path.startsWith("/users")) return "Workspace Team";
    if (path.startsWith("/settings")) return "Settings";
    return "Workspace";
  };

  // Get Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const workspaceName = user?.workspaceName || user?.workspace?.name || "LOOP Workspace";

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 px-8 py-4 flex justify-between items-center transition-colors">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          {getPageTitle(pathname)}
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {workspaceName}
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Search simulation (Visual only) */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search workspace..."
            className="h-9 w-64 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-zinc-950"></span>
          </button>
        </div>

        {/* Profile Card / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-zinc-850 text-left focus:outline-none cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xxs uppercase tracking-wider font-extrabold text-indigo-500">
                {user?.role || "VIEWER"}
              </p>
            </div>

            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/10 hover:opacity-90 transition-opacity">
              {user?.name ? getInitials(user.name) : "GU"}
            </div>
          </button>

          {menuOpen && (
            <>
              {/* Overlay background to dismiss menu on click outside */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-40">
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-350 dark:hover:bg-zinc-800/50"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-450 dark:hover:bg-rose-950/20 text-left cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
