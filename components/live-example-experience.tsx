"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/animated-counter";
import type { YouTubeChannelResult, YouTubeVideoItem } from "@/lib/live-example/youtube";
import type { InstagramResolveResult } from "@/lib/live-example/instagram";

interface LiveExampleExperienceProps {
  initialUser: {
    id: string;
    email: string;
    role: string;
    creator?: {
      id: string;
      name: string;
      bio: string;
      avatarUrl: string | null;
      category: string;
      location: string;
      niche: string;
      audienceRange: string;
      collabPrefs: string;
      socials?: Array<{ platform: string; handle: string }>;
    } | null;
  } | null;
}

const CATEGORIES = [
  "Tech & Software",
  "Design & Creative",
  "Lifestyle & Travel",
  "Business & Finance",
  "Food & Culinary",
  "Fitness & Wellness",
  "Gaming & Esports",
  "Education & Science",
];

const AUDIENCE_RANGES = [
  "1k–10k",
  "10k–50k",
  "50k–100k",
  "100k–500k",
  "500k–1M",
  "1M+",
];

export function LiveExampleExperience({ initialUser }: LiveExampleExperienceProps) {
  // Mode: "FLOW" (5-step progressive setup) or "DEMO" (instant public channel lookup)
  const [mode, setMode] = useState<"FLOW" | "DEMO">("DEMO");
  const [currentStep, setCurrentStep] = useState<number>(initialUser ? 2 : 1);

  // Form State for Creator Setup (Step 2)
  const [creatorName, setCreatorName] = useState(initialUser?.creator?.name || initialUser?.email?.split("@")[0] || "");
  const [creatorBio, setCreatorBio] = useState(initialUser?.creator?.bio || "Digital creator producing technical breakdowns, production insights, and deep-dive essays.");
  const [creatorAvatar, setCreatorAvatar] = useState(initialUser?.creator?.avatarUrl || "");
  const [creatorCategory, setCreatorCategory] = useState(initialUser?.creator?.category || "Tech & Software");
  const [creatorNiche, setCreatorNiche] = useState(initialUser?.creator?.niche || "Web Engineering & Design Systems");
  const [secondaryNiches, setSecondaryNiches] = useState<string[]>(["Full-Stack", "Developer Tools"]);
  const [creatorLocation, setCreatorLocation] = useState(initialUser?.creator?.location || "San Francisco, CA");
  const [creatorServices, setCreatorServices] = useState(initialUser?.creator?.collabPrefs || "Dedicated Video Features, Multi-Platform Sponsorships");
  const [audienceRange, setAudienceRange] = useState(initialUser?.creator?.audienceRange || "50k–100k");
  const [creatorWebsite, setCreatorWebsite] = useState("");

  // Platform Input State (Step 3 & Demo mode)
  const [youtubeInput, setYoutubeInput] = useState("@GoogleDevelopers");
  const [instagramInput, setInstagramInput] = useState("@infurizz.official");

const DEFAULT_INITIAL_INSTAGRAM: InstagramResolveResult = {
  success: true,
  platform: "Instagram",
  handle: "@infurizz.official",
  profileUrl: "https://instagram.com/infurizz.official",
  connectionStatus: "PUBLIC_HANDLE_DECLARED",
  isLiveApi: false,
  isDatabaseSnapshot: false,
  requiresAuthorization: true,
  authorizationNotice: "Connect your Instagram professional account to unlock verified performance analytics.",
  complianceNote:
    "Meta Graph API requires an authorized Instagram Professional (Creator or Business) account to access verified reach, impressions, audience demographics, and media metrics. Unofficial scraping is strictly prohibited under Meta Platform Terms.",
  followers: null,
  mediaCount: null,
  reach: null,
  impressions: null,
  likes: null,
  comments: null,
  engagement: null,
  engagementRate: null,
  recentPosts: [],
};

  // Live Query Results
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [youtubeResult, setYoutubeResult] = useState<YouTubeChannelResult | null>(null);
  const [instagramResult, setInstagramResult] = useState<InstagramResolveResult | null>(DEFAULT_INITIAL_INSTAGRAM);

  // Live Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [minutesAgo, setMinutesAgo] = useState(0);

  // Selected tab in Analytics (Step 5)
  const [analyticsPlatformTab, setAnalyticsPlatformTab] = useState<"ALL" | "YOUTUBE" | "INSTAGRAM">("ALL");
  const [metaNotice, setMetaNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("metaAuthNotice") === "unconfigured") {
        setMetaNotice(
          "Meta credentials (INSTAGRAM_CLIENT_ID / META_APP_ID) are required in environment variables to complete live Meta OAuth. Public handles remain verified under the PUBLIC HANDLE DECLARED standard."
        );
      } else if (sp.get("instagramConnected") === "true") {
        setMetaNotice("Instagram professional account successfully authorized via Meta Graph API.");
      }
    }
  }, []);

  // Keep timestamp fresh
  useEffect(() => {
    const timer = setInterval(() => {
      const diffMs = Date.now() - lastUpdated.getTime();
      setMinutesAgo(Math.floor(diffMs / 60000));
    }, 30000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Initial demo resolution on mount
  useEffect(() => {
    runAnalysis("@GoogleDevelopers", "@infurizz.official");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAnalysis(ytHandle: string, igHandle: string) {
    setIsResolving(true);
    setResolveError(null);

    try {
      // 1. Resolve YouTube
      const ytPromise = fetch(`/api/live-example/resolve-youtube?handle=${encodeURIComponent(ytHandle.trim())}`)
        .then((r) => r.json())
        .catch(() => ({
          success: false,
          error: "Network error contacting YouTube resolution endpoint.",
        }));

      // 2. Resolve Instagram
      const igPromise = fetch(`/api/live-example/resolve-instagram?handle=${encodeURIComponent(igHandle.trim())}`)
        .then((r) => r.json())
        .catch(() => ({
          success: false,
          error: "Network error contacting Instagram resolution endpoint.",
        }));

      const [ytData, igData] = await Promise.all([ytPromise, igPromise]);

      setYoutubeResult(ytData);
      setInstagramResult(igData);
      setLastUpdated(new Date());

      if (!ytData.success && !ytData.missingEnv) {
        setResolveError(ytData.error || "Could not resolve YouTube channel.");
      }
    } catch (err: any) {
      setResolveError(err?.message || "Failed to execute platform analysis.");
    } finally {
      setIsResolving(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await runAnalysis(youtubeInput, instagramInput);
    setTimeout(() => setIsRefreshing(false), 500);
  }

  // Handle saving creator profile for signed-in users in the 5-step flow
  async function handleSaveCreatorAndAnalyze() {
    if (initialUser) {
      try {
        await fetch("/api/live-example/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: creatorName,
            bio: creatorBio,
            avatarUrl: creatorAvatar,
            category: creatorCategory,
            niche: creatorNiche,
            secondaryNiches,
            location: creatorLocation,
            services: creatorServices,
            audienceType: audienceRange,
            website: creatorWebsite,
            youtubeHandle: youtubeInput,
            instagramHandle: instagramInput,
          }),
        });
      } catch {
        // Continue to analysis even if offline
      }
    }

    setCurrentStep(4);
    await runAnalysis(youtubeInput, instagramInput);
    setCurrentStep(5);
  }

  // Pre-configured public showcase examples
  const PRESET_EXAMPLES = [
    { label: "Google Developers", yt: "@GoogleDevelopers", ig: "@google" },
    { label: "Veritasium", yt: "@veritasium", ig: "@veritasium" },
    { label: "MKBHD", yt: "@mkbhd", ig: "@mkbhd" },
    { label: "Fireship", yt: "@fireship", ig: "@fireship_dev" },
  ];

  // Calculate Verified KPI Metrics
  const ytAudience = youtubeResult?.channel?.subscriberCount || youtubeResult?.kpis?.totalAudience || 0;
  const isIgVerified = instagramResult?.connectionStatus === "CONNECTED" && Boolean(instagramResult?.followers);
  const igAudience = isIgVerified ? Number(instagramResult?.followers || 0) : 0;
  const totalVerifiedAudience = ytAudience + igAudience;
  const bothPlatformsAvailable = ytAudience > 0 && igAudience > 0;

  const ytViews = youtubeResult?.channel?.viewCount || youtubeResult?.kpis?.totalViews || 0;
  const igReach = (instagramResult?.connectionStatus === "CONNECTED" && instagramResult?.reach) ? Number(instagramResult.reach) : 0;
  const totalViews = ytViews + igReach;

  const ytEngagement = youtubeResult?.kpis?.totalEngagement || 0;
  const igEngagement = (instagramResult?.connectionStatus === "CONNECTED" && instagramResult?.engagement) ? Number(instagramResult.engagement) : 0;
  const totalEngagement = ytEngagement + igEngagement;

  const avgEngagementRate = youtubeResult?.kpis?.avgEngagementRate || 0;
  const totalContentCount = (youtubeResult?.channel?.videoCount || youtubeResult?.kpis?.contentPublished || 0) +
    (isIgVerified && (instagramResult?.mediaCount || instagramResult?.recentPosts?.length) ? Number(instagramResult.mediaCount || instagramResult.recentPosts?.length) : 0);

  // Ranked videos sorted by views descending
  const rankedVideos: YouTubeVideoItem[] = [...(youtubeResult?.videos || [])].sort(
    (a, b) => b.viewCount - a.viewCount
  );

  return (
    <div className="space-y-12">
      {metaNotice ? (
        <div className="flex items-start justify-between border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 animate-fade-in">
          <div>
            <strong className="font-semibold">Meta Graph API Notice: </strong>
            {metaNotice}
          </div>
          <button
            type="button"
            onClick={() => setMetaNotice(null)}
            className="ml-4 font-bold text-amber-800 hover:text-ink"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* 1. Mode Switcher & Progress Bar */}
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("DEMO")}
            className={`btn-tactile px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all ${
              mode === "DEMO"
                ? "bg-ink text-paper"
                : "border border-line bg-card text-muted hover:text-ink"
            }`}
          >
            Explore Live Example
          </button>
          <button
            type="button"
            onClick={() => setMode("FLOW")}
            className={`btn-tactile px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all ${
              mode === "FLOW"
                ? "bg-ink text-paper"
                : "border border-line bg-card text-muted hover:text-ink"
            }`}
          >
            Interactive Creator Flow (5 Steps)
          </button>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 border px-3 py-1 text-xs ${
            youtubeResult?.isLiveApi
              ? "border-emerald-600/40 bg-emerald-50 text-emerald-800"
              : youtubeResult?.isDatabaseSnapshot
              ? "border-amber-600/40 bg-amber-50 text-amber-800"
              : "border-sky-600/40 bg-sky-50 text-sky-800"
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              youtubeResult?.isLiveApi
                ? "bg-emerald-600 animate-pulse"
                : youtubeResult?.isDatabaseSnapshot
                ? "bg-amber-600"
                : "bg-sky-600"
            }`} />
            <span className="font-mono text-[11px] font-semibold tracking-wider uppercase">
              {youtubeResult?.isLiveApi
                ? "LIVE API DATA"
                : youtubeResult?.isDatabaseSnapshot
                ? "STORED SNAPSHOT DATA"
                : "DEMO DATA"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isResolving}
            className="btn-tactile flex items-center gap-1.5 border border-line bg-card px-3 py-1 text-xs text-ink hover:border-ink disabled:opacity-50"
            title="Refresh analytics from source API"
          >
            <span className={isRefreshing ? "inline-block animate-spin" : ""}>↻</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. MODE: DEMO MODE (Fast Exploration) */}
      {mode === "DEMO" ? (
        <section className="card-interactive border border-line bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-2 border-b border-line pb-6 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.16em] text-oxblood uppercase">
                Direct Channel Resolution
              </span>
              <h2 className="mt-1 font-serif text-3xl text-ink">Explore a Live Example</h2>
            </div>
            <p className="max-w-md text-xs text-muted">
              Enter any public YouTube channel handle or URL to inspect actual real-time channel statistics and video performance via the official Google Data API.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">Quick Channels:</span>
            {PRESET_EXAMPLES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setYoutubeInput(preset.yt);
                  setInstagramInput(preset.ig);
                  runAnalysis(preset.yt, preset.ig);
                }}
                className={`btn-tactile border px-2.5 py-1 text-xs transition-colors ${
                  youtubeInput === preset.yt
                    ? "border-oxblood bg-oxblood/10 text-oxblood font-medium"
                    : "border-line bg-paper text-muted hover:text-ink hover:border-ink/50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAnalysis(youtubeInput, instagramInput);
            }}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                YouTube Channel Handle or URL
              </label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  placeholder="@GoogleDevelopers or youtube.com/@channel"
                  className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  required
                />
              </div>
              <span className="mt-1 block text-[11px] text-muted">
                Accepts handles (e.g. <code>@mkbhd</code>) or full channel links.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                Instagram Handle or Profile URL
              </label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  value={instagramInput}
                  onChange={(e) => setInstagramInput(e.target.value)}
                  placeholder="@handle or instagram.com/username"
                  className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                />
              </div>
              <span className="mt-1 block text-[11px] text-muted">
                Meta terms require OAuth for private metrics; public handle verified.
              </span>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isResolving}
                className="btn-tactile bg-ink px-6 py-2.5 text-xs font-semibold tracking-wider text-paper uppercase hover:bg-oxblood disabled:opacity-50"
              >
                {isResolving ? "Resolving Channels via API..." : "Run Live Analysis →"}
              </button>

              <span className="font-mono text-[11px] text-muted">
                Last synced: {minutesAgo === 0 ? "Just now" : `${minutesAgo}m ago`}
              </span>
            </div>
          </form>

          {resolveError ? (
            <div className="mt-4 border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800">
              <strong>Resolution Notice: </strong> {resolveError}
            </div>
          ) : null}

          {youtubeResult?.missingEnv ? (
            <div className="mt-4 border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
              <strong className="font-semibold">API Environment Note: </strong>
              {youtubeResult.error}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 3. MODE: 5-STEP INTERACTIVE CREATOR FLOW */}
      {mode === "FLOW" ? (
        <section className="space-y-8">
          {/* Step Timeline Indicator */}
          <div className="border border-line bg-card p-4">
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs">
              {[
                { step: 1, title: "01 · Google Auth" },
                { step: 2, title: "02 · Creator Setup" },
                { step: 3, title: "03 · Connect Platforms" },
                { step: 4, title: "04 · Analysis" },
                { step: 5, title: "05 · Live Analytics" },
              ].map((s) => (
                <li
                  key={s.step}
                  onClick={() => s.step <= (initialUser ? 3 : currentStep) && setCurrentStep(s.step)}
                  className={`flex items-center gap-2 p-2 border transition-all cursor-pointer ${
                    currentStep === s.step
                      ? "border-ink bg-paper font-semibold text-ink"
                      : currentStep > s.step
                      ? "border-line bg-card text-emerald-800"
                      : "border-transparent text-muted"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                      currentStep === s.step
                        ? "bg-ink text-paper"
                        : currentStep > s.step
                        ? "bg-emerald-700 text-paper"
                        : "bg-line text-muted"
                    }`}
                  >
                    {currentStep > s.step ? "✓" : s.step}
                  </span>
                  <span className="truncate">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* STEP 01: Google Authentication */}
          {currentStep === 1 ? (
            <div className="border border-line bg-card p-8 animate-fade-up">
              <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                Step 01 of 05
              </span>
              <h2 className="mt-1 font-serif text-3xl text-ink">Google Sign In / Verification</h2>
              <p className="mt-2 text-sm text-muted max-w-xl">
                Authenticate with your official Google account to link your verified creator identity. Your existing session credentials will be securely recognized.
              </p>

              {initialUser ? (
                <div className="mt-6 flex items-center justify-between border border-emerald-600 bg-emerald-50 p-4 text-xs text-emerald-900">
                  <div>
                    <span className="font-semibold">✓ Active Session Recognized: </span>
                    <span>{initialUser.email} ({initialUser.role})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-tactile bg-ink px-4 py-2 text-xs font-medium text-paper uppercase hover:bg-oxblood"
                  >
                    Proceed to Step 02 →
                  </button>
                </div>
              ) : (
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href="/api/auth/google?returnTo=/live-example"
                    className="btn-tactile inline-flex items-center gap-3 bg-ink px-6 py-3 text-xs font-semibold tracking-wider text-paper uppercase hover:bg-oxblood"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google Auth →
                  </Link>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-tactile border border-line px-4 py-3 text-xs font-semibold tracking-wider text-muted uppercase hover:text-ink hover:border-ink"
                  >
                    Skip to Profile Setup (Sandbox Mode)
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* STEP 02: Creator Setup Form */}
          {currentStep === 2 ? (
            <div className="border border-line bg-card p-8 animate-fade-up">
              <div className="border-b border-line pb-4">
                <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                  Step 02 of 05
                </span>
                <h2 className="mt-1 font-serif text-3xl text-ink">Creator Profile Specification</h2>
                <p className="mt-2 text-xs text-muted">
                  Configure your professional identity. These attributes form your verified storefront and marketplace footprint.
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Creator Name
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    required
                    placeholder="e.g. Elena Rostova"
                    className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Location
                  </label>
                  <input
                    type="text"
                    value={creatorLocation}
                    onChange={(e) => setCreatorLocation(e.target.value)}
                    placeholder="e.g. London, UK / Global"
                    className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Professional Description &amp; Editorial Bio
                  </label>
                  <textarea
                    rows={3}
                    value={creatorBio}
                    onChange={(e) => setCreatorBio(e.target.value)}
                    placeholder="Describe your creative focus, production style, and core audience."
                    className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Primary Category
                  </label>
                  <select
                    value={creatorCategory}
                    onChange={(e) => setCreatorCategory(e.target.value)}
                    className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Audience Size Tier
                  </label>
                  <select
                    value={audienceRange}
                    onChange={(e) => setAudienceRange(e.target.value)}
                    className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  >
                    {AUDIENCE_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Primary Niche
                  </label>
                  <input
                    type="text"
                    value={creatorNiche}
                    onChange={(e) => setCreatorNiche(e.target.value)}
                    placeholder="e.g. Industrial Design"
                    className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Key Services &amp; Packages
                  </label>
                  <input
                    type="text"
                    value={creatorServices}
                    onChange={(e) => setCreatorServices(e.target.value)}
                    placeholder="e.g. Dedicated Video, Product Macro Feature"
                    className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-tactile bg-ink px-6 py-2.5 text-xs font-semibold tracking-wider text-paper uppercase hover:bg-oxblood"
                >
                  Continue to Connect Platforms →
                </button>
              </div>
            </div>
          ) : null}

          {/* STEP 03: Platform Connection */}
          {currentStep === 3 ? (
            <div className="border border-line bg-card p-8 animate-fade-up">
              <div className="border-b border-line pb-4">
                <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                  Step 03 of 05
                </span>
                <h2 className="mt-1 font-serif text-3xl text-ink">Connect Your Platforms</h2>
                <p className="mt-2 text-xs text-muted">
                  Provide your primary channel channels. Paste either full profile URLs or @handles; inputs are automatically normalized.
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* YouTube Card */}
                <div className="border border-line bg-paper p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl text-ink">YouTube</span>
                    <span className="border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                      Official Data API v3
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Channel subscribers, lifetime views, and recent upload performance.
                  </p>
                  <input
                    type="text"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    placeholder="@GoogleDevelopers or channel URL"
                    className="mt-4 w-full border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>

                {/* Instagram Card */}
                <div className="border border-line bg-paper p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl text-ink">Instagram</span>
                    <span className="border border-line bg-card px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                      Meta Graph API Compliance
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Profile connection. Private reach requires Meta Business authorization.
                  </p>
                  <input
                    type="text"
                    value={instagramInput}
                    onChange={(e) => setInstagramInput(e.target.value)}
                    placeholder="@handle or instagram.com/handle"
                    className="mt-4 w-full border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-tactile border border-line px-4 py-2 text-xs uppercase text-muted hover:text-ink"
                >
                  ← Back to Setup
                </button>
                <button
                  type="button"
                  onClick={handleSaveCreatorAndAnalyze}
                  className="btn-tactile bg-ink px-6 py-2.5 text-xs font-semibold tracking-wider text-paper uppercase hover:bg-oxblood"
                >
                  Save &amp; Run Platform Analysis →
                </button>
              </div>
            </div>
          ) : null}

          {/* STEP 04: Platform Analysis / Audit */}
          {currentStep === 4 ? (
            <div className="border border-line bg-card p-8 animate-fade-up text-center">
              <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                Step 04 of 05
              </span>
              <h2 className="mt-2 font-serif text-3xl text-ink">Analyzing Platform Footprint</h2>
              <p className="mt-2 text-xs text-muted max-w-md mx-auto">
                Validating handles, querying official platform endpoints, and compiling verified metric snapshots.
              </p>

              <div className="mt-8 flex justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-line border-t-ink rounded-full" />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 4. UNIFIED ANALYTICS DASHBOARD (Visible in Demo mode and Step 5 of Flow) */}
      {(mode === "DEMO" || currentStep === 5) ? (
        <section className="space-y-10 animate-fade-up">
          {/* Top-Level KPI Strip */}
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between border-b border-line pb-3">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                  Unified Intelligence Strip
                </span>
                <h3 className="mt-1 font-serif text-2xl text-ink">Your Creator Performance</h3>
              </div>
              <span className="font-mono text-xs text-muted">
                Aggregated strictly across connected channels
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="card-interactive border border-line bg-card p-5">
                <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Total Verified Audience
                </span>
                <p className="mt-2 font-serif text-3xl font-medium text-ink">
                  <AnimatedCounter value={totalVerifiedAudience} />
                </p>
                <span className="mt-1 block text-xs text-muted">
                  {bothPlatformsAvailable
                    ? "Verified across 2 connected platforms (YouTube + Instagram)"
                    : ytAudience > 0
                    ? "Verified across 1 platform (YouTube Data API v3)"
                    : igAudience > 0
                    ? "Verified across 1 platform (Meta Graph API)"
                    : "Pending platform verification"}
                </span>
              </div>

              <div className="card-interactive border border-line bg-card p-5">
                <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Total Views / Reach
                </span>
                <p className="mt-2 font-serif text-3xl font-medium text-ink">
                  <AnimatedCounter value={totalViews} />
                </p>
                <span className="mt-1 block text-xs text-muted">
                  {igReach > 0
                    ? "YouTube views + Instagram verified reach"
                    : "Lifetime synced YouTube video views"}
                </span>
              </div>

              <div className="card-interactive border border-line bg-card p-5">
                <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                  Total Engagement
                </span>
                <p className="mt-2 font-serif text-3xl font-medium text-ink">
                  <AnimatedCounter value={totalEngagement} />
                </p>
                <span className="mt-1 block text-xs text-muted">
                  Recent likes + comments
                </span>
              </div>

              <div className="card-interactive border border-line bg-card p-5">
                <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">
                  Avg Engagement Rate
                </span>
                <p className="mt-2 font-serif text-3xl font-medium text-ink">
                  {avgEngagementRate > 0 ? `${avgEngagementRate}%` : "Calculating"}
                </p>
                <span className="mt-1 block text-xs text-muted">
                  Weighted interaction ratio
                </span>
              </div>

              <div className="card-interactive border border-line bg-card p-5 col-span-2 lg:col-span-1">
                <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Content Published
                </span>
                <p className="mt-2 font-serif text-3xl font-medium text-ink">
                  <AnimatedCounter value={totalContentCount} />
                </p>
                <span className="mt-1 block text-xs text-muted">
                  Total tracked uploads
                </span>
              </div>
            </div>
          </div>

          {/* Platform Performance Selector */}
          <div className="flex items-center gap-2 border-b border-line pb-3 text-xs">
            <button
              type="button"
              onClick={() => setAnalyticsPlatformTab("ALL")}
              className={`px-3 py-1.5 transition-colors ${
                analyticsPlatformTab === "ALL"
                  ? "bg-ink text-paper font-medium"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              All Platforms Overview
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsPlatformTab("YOUTUBE")}
              className={`px-3 py-1.5 transition-colors ${
                analyticsPlatformTab === "YOUTUBE"
                  ? "bg-ink text-paper font-medium"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              YouTube ({youtubeResult?.channel?.handle || "@channel"})
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsPlatformTab("INSTAGRAM")}
              className={`px-3 py-1.5 transition-colors ${
                analyticsPlatformTab === "INSTAGRAM"
                  ? "bg-ink text-paper font-medium"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              Instagram ({instagramResult?.handle || "@handle"})
            </button>
          </div>

          {/* A. Audience Overview & Channel Detail */}
          {(analyticsPlatformTab === "ALL" || analyticsPlatformTab === "YOUTUBE") && youtubeResult?.channel ? (
            <div className="border border-line bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
                <div className="flex items-center gap-4">
                  {youtubeResult.channel.avatarUrl ? (
                    <img
                      src={youtubeResult.channel.avatarUrl}
                      alt={youtubeResult.channel.title}
                      className="h-14 w-14 rounded-full border border-line object-cover"
                    />
                  ) : null}
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-oxblood uppercase">
                      YouTube Channel
                    </span>
                    <h4 className="font-serif text-2xl text-ink">
                      {youtubeResult.channel.title}
                    </h4>
                    <span className="font-mono text-xs text-muted">
                      {youtubeResult.channel.handle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    youtubeResult.isLiveApi
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : youtubeResult.isDatabaseSnapshot
                      ? "border-amber-600 bg-amber-50 text-amber-800"
                      : "border-sky-600 bg-sky-50 text-sky-800"
                  }`}>
                    {youtubeResult.isLiveApi
                      ? "● LIVE API DATA"
                      : youtubeResult.isDatabaseSnapshot
                      ? "● STORED SNAPSHOT DATA"
                      : "● DEMO DATA"}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="border-r border-line/60 pr-4">
                  <span className="text-[11px] text-muted uppercase">Subscribers</span>
                  <p className="mt-1 font-serif text-2xl text-ink">
                    <AnimatedCounter value={youtubeResult.channel.subscriberCount} />
                  </p>
                </div>
                <div className="border-r border-line/60 pr-4">
                  <span className="text-[11px] text-muted uppercase">Lifetime Views</span>
                  <p className="mt-1 font-serif text-2xl text-ink">
                    <AnimatedCounter value={youtubeResult.channel.viewCount} />
                  </p>
                </div>
                <div className="border-r border-line/60 pr-4">
                  <span className="text-[11px] text-muted uppercase">Total Uploads</span>
                  <p className="mt-1 font-serif text-2xl text-ink">
                    <AnimatedCounter value={youtubeResult.channel.videoCount} />
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted uppercase">Avg Video ER</span>
                  <p className="mt-1 font-serif text-2xl text-ink">
                    {avgEngagementRate}%
                  </p>
                </div>
              </div>

              {youtubeResult.channel.description ? (
                <p className="mt-4 border-t border-line pt-4 text-xs text-muted line-clamp-2">
                  {youtubeResult.channel.description}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Instagram Platform Compliance Status Card */}
          {(analyticsPlatformTab === "ALL" || analyticsPlatformTab === "INSTAGRAM") && instagramResult ? (
            <div className="border border-line bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">
                    Meta Platform Integration
                  </span>
                  <h4 className="font-serif text-2xl text-ink">
                    Instagram ({instagramResult.handle})
                  </h4>
                  <a
                    href={instagramResult.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-oxblood hover:underline"
                  >
                    {instagramResult.profileUrl} ↗
                  </a>
                </div>

                <span
                  className={`border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    instagramResult.connectionStatus === "CONNECTED"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-line bg-paper text-muted"
                  }`}
                >
                  {instagramResult.connectionStatus === "CONNECTED"
                    ? "● LIVE API DATA"
                    : "● PUBLIC HANDLE DECLARED"}
                </span>
              </div>

              {instagramResult.connectionStatus === "CONNECTED" ? (
                /* Authenticated Instagram Analytics */
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="border-r border-line/60 pr-4">
                      <span className="text-[11px] text-muted uppercase">Followers</span>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        <AnimatedCounter value={instagramResult.followers || 0} />
                      </p>
                    </div>
                    <div className="border-r border-line/60 pr-4">
                      <span className="text-[11px] text-muted uppercase">Media / Content</span>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        <AnimatedCounter value={instagramResult.mediaCount || instagramResult.recentPosts?.length || 0} />
                      </p>
                    </div>
                    <div className="border-r border-line/60 pr-4">
                      <span className="text-[11px] text-muted uppercase">Verified Reach</span>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        <AnimatedCounter value={instagramResult.reach || 0} />
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted uppercase">Avg Engagement</span>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        {instagramResult.engagementRate || (instagramResult.engagement ? Number(instagramResult.engagement).toLocaleString() : "Calculated")}
                      </p>
                    </div>
                  </div>

                  {instagramResult.recentPosts && instagramResult.recentPosts.length > 0 ? (
                    <div className="border-t border-line pt-4">
                      <h5 className="font-serif text-lg text-ink mb-3">Recent Instagram Media</h5>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {instagramResult.recentPosts.map((post) => (
                          <div key={post.id} className="border border-line bg-paper p-3 text-xs">
                            <p className="line-clamp-2 text-ink font-medium">{post.caption || "Instagram Media"}</p>
                            <div className="mt-2 flex justify-between text-muted text-[11px]">
                              <span>Likes: {post.likeCount != null ? post.likeCount.toLocaleString() : "—"}</span>
                              <span>Comments: {post.commentCount != null ? post.commentCount.toLocaleString() : "—"}</span>
                            </div>
                            <a href={post.permalink} target="_blank" rel="noreferrer" className="mt-2 block text-oxblood hover:underline text-[11px]">View Post ↗</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                /* Unauthorized Public Handle State */
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-b border-line pb-4">
                    <div className="border-r border-line/60 pr-4">
                      <span className="text-[11px] text-muted uppercase">Followers</span>
                      <p className="mt-1 font-serif text-lg text-muted italic">Authorization Required</p>
                      <span className="text-[10px] text-muted">Meta OAuth needed</span>
                    </div>
                    <div className="border-r border-line/60 pr-4">
                      <span className="text-[11px] text-muted uppercase">Media Count</span>
                      <p className="mt-1 font-serif text-lg text-muted italic">Authorization Required</p>
                      <span className="text-[10px] text-muted">Meta OAuth needed</span>
                    </div>
                    <div className="border-r border-line/60 pr-4">
                      <span className="text-[11px] text-muted uppercase">Verified Reach</span>
                      <p className="mt-1 font-serif text-lg text-muted italic">Authorization Required</p>
                      <span className="text-[10px] text-muted">Meta OAuth needed</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted uppercase">Avg Post ER</span>
                      <p className="mt-1 font-serif text-lg text-muted italic">Authorization Required</p>
                      <span className="text-[10px] text-muted">Meta OAuth needed</span>
                    </div>
                  </div>

                  <div className="border border-line bg-paper p-5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h5 className="font-serif text-base text-ink font-semibold">
                          Connect your Instagram professional account to unlock verified performance analytics.
                        </h5>
                        <p className="mt-1 text-muted leading-relaxed max-w-xl">
                          {instagramResult.complianceNote}
                        </p>
                      </div>

                      <a
                        href={`/api/auth/instagram?returnTo=/live-example&handle=${encodeURIComponent(instagramResult.handle)}`}
                        className="btn-tactile inline-flex items-center justify-center whitespace-nowrap bg-ink px-5 py-2.5 text-xs font-semibold tracking-wider text-paper uppercase hover:bg-oxblood transition-colors shadow-sm"
                      >
                        Connect Instagram →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* C. Content Performance & Recent Uploads Grid */}
          {youtubeResult?.videos && youtubeResult.videos.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between border-b border-line pb-2">
                <h4 className="font-serif text-2xl text-ink">Recent Content Performance</h4>
                <span className="text-xs text-muted">
                  Queried directly via YouTube Data API
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {youtubeResult.videos.map((vid) => (
                  <article
                    key={vid.id}
                    className="card-interactive flex flex-col justify-between border border-line bg-card p-4 transition-all hover:border-ink/50"
                  >
                    <div>
                      {vid.thumbnailUrl ? (
                        <div className="aspect-video w-full overflow-hidden border border-line bg-paper">
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      ) : null}

                      <h5 className="mt-3 font-serif text-base font-medium text-ink line-clamp-2">
                        {vid.title}
                      </h5>

                      <div className="mt-3 space-y-1.5 border-t border-line pt-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">Views:</span>
                          <strong className="text-ink font-mono">{vid.viewCount.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Likes:</span>
                          <strong className="text-ink font-mono">{vid.likeCount.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Comments:</span>
                          <strong className="text-ink font-mono">{vid.commentCount.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between border-t border-line/40 pt-1">
                          <span className="text-oxblood font-semibold">Engagement:</span>
                          <strong className="text-oxblood font-mono">{vid.engagementRate}%</strong>
                        </div>
                      </div>
                    </div>

                    <a
                      href={vid.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block text-center border border-line py-1 text-[11px] uppercase tracking-wider text-ink hover:border-ink hover:text-oxblood"
                    >
                      Watch on YouTube ↗
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* D. Top Performing Content (Ranked #1 to #5) */}
          {rankedVideos.length > 0 ? (
            <section className="border border-line bg-card p-6">
              <div className="border-b border-line pb-3">
                <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                  Performance Ranking
                </span>
                <h4 className="mt-1 font-serif text-2xl text-ink">
                  Top Performing Content (#1–#{Math.min(rankedVideos.length, 5)})
                </h4>
              </div>

              <div className="mt-4 divide-y divide-line">
                {rankedVideos.slice(0, 5).map((vid, idx) => (
                  <div
                    key={vid.id}
                    className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-2xl font-bold text-oxblood w-8">
                        #{idx + 1}
                      </span>
                      {vid.thumbnailUrl ? (
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="h-12 w-20 object-cover border border-line"
                        />
                      ) : null}
                      <div>
                        <h5 className="font-medium text-sm text-ink line-clamp-1">{vid.title}</h5>
                        <span className="font-mono text-xs text-muted">
                          Published {new Date(vid.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-mono">
                      <div>
                        <span className="text-muted block text-[10px] uppercase">Views</span>
                        <strong className="text-ink">{vid.viewCount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase">Likes</span>
                        <strong className="text-ink">{vid.likeCount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase">ER</span>
                        <strong className="text-oxblood">{vid.engagementRate}%</strong>
                      </div>
                      <a
                        href={vid.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-muted hover:text-ink"
                      >
                        Link ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* E. Platform Comparison & F. Performance Trend */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Platform Comparison */}
            <section className="border border-line bg-card p-6">
              <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                Channel Comparative
              </span>
              <h4 className="mt-1 font-serif text-2xl text-ink">Platform Comparison</h4>
              <p className="mt-2 text-xs text-muted">
                Mathematical comparison across active linked accounts based on available verified metrics.
              </p>

              <div className="mt-6 space-y-4">
                <div className="border border-line bg-paper p-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">YouTube Dominance</span>
                    <span className="font-mono text-oxblood font-semibold">
                      {youtubeResult?.isLiveApi ? "● LIVE API DATA" : "● DATA VERIFIED"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    YouTube accounts for {totalVerifiedAudience > 0 ? Math.round((ytAudience / totalVerifiedAudience) * 100) : 100}% of verified audience with {totalViews.toLocaleString()} lifetime views.
                  </p>
                </div>

                <div className="border border-line bg-paper p-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">Instagram Intelligence</span>
                    <span className="font-mono text-muted">
                      {instagramResult?.connectionStatus === "CONNECTED"
                        ? "● LIVE API DATA"
                        : "● PUBLIC HANDLE DECLARED"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {instagramResult?.connectionStatus === "CONNECTED"
                      ? `Instagram account verified with active Meta Graph API insights.`
                      : `Connect your Instagram professional account to unlock verified performance analytics.`}
                  </p>
                </div>
              </div>
            </section>

            {/* F. Performance Trend */}
            <section className="border border-line bg-card p-6">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">
                Historical Series
              </span>
              <h4 className="mt-1 font-serif text-2xl text-ink">Performance Trend</h4>
              <p className="mt-2 text-xs text-muted">
                Continuous daily audience &amp; engagement trend snapshots.
              </p>

              <div className="mt-6 flex flex-col items-center justify-center border border-dashed border-line bg-paper p-8 text-center">
                <div className="h-2 w-2 rounded-full bg-emerald-600 animate-ping mb-3" />
                <span className="font-serif text-lg text-ink font-medium">Collecting performance history</span>
                <p className="mt-1 max-w-xs text-xs text-muted">
                  INFURIZZ records immutable daily snapshots. As snapshots accumulate over time, verified growth trends will render here.
                </p>
                <span className="mt-3 font-mono text-[11px] text-muted">
                  Strict Standard: No simulated or fabricated historical lines.
                </span>
              </div>
            </section>
          </div>
        </section>
      ) : null}
    </div>
  );
}
