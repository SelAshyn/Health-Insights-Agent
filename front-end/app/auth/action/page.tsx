"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

const GITHUB_URL = "https://github.com/SelAshyn/Health-Insights-Agent";

// ── GitHub icon ───────────────────────────────────────────────────────────────
function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ── Left panel (shared) ───────────────────────────────────────────────────────
function LeftPanel({ title, subtitle }: { title: React.ReactNode; subtitle: string }) {
  return (
    <div className="hidden lg:flex w-[45%] bg-gray-950 flex-col justify-between px-14 py-12">
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
        <p className="text-[32px] font-extrabold text-white leading-[1.15] tracking-tight mb-5" style={{ fontFamily: "var(--font-sora)" }}>
          {title}
        </p>
        <p className="text-[15px] text-gray-400 leading-relaxed max-w-sm">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-gray-600">Trusted by patients and clinicians worldwide.</p>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-400 transition-colors no-underline">
          <GitHubIcon />
          View on GitHub
        </a>
      </div>
    </div>
  );
}

// ── Reset password form ───────────────────────────────────────────────────────
function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const oobCode = params.get("oobCode") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [done, setDone] = useState(false);

  // Verify the oobCode on mount to show a proper error if it's expired/invalid
  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      setCodeValid(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((resolvedEmail) => {
        setEmail(resolvedEmail);
        setCodeValid(true);
      })
      .catch(() => {
        setCodeValid(false);
      })
      .finally(() => setVerifying(false));
  }, [oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/expired-action-code") {
        setError("This reset link has expired. Please request a new one.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (verifying) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-gray-400">Verifying your reset link…</p>
      </div>
    );
  }

  // ── Invalid / expired code ────────────────────────────────────────────────
  if (!codeValid) {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-2" style={{ fontFamily: "var(--font-sora)" }}>
            Link expired
          </h1>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            This password reset link is invalid or has expired. Reset links are only valid for 1 hour.
          </p>
        </div>
        <Link href="/auth/forgot-password"
          className="px-6 py-3 bg-teal-500 text-white text-[14px] font-bold rounded-xl hover:bg-teal-600 transition-colors no-underline"
          style={{ fontFamily: "var(--font-sora)" }}>
          Request a new link →
        </Link>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-2" style={{ fontFamily: "var(--font-sora)" }}>
            Password updated
          </h1>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
        </div>
        <button
          onClick={() => router.push("/auth/signin")}
          className="px-6 py-3 bg-teal-500 text-white text-[14px] font-bold rounded-xl hover:bg-teal-600 transition-colors"
          style={{ fontFamily: "var(--font-sora)" }}>
          Sign in →
        </button>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Link href="/auth/signin"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-gray-700 transition-colors no-underline mb-8">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to sign in
      </Link>

      <div className="mb-8">
        <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight mb-2" style={{ fontFamily: "var(--font-sora)" }}>
          Reset your password
        </h1>
        <p className="text-[15px] text-gray-500">
          Setting a new password for <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[14px] rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-semibold text-gray-700 tracking-wide">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-[13px] font-semibold text-gray-700 tracking-wide">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Password strength hint */}
        {password.length > 0 && (
          <div className="flex gap-1.5">
            {[...Array(4)].map((_, i) => {
              const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
              return (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  i < strength
                    ? strength === 1 ? "bg-red-400" : strength === 2 ? "bg-amber-400" : strength === 3 ? "bg-teal-400" : "bg-teal-500"
                    : "bg-gray-100"
                }`} />
              );
            })}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 py-3.5 bg-teal-500 text-white text-[15px] font-bold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
          style={{ fontFamily: "var(--font-sora)" }}>
          {loading ? "Saving…" : "Set new password →"}
        </button>
      </form>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ActionPage() {
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-inter)" }}>
      <LeftPanel
        title={<>Set a new <span className="text-teal-400">password.</span></>}
        subtitle="Choose something strong that you haven't used before. We recommend at least 10 characters."
      />
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-stone-50">
        <div className="w-full max-w-md">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
