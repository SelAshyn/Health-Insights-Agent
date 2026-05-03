"use client";

import { useRef, useState, useEffect } from "react";
import { collection, addDoc, doc, updateDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Session, StructuredAnalysis, ChatMessage } from "@/types/session";
import { SAMPLE_REPORT_TEXT, SAMPLE_REPORT_FILENAME } from "@/lib/sampleReport";

const MAX_SIZE_MB = 1.5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_PAGES_ESTIMATE = 50; // shown in UI hint
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Auth helper ───────────────────────────────────────────────────────────────
// Gets the current user's Firebase ID token and returns auth headers.
// The token is short-lived (1hr) but Firebase auto-refreshes it.
async function getAuthHeaders(user: import("firebase/auth").User): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

type Stage = "welcome" | "upload" | "analyzing" | "result";

// ── Status badge ──────────────────────────────────────────────────────────────
const statusConfig = {
  low:    { label: "Low",    bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100",  dot: "bg-blue-400"  },
  high:   { label: "High",   bg: "bg-red-50",    text: "text-red-600",    border: "border-red-100",   dot: "bg-red-400"   },
  normal: { label: "Normal", bg: "bg-teal-50",   text: "text-teal-600",   border: "border-teal-100",  dot: "bg-teal-400"  },
};

// ── Analysis card component ───────────────────────────────────────────────────
function AnalysisView({ data, fileName, modelUsed, onNewSession }: {
  data: StructuredAnalysis;
  fileName: string;
  modelUsed: string;
  onNewSession: () => void;
}) {
  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: "var(--font-inter)" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-gray-400">📄 {fileName}</p>
          {modelUsed && <p className="text-[11px] text-gray-300 mt-0.5">Analyzed by {modelUsed}</p>}
        </div>
        <button onClick={onNewSession}
          className="shrink-0 px-5 py-2 text-[13px] font-semibold text-teal-600 border border-teal-200 rounded-full hover:bg-teal-50 transition-colors">
          + New session
        </button>
      </div>

      {/* Summary card */}
      <div className="bg-teal-500 rounded-3xl p-7 text-white">
        <p className="text-[11px] font-bold tracking-widest uppercase text-teal-100 mb-3">Overview</p>
        <p className="text-[16px] leading-relaxed font-medium">{data.summary}</p>
      </div>

      {/* Results grid */}
      {data.results && data.results.length > 0 && (
        <div>
          <p className="text-[12px] font-bold tracking-widest uppercase text-gray-400 mb-3 px-1">Your Results</p>
          <div className="flex flex-col gap-3">
            {data.results.map((r, i) => {
              const cfg = statusConfig[r.status] || statusConfig.normal;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[15px] font-bold text-gray-900" style={{ fontFamily: "var(--font-sora)" }}>{r.name}</p>
                      <p className="text-[13px] text-gray-400 mt-0.5">Normal range: {r.range}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-[18px] font-extrabold text-gray-900" style={{ fontFamily: "var(--font-sora)" }}>{r.value}</p>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="h-px bg-gray-100 mb-3" />
                  {/* Explanation */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2.5">
                      <span className="text-[14px] mt-0.5">💡</span>
                      <p className="text-[13px] text-gray-600 leading-relaxed">{r.what_it_means}</p>
                    </div>
                    <div className="flex gap-2.5">
                      <span className="text-[14px] mt-0.5">✅</span>
                      <p className="text-[13px] text-teal-700 leading-relaxed font-medium">{r.what_to_do}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key findings */}
      {data.key_findings && data.key_findings.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-[12px] font-bold tracking-widest uppercase text-amber-600 mb-3">Things Worth Noting</p>
          <div className="flex flex-col gap-2">
            {data.key_findings.map((f, i) => (
              <p key={i} className="text-[13px] text-amber-900 leading-relaxed">{f}</p>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {data.next_steps && data.next_steps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[12px] font-bold tracking-widest uppercase text-gray-400 mb-4">What To Do Next</p>
          <div className="flex flex-col gap-3">
            {data.next_steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement */}
      {data.encouragement && (
        <div className="bg-gray-950 rounded-2xl p-5">
          <p className="text-[12px] font-bold tracking-widest uppercase text-gray-500 mb-2">A Note For You</p>
          <p className="text-[14px] text-gray-300 leading-relaxed">{data.encouragement}</p>
        </div>
      )}
    </div>
  );
}

// ── Chat component ────────────────────────────────────────────────────────────
function ChatSection({ messages, onSend, loading, sessionId }: {
  messages: ChatMessage[];
  onSend: (q: string) => void;
  loading: boolean;
  sessionId: string | null;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleSend() {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }

  const suggestions = [
    "Why do I feel tired all the time?",
    "What foods should I eat to improve my results?",
    "Should I be worried about anything?",
    "What does this mean for my daily life?",
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" style={{ fontFamily: "var(--font-inter)" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-[14px] font-bold text-gray-900" style={{ fontFamily: "var(--font-sora)" }}>Ask about your results</p>
          <p className="text-[12px] text-gray-400">I'm here to help you understand anything</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-5 py-4 flex flex-col gap-3 min-h-50 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2 py-2">
            <p className="text-[12px] text-gray-400 mb-1">Try asking:</p>
            {suggestions.map((q) => (
              <button key={q} onClick={() => onSend(q)}
                className="text-left px-4 py-2.5 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 text-[13px] text-gray-600 rounded-xl transition-colors border border-gray-100 hover:border-teal-200">
                {q}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed
                ${msg.role === "user"
                  ? "bg-teal-500 text-white rounded-br-sm"
                  : "bg-gray-50 text-gray-700 rounded-bl-sm border border-gray-100"}`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-gray-100 flex gap-3">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask anything about your report…"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
        <button onClick={handleSend} disabled={loading || !input.trim()}
          className="px-5 py-2.5 bg-teal-500 text-white text-[13px] font-bold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-sora)" }}>
          Send
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MainPage() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "there";

  const [stage, setStage] = useState<Stage>("welcome");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<StructuredAnalysis | null>(null);
  const [analysisRaw, setAnalysisRaw] = useState<string>("");
  const [reportText, setReportText] = useState<string>("");
  const [modelUsed, setModelUsed] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load session from sidebar ───────────────────────────────────────────────
  useEffect(() => {
    // Listen for "new session" button in sidebar
    function handleNewSession() {
      handleReset();
    }
    window.addEventListener("new-session", handleNewSession);
    return () => window.removeEventListener("new-session", handleNewSession);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    async function handleLoadSession(e: CustomEvent) {
      const session = e.detail as Session;
      if (session.status !== "done" || !session.analysis) {
        // Dispatch session-loaded even for non-done sessions so spinner clears
        window.dispatchEvent(new CustomEvent("session-loaded"));
        return;
      }

      setAnalysis(session.analysis);
      setAnalysisRaw(session.analysisRaw || "");
      setReportText(session.reportText || "");
      setModelUsed(session.modelUsed || "");
      setSessionId(session.id);
      setFileName(session.fileName);
      setStage("result");

      // Load chat history from Firestore subcollection
      try {
        const chatRef = collection(db, "sessions", session.id, "messages");
        const q = query(chatRef, orderBy("createdAt", "asc"));
        const snap = await getDocs(q);
        const msgs = snap.docs.map((d) => d.data() as ChatMessage);
        setChatMessages(msgs);
      } catch {
        setChatMessages([]);
      }

      // Notify layout that session has loaded
      window.dispatchEvent(new CustomEvent("session-loaded"));
    }

    window.addEventListener("load-session", handleLoadSession as unknown as EventListener);
    return () => window.removeEventListener("load-session", handleLoadSession as unknown as EventListener);
  }, []);

  // ── Retry session from sidebar ──────────────────────────────────────────────
  useEffect(() => {
    async function handleRetrySession(e: CustomEvent) {
      const session = e.detail as Session;
      if (session.reportText) {
        // Re-analyze using stored report text
        setFileName(session.fileName);
        setSessionId(session.id);
        setStage("analyzing");
        setErrorMsg(null);
        setUploadProgress(0);

        try {
          const response = await fetch(`${API_URL}/analyze-text`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(user ? await getAuthHeaders(user) : {}) },
            body: JSON.stringify({ text: session.reportText, filename: session.fileName }),
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Analysis failed (${response.status})`);
          }
          const result = await response.json();

          const sessionTitle = generateSessionTitle(result.analysis?.summary, session.fileName);

          await updateDoc(doc(db, "sessions", session.id), {
            status: "done",
            analysis: result.analysis,
            analysisRaw: result.analysis_raw ?? "",
            reportText: result.report_text ?? "",
            modelUsed: result.model_used ?? "",
            sessionTitle,
          });

          setAnalysis(result.analysis);
          setAnalysisRaw(result.analysis_raw);
          setReportText(result.report_text);
          setModelUsed(result.model_used);
          setChatMessages([]);
          setUploadProgress(100);
          setStage("result");
        } catch (err: unknown) {
          console.error(err);
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
          await updateDoc(doc(db, "sessions", session.id), { status: "error" }).catch(() => {});
          setStage("upload");
        }
      } else {
        // No stored text — show upload stage
        setFileName(session.fileName);
        setStage("upload");
        setErrorMsg(`Re-analyzing: ${session.fileName}`);
      }
    }

    window.addEventListener("retry-session", handleRetrySession as unknown as EventListener);
    return () => window.removeEventListener("retry-session", handleRetrySession as unknown as EventListener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Generate session title from summary ────────────────────────────────────
  function generateSessionTitle(summary: string | undefined, fallback: string): string {
    if (!summary) return fallback;
    const words = summary.trim().split(/\s+/).slice(0, 6);
    return words.join(" ");
  }

  // ── Sample report ───────────────────────────────────────────────────────────
  async function handleUseSampleReport() {
    if (!user) return;
    setStage("analyzing");
    setErrorMsg(null);
    setUploadProgress(0);
    let newSessionId: string | null = null;

    try {
      const timestamp = Date.now();

      const sessionRef = await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        fileName: SAMPLE_REPORT_FILENAME,
        storageUrl: "",
        storagePath: "",
        createdAt: timestamp,
        status: "analyzing",
      });
      newSessionId = sessionRef.id;
      setSessionId(sessionRef.id);
      setUploadProgress(30);

      const response = await fetch(`${API_URL}/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...await getAuthHeaders(user) },
        body: JSON.stringify({ text: SAMPLE_REPORT_TEXT, filename: SAMPLE_REPORT_FILENAME }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Analysis failed (${response.status})`);
      }
      const result = await response.json();
      setUploadProgress(90);

      const sessionTitle = generateSessionTitle(result.analysis?.summary, SAMPLE_REPORT_FILENAME);

      await updateDoc(doc(db, "sessions", sessionRef.id), {
        status: "done",
        analysis: result.analysis,
        analysisRaw: result.analysis_raw ?? "",
        reportText: result.report_text ?? "",
        modelUsed: result.model_used ?? "",
        sessionTitle,
      });

      setAnalysis(result.analysis);
      setAnalysisRaw(result.analysis_raw);
      setReportText(result.report_text);
      setModelUsed(result.model_used);
      setFileName(SAMPLE_REPORT_FILENAME);
      setChatMessages([]);
      setUploadProgress(100);
      setStage("result");

    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      if (newSessionId) {
        await updateDoc(doc(db, "sessions", newSessionId), { status: "error" }).catch(() => {});
      }
      setStage("upload");
    }
  }

  // ── Upload + Analyze ────────────────────────────────────────────────────────
  async function handleUploadAndAnalyze() {
    if (!selectedFile || !user) return;
    setStage("analyzing");
    setErrorMsg(null);
    setUploadProgress(0);
    let newSessionId: string | null = null;

    // Track storagePath outside try so the catch block can clean it up
    let uploadedStoragePath: string | null = null;

    try {
      const timestamp = Date.now();
      const storagePath = `${user.uid}/${timestamp}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("reports").upload(storagePath, selectedFile, { contentType: "application/pdf" });
      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      // Mark as uploaded — from this point on, any failure must clean this up
      uploadedStoragePath = storagePath;
      setUploadProgress(35);

      const { data: signedData, error: urlError } = await supabase.storage
        .from("reports").createSignedUrl(storagePath, 365 * 24 * 60 * 60);
      if (urlError || !signedData) throw new Error("Failed to get file URL.");
      setUploadProgress(45);

      const sessionRef = await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        fileName: selectedFile.name,
        storageUrl: signedData.signedUrl,
        storagePath,
        createdAt: timestamp,
        status: "analyzing",
      });
      newSessionId = sessionRef.id;
      setSessionId(sessionRef.id);
      setUploadProgress(55);

      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { ...await getAuthHeaders(user) }, // no Content-Type — browser sets it with boundary for multipart
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Analysis failed (${response.status})`);
      }
      const result = await response.json();
      setUploadProgress(90);

      const sessionTitle = generateSessionTitle(result.analysis?.summary, selectedFile.name);

      await updateDoc(doc(db, "sessions", sessionRef.id), {
        status: "done",
        analysis: result.analysis,
        analysisRaw: result.analysis_raw ?? "",
        reportText: result.report_text ?? "",
        modelUsed: result.model_used ?? "",
        sessionTitle,
      });

      // Success — clear the cleanup tracker since everything committed
      uploadedStoragePath = null;

      setAnalysis(result.analysis);
      setAnalysisRaw(result.analysis_raw);
      setReportText(result.report_text);
      setModelUsed(result.model_used);
      setFileName(selectedFile.name);
      setChatMessages([]);
      setUploadProgress(100);
      setStage("result");

    } catch (err: unknown) {
      console.error(err);

      // ── Compensating cleanup ──────────────────────────────────────────────
      // If the file was uploaded but something failed after, delete it from
      // Supabase so it doesn't become an orphaned file the user can't see or delete.
      if (uploadedStoragePath) {
        supabase.storage.from("reports").remove([uploadedStoragePath]).catch((e) => {
          console.error("Cleanup: failed to remove orphaned file:", e);
        });
      }
      // Mark Firestore session as error if it was created
      if (newSessionId) {
        await updateDoc(doc(db, "sessions", newSessionId), { status: "error" }).catch(() => {});
      }

      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      const isScanned = msg.includes("SCANNED_PDF") || msg.toLowerCase().includes("scanned image");
      setErrorMsg(
        isScanned
          ? "This PDF looks like a scanned image — we can't read text from it. Please ask your doctor or lab for a digital version of your report."
          : msg
      );
      setStage("upload");
    }
  }

  // ── Chat with history saving ────────────────────────────────────────────────
  async function handleSendMessage(question: string) {
    if (!question || chatLoading) return;

    // Use the current sessionId from state — log if missing so we can debug
    const currentSessionId = sessionId;
    if (!currentSessionId) {
      console.warn("handleSendMessage: sessionId is null, messages won't be saved");
    }

    setChatLoading(true);

    const userMsg: ChatMessage = { role: "user", content: question, createdAt: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);

    // Save user message to Firestore
    if (currentSessionId) {
      try {
        await addDoc(collection(db, "sessions", currentSessionId, "messages"), {
          role: userMsg.role,
          content: userMsg.content,
          createdAt: userMsg.createdAt,
        });
      } catch (e) {
        console.error("Failed to save user message:", e);
      }
    }

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(user ? await getAuthHeaders(user) : {}) },
        body: JSON.stringify({
          question,
          report_text: reportText,
          analysis_raw: analysisRaw,
          history: chatMessages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error("Chat request failed.");
      const data = await response.json();

      const assistantMsg: ChatMessage = { role: "assistant", content: data.answer, createdAt: Date.now() };
      setChatMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to Firestore
      if (currentSessionId) {
        try {
          await addDoc(collection(db, "sessions", currentSessionId, "messages"), {
            role: assistantMsg.role,
            content: assistantMsg.content,
            createdAt: assistantMsg.createdAt,
          });
        } catch (e) {
          console.error("Failed to save assistant message:", e);
        }
      }

    } catch (e) {
      console.error("Chat fetch failed:", e);
      const errMsg: ChatMessage = { role: "assistant", content: "Sorry, I couldn't process that. Please try again.", createdAt: Date.now() };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleReset() {
    setStage("welcome");
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMsg(null);
    setAnalysis(null);
    setAnalysisRaw("");
    setReportText("");
    setModelUsed("");
    setSessionId(null);
    setFileName("");
    setChatMessages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-14" style={{ fontFamily: "var(--font-inter)" }}>
      <div className="mb-10">
        <h1 className="text-[36px] font-extrabold text-gray-900 tracking-tight mb-2" style={{ fontFamily: "var(--font-sora)" }}>
          Hello, {firstName} 👋
        </h1>
        <p className="text-[15px] text-gray-400">Your personal health report assistant.</p>
      </div>

      {/* WELCOME */}
      {stage === "welcome" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              { icon: "📄", title: "Upload your report", desc: "Any PDF health report — blood work, thyroid, lipids, and more." },
              { icon: "🧠", title: "Plain-language insights", desc: "We explain what your results mean in simple, friendly terms." },
              { icon: "💬", title: "Ask follow-up questions", desc: "Chat with your report — ask anything, anytime." },
            ].map((card) => (
              <div key={card.title} className="bg-gray-50 rounded-2xl px-5 py-6 flex flex-col gap-2">
                <span className="text-[28px]">{card.icon}</span>
                <p className="text-[14px] font-bold text-gray-900" style={{ fontFamily: "var(--font-sora)" }}>{card.title}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-100 mb-8" />
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-[18px] font-bold text-gray-900" style={{ fontFamily: "var(--font-sora)" }}>Ready to understand your health?</p>
            <p className="text-[14px] text-gray-400 max-w-sm">Upload your report and we'll explain everything in plain language — no medical degree needed.</p>
            <button onClick={() => setStage("upload")}
              className="mt-2 px-8 py-3.5 bg-teal-500 text-white text-[15px] font-bold rounded-full hover:bg-teal-600 transition-colors shadow-lg shadow-teal-100"
              style={{ fontFamily: "var(--font-sora)" }}>
              + Start a new session
            </button>
          </div>
        </div>
      )}

      {/* UPLOAD */}
      {stage === "upload" && (
        <div className="flex flex-col gap-4">
          <button onClick={handleReset} className="self-start inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-gray-700 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <div onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`bg-white border-2 border-dashed rounded-3xl p-12 flex flex-col items-center text-center gap-5 transition-colors
              ${!selectedFile ? "border-gray-200 hover:border-teal-400 cursor-pointer" : "border-gray-100 cursor-default"}`}>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.type !== "application/pdf") { setErrorMsg("Only PDF files are supported."); return; }
              if (file.size > MAX_SIZE_BYTES) { setErrorMsg(`File too large. Max ${MAX_SIZE_MB} MB. Try compressing the PDF or exporting just the relevant pages.`); return; }
              setErrorMsg(null);
              setSelectedFile(file);
            }} />
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            {selectedFile ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">
                  <span className="text-[13px] font-semibold text-teal-700">{selectedFile.name}</span>
                  <span className="text-[12px] text-teal-500">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleUploadAndAnalyze(); }}
                  className="px-7 py-3 text-[14px] font-bold text-white bg-teal-500 rounded-full hover:bg-teal-600 transition-colors shadow-md"
                  style={{ fontFamily: "var(--font-sora)" }}>
                  Upload & Analyze →
                </button>
                <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-[12px] text-gray-400 hover:text-gray-600">
                  Choose a different file
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[17px] font-bold text-gray-800 mb-1" style={{ fontFamily: "var(--font-sora)" }}>Drop your health report here</p>
                  <p className="text-[13px] text-gray-400">PDF · Up to {MAX_SIZE_MB} MB · Max {MAX_PAGES_ESTIMATE} pages</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-7 py-3 text-[14px] font-bold text-white bg-teal-500 rounded-full hover:bg-teal-600 transition-colors shadow-md"
                  style={{ fontFamily: "var(--font-sora)" }}>
                  Choose file
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleUseSampleReport(); }}
                  className="text-[13px] text-gray-400 hover:text-teal-600 transition-colors underline underline-offset-2">
                  or use a sample report
                </button>
              </>
            )}
          </div>
          {errorMsg && (
            <div className={`px-4 py-3 text-[14px] rounded-xl border ${
              errorMsg.includes("scanned image") || errorMsg.includes("digital version")
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {(errorMsg.includes("scanned image") || errorMsg.includes("digital version")) && (
                <p className="font-bold mb-1">📷 Scanned PDF detected</p>
              )}
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* ANALYZING */}
      {stage === "analyzing" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-[20px] font-extrabold text-gray-900 mb-1" style={{ fontFamily: "var(--font-sora)" }}>Reading your report…</p>
            <p className="text-[14px] text-gray-400">Hang tight — this usually takes 10–20 seconds.</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-[12px] text-gray-400 mt-2">
              {uploadProgress < 50 ? "Uploading your report…" : uploadProgress < 80 ? "Our AI is reading your results…" : "Almost done…"}
            </p>
          </div>
        </div>
      )}

      {/* RESULT */}
      {stage === "result" && analysis && (
        <div className="flex flex-col gap-6">
          <AnalysisView data={analysis} fileName={fileName} modelUsed={modelUsed} onNewSession={handleReset} />
          <ChatSection messages={chatMessages} onSend={handleSendMessage} loading={chatLoading} sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}
