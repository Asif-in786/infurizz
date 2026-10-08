"use client";

import React, { useState } from "react";
import Image from "next/image";

export function MatchVisualizer() {
  const [isMatched, setIsMatched] = useState(true);

  return (
    <div className="relative mx-auto my-8 max-w-4xl overflow-hidden rounded-2xl border border-line bg-card/70 p-6 sm:p-10 backdrop-blur-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line/80 pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
            Protocol State 04 · Deterministic Pairing
          </span>
          <h3 className="mt-1 font-serif text-2xl text-ink sm:text-3xl">
            The INFURIZZ Match Architecture
          </h3>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMatched(!isMatched)}
            className="btn-tactile rounded-full border border-line bg-paper px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-ink hover:text-oxblood"
          >
            {isMatched ? "Reset State" : "Simulate Mutual Agreement"}
          </button>
        </div>
      </div>

      {/* Convergence Stage */}
      <div className="relative mt-8 grid items-center gap-6 sm:grid-cols-11">
        {/* Creator Identity Pillar (Cols 1-4) */}
        <div
          className={`card-interactive sm:col-span-4 rounded-xl border bg-paper p-5 transition-all duration-500 ${
            isMatched ? "border-oxblood/40 shadow-md" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Side A · Verified Creator
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-700">
              ✓ Verified Storefront
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-ink font-serif text-lg font-bold text-paper">
              ER
            </div>
            <div>
              <h4 className="font-serif text-lg font-medium text-ink">Elena Rostova</h4>
              <p className="font-mono text-xs text-oxblood">@elena.arch · Design & Spaces</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-line/60 pt-3 text-xs text-muted">
            <div className="flex justify-between">
              <span>Audited Audience:</span>
              <strong className="text-ink">620K across 3 platforms</strong>
            </div>
            <div className="flex justify-between">
              <span>Standard Package:</span>
              <strong className="text-ink">Dedicated Video + 2 Shorts ($2,200)</strong>
            </div>
            <div className="flex justify-between">
              <span>Platform Interest:</span>
              <span className="font-semibold text-emerald-600">“Confirmed Yes”</span>
            </div>
          </div>
        </div>

        {/* Center Convergence Nexus (Cols 5-7) */}
        <div className="sm:col-span-3 flex flex-col items-center justify-center py-4 sm:py-0">
          <div className="relative flex flex-col items-center">
            {/* Animated SVG Convergence Connector */}
            <svg
              className="h-10 w-full select-none"
              viewBox="0 0 160 40"
              fill="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="20"
                x2="160"
                y2="20"
                stroke={isMatched ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isMatched ? "3" : "1.5"}
                strokeDasharray={isMatched ? "none" : "4 4"}
                className="transition-all duration-500"
              />
              {isMatched && (
                <circle cx="80" cy="20" r="4" fill="#6f2e2a" className="animate-ping" />
              )}
            </svg>

            {/* Emblem Lockup Crest */}
            <div
              className={`grid h-14 w-14 place-items-center rounded-full border bg-card shadow-md transition-all duration-500 ${
                isMatched
                  ? "border-oxblood/80 bg-paper ring-4 ring-oxblood/10 scale-110"
                  : "border-line opacity-60 scale-90"
              }`}
            >
              <Image
                src="/brand/infurizz-mark.png"
                alt="INFURIZZ"
                width={32}
                height={32}
                className={`h-7 w-auto object-contain transition-transform duration-500 ${
                  isMatched ? "rotate-0 scale-105" : "rotate-12 opacity-50"
                }`}
              />
            </div>

            <div className="mt-3 text-center">
              <span
                className={`inline-block font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isMatched ? "text-oxblood" : "text-muted"
                }`}
              >
                {isMatched ? "Mutual Agreement" : "Awaiting Pairing"}
              </span>
              {isMatched && (
                <span className="block mt-0.5 rounded-full bg-oxblood/10 px-2 py-0.2 font-mono text-[9px] font-bold text-oxblood">
                  98% Compatibility
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Brand Campaign Pillar (Cols 8-11) */}
        <div
          className={`card-interactive sm:col-span-4 rounded-xl border bg-paper p-5 transition-all duration-500 ${
            isMatched ? "border-oxblood/40 shadow-md" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Side B · Brand Campaign
            </span>
            <span className="rounded-full bg-oxblood/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-oxblood">
              Verified Brief
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-line bg-card font-serif text-lg font-bold text-ink">
              NV
            </div>
            <div>
              <h4 className="font-serif text-lg font-medium text-ink">Nordic Vista</h4>
              <p className="font-mono text-xs text-muted">Brief: Minimalist Living 2026</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-line/60 pt-3 text-xs text-muted">
            <div className="flex justify-between">
              <span>Allocated Budget:</span>
              <strong className="text-ink">$2,500 – $4,000</strong>
            </div>
            <div className="flex justify-between">
              <span>Deliverable Target:</span>
              <strong className="text-ink">Dedicated Video + Story series</strong>
            </div>
            <div className="flex justify-between">
              <span>Brand Interest:</span>
              <span className="font-semibold text-emerald-600">“Confirmed Yes”</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked Desk Notification Bar */}
      {isMatched && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-ink">
              <strong>Match Unlocked:</strong> Both sides verified reciprocal interest. Direct collaboration workspace and order contract generated.
            </span>
          </div>
          <span className="font-mono text-[11px] text-oxblood font-semibold">
            Zero Agency Markup · Direct Payment
          </span>
        </div>
      )}
    </div>
  );
}
