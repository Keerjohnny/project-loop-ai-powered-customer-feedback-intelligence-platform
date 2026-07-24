"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }
      localStorage.removeItem("user");
      router.replace("/signin");
    }
    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070f] font-sans">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-400">Signing out of your workspace...</p>
      </div>
    </div>
  );
}
