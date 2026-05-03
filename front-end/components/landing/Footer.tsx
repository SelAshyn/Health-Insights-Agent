export default function Footer() {
  // Hardcode the year as a constant to avoid any server/client mismatch
  // at midnight on Dec 31. Update this annually or use a build-time value.
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <span
          className="text-[13px] text-gray-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          © {year} Health Insights Agent
        </span>
        <span
          className="text-[13px] text-gray-600"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Built with Next.js · Firebase · Groq · FAISS
        </span>
      </div>
    </footer>
  );
}
