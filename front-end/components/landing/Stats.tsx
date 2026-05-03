import { stats } from "./data";

export default function Stats() {
  return (
    <section className="max-w-6xl mx-auto px-8 py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <p
              className="text-[56px] font-extrabold text-gray-900 leading-none tracking-tight"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              {s.num}
            </p>
            <p
              className="text-[14px] text-gray-400 max-w-40"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
