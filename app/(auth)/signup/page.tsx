"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Sparkles, User, Briefcase, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

type RegisterForm = {
  name: string;
  workspace: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<RegisterForm>();

  async function onSubmit(data: RegisterForm) {
    if (data.password !== data.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(result.message || "Registration failed.");
        return;
      }

      alert("Workspace and account created successfully!");
      reset();
      router.push("/signin");
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#05070f] overflow-hidden px-4 py-12">
      {/* Background radial gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-950/20 grid md:grid-cols-12 min-h-[650px]">
        
        {/* Left pane: Brand visual (5 cols) */}
        <div className="relative col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-10 flex flex-col justify-between overflow-hidden border-r border-slate-800/50 hidden md:flex">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-extrabold text-sm tracking-wider">L</span>
              </div>
              <span className="text-lg font-bold tracking-wider text-slate-100">
                Project LOOP
              </span>
            </div>
          </div>

          <div className="relative z-10 my-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3 w-3" />
              <span>Workspace Setup</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Create your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">collaboration workspace.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Launch a shared environment where your team can collaborate to process CSV datasets and inspect AI recommendations.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800/60 pt-6">
            <span>Powered by Groq </span>
            <span>&bull;</span>
            <span>Secure SSL encryption</span>
          </div>
        </div>

        {/* Right pane: Signup form (7 cols) */}
        <div className="col-span-12 md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-slate-950/25">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              {/* Logo block for mobile */}
              <div className="flex items-center gap-2 mb-3 md:hidden">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-white font-extrabold text-sm tracking-wider">L</span>
                </div>
                <span className="text-lg font-bold tracking-wider text-slate-100">
                  Project LOOP
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                Create Workspace
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Set up a workspace and create your administrator profile.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-sm text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...register("name", { required: true })}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Workspace Name
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...register("workspace", { required: true })}
                      placeholder="My Team"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register("email", { required: true })}
                    type="email"
                    placeholder="jane@company.com"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...register("password", { required: true })}
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...register("confirmPassword", { required: true })}
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl py-3.5 font-medium shadow-lg shadow-indigo-650/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-400">
                Already have an account?
                <a
                  href="/signin"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 ml-1.5 transition-colors"
                >
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}