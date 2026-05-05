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
          <a
            href="https://github.com/SelAshyn/Health-Insights-Agent"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="View source on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
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
          <a
            href="https://github.com/SelAshyn/Health-Insights-Agent"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 text-center text-[14px] font-semibold text-gray-500 border border-gray-200 rounded-xl hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            View on GitHub
          </a>
        </div>
      )}
    </nav>
  );
}
