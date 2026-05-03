import { reportRows, statusStyles } from "./data";
import { IconAI } from "./icons";

export default function ReportCard() {
  return (
    <div className="relative bg-white border border-gray-100 rounded-3xl p-7 shadow-2xl  overflow-hidden">
      {/* Teal accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-teal-400 to-teal-200 rounded-t-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-1">
        <div>
          <p
            className="text-[15px] font-bold text-gray-900"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            CBC Report
          </p>
          <p
            className="text-[12px] text-gray-400 mt-0.5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Apr 15, 2025
          </p>
        </div>
        <span
          className="text-[12px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3.5 py-1.5 rounded-full"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          ✓ Analyzed
        </span>
      </div>

      {/* Biomarker rows */}
      <div className="flex flex-col gap-2.5">
        {reportRows.map((row) => {
          const s = statusStyles[row.status];
          return (
            <div
              key={row.name}
              className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[14px] font-semibold text-gray-900"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {row.name}
                </span>
                <span
                  className="text-[11px] text-gray-400"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {row.ref}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-[15px] font-bold ${s.val}`}
                  style={{ fontFamily: "var(--font-sora)" }}
                >
                  {row.val}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.tag}`}
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI insight */}
      <div className="mt-5 flex gap-3 items-start bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3.5">
        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shrink-0 shadow-sm">
          <IconAI />
        </div>
        <div>
          <p
            className="text-[12px] font-bold text-teal-600 mb-1"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            AI insight
          </p>
          <p
            className="text-[13px] text-teal-900 leading-relaxed"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Low hemoglobin with elevated WBC may suggest early-stage anemia with an
            inflammatory response. Consider follow-up iron studies and a physician review.
          </p>
        </div>
      </div>
    </div>
  );
}
