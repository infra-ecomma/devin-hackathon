"use client";

import { useState } from "react";
import Tour from "@/components/Tour";

export default function Home() {
  const [showTour, setShowTour] = useState(true);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-900/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-900/10 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-700/40 bg-brand-950/50 px-4 py-1.5 text-xs font-medium text-brand-300">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
          Collabute X TheBlock Hackathon
        </div>

        <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-brand-300 via-cyan-300 to-brand-400 bg-clip-text text-transparent">
            DevinHackathon
          </span>
        </h1>

        <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          An intelligent collaboration platform bridging human creativity with
          AI-driven development. Built by{" "}
          <span className="font-semibold text-brand-300">Ecomma</span>.
        </p>

        <button
          onClick={() => setShowTour(true)}
          className="tour-btn-primary group"
        >
          <svg
            className="h-4 w-4 transition-transform group-hover:scale-110"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Take the Tour
        </button>

        <p className="mt-4 text-xs text-slate-600">
          Or press Escape to skip
        </p>
      </div>

      {showTour && <Tour initialStep={0} />}
    </main>
  );
}
