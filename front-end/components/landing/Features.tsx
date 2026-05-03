import { Feature } from "@/types/landing";
import { features } from "./data";

function FeatureCard({ icon, title, desc }: Feature) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 hover:shadow-md hover:border-teal-100 transition-all">
      {/* Icon container — larger, more prominent */}
      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
        {/* Scale up the icon inside */}
        <span className="scale-125 flex items-center justify-center">{icon}</span>
      </div>
      <p
        className="text-[17px] font-bold text-gray-900 mb-2"
        style={{ fontFamily: "var(--font-sora)" }}
      >
        {title}
      </p>
      <p
        className="text-[14px] text-gray-500 leading-relaxed"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {desc}
      </p>
    </div>
  );
}

export default function Features() {
  return (
    <section className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-8 py-24">
        <p
          className="text-[12px] font-bold tracking-widest uppercase text-teal-500 mb-3"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Features
        </p>
        <h2
          className="text-[clamp(30px,3.5vw,44px)] font-extrabold tracking-tight text-gray-900 mb-14"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          Built for clarity, not complexity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
