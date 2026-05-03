"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/main");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-inter)" }}>

      {/* ── LEFT PANEL — branded ── */}
      <div className="hidden lg:flex w-[45%] bg-gray-950 flex-col justify-between px-14 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
            {/* Heart pulse icon inline */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-white font-bold text-[18px]" style={{ fontFamily: "var(--font-sora)" }}>
            Health Insights
          </span>
        </Link>

        {/* Center quote */}
        <div>
          <p
            className="text-[32px] font-extrabold text-white leading-[1.15] tracking-tight mb-5"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Understand your health,{" "}
            <span className="text-teal-400">one report at a time.</span>
          </p>
          <p className="text-[15px] text-gray-400 leading-relaxed max-w-sm">
            AI-powered analysis of your blood reports — plain language, instant insights, follow-up chat.
          </p>
        </div>

        {/* Bottom trust note */}
        <p className="text-[13px] text-gray-600">
          Trusted by patients and clinicians worldwide.
        </p>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-stone-50">
        <div className="w-full max-w-md">

          {/* Back to landing */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-gray-700 transition-colors no-underline mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to home
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-[32px] font-extrabold text-gray-900 tracking-tight mb-2"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              Welcome back
            </h1>
            <p className="text-[15px] text-gray-500">
              Sign in to continue to your dashboard.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[14px] rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-semibold text-gray-700 tracking-wide">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-semibold text-gray-700 tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3.5 bg-teal-500 text-white text-[15px] font-bold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-[14px] text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-teal-600 font-bold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
