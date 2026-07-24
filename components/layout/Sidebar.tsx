"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  TrendingUp,
  FileText,
  Sparkles,
  Users,
  Settings,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/theme-trends", label: "Theme Trends", icon: TrendingUp },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/ask-loop", label: "Ask LOOP", icon: Sparkles },
    { href: "/users", label: "Users", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed", error);
    }
    localStorage.removeItem("user");
    router.push("/signin");
  }

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-extrabold text-lg tracking-wider">L</span>
          </div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            LOOP
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 text-slate-500 group-hover:text-rose-400 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
