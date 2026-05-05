import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-stone-50 flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      <div className="flex flex-col items-center text-center max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline mb-12 group">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:bg-teal-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
              Health Insights
            </span>
            <span className="text-[10px] font-semibold text-teal-500 tracking-widest uppercase">
              Agent
            </span>
          </div>
        </Link>

        {/* 404 number */}
        <p
          className="text-[120px] font-extrabold leading-none tracking-tighter text-gray-100 select-none mb-2"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          404
        </p>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-6 -mt-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="11" />
            <line x1="11" y1="14" x2="11.01" y2="14" />
          </svg>
        </div>

        <h1
          className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-3"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          Page not found
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="w-full sm:w-auto px-7 py-3 bg-teal-500 text-white text-[14px] font-bold rounded-full hover:bg-teal-600 transition-colors no-underline shadow-lg shadow-teal-100"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Go home
          </Link>
          <Link
            href="/main"
            className="w-full sm:w-auto px-7 py-3 text-[14px] font-semibold text-gray-600 border border-gray-300 rounded-full hover:border-teal-400 hover:text-teal-600 transition-colors no-underline"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Open dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
