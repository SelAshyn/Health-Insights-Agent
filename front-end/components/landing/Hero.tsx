import Link from "next/link";
import ReportCard from "./ReportCard";

const trustInitials = ["JD", "MR", "SK", "+"] as const;

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-8 py-28 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
      {/* ── LEFT: copy ── */}
      <div>
        {/* Eyebrow label */}
        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-widest uppercase text-teal-600 bg-teal-50 border border-teal-100 px-3.5 py-1.5 rounded-full mb-7"
          style={{ fontFamily: "var(--font-inter)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          AI-powered health analysis
        </div>

        {/* Headline — Sora, large, tight leading */}
        <h1
          className="text-[clamp(38px,4.5vw,58px)] font-extrabold leading-[1.08] tracking-tight text-gray-900 mb-6"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          Your blood report,{" "}
          <span className="text-teal-500">clearly explained</span>
        </h1>

        {/* Subheading — Inter, relaxed */}
        <p
          className="text-[17px] text-gray-500 leading-[1.75] mb-10 max-w-md"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Upload any blood report and get an instant, plain-language analysis.
          Ask follow-up questions. Understand what your numbers actually mean.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/auth/signup"
            className="px-8 py-3.5 text-[15px] font-semibold text-white bg-teal-500 rounded-full hover:bg-teal-600 transition-colors no-underline shadow-lg shadow-teal-200"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Analyze a report →
          </Link>
          <Link
            href="/demo"
            className="px-6 py-3.5 text-[15px] font-medium text-gray-500 border border-gray-200 rounded-full hover:border-gray-400 hover:text-gray-800 transition-colors no-underline"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            See sample
          </Link>
        </div>

        {/* Trust row */}
        <div className="mt-10 flex items-center gap-3">
          <div className="flex">
            {trustInitials.map((initial, i) => (
              <div
                key={initial}
                className="w-8 h-8 rounded-full border-2 border-stone-50 bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-600"
                style={{ marginLeft: i === 0 ? 0 : "-8px", fontFamily: "var(--font-inter)" }}
              >
                {initial}
              </div>
            ))}
          </div>
          <span
            className="text-[13px] text-gray-400"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Trusted by patients and clinicians
          </span>
        </div>
      </div>

      {/* ── RIGHT: report preview ── */}
      <ReportCard />
    </section>
  );
}
