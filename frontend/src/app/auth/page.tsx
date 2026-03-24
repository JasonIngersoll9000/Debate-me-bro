"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function AuthPageInner() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnToRaw = searchParams.get("returnTo") || searchParams.get("next");
  const safeReturnTo =
    returnToRaw && returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail || "Registration failed.");
        }
        // Auto-login after registration
      }

      // Login
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "Invalid email or password.");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_email", email);
      router.push(safeReturnTo ?? "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative font-sans overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-fuchsia-600/15 blur-[120px] rounded-none mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] -right-[15%] w-[60vw] h-[60vw] bg-blue-600/15 blur-[120px] rounded-none mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute -bottom-[10%] left-[30%] w-[40vw] h-[40vw] bg-violet-600/15 blur-[120px] rounded-none mix-blend-screen animate-[pulse_9s_ease-in-out_infinite_2s]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-outline-variant bg-black/40 backdrop-blur-3xl px-8 py-5 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-none bg-pro flex items-center justify-center">
            <span className="text-[#00195b] font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-on-surface">
            DebateMeBro
          </span>
        </Link>
      </header>

      {/* Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-none border border-outline-variant bg-surface-container overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex border-b border-outline-variant">
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${
                  mode === "login"
                    ? "text-on-surface bg-surface-container border-b-2 border-pro"
                    : "border-b-2 border-transparent text-on-surface-variant hover:bg-surface-high"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("register"); setError(null); }}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${
                  mode === "register"
                    ? "text-on-surface bg-surface-container border-b-2 border-pro"
                    : "border-b-2 border-transparent text-on-surface-variant hover:bg-surface-high"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black text-on-surface mb-2">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  {mode === "login"
                    ? "Sign in to vote, view history, and track debates."
                    : "Join to participate in AI-powered debates."}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-none bg-con/10 border border-con/30 text-con text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-none border-0 border-b border-outline bg-surface-high text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:border-pro transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-none border-0 border-b border-outline bg-surface-high text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:border-pro transition-all"
                />
              </div>

              {/* Confirm Password (register only) */}
              {mode === "register" && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-none border-0 border-b border-outline bg-surface-high text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:border-pro transition-all"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-none uppercase tracking-widest text-sm font-black transition-all border ${
                  mode === "login"
                    ? "bg-pro text-[#00195b] border-pro/30"
                    : "bg-con text-[#4a0004] border-con/30"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-none border-2 border-white/40 border-t-white animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  mode === "login" ? "Sign In" : "Create Account"
                )}
              </button>

              {/* Switch mode link */}
              <p className="text-center text-sm text-on-surface-variant pt-2">
                {mode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => { setMode("register"); setError(null); }} className="text-con hover:text-con font-bold transition-colors">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setMode("login"); setError(null); }} className="text-pro hover:text-pro font-bold transition-colors">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>

          {/* Bottom text */}
          <p className="text-center text-xs text-on-surface-variant mt-6">
            By signing up, you agree to participate in AI-powered debates for educational purposes.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-none border-2 border-pro border-t-transparent animate-spin" />
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  );
}
