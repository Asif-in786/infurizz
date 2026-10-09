"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RevolvingBorder } from "@/components/revolving-border";

interface PlatformNode {
  id: string;
  name: string;
  handle: string;
  metric: string;
  metricLabel: string;
  badge: string;
  iconBg: string;
  iconColor: string;
  iconSvg: React.ReactNode;
}

const PLATFORM_NODES: PlatformNode[] = [
  {
    id: "youtube",
    name: "YouTube",
    handle: "@marcus.visuals",
    metric: "480K",
    metricLabel: "Subscribers",
    badge: "Live API",
    iconBg: "bg-[#FF0000]/10 border-[#FF0000]/30",
    iconColor: "text-[#FF0000]",
    iconSvg: (
      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@marcus_vance",
    metric: "142K",
    metricLabel: "Followers",
    badge: "Verified",
    iconBg: "bg-[#E1306C]/10 border-[#E1306C]/30",
    iconColor: "text-[#E1306C]",
    iconSvg: (
      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "marcus-vance",
    metric: "38K",
    metricLabel: "Executive Reach",
    badge: "Keynote",
    iconBg: "bg-[#0A66C2]/10 border-[#0A66C2]/30",
    iconColor: "text-[#0A66C2]",
    iconSvg: (
      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    id: "x",
    name: "X (Twitter)",
    handle: "@marcus_builds",
    metric: "85K",
    metricLabel: "Impressions/Mo",
    badge: "Insights",
    iconBg: "bg-ink/10 border-ink/30",
    iconColor: "text-ink",
    iconSvg: (
      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export function HeroEcosystem() {
  const [isUnified, setIsUnified] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden pt-2 pb-12 sm:pt-4 sm:pb-16 lg:py-10">
      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none opacity-30">
        <div className="absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/50 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/30 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_75%)]" />
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12">
        {/* =========================================================
            LEFT COLUMN: Editorial Manifesto & Action Desk
            ========================================================= */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
          {/* Eyebrow Status Pill */}
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-line bg-card/90 px-2.5 sm:px-3.5 py-1 backdrop-blur-xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oxblood opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-oxblood" />
            </span>
            <span className="font-mono text-[9.5px] sm:text-[10.5px] font-semibold tracking-[0.12em] sm:tracking-[0.16em] uppercase text-oxblood truncate">
              Creator Ecosystem · Unified Identity
            </span>
          </div>

          {/* Fluid Editorial Headline — Bound to Column */}
          <h1 className="animate-editorial-reveal mt-4 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[2.65rem] xl:text-[3.25rem] font-normal leading-[0.96] tracking-[-0.035em] text-ink">
            One Creator.
            <br />
            Multiple Platforms.
            <br />
            <span className="italic font-medium text-oxblood">One Identity.</span>
          </h1>

          {/* Subtitle Paragraph */}
          <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-muted">
            Your audience is scattered across YouTube, Instagram, LinkedIn, and X.
            INFURIZZ consolidates your verified reach, storefront packages, and brand
            partnerships into a single authoritative identity desk.
          </p>

          {/* Interactive State Toggle */}
          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setIsUnified(true)}
              className={`btn-tactile inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-mono uppercase tracking-normal sm:tracking-wider transition-all ${
                isUnified
                  ? "bg-ink text-paper shadow-sm"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <span className="truncate">Unified on INFURIZZ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsUnified(false)}
              className={`btn-tactile inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-mono uppercase tracking-normal sm:tracking-wider transition-all ${
                !isUnified
                  ? "bg-oxblood text-paper shadow-sm"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <span className="truncate">Scattered Across Platforms</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3">
            <RevolvingBorder className="w-full sm:w-auto" contentClassName="bg-ink">
              <Link
                href="/join"
                className="btn-tactile group inline-flex min-h-11 w-full items-center justify-center gap-2 px-6 text-xs sm:text-sm font-medium tracking-wide text-paper hover:text-white sm:w-auto"
              >
                <span>Claim Your Creator Identity</span>
                <span className="icon-arrow-motion font-mono">→</span>
              </Link>
            </RevolvingBorder>

            <Link
              href="/discover"
              className="btn-tactile inline-flex min-h-11 items-center justify-center border border-ink/20 bg-card px-5 text-xs sm:text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-paper"
            >
              <span>Explore Directory</span>
            </Link>

            <Link
              href="/live-example"
              className="btn-tactile inline-flex min-h-11 items-center justify-center border border-oxblood/30 bg-oxblood/5 px-4 text-xs sm:text-sm font-medium text-oxblood transition-colors hover:bg-oxblood/10"
            >
              <span>Interactive Demo ↗</span>
            </Link>
          </div>

          {/* Proof Bar */}
          <div className="mt-7 flex items-center gap-5 border-t border-line/80 pt-5 text-xs text-muted">
            <div>
              <strong className="font-serif text-base sm:text-lg text-ink font-semibold">100%</strong>
              <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Audited Metrics</p>
            </div>
            <div className="h-7 w-px bg-line" />
            <div>
              <strong className="font-serif text-base sm:text-lg text-ink font-semibold">0%</strong>
              <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Agency Friction</p>
            </div>
            <div className="h-7 w-px bg-line" />
            <div>
              <strong className="font-serif text-base sm:text-lg text-ink font-semibold">Direct</strong>
              <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Mutual Match</p>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: The Creator Identity Ecosystem Stage
            ========================================================= */}
        <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center">
          {/* -------------------------------------------------------
              TABLET & DESKTOP PRESENTATION (sm:block)
              Orbital constellation canvas bounded to 460px x 440px
              ------------------------------------------------------- */}
          <div className="hidden sm:block relative mx-auto w-full max-w-[460px] h-[440px] select-none">
            {/* SVG Vector Convergence Beams */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 460 440"
              fill="none"
              aria-hidden="true"
            >
              {/* Converging lines from card centers to nexus center (230, 210) */}
              <line
                x1="80"
                y1="36"
                x2="230"
                y2="210"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${isUnified ? "opacity-90" : "opacity-35"}`}
              />
              <line
                x1="380"
                y1="36"
                x2="230"
                y2="210"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${isUnified ? "opacity-90" : "opacity-35"}`}
              />
              <line
                x1="80"
                y1="404"
                x2="230"
                y2="210"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${isUnified ? "opacity-90" : "opacity-35"}`}
              />
              <line
                x1="380"
                y1="404"
                x2="230"
                y2="210"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${isUnified ? "opacity-90" : "opacity-35"}`}
              />

              {/* Animated energy pulses along vector beams */}
              {isUnified && (
                <>
                  <circle r="3.5" fill="#6f2e2a">
                    <animateMotion path="M 80 36 L 230 210" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3.5" fill="#6f2e2a">
                    <animateMotion path="M 380 36 L 230 210" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3.5" fill="#6f2e2a">
                    <animateMotion path="M 80 404 L 230 210" dur="2.0s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3.5" fill="#6f2e2a">
                    <animateMotion path="M 380 404 L 230 210" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </svg>

            {/* Central Unified Identity Hub */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
              className={`z-10 flex flex-col items-center justify-center transition-all duration-500 ${
                isUnified ? "scale-100" : "scale-95 opacity-80"
              }`}
            >
              {/* Central Geometric Badge Card */}
              <div
                className={`relative flex h-36 w-36 sm:h-40 sm:w-40 flex-col items-center justify-center rounded-2xl border bg-card/95 p-3.5 shadow-lg backdrop-blur-md transition-all duration-500 ${
                  isUnified
                    ? "border-oxblood/40 shadow-oxblood/10 ring-2 ring-oxblood/10"
                    : "border-line border-dashed shadow-none"
                }`}
              >
                <Image
                  src="/brand/infurizz-mark.png"
                  alt="INFURIZZ Emblem"
                  width={64}
                  height={64}
                  className="h-14 w-auto object-contain drop-shadow-xs"
                  priority
                />
                <Image
                  src="/brand/infurizz-wordmark.png"
                  alt="INFURIZZ"
                  width={80}
                  height={18}
                  className="mt-1.5 h-3.5 w-auto object-contain"
                  priority
                />

                {/* Status Indicator Badge */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-0.5 shadow-xs">
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-oxblood">
                    {isUnified ? "✓ Unified Identity" : "⚠ Separated Data"}
                  </span>
                </div>
              </div>

              {/* Creator Metadata */}
              <div className="mt-4 text-center">
                <p className="font-serif text-sm font-medium text-ink">Marcus Vance</p>
                <p className="font-mono text-[10px] text-muted">Audience: 745K · 4 channels</p>
              </div>
            </div>

            {/* 4 Corner Platform Satellite Nodes */}
            {/* Top-Left: YouTube */}
            <div
              style={{ position: "absolute", top: 0, left: 0 }}
              onMouseEnter={() => setActivePlatform("youtube")}
              onMouseLeave={() => setActivePlatform(null)}
              onClick={() => setActivePlatform(activePlatform === "youtube" ? null : "youtube")}
              className={`!absolute z-20 flex w-40 cursor-pointer flex-col rounded-lg border bg-card/95 p-2.5 shadow-xs backdrop-blur-md transition-all duration-300 ${
                isUnified ? "border-line hover:border-ink/60" : "border-dashed border-line/80 opacity-80"
              } ${activePlatform === "youtube" ? "scale-105 border-oxblood shadow-md" : ""}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`grid h-5 w-5 place-items-center rounded border ${PLATFORM_NODES[0].iconBg} ${PLATFORM_NODES[0].iconColor}`}>
                    {PLATFORM_NODES[0].iconSvg}
                  </div>
                  <span className="text-[11px] font-semibold text-ink">{PLATFORM_NODES[0].name}</span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted">
                  {PLATFORM_NODES[0].badge}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between border-t border-line/60 pt-1">
                <span className="truncate font-mono text-[10px] text-muted">{PLATFORM_NODES[0].handle}</span>
                <span className="font-serif text-xs font-bold text-ink">{PLATFORM_NODES[0].metric}</span>
              </div>
            </div>

            {/* Top-Right: Instagram */}
            <div
              style={{ position: "absolute", top: 0, right: 0 }}
              onMouseEnter={() => setActivePlatform("instagram")}
              onMouseLeave={() => setActivePlatform(null)}
              onClick={() => setActivePlatform(activePlatform === "instagram" ? null : "instagram")}
              className={`!absolute z-20 flex w-40 cursor-pointer flex-col rounded-lg border bg-card/95 p-2.5 shadow-xs backdrop-blur-md transition-all duration-300 ${
                isUnified ? "border-line hover:border-ink/60" : "border-dashed border-line/80 opacity-80"
              } ${activePlatform === "instagram" ? "scale-105 border-oxblood shadow-md" : ""}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`grid h-5 w-5 place-items-center rounded border ${PLATFORM_NODES[1].iconBg} ${PLATFORM_NODES[1].iconColor}`}>
                    {PLATFORM_NODES[1].iconSvg}
                  </div>
                  <span className="text-[11px] font-semibold text-ink">{PLATFORM_NODES[1].name}</span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted">
                  {PLATFORM_NODES[1].badge}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between border-t border-line/60 pt-1">
                <span className="truncate font-mono text-[10px] text-muted">{PLATFORM_NODES[1].handle}</span>
                <span className="font-serif text-xs font-bold text-ink">{PLATFORM_NODES[1].metric}</span>
              </div>
            </div>

            {/* Bottom-Left: LinkedIn */}
            <div
              style={{ position: "absolute", bottom: 0, left: 0 }}
              onMouseEnter={() => setActivePlatform("linkedin")}
              onMouseLeave={() => setActivePlatform(null)}
              onClick={() => setActivePlatform(activePlatform === "linkedin" ? null : "linkedin")}
              className={`!absolute z-20 flex w-40 cursor-pointer flex-col rounded-lg border bg-card/95 p-2.5 shadow-xs backdrop-blur-md transition-all duration-300 ${
                isUnified ? "border-line hover:border-ink/60" : "border-dashed border-line/80 opacity-80"
              } ${activePlatform === "linkedin" ? "scale-105 border-oxblood shadow-md" : ""}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`grid h-5 w-5 place-items-center rounded border ${PLATFORM_NODES[2].iconBg} ${PLATFORM_NODES[2].iconColor}`}>
                    {PLATFORM_NODES[2].iconSvg}
                  </div>
                  <span className="text-[11px] font-semibold text-ink">{PLATFORM_NODES[2].name}</span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted">
                  {PLATFORM_NODES[2].badge}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between border-t border-line/60 pt-1">
                <span className="truncate font-mono text-[10px] text-muted">{PLATFORM_NODES[2].handle}</span>
                <span className="font-serif text-xs font-bold text-ink">{PLATFORM_NODES[2].metric}</span>
              </div>
            </div>

            {/* Bottom-Right: X (Twitter) */}
            <div
              style={{ position: "absolute", bottom: 0, right: 0 }}
              onMouseEnter={() => setActivePlatform("x")}
              onMouseLeave={() => setActivePlatform(null)}
              onClick={() => setActivePlatform(activePlatform === "x" ? null : "x")}
              className={`!absolute z-20 flex w-40 cursor-pointer flex-col rounded-lg border bg-card/95 p-2.5 shadow-xs backdrop-blur-md transition-all duration-300 ${
                isUnified ? "border-line hover:border-ink/60" : "border-dashed border-line/80 opacity-80"
              } ${activePlatform === "x" ? "scale-105 border-oxblood shadow-md" : ""}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`grid h-5 w-5 place-items-center rounded border ${PLATFORM_NODES[3].iconBg} ${PLATFORM_NODES[3].iconColor}`}>
                    {PLATFORM_NODES[3].iconSvg}
                  </div>
                  <span className="text-[11px] font-semibold text-ink">{PLATFORM_NODES[3].name}</span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted">
                  {PLATFORM_NODES[3].badge}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between border-t border-line/60 pt-1">
                <span className="truncate font-mono text-[10px] text-muted">{PLATFORM_NODES[3].handle}</span>
                <span className="font-serif text-xs font-bold text-ink">{PLATFORM_NODES[3].metric}</span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------
              MOBILE PRESENTATION (< sm:block, e.g. 320px - 639px)
              Vertically stacked ecosystem: Central hub + conduit + 2-col grid
              ------------------------------------------------------- */}
          <div className="block sm:hidden w-full max-w-sm mx-auto select-none pt-2">
            {/* Central Mobile Hub */}
            <div
              className={`relative mx-auto flex w-full flex-col items-center justify-center rounded-xl border bg-card/95 p-4 shadow-sm backdrop-blur-md transition-all duration-500 ${
                isUnified
                  ? "border-oxblood/40 shadow-oxblood/10 ring-1 ring-oxblood/10"
                  : "border-line border-dashed"
              }`}
            >
              <div className="flex flex-col items-center">
                <Image
                  src="/brand/infurizz-mark.png"
                  alt="INFURIZZ Emblem"
                  width={52}
                  height={52}
                  className="h-12 w-auto object-contain drop-shadow-xs"
                  priority
                />
                <Image
                  src="/brand/infurizz-wordmark.png"
                  alt="INFURIZZ"
                  width={72}
                  height={16}
                  className="mt-1 h-3.5 w-auto object-contain"
                  priority
                />
              </div>

              <div className="mt-2.5 text-center">
                <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-oxblood">
                  {isUnified ? "✓ Unified Identity" : "⚠ Separated Data"}
                </span>
                <p className="mt-2 font-serif text-sm font-medium text-ink">Marcus Vance</p>
                <p className="font-mono text-[10px] text-muted">Total Audience: 745K across 4 channels</p>
              </div>
            </div>

            {/* Vertical Flow Conduit */}
            <div className="flex justify-center py-2">
              <svg className="h-6 w-4" viewBox="0 0 16 24" fill="none" aria-hidden="true">
                <line
                  x1="8"
                  y1="0"
                  x2="8"
                  y2="24"
                  stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                  strokeWidth="2"
                  strokeDasharray={isUnified ? "none" : "3 3"}
                />
                {isUnified && (
                  <circle r="2.5" fill="#6f2e2a">
                    <animateMotion path="M 8 0 L 8 24" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </div>

            {/* Mobile 2-Column Touch Grid */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {PLATFORM_NODES.map((node) => {
                const isActive = activePlatform === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setActivePlatform(isActive ? null : node.id)}
                    className={`card-interactive flex flex-col justify-between rounded-lg border bg-card/95 p-2.5 shadow-xs transition-all duration-200 ${
                      isActive ? "border-oxblood ring-1 ring-oxblood bg-paper" : "border-line"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${node.iconBg} ${node.iconColor}`}>
                          {node.iconSvg}
                        </div>
                        <span className="truncate text-[10.5px] font-semibold text-ink">{node.name}</span>
                      </div>
                      <span className="font-mono text-[7.5px] uppercase tracking-wider text-muted shrink-0">
                        {node.badge}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between border-t border-line/60 pt-1">
                      <span className="truncate font-mono text-[9.5px] text-muted">{node.handle}</span>
                      <span className="font-serif text-[11px] font-bold text-ink shrink-0 ml-1">{node.metric}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
