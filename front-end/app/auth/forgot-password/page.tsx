"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/main");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // Don't reveal whether the email exists — just show the success state
        setSent(true);
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

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[45%] bg-gray-950 flex-col justify-between px-14 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-white font-bold text-[18px]" style={{ fontFamily: "var(--font-sora)" }}>
            Health Insights
          </span>
        </Link>

        <div>
          <p
            className="text-[32px] font-extrabold text-white leading-[1.15] tracking-tight mb-5"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            No worries —{" "}
            <span className="text-teal-400">we&apos;ve got you.</span>
          </p>
          <p className="text-[15px] text-gray-400 leading-relaxed max-w-sm">
            Enter your email and we&apos;ll send you a link to reset your password. It only takes a moment.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-gray-600">
            Trusted by patients and clinicians worldwide.
          </p>
          <a
            href="https://github.com/SelAshyn/Health-Insights-Agent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-400 transition-colors no-underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-stone-50">
        <div className="w-full max-w-md">

          {/* Back to sign in */}
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-gray-700 transition-colors no-underline mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to sign in
          </Link>

          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h1
                  className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-2"
                  style={{ fontFamily: "var(--font-sora)" }}
                >
                  Check your inbox
                </h1>
                <p className="text-[15px] text-gray-500 leading-relaxed">
                  If an account exists for <span className="font-semibold text-gray-700">{email}</span>, you&apos;ll receive a password reset link shortly.
                </p>
              </div>
              <p className="text-[13px] text-gray-400">
                Didn&apos;t get it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/auth/signin"
                className="mt-2 px-6 py-3 bg-teal-500 text-white text-[14px] font-bold rounded-xl hover:bg-teal-600 transition-colors no-underline"
                style={{ fontFamily: "var(--font-sora)" }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <h1
                  className="text-[32px] font-extrabold text-gray-900 tracking-tight mb-2"
                  style={{ fontFamily: "var(--font-sora)" }}
                >
                  Forgot password?
                </h1>
                <p className="text-[15px] text-gray-500">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[14px] rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[13px] font-semibold text-gray-700 tracking-wide">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 py-3.5 bg-teal-500 text-white text-[15px] font-bold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
                  style={{ fontFamily: "var(--font-sora)" }}
                >
                  {loading ? "Sending…" : "Send reset link →"}
                </button>
              </form>

              <p className="text-center text-[14px] text-gray-500 mt-6">
                Remember your password?{" "}
                <Link href="/auth/signin" className="text-teal-600 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
