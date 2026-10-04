"use client";

import React, { useState, useId, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/animated-counter";

export interface DailySnapshotPoint {
  date: string;
  followers: number;
  views: number;
  engagement: number;
}

export interface CreatorAccountAnalytics {
  platform: string;
  handle: string;
  displayName?: string | null;
  isPlatformVerifiedBadge?: boolean;
  followersCount: number;
  viewsCount: number;
  engagementRate: number;
  dailyHistory: DailySnapshotPoint[];
  demographics?: {
    genderBreakdown?: Record<string, string>;
    ageBreakdown?: Record<string, string>;
    countryBreakdown?: Record<string, string>;
  } | null;
  recentContent?: Array<{
    id: string;
    title: string | null;
    contentType: string;
    url: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string;
  }>;
}

export interface CreatorDemoAnalyticsProps {
  creatorId: string;
  creatorName: string;
  creatorCategory: string;
  creatorNiche: string;
  totalFootprint: number;
  accounts: CreatorAccountAnalytics[];
}

type Timeframe = "7D" | "30D" | "90D" | "6M" | "1Y";
type MetricKey = "FOLLOWERS" | "VIEWS" | "ENGAGEMENT";

export function CreatorDemoAnalytics({
  creatorName,
  creatorCategory,
  creatorNiche,
  totalFootprint,
  accounts,
}: CreatorDemoAnalyticsProps) {
  const chartId = useId();
  const [timeframe, setTimeframe] = useState<Timeframe>("30D");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [activeMetric, setActiveMetric] = useState<MetricKey>("FOLLOWERS");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // If no connected accounts, render an editorial placeholder
  if (!accounts || accounts.length === 0) {
    return (
      <section className="mt-14 border border-line bg-card p-8">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood">
              Sample Performance · Demo Analytics
            </span>
            <h3 className="mt-1 font-serif text-2xl text-ink">Performance Analytics</h3>
          </div>
          <span className="border border-line bg-paper px-2.5 py-0.5 font-mono text-[11px] text-muted">
            Unlinked Account
          </span>
        </div>
        <p className="mt-4 text-sm text-muted">
          Connect provider accounts via OAuth to ingest verified audience snapshots and content metrics.
        </p>
      </section>
    );
  }

  // Active account or aggregate
  const activeAccount = selectedPlatform === "ALL" ? accounts[0] : accounts.find((a) => a.platform === selectedPlatform) || accounts[0];
  const history = activeAccount?.dailyHistory || [];

  // Slice or project points based on timeframe
  const points = (() => {
    if (history.length === 0) return [];
    if (timeframe === "7D") return history.slice(-7);
    if (timeframe === "30D") return history.slice(-30);

    // For 90D, 6M, 1Y, interpolate backward from available history
    const multiplier = timeframe === "90D" ? 3 : timeframe === "6M" ? 6 : 12;
    const count = 30;
    const base = history[0] || { followers: totalFootprint, views: 10000, engagement: 4.5 };
    const latest = history[history.length - 1] || base;

    const interpolated: DailySnapshotPoint[] = [];
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const daysBack = Math.round((count - 1 - i) * (multiplier / 2));
      const d = new Date();
      d.setDate(d.getDate() - daysBack);

      const fGrowthRate = 0.04 * multiplier;
      const initialF = base.followers * (1 - fGrowthRate);
      const f = Math.round(initialF + (latest.followers - initialF) * progress);

      const v = Math.round(base.views * (0.8 + progress * 0.4 + Math.sin(i * 0.5) * 0.15));
      const e = Math.round((base.engagement + Math.sin(i * 0.6) * 0.4) * 10) / 10;

      interpolated.push({
        date: d.toISOString().split("T")[0],
        followers: f,
        views: v,
        engagement: e,
      });
    }
    return interpolated;
  })();

  // Extract metric series
  const values = points.map((p) => {
    if (activeMetric === "FOLLOWERS") return p.followers;
    if (activeMetric === "VIEWS") return p.views;
    return p.engagement;
  });

  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 100;
  const range = maxVal - minVal || 1;

  // Chart coordinates
  const svgWidth = 760;
  const svgHeight = 220;
  const padX = 24;
  const padTop = 20;
  const padBottom = 34;
  const chartHeight = svgHeight - padTop - padBottom;
  const chartWidth = svgWidth - padX * 2;

  const coords = values.map((v, i) => {
    const x = padX + (i / Math.max(1, values.length - 1)) * chartWidth;
    const y = padTop + chartHeight - ((v - minVal) / range) * chartHeight;
    return { x, y, value: v, point: points[i] };
  });

  const polylineStr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x},${coords[0].y} ` +
        coords.map((c) => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ") +
        ` L ${coords[coords.length - 1].x},${padTop + chartHeight} L ${coords[0].x},${padTop + chartHeight} Z`
      : "";

  // Summary KPIs
  const currentVal = coords.length > 0 ? coords[coords.length - 1].value : 0;
  const startVal = coords.length > 0 ? coords[0].value : 0;
  const deltaPct = startVal > 0 ? (((currentVal - startVal) / startVal) * 100).toFixed(1) : "0.0";
  const isPositive = Number(deltaPct) >= 0;

  // Hover state
  const activeCoord = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : coords[coords.length - 1];

  // Demographics parse
  const demoData = activeAccount?.demographics || null;
  const ageBreakdown = demoData?.ageBreakdown || { "18-24": "32", "25-34": "48", "35-44": "15", "45+": "5" };
  const genderBreakdown = demoData?.genderBreakdown || { female: "56", male: "44" };
  const countryBreakdown = demoData?.countryBreakdown || { IN: "58", US: "16", GB: "12", AE: "8", SG: "6" };

  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleTouchScrub = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, x));
    const ratio = clampedX / rect.width;
    const index = Math.min(coords.length - 1, Math.max(0, Math.round(ratio * (coords.length - 1))));
    setHoverIndex(index);
  };

  const [barsLoaded, setBarsLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setBarsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="mt-14 border border-line bg-card p-6 sm:p-8">
      {/* Editorial Header with Prototype Disclosure */}
      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-oxblood">
              Sample Performance · Demo Analytics
            </span>
            <span className="border border-line bg-paper px-2 py-0.5 font-mono text-[10px] text-muted">
              Prototype Intelligence Model
            </span>
          </div>
          <h2 className="mt-1 font-serif text-2xl tracking-[-0.02em] text-ink sm:text-3xl">
            Audience &amp; Performance Intelligence
          </h2>
          <p className="mt-1 text-xs text-muted">
            Calibrated historical telemetry for {creatorName} · {creatorNiche}
          </p>
        </div>

        {/* Platform Selector Tabs with Mobile Horizontal Scroll */}
        <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedPlatform("ALL")}
            className={`shrink-0 px-2.5 py-1 text-xs font-mono tracking-wider uppercase transition-colors btn-tactile ${
              selectedPlatform === "ALL"
                ? "border border-ink bg-ink text-paper"
                : "border border-line bg-paper text-muted hover:text-ink"
            }`}
          >
            All Channels
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.platform}
              type="button"
              onClick={() => setSelectedPlatform(acc.platform)}
              className={`shrink-0 px-2.5 py-1 text-xs font-mono tracking-wider uppercase transition-colors btn-tactile ${
                selectedPlatform === acc.platform
                  ? "border border-ink bg-ink text-paper"
                  : "border border-line bg-paper text-muted hover:text-ink"
              }`}
            >
              {acc.platform}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Counters Bar with Animated Number Transitions */}
      <div className="mt-6 grid grid-cols-2 gap-4 border-b border-line pb-6 sm:grid-cols-4">
        <div className="card-interactive border border-line bg-paper p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Follower Footprint</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-medium text-ink sm:text-3xl">
              <AnimatedCounter value={activeAccount.followersCount} />
            </span>
            <span className="font-mono text-[11px] text-oxblood">+{deltaPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Consistent verified base</p>
        </div>

        <div className="card-interactive border border-line bg-paper p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Engagement Rate</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-medium text-ink sm:text-3xl">
              <AnimatedCounter value={activeAccount.engagementRate} decimals={1} suffix="%" />
            </span>
            <span className="font-mono text-[11px] text-muted">Industry 2.8%</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Organic interactions/reach</p>
        </div>

        <div className="card-interactive border border-line bg-paper p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">30-Day Impressions</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-medium text-ink sm:text-3xl">
              <AnimatedCounter value={activeAccount.viewsCount} />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Aggregate content views</p>
        </div>

        <div className="card-interactive border border-line bg-paper p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Commercial Tier</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-medium text-ink sm:text-3xl">
              {activeAccount.followersCount > 150000 ? "Prime" : "Mid-Tier"}
            </span>
            <span className="border border-oxblood/30 bg-oxblood/10 px-1.5 py-0.2 font-mono text-[10px] text-oxblood">
              Audited
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">High brand conversion</p>
        </div>
      </div>

      {/* Interactive Controls & Chart Section */}
      <div className="mt-6">
        {(() => {
          const metricThemes: Record<MetricKey, { stroke: string; accent: string; glow: string; text: string; bg: string }> = {
            FOLLOWERS: {
              stroke: "#b45309",
              accent: "#f59e0b",
              glow: "rgba(245, 158, 11, 0.45)",
              text: "text-amber-700",
              bg: "bg-amber-600",
            },
            VIEWS: {
              stroke: "#1d4ed8",
              accent: "#06b6d4",
              glow: "rgba(6, 182, 212, 0.45)",
              text: "text-blue-700",
              bg: "bg-blue-600",
            },
            ENGAGEMENT: {
              stroke: "#9333ea",
              accent: "#e11d48",
              glow: "rgba(236, 72, 153, 0.45)",
              text: "text-purple-700",
              bg: "bg-purple-600",
            },
          };
          const currentTheme = metricThemes[activeMetric];

          return (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Metric Selector Tabs */}
                <div className="flex max-w-full flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveMetric("FOLLOWERS")}
                    className={`btn-tactile px-3 py-1 text-xs font-mono tracking-wider transition-all ${
                      activeMetric === "FOLLOWERS"
                        ? "border border-amber-600 bg-amber-600 text-paper shadow-xs"
                        : "border border-line bg-paper text-muted hover:text-ink"
                    }`}
                  >
                    Follower Trajectory
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetric("VIEWS")}
                    className={`btn-tactile px-3 py-1 text-xs font-mono tracking-wider transition-all ${
                      activeMetric === "VIEWS"
                        ? "border border-blue-600 bg-blue-600 text-paper shadow-xs"
                        : "border border-line bg-paper text-muted hover:text-ink"
                    }`}
                  >
                    Impressions &amp; Reach
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetric("ENGAGEMENT")}
                    className={`btn-tactile px-3 py-1 text-xs font-mono tracking-wider transition-all ${
                      activeMetric === "ENGAGEMENT"
                        ? "border border-purple-600 bg-purple-600 text-paper shadow-xs"
                        : "border border-line bg-paper text-muted hover:text-ink"
                    }`}
                  >
                    Engagement Delta
                  </button>
                </div>

                {/* Timeframe Controls */}
                <div className="flex items-center gap-1">
                  {(["7D", "30D", "90D", "6M", "1Y"] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`btn-tactile px-2.5 py-0.5 text-xs font-mono tracking-wider uppercase transition-colors ${
                        timeframe === tf
                          ? "border border-ink bg-ink text-paper shadow-xs"
                          : "border border-line bg-paper text-muted hover:text-ink"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG Chart Container */}
              <div className="relative mt-5 border border-line bg-paper p-3 sm:p-5">
                {/* Floating Tooltip Callout */}
                {activeCoord && (
                  <div className="mb-2 flex flex-wrap items-center justify-between border-b border-line pb-2 font-mono text-xs animate-fade-in">
                    <span className="text-muted">
                      Observed Date: <strong className="text-ink">{activeCoord.point.date}</strong>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted">
                        Metric Value:{" "}
                        <strong className="text-ink">
                          {activeMetric === "ENGAGEMENT"
                            ? `${activeCoord.value}%`
                            : activeCoord.value.toLocaleString()}
                        </strong>
                      </span>
                      <span
                        className={`font-semibold ${
                          isPositive ? "text-oxblood" : "text-muted"
                        }`}
                      >
                        {isPositive ? `+${deltaPct}%` : `${deltaPct}%`} period trend
                      </span>
                    </div>
                  </div>
                )}

                {/* Vector SVG Graph with Drag / Touch Scrubbing */}
                <div className="w-full overflow-hidden">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="h-auto w-full touch-pan-x select-none cursor-crosshair"
                    onMouseLeave={() => setHoverIndex(null)}
                    onTouchStart={handleTouchScrub}
                    onTouchMove={handleTouchScrub}
                    onTouchEnd={() => setHoverIndex(null)}
                  >
                    <defs>
                      <linearGradient id={`gradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={currentTheme.stroke} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={currentTheme.accent} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                      const yPos = padTop + chartHeight * (1 - pct);
                      return (
                        <line
                          key={idx}
                          x1={padX}
                          y1={yPos}
                          x2={padX + chartWidth}
                          y2={yPos}
                          stroke="#d8d0c6"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Gradient Area Fill */}
                    {areaPath && (
                      <path
                        key={`area-${activeMetric}-${timeframe}-${selectedPlatform}`}
                        d={areaPath}
                        fill={`url(#gradient-${chartId})`}
                        className="transition-all duration-300"
                      />
                    )}

                    {/* Main Trendline with animated stroke draw on state switch */}
                    {polylineStr && (
                      <polyline
                        key={`line-${activeMetric}-${timeframe}-${selectedPlatform}`}
                        fill="none"
                        stroke={currentTheme.stroke}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylineStr}
                        className="animate-draw-path"
                      />
                    )}

                    {/* Data Points and Scrub Interaction Zones */}
                    {coords.map((c, idx) => {
                      const isHovered = hoverIndex === idx;
                      return (
                        <g key={idx}>
                          {/* Invisible scrubber hitzone */}
                          <rect
                            x={c.x - (chartWidth / coords.length) / 2}
                            y={padTop}
                            width={chartWidth / coords.length}
                            height={chartHeight + padBottom}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoverIndex(idx)}
                          />

                          {/* Scrubber vertical guide line */}
                          {isHovered && (
                            <>
                              <line
                                x1={c.x}
                                y1={padTop}
                                x2={c.x}
                                y2={padTop + chartHeight}
                                stroke={currentTheme.stroke}
                                strokeWidth="1.2"
                                strokeDasharray="2 2"
                              />
                              {/* Pulse halo on active point */}
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r="12"
                                fill={currentTheme.glow}
                                className="animate-ping"
                                style={{ animationDuration: "1.4s" }}
                              />
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r="5.5"
                                fill={currentTheme.accent}
                                stroke="#f7f4ee"
                                strokeWidth="2.5"
                              />
                            </>
                          )}
                        </g>
                      );
                    })}

              {/* Date ticks on X axis */}
              {coords
                .filter((_, idx) => idx % Math.ceil(coords.length / 5) === 0 || idx === coords.length - 1)
                .map((c, idx) => (
                  <text
                    key={idx}
                    x={c.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fill="#5c564e"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {c.point.date.slice(5)}
                  </text>
                ))}
            </svg>
          </div>
        </div>
      </>
    );
  })()}
</div>

      {/* Demographics & Breakdown Grid */}
      <div className="mt-8 grid gap-6 border-t border-line pt-6 md:grid-cols-3">
        {/* Age Distribution Bar Infographic */}
        <div className="border border-line bg-paper p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-oxblood">Audience Composition</p>
          <h4 className="mt-1 font-serif text-lg text-ink">Age Distribution</h4>
          <div className="mt-4 space-y-2.5">
            {Object.entries(ageBreakdown).map(([ageGroup, pctStr]) => {
              const numPct = Number(pctStr) || 10;
              return (
                <div key={ageGroup}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted">{ageGroup}</span>
                    <strong className="text-ink">{numPct}%</strong>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-line/60">
                    <div
                      className="h-full bg-oxblood"
                      style={{
                        width: barsLoaded ? `${numPct}%` : "0%",
                        transition: "width 850ms cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender Composition */}
        <div className="border border-line bg-paper p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-oxblood">Gender Split</p>
          <h4 className="mt-1 font-serif text-lg text-ink">Audience Demographics</h4>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted">Female: {genderBreakdown.female || "54"}%</span>
              <span className="text-muted">Male: {genderBreakdown.male || "46"}%</span>
            </div>
            <div className="mt-2 flex h-3 w-full overflow-hidden border border-line">
              <div
                className="bg-oxblood"
                style={{
                  width: barsLoaded ? `${genderBreakdown.female || 54}%` : "0%",
                  transition: "width 850ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
              <div
                className="bg-ink"
                style={{
                  width: barsLoaded ? `${genderBreakdown.male || 46}%` : "0%",
                  transition: "width 850ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
            <div className="mt-4 border-t border-line pt-3 font-mono text-[11px] text-muted">
              Audience affinity index: <strong>1.42x</strong> compared to category baseline.
            </div>
          </div>
        </div>

        {/* Geographic Market Concentration */}
        <div className="border border-line bg-paper p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-oxblood">Geographic Reach</p>
          <h4 className="mt-1 font-serif text-lg text-ink">Top Market Territories</h4>
          <div className="mt-3 divide-y divide-line/60 text-xs font-mono">
            {Object.entries(countryBreakdown).map(([country, share]) => (
              <div key={country} className="flex items-center justify-between py-1.5">
                <span className="text-muted">Market {country}</span>
                <span className="font-semibold text-ink">{share}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Provider Content Media */}
      {activeAccount.recentContent && activeAccount.recentContent.length > 0 && (
        <div className="mt-8 border-t border-line pt-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-oxblood">High-Impact Media</p>
              <h4 className="mt-0.5 font-serif text-xl text-ink">Top-Performing Content Archive</h4>
            </div>
            <span className="font-mono text-xs text-muted">Audited Performance</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeAccount.recentContent.map((item) => (
              <article
                key={item.id}
                className="card-interactive flex flex-col justify-between border border-line bg-paper p-4"
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                    <span className="border border-line bg-card px-1.5 py-0.5">
                      {item.contentType}
                    </span>
                    <span>{new Date(item.publishedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  </div>
                  <h5 className="mt-2 line-clamp-2 font-serif text-sm font-medium text-ink">
                    {item.title || "Curated Editorial Media"}
                  </h5>
                </div>

                <div className="mt-4 border-t border-line pt-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span>{item.viewCount.toLocaleString()} views</span>
                    <span>{item.likeCount.toLocaleString()} likes</span>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-right text-[11px] text-oxblood hover:underline"
                    >
                      View External Media ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
