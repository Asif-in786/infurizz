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
  position: string;
}

const PLATFORM_NODES: PlatformNode[] = [
  {
    id: "youtube",
    name: "YouTube",
    handle: "@marcus.visuals",
    metric: "480K",
    metricLabel: "Subscribers",
    badge: "Verified Live API",
    iconBg: "bg-[#FF0000]/10 border-[#FF0000]/30",
    iconColor: "text-[#FF0000]",
    iconSvg: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    position: "top-0 left-0 lg:-top-4 lg:-left-6",
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@marcus_vance",
    metric: "142K",
    metricLabel: "Followers",
    badge: "Meta Verified",
    iconBg: "bg-[#E1306C]/10 border-[#E1306C]/30",
    iconColor: "text-[#E1306C]",
    iconSvg: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    position: "top-0 right-0 lg:-top-4 lg:-right-6",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "marcus-vance-tech",
    metric: "38K",
    metricLabel: "Executive Reach",
    badge: "Keynote Speaker",
    iconBg: "bg-[#0A66C2]/10 border-[#0A66C2]/30",
    iconColor: "text-[#0A66C2]",
    iconSvg: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
    position: "bottom-0 left-0 lg:-bottom-4 lg:-left-6",
  },
  {
    id: "x",
    name: "X (Twitter)",
    handle: "@marcus_builds",
    metric: "85K",
    metricLabel: "Impressions/Mo",
    badge: "Daily Insights",
    iconBg: "bg-ink/10 border-ink/30",
    iconColor: "text-ink",
    iconSvg: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    position: "bottom-0 right-0 lg:-bottom-4 lg:-right-6",
  },
];

export function HeroEcosystem() {
  const [isUnified, setIsUnified] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden pt-4 pb-16 lg:py-12">
      {/* Background Ambient Network Geometry */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none opacity-40">
        <div className="absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/40 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_75%)]" />
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Editorial Headline & Manifesto */}
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-card/80 px-3.5 py-1 backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oxblood opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-oxblood" />
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-[0.16em] uppercase text-oxblood">
              Creator Ecosystem · Unified Identity
            </span>
          </div>

          <h1 className="animate-editorial-reveal mt-5 font-serif text-[clamp(2.8rem,6.8vw,6.2rem)] font-normal leading-[0.88] tracking-[-0.04em] text-ink">
            One Creator.
            <br />
            Multiple Platforms.
            <br />
            <span className="italic font-medium text-oxblood">One Identity.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Your audience is scattered across YouTube, Instagram, LinkedIn, and X.
            INFURIZZ consolidates your verified reach, storefront packages, and brand
            partnerships into a single authoritative identity desk.
          </p>

          {/* Interactive State Mode Switch */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUnified(true)}
              className={`btn-tactile inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                isUnified
                  ? "bg-ink text-paper shadow-md"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Unified on INFURIZZ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsUnified(false)}
              className={`btn-tactile inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                !isUnified
                  ? "bg-oxblood text-paper shadow-md"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Scattered Across Platforms</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <RevolvingBorder className="w-full sm:w-auto" contentClassName="bg-ink">
              <Link
                href="/join"
                className="btn-tactile group inline-flex min-h-12 w-full items-center justify-center gap-2 px-7 text-sm font-medium tracking-wide text-paper hover:text-white sm:w-auto"
              >
                <span>Claim Your Creator Identity</span>
                <span className="icon-arrow-motion font-mono">→</span>
              </Link>
            </RevolvingBorder>

            <Link
              href="/discover"
              className="btn-tactile inline-flex min-h-12 items-center justify-center border border-ink/20 bg-card px-6 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-paper"
            >
              <span>Explore Verified Directory</span>
            </Link>

            <Link
              href="/live-example"
              className="btn-tactile inline-flex min-h-12 items-center justify-center border border-oxblood/30 bg-oxblood/5 px-5 text-sm font-medium text-oxblood transition-colors hover:bg-oxblood/10"
            >
              <span>Interactive Demo ↗</span>
            </Link>
          </div>

          {/* Micro Proof Bar */}
          <div className="mt-8 flex items-center gap-6 border-t border-line/80 pt-6 text-xs text-muted">
            <div>
              <strong className="font-serif text-lg text-ink font-semibold">100%</strong>
              <p className="font-mono text-[10px] uppercase tracking-wider">Audited Metrics</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <strong className="font-serif text-lg text-ink font-semibold">0%</strong>
              <p className="font-mono text-[10px] uppercase tracking-wider">Agency Friction</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <strong className="font-serif text-lg text-ink font-semibold">Direct</strong>
              <p className="font-mono text-[10px] uppercase tracking-wider">Mutual Match</p>
            </div>
          </div>
        </div>

        {/* Right Column: The Visual Ecosystem Convergence Stage */}
        <div className="lg:col-span-6">
          <div className="relative mx-auto flex min-h-[460px] w-full max-w-lg items-center justify-center p-4 sm:p-8">
            {/* SVG Connecting Flow Lines */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
              viewBox="0 0 500 500"
              fill="none"
              aria-hidden="true"
            >
              {/* Converging vectors from corner satellites to center */}
              <line
                x1="80"
                y1="80"
                x2="250"
                y2="250"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${
                  isUnified ? "animate-pulse" : "opacity-40"
                }`}
              />
              <line
                x1="420"
                y1="80"
                x2="250"
                y2="250"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${
                  isUnified ? "animate-pulse" : "opacity-40"
                }`}
              />
              <line
                x1="80"
                y1="420"
                x2="250"
                y2="250"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${
                  isUnified ? "animate-pulse" : "opacity-40"
                }`}
              />
              <line
                x1="420"
                y1="420"
                x2="250"
                y2="250"
                stroke={isUnified ? "#6f2e2a" : "#d8d0c6"}
                strokeWidth={isUnified ? "2" : "1"}
                strokeDasharray={isUnified ? "none" : "4 4"}
                className={`transition-colors duration-500 ${
                  isUnified ? "animate-pulse" : "opacity-40"
                }`}
              />

              {/* Animated energy pulses flowing inward */}
              {isUnified && (
                <>
                  <circle r="4" fill="#6f2e2a">
                    <animateMotion
                      path="M 80 80 L 250 250"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="4" fill="#6f2e2a">
                    <animateMotion
                      path="M 420 80 L 250 250"
                      dur="2.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="4" fill="#6f2e2a">
                    <animateMotion
                      path="M 80 420 L 250 250"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="4" fill="#6f2e2a">
                    <animateMotion
                      path="M 420 420 L 250 250"
                      dur="2.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}
            </svg>

            {/* Central Unified INFURIZZ Identity Anchor */}
            <div
              className={`group relative z-10 flex flex-col items-center justify-center transition-all duration-500 ${
                isUnified ? "scale-100" : "scale-90 opacity-70"
              }`}
            >
              {/* Decorative Geometric Outer Ring */}
              <div
                className={`relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur-md transition-all duration-500 ${
                  isUnified
                    ? "border-oxblood/40 shadow-oxblood/10 ring-4 ring-oxblood/10"
                    : "border-line border-dashed shadow-none"
                }`}
              >
                {/* Brand Emblem Hero Element */}
                <div className="relative flex flex-col items-center justify-center">
                  <Image
                    src="/brand/infurizz-mark.png"
                    alt="INFURIZZ Emblem"
                    width={72}
                    height={72}
                    className="h-16 w-auto sm:h-20 object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 drop-shadow-sm"
                    priority
                  />
                  <Image
                    src="/brand/infurizz-wordmark.png"
                    alt="INFURIZZ"
                    width={96}
                    height={22}
                    className="mt-2 h-4 sm:h-5 w-auto object-contain transition-opacity duration-300"
                    priority
                  />
                </div>

                {/* Status Indicator Pin */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-paper px-3 py-0.5 shadow-xs">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-oxblood">
                    {isUnified ? "✓ Unified Identity" : "⚠ Separated Data"}
                  </span>
                </div>
              </div>

              {/* Creator Metadata Plaque */}
              <div className="mt-5 text-center">
                <p className="font-serif text-lg font-medium text-ink">Marcus Vance</p>
                <p className="font-mono text-xs text-muted">Total Audience: <strong className="text-oxblood">745K</strong> across 4 channels</p>
              </div>
            </div>

            {/* Orbiting Platform Satellites */}
            {PLATFORM_NODES.map((node) => {
              const isActive = activePlatform === node.id;
              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setActivePlatform(node.id)}
                  onMouseLeave={() => setActivePlatform(null)}
                  onClick={() => setActivePlatform(node.id === activePlatform ? null : node.id)}
                  className={`card-interactive absolute z-20 flex w-44 sm:w-52 cursor-pointer flex-col rounded-lg border bg-card/95 p-3 shadow-md backdrop-blur-md transition-all duration-300 ${
                    node.position
                  } ${
                    isUnified
                      ? "border-line hover:border-ink/60"
                      : "border-dashed border-line/80 opacity-80"
                  } ${isActive ? "scale-105 border-oxblood shadow-lg" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`grid h-6 w-6 place-items-center rounded border ${node.iconBg} ${node.iconColor}`}
                      >
                        {node.iconSvg}
                      </div>
                      <span className="text-xs font-semibold text-ink">{node.name}</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                      {node.badge}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between border-t border-line/60 pt-1.5">
                    <span className="truncate font-mono text-[11px] text-muted">
                      {node.handle}
                    </span>
                    <div className="text-right">
                      <span className="font-serif text-sm font-bold text-ink">
                        {node.metric}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Caption */}
          <div className="mt-4 text-center">
            <p className="font-mono text-[11px] text-muted">
              Tap or hover any platform card to inspect the unified data stream.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
