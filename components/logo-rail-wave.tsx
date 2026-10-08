"use client";

import React from "react";
import Image from "next/image";

export function LogoRailWave({
  size = "md",
  className = "",
  showTrack = true,
  subtitle = "Loading INFURIZZ…",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTrack?: boolean;
  subtitle?: string | null;
}) {
  const letters = ["I", "N", "F", "U", "R", "I", "Z", "Z"];

  const sizeClasses = {
    sm: "text-2xl sm:text-3xl gap-[2px]",
    md: "text-3xl sm:text-4xl md:text-5xl gap-[3px]",
    lg: "text-4xl sm:text-5xl md:text-6xl gap-1",
  }[size];

  const trackWidth = {
    sm: "w-36",
    md: "w-48 sm:w-56",
    lg: "w-64 sm:w-72",
  }[size];

  const markSize = {
    sm: 32,
    md: 44,
    lg: 56,
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Brand Emblem Mark */}
      <div className="relative mb-3 flex items-center justify-center">
        <Image
          src="/brand/infurizz-mark.png"
          alt="INFURIZZ Mark"
          width={markSize}
          height={markSize}
          className="h-auto w-auto object-contain transition-transform duration-700 animate-pulse drop-shadow-xs"
          priority
        />
      </div>

      {/* Waving Letterform Row */}
      <div
        className={`flex items-baseline font-serif font-semibold tracking-[-0.03em] select-none text-ink ${sizeClasses}`}
        aria-label="INFURIZZ"
      >
        {letters.map((char, i) => (
          <span
            key={i}
            className="inline-block animate-rail-wave will-change-transform"
            style={{
              animationDelay: `${i * 110}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {showTrack && (
        <div className={`mt-3 ${trackWidth} flex flex-col items-center`}>
          {/* Moving Rail Track Stage */}
          <div className="relative h-2 w-full overflow-hidden rounded-[1px] bg-line/40">
            {/* The Stationary Rail Spine */}
            <div className="absolute top-[3px] left-0 right-0 h-[2px] bg-ink/30" />

            {/* Moving Sleepers / Rail Ties flowing smoothly like moving rail */}
            <div className="absolute inset-0 animate-rail-track-flow bg-[repeating-linear-gradient(90deg,rgba(22,20,17,0.4)_0px,rgba(22,20,17,0.4)_2px,transparent_2px,transparent_12px)] opacity-60" />

            {/* Traveling Light / Locomotive Wave Beam */}
            <div className="absolute top-0 h-full w-16 -translate-x-full animate-rail-beam bg-gradient-to-r from-transparent via-[#6f2e2a] to-[#f59e0b] blur-[1px] opacity-95" />
          </div>

          {/* Subtitle / Status */}
          {subtitle && (
            <p className="mt-3.5 text-center font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-muted animate-fade-in">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
