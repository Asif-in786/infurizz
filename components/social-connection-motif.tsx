"use client";

import React from "react";

export function SocialConnectionMotif({
  stepNumber = "01",
  stageName = "CONVERGENCE",
  label = "Creator → Platform → Identity → Opportunity",
}: {
  stepNumber?: string;
  stageName?: string;
  label?: string;
}) {
  return (
    <div className="relative my-12 flex items-center justify-between gap-4 overflow-hidden border-y border-line/60 py-3 text-xs select-none">
      {/* Chapter Step Pill */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-oxblood">
          CH {stepNumber}
        </span>
        <span className="text-line">/</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {stageName}
        </span>
      </div>

      {/* Center Connecting Wire with Animated Pulse */}
      <div className="relative hidden flex-1 items-center sm:flex">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-line to-transparent" />
        <div className="absolute inset-x-0 h-px animate-rail-beam bg-gradient-to-r from-transparent via-oxblood/80 to-transparent" />
      </div>

      {/* Editorial Thread Label */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted/80">
        {label}
      </div>
    </div>
  );
}
