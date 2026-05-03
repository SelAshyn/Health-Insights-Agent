import { Step } from "@/types/landing";
import { steps } from "./data";

function StepCard({ num, icon, title, desc, last }: Step) {
  return (
    <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
      {/* Icon in a teal container */}
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
          {icon}
        </div>
      )}
      {/* Large decorative step number */}

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
      {/* Connector line between steps */}
      {!last && (
        <div className="hidden md:block absolute top-10 -right-5 w-10 h-px bg-gray-200" />
      )}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-8 py-24">
      {/* Section label */}
      <p
        className="text-[12px] font-bold tracking-widest uppercase text-teal-500 mb-3"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        How it works
      </p>
      <h2
        className="text-[clamp(30px,3.5vw,44px)] font-extrabold tracking-tight text-gray-900 mb-14"
        style={{ fontFamily: "var(--font-sora)" }}
      >
        From upload to insight in seconds
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <StepCard key={step.num} {...step} />
        ))}
      </div>
    </section>
  );
}
