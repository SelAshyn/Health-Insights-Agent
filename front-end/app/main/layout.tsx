"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Session } from "@/types/session";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Status badge colors
const statusColors: Record<Session["status"], string> = {
  uploaded:  "bg-blue-500/10 text-blue-400",
  analyzing: "bg-yellow-500/10 text-yellow-400",
  done:      "bg-teal-500/10 text-teal-400",
  error:     "bg-red-500/10 text-red-400",
};

const statusLabels: Record<Session["status"], string> = {
  uploaded:  "Uploaded",
  analyzing: "Analyzing…",
  done:      "Done",
  error:     "Error",
};

// ── Session item ──────────────────────────────────────────────────────────────
function SessionItem({
  session,
  active,
  loading,
  onClick,
  onDelete,
  onRetry,
}: {
  session: Session;
  active: boolean;
  loading: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onRetry: (id: string) => void;
}) {
  const isError = session.status === "error";

  return (
    <div
      onClick={() => {
        // Fire a custom event that main/page.tsx listens to
        window.dispatchEvent(new CustomEvent("load-session", { detail: session }));
        onClick();
      }}
      className={`group relative flex flex-col gap-1 px-3 py-2.5 rounded-xl cursor-pointer transition-colors
        ${active ? "bg-white/10" : "hover:bg-white/5"}`}
    >
      {/* File name / session title */}
      <p className="text-[13px] font-medium text-gray-200 truncate pr-6">
        {session.sessionTitle || session.fileName}
      </p>
      {/* Date + status */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-600">{formatDate(session.createdAt)}</span>
        {isError ? (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
            Failed
          </span>
        ) : (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[session.status]}`}>
            {statusLabels[session.status]}
          </span>
        )}
      </div>
      {/* Retry button for error state */}
      {isError && (
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(session.id); }}
          className="mt-1 self-start text-[11px] font-semibold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg px-2 py-0.5 transition-colors"
        >
          Retry
        </button>
      )}
      {/* Delete button or loading spinner */}
      {loading ? (
        <div className="absolute right-2 top-2.5 p-0.5">
          <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <button
          onClick={onDelete}
          className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 p-0.5"
          title="Delete session"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  userName,
  userEmail,
  sessions,
  sessionsLoading,
  sessionsError,
  activeSessionId,
  loadingSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
  onRetry,
  onSignOut,
}: {
  userName: string;
  userEmail: string;
  sessions: Session[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  activeSessionId: string | null;
  loadingSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
  onRetry: (id: string) => void;
  onSignOut: () => void;
}) {
  const initials = userName !== userEmail
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : userEmail.slice(0, 2).toUpperCase();

  // Daily limit — count sessions created today
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayCount = sessions.filter(s => s.createdAt >= todayStart.getTime()).length;
  const DAILY_LIMIT = 15;
  const remaining = Math.max(0, DAILY_LIMIT - todayCount);
  const limitPct = Math.min(100, (todayCount / DAILY_LIMIT) * 100);

  return (
    <aside
      className="w-72 shrink-0 h-screen sticky top-0 flex flex-col bg-gray-950 border-r border-white/5"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-teal-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
              Health Insights
            </span>
            <span className="text-[10px] font-semibold text-teal-400 tracking-widest uppercase mt-0.5">
              Agent
            </span>
          </div>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-3">
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-sora)" }}>
              {initials}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-white truncate">{userName}</span>
            <span className="text-[11px] text-gray-500 truncate">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* New session button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onNewSession}
          className="w-full py-2.5 text-[13px] font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-400 transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Session
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-3 px-1">
          Recent Sessions
        </p>

        {sessionsLoading ? (
          // Skeleton loading state
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessionsError ? (
          // Error state — listener failed
          <div className="flex flex-col items-center justify-center py-8 gap-3 px-1">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-[11px] text-red-400 text-center leading-relaxed">{sessionsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[11px] text-gray-500 hover:text-gray-300 underline transition-colors"
            >
              Refresh page
            </button>
          </div>
        ) : sessions.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.8" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-[12px] text-gray-600 text-center leading-relaxed">
              No sessions yet.<br />Upload a report to get started.
            </p>
          </div>
        ) : (
          // Session items
          <div className="flex flex-col gap-1">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                active={session.id === activeSessionId}
                loading={session.id === loadingSessionId}
                onClick={() => onSelectSession(session.id)}
                onDelete={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                onRetry={onRetry}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom: daily limit + sign out */}
      <div className="px-4 py-4 border-t border-white/5 flex flex-col gap-3">
        <div className="bg-white/5 rounded-xl px-3.5 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-gray-400">Daily analyses</span>
            <span className={`text-[12px] font-semibold ${remaining === 0 ? "text-red-400" : "text-gray-300"}`}>
              {todayCount} / {DAILY_LIMIT}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${limitPct > 80 ? "bg-red-500" : "bg-teal-500"}`}
              style={{ width: `${limitPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-600 mt-1.5">
            {remaining === 0 ? "Daily limit reached" : `${remaining} analyses remaining today`}
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="w-full py-2.5 text-[13px] font-semibold text-gray-400 border border-white/10 rounded-xl hover:border-white/20 hover:text-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Route protection
  useEffect(() => {
    if (!loading && !user) router.push("/auth/signin");
  }, [user, loading, router]);

  // Real-time session listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      // onNext — fires on every data change
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Session[];
        setSessions(data);
        setSessionsLoading(false);
        setSessionsError(null);
      },
      // onError — fires on permission errors, missing indexes, network failures
      // Without this, the listener silently dies and sessionsLoading stays true forever
      (error) => {
        console.error("Session listener error:", error);
        setSessionsLoading(false);
        if (error.code === "permission-denied") {
          setSessionsError("Permission denied. Check your Firestore security rules.");
        } else if (error.code === "failed-precondition") {
          setSessionsError("Missing Firestore index. Check the browser console for a link to create it.");
        } else {
          setSessionsError("Failed to load sessions. Please refresh the page.");
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen for session-loaded event from page to clear loading state
  useEffect(() => {
    function handleSessionLoaded() {
      setLoadingSessionId(null);
    }
    window.addEventListener("session-loaded", handleSessionLoaded);
    return () => window.removeEventListener("session-loaded", handleSessionLoaded);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-500" style={{ fontFamily: "var(--font-inter)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  async function handleSignOut() {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (!confirmed) return;
    await signOut(auth);
    router.push("/auth/signin");
  }

  async function handleDeleteSession(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const confirmed = window.confirm(
      `Delete "${session.sessionTitle || session.fileName}"?\n\nThis will permanently remove the PDF and all associated data.`
    );
    if (!confirmed) return;

    try {
      // Step 1: Delete from Supabase Storage first.
      // If this fails, we abort — better to have an orphaned-but-discoverable
      // session in Firestore than a PDF with no metadata pointing to it.
      if (session.storagePath) {
        const { error } = await supabase.storage
          .from("reports")
          .remove([session.storagePath]);

        if (error) {
          // Storage delete failed — do NOT proceed to delete Firestore doc.
          // The session remains visible so the user can retry or report the issue.
          console.error("Storage delete error:", error);
          window.alert(
            `Could not delete the PDF file from storage: ${error.message}\n\n` +
            `The session has not been removed. Please try again.`
          );
          return; // ← abort here, Firestore doc stays intact
        }
      }

      // Step 2: Storage succeeded (or there was no file) — safe to delete metadata.
      await deleteDoc(doc(db, "sessions", sessionId));

      if (activeSessionId === sessionId) setActiveSessionId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      window.alert("Something went wrong while deleting. Please try again.");
    }
  }

  function handleNewSession() {
    setActiveSessionId(null);
    // Tell the main page to reset to the welcome screen
    window.dispatchEvent(new CustomEvent("new-session"));
  }

  function handleSelectSession(id: string) {
    setActiveSessionId(id);
    setLoadingSessionId(id);
    // Fallback: clear loading after 500ms in case session-loaded event doesn't fire
    setTimeout(() => {
      setLoadingSessionId((prev) => (prev === id ? null : prev));
    }, 500);
  }

  function handleRetrySession(id: string) {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    window.dispatchEvent(new CustomEvent("retry-session", { detail: session }));
  }

  const userName = user.displayName || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "";

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          sessionsError={sessionsError}
          activeSessionId={activeSessionId}
          loadingSessionId={loadingSessionId}
          onSelectSession={(id) => { handleSelectSession(id); setSidebarOpen(false); }}
          onDeleteSession={handleDeleteSession}
          onNewSession={() => { handleNewSession(); setSidebarOpen(false); }}
          onRetry={handleRetrySession}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-950 border-b border-white/5 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-[14px] font-bold text-white" style={{ fontFamily: "var(--font-sora)" }}>
              Health Insights
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
