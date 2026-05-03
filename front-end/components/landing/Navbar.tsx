"use client";

import { useState } from "react";
import Link from "next/link";
import { IconHeartPulse } from "./icons";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:bg-teal-600 transition-colors">
            <IconHeartPulse className="scale-125" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
              Health Insights
            </span>
            <span className="text-[10px] font-semibold text-teal-500 tracking-widest uppercase" style={{ fontFamily: "var(--font-inter)" }}>
              Agent
            </span>
          </div>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="px-5 py-2.5 text-[14px] font-semibold text-gray-600 border border-gray-300 rounded-full hover:border-teal-400 hover:text-teal-600 transition-colors no-underline"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-2.5 text-[14px] font-semibold text-white bg-teal-500 rounded-full hover:bg-teal-600 transition-colors no-underline shadow-md hover:shadow-lg"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Get started →
          </Link>
        </div>

        {/* Mobile hamburger — visible only on small screens */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="sm:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            // X icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Hamburger icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-3"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <Link
            href="/auth/signin"
            onClick={() => setMenuOpen(false)}
            className="w-full py-3 text-center text-[15px] font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-colors no-underline"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            onClick={() => setMenuOpen(false)}
            className="w-full py-3 text-center text-[15px] font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors no-underline"
          >
            Get started →
          </Link>
        </div>
      )}
    </nav>
  );
}
