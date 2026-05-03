import Link from "next/link";

export default function CTA() {
  return (
    <section className="bg-gray-950">
      <div className="max-w-6xl mx-auto px-8 py-24 flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
        <div className="max-w-xl">
          <h2
            className="text-[clamp(30px,3.5vw,48px)] font-extrabold text-white tracking-tight leading-[1.1] mb-4"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Ready to understand{" "}
            <span className="text-teal-400">your health?</span>
          </h2>
          <p
            className="text-[16px] text-gray-400 leading-relaxed"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Upload a report and get your analysis in seconds. No credit card required.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-start shrink-0">
          <Link
            href="/auth/signup"
            className="px-9 py-4 text-[15px] font-bold text-gray-950 bg-white rounded-full hover:bg-teal-50 transition-colors no-underline whitespace-nowrap shadow-lg"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Analyze my report →
          </Link>
          <span
            className="text-[13px] text-gray-500 px-1"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Free · Private · No account needed
          </span>
        </div>
      </div>
    </section>
  );
}
