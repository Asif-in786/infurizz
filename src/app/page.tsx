import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Search,
  ExternalLink,
  MessageSquare,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { PlatformIcon } from "@/components/common/PlatformIcon";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { MOCK_SOCIAL_DATA } from "@/lib/integrations/mock-data";
import { AudienceAggregator } from "@/lib/analytics/aggregator";

export default function Home() {
  const mockAccounts = Object.values(MOCK_SOCIAL_DATA).map((item, idx) => ({
    id: `acc_mock_${idx}`,
    creatorId: "cprof_sarah_chen",
    platform: item.metrics.platform,
    platformAccountId: item.profile.platformAccountId,
    username: item.profile.username,
    profileUrl: item.profile.profileUrl,
    followersCount: item.metrics.followersCount,
    followingCount: item.metrics.followingCount ?? 0,
    postsCount: item.metrics.postsCount ?? 0,
    engagementRate: item.metrics.engagementRate,
    metricsJson: JSON.stringify(item.metrics),
    isConnected: true,
    lastSyncedAt: item.metrics.fetchedAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const aggregated = AudienceAggregator.calculate(mockAccounts);

  const platformSources = [
    { name: "Instagram", platform: "INSTAGRAM", handle: "@kaicreative", count: "600K" },
    { name: "YouTube", platform: "YOUTUBE", handle: "Kai Zhang Studio", count: "410K" },
    { name: "X", platform: "X_TWITTER", handle: "@kai_creative", count: "280K" },
    { name: "Facebook", platform: "FACEBOOK", handle: "Kai Zhang Media", count: "110K" },
    { name: "LinkedIn", platform: "LINKEDIN", handle: "kaizhang-design", count: "50K" },
    { name: "WhatsApp", platform: "WHATSAPP_CHANNEL", handle: "Kai Zhang Updates", count: "30K" },
  ];

  const featuredCreators = [
    {
      id: "featured_1",
      name: "Kai Zhang",
      handle: "@kaicreative",
      niche: "Design & Creative Tech",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      totalReach: "1.48M",
      engagement: "4.8%",
      growth: "+14.2%",
      platforms: ["INSTAGRAM", "YOUTUBE", "X_TWITTER", "FACEBOOK", "LINKEDIN", "WHATSAPP_CHANNEL"],
      verified: true,
    },
    {
      id: "cprof_marcus_vance",
      name: "Marcus Vance",
      handle: "@marcusaudio",
      niche: "Hardware & Audio Tech",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      totalReach: "850K",
      engagement: "5.2%",
      growth: "+9.8%",
      platforms: ["YOUTUBE", "INSTAGRAM", "X_TWITTER", "WHATSAPP_CHANNEL"],
      verified: true,
    },
    {
      id: "cprof_elena_rostova",
      name: "Elena Rostova",
      handle: "@elenacodes",
      niche: "Software & AI Engineering",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
      totalReach: "620K",
      engagement: "6.1%",
      growth: "+18.4%",
      platforms: ["X_TWITTER", "YOUTUBE", "LINKEDIN", "INSTAGRAM"],
      verified: true,
    },
  ];

  return (
    <div className="flex flex-col gap-28 sm:gap-36 pb-32 overflow-x-hidden">
      {/* ================================================== */}
      {/* 1. HERO SECTION                                   */}
      {/* ================================================== */}
      <section className="pt-14 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
        <div className="space-y-8 animate-fade-in-up">
          {/* Official Logo (Including Built-in Tagline: CREATE. CONNECT. GROW.) */}
          <div className="flex flex-col items-center justify-center">
            <Logo size="lg" priority />
          </div>

          {/* Primary Headline */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-950 uppercase leading-[1.05]">
              One Creator.
              <br />
              Multiple Platforms.
              <br />
              <span className="text-[#E90000]">One Identity.</span>
            </h1>
          </div>

          {/* Supporting Copy */}
          <p className="text-base sm:text-xl text-zinc-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Infurizz brings your creator presence together, helping brands discover you and giving you one place to manage collaborations.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/signup">
              <Button
                variant="primary"
                size="lg"
                className="text-sm px-8 py-3.5 gap-2 cursor-pointer shadow-sm hover:shadow transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/brand/discover">
              <Button
                variant="outline"
                size="lg"
                className="text-sm px-8 py-3.5 gap-2 cursor-pointer bg-white text-zinc-800 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
              >
                <span>Explore Creators</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 2. HERO PRODUCT VISUAL: CONVERGENCE STORY          */}
      {/* ================================================== */}
      <section id="convergence" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
          <div className="text-center space-y-1 max-w-md mx-auto">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#E90000]">
              The Core Concept
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-950">
              Multiple Platforms → One Unified Creator Identity
            </h2>
          </div>

          {/* Clean Convergence Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* 6 Clean Platform Markers */}
            <div className="lg:col-span-5 space-y-2">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Supported Platforms
              </div>
              <div className="grid grid-cols-2 gap-2">
                {platformSources.map((plat) => (
                  <div
                    key={plat.platform}
                    className="p-3 bg-[#FAFAF9] border border-zinc-200 rounded-lg flex items-center justify-between hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={plat.platform} className="h-4 w-4 text-zinc-700" />
                      <span className="text-xs font-medium text-zinc-900">{plat.name}</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-950 font-mono">{plat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Convergence Indicator */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0 text-zinc-400">
              <div className="hidden lg:block w-px h-8 bg-zinc-200" />
              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full text-[11px] font-semibold text-zinc-700 my-1">
                <span>Converge</span>
                <ArrowRight className="h-3 w-3 text-[#E90000] hidden lg:inline" />
                <ArrowDown className="h-3 w-3 text-[#E90000] lg:hidden" />
              </div>
              <div className="hidden lg:block w-px h-8 bg-zinc-200" />
            </div>

            {/* INFURIZZ Revealed Unified Identity */}
            <div className="lg:col-span-5 bg-[#FAFAF9] border-2 border-zinc-950 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <Logo size="xs" priority />
                <span className="text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-200 px-2 py-0.5 rounded-full">
                  Unified Identity
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 font-mono">
                  <AnimatedCounter
                    value={aggregated.totalReach}
                    divisor={1_000_000}
                    decimals={2}
                    suffix="M"
                  />
                </div>
                <div className="text-sm font-semibold text-zinc-700">Total audience</div>
                <p className="text-xs text-zinc-500 pt-1">
                  Verified multi-platform creator footprint across 6 active platforms.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
                <span>Engagement: <strong className="text-zinc-950 font-mono">4.8%</strong></span>
                <span>Monthly Growth: <strong className="text-zinc-950 font-mono">+14.2%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 3. PROBLEM SECTION                                 */}
      {/* ================================================== */}
      <section id="problem" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="border-t border-zinc-200 pt-16 space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
              The Real-World Challenge
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              Your audience is everywhere.
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
              Creators build communities across multiple platforms, but their audience, performance and brand opportunities are scattered.
            </p>
          </div>

          {/* Clean Editorial Comparison: Scattered vs. Unified */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Fragmented Reality */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Fragmented Creator Presence</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-zinc-600">
                <div className="border-b border-zinc-100 pb-3 space-y-1">
                  <span className="font-semibold text-zinc-900 block">Isolated Follower Proof</span>
                  <p className="leading-relaxed">
                    600K on Instagram, 410K on YouTube, 280K on X. No single authoritative place demonstrates your true combined cultural footprint.
                  </p>
                </div>
                <div className="border-b border-zinc-100 pb-3 space-y-1">
                  <span className="font-semibold text-zinc-900 block">Outdated PDF Media Kits</span>
                  <p className="leading-relaxed">
                    Manual screenshot PDFs expire the moment they are exported. Follower counts and rates require constant manual editing.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-900 block">Inquiries Lost in Spam DMs</span>
                  <p className="leading-relaxed">
                    High-value sponsorship opportunities vanish under hundreds of casual direct messages and unsolicited bot requests.
                  </p>
                </div>
              </div>
            </div>

            {/* The Infurizz Standard */}
            <div className="bg-white border-2 border-zinc-900 rounded-xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#E90000] uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E90000]" />
                <span>One Unified Infurizz Profile</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-zinc-700">
                <div className="border-b border-zinc-100 pb-3 space-y-1">
                  <span className="font-semibold text-zinc-950 block">Single Verifiable Reach</span>
                  <p className="leading-relaxed">
                    All connected data sources calculate into one verified 1.48M audience footprint, authentic and updated without manual claims.
                  </p>
                </div>
                <div className="border-b border-zinc-100 pb-3 space-y-1">
                  <span className="font-semibold text-zinc-950 block">Living Media Kit</span>
                  <p className="leading-relaxed">
                    Your public press kit shows real performance telemetry, rate tiers, and content focus in an elegant editorial layout.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-950 block">Structured Deal Desk</span>
                  <p className="leading-relaxed">
                    Brands send formal proposals with deliverables, timelines, and budgets directly inside Infurizz. Zero DM clutter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. SOLUTION SECTION                                */}
      {/* ================================================== */}
      <section id="solution" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="border-t border-zinc-200 pt-16 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#E90000]">
              The Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              Everything your creator business needs, in one place.
            </h2>
            <p className="text-sm sm:text-base text-zinc-600">
              Three parts of one continuous product journey designed to turn multi-platform reach into verified brand partnerships.
            </p>
          </div>

          {/* Three Connected Product Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* UNIFY */}
            <div className="p-6 bg-white border border-zinc-200 rounded-xl space-y-3 hover:border-zinc-300 transition-colors">
              <div className="text-xs font-mono font-bold text-[#E90000]">01 / UNIFY</div>
              <h3 className="text-lg font-bold text-zinc-950">Unified Creator Profile</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Connect supported platform data into one creator profile. Replace fragmented numbers with a unified reach metric.
              </p>
            </div>

            {/* DISCOVER */}
            <div className="p-6 bg-white border border-zinc-200 rounded-xl space-y-3 hover:border-zinc-300 transition-colors">
              <div className="text-xs font-mono font-bold text-zinc-900">02 / DISCOVER</div>
              <h3 className="text-lg font-bold text-zinc-950">Marketplace Discovery</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Help brands find creators based on audience, niche and performance. Curated directories replace guesswork with verified data.
              </p>
            </div>

            {/* COLLABORATE */}
            <div className="p-6 bg-white border border-zinc-200 rounded-xl space-y-3 hover:border-zinc-300 transition-colors">
              <div className="text-xs font-mono font-bold text-zinc-900">03 / COLLABORATE</div>
              <h3 className="text-lg font-bold text-zinc-950">Direct Partnerships</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Manage proposals, conversations and partnerships inside Infurizz. Keep deliverables, budgets, and messages in one clean workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 5. HOW INFURIZZ WORKS                              */}
      {/* ================================================== */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="border-t border-zinc-200 pt-16 space-y-12">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
              Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              How Infurizz Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              A straightforward progression from connecting channels to executing brand partnerships.
            </p>
          </div>

          {/* Clean 5-Step Progression */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 border-t border-zinc-100 pt-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-zinc-900">01</div>
              <h4 className="text-sm font-bold text-zinc-950">Connect your platforms</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Link supported social channels as read-only audience data sources.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-zinc-900">02</div>
              <h4 className="text-sm font-bold text-zinc-950">Build your unified profile</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Infurizz computes your total reach, growth rates, and category focus.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-zinc-900">03</div>
              <h4 className="text-sm font-bold text-zinc-950">Get discovered by brands</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Your profile is listed in the creator marketplace for targeted brand discovery.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-[#E90000]">04</div>
              <h4 className="text-sm font-bold text-zinc-950">Receive collaboration proposals</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Brands dispatch formal proposals with deliverables, timelines, and budgets.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-zinc-900">05</div>
              <h4 className="text-sm font-bold text-zinc-950">Work together through Infurizz</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Negotiate terms, exchange messages, and finalize deals without DM chaos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 6. CREATOR SECTION: REALISTIC PROFILE PREVIEW      */}
      {/* ================================================== */}
      <section id="creators" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="border-t border-zinc-200 pt-16 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#E90000]">
                For Creators
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
                Your entire creator presence.
                <br />
                One profile.
              </h2>
              <p className="text-sm text-zinc-600">
                Turn scattered follower numbers into one professional, verified identity that brands take seriously.
              </p>
            </div>
            <Link href="/creator/dashboard">
              <Button variant="primary" size="md" className="gap-2 cursor-pointer shrink-0">
                <span>Enter Creator Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Realistic Creator Profile Preview */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
            {/* Header: Avatar, Name, Category */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
                    alt="Kai Zhang"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-zinc-950">Kai Zhang</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="h-3 w-3 text-[#E90000]" />
                      Verified Creator
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">Design & Creative Tech · San Francisco, CA</p>
                  <p className="text-xs text-zinc-600 pt-1 max-w-lg">
                    Product designer & developer sharing interface craft, workspace setups, and software tutorials.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/creator/profile">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <span>View Public Press Kit</span>
                    <ExternalLink className="h-3 w-3 text-zinc-400" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Core Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="p-4 bg-[#FAFAF9] border border-zinc-200 rounded-xl">
                <span className="text-xs text-zinc-500">Total Audience</span>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-950 font-mono mt-1">1.48M</div>
                <span className="text-[11px] text-zinc-500">Across 6 platforms</span>
              </div>
              <div className="p-4 bg-[#FAFAF9] border border-zinc-200 rounded-xl">
                <span className="text-xs text-zinc-500">Audience Growth</span>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-950 font-mono mt-1">+14.2%</div>
                <span className="text-[11px] text-zinc-500">Last 30 days</span>
              </div>
              <div className="p-4 bg-[#FAFAF9] border border-zinc-200 rounded-xl">
                <span className="text-xs text-zinc-500">Avg Engagement</span>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-950 font-mono mt-1">4.8%</div>
                <span className="text-[11px] text-zinc-500">Verified telemetry</span>
              </div>
              <div className="p-4 bg-[#FAFAF9] border border-zinc-200 rounded-xl">
                <span className="text-xs text-zinc-500">Standard Rate</span>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-950 font-mono mt-1">$3,500</div>
                <span className="text-[11px] text-zinc-500">Per integration</span>
              </div>
            </div>

            {/* Platform Distribution Bar & Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-semibold text-zinc-900">Platform Distribution</span>
                <span>6 connected data sources</span>
              </div>

              {/* Proportional distribution bar */}
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-200">
                <div style={{ width: "40.5%" }} className="bg-zinc-900" title="Instagram (40.5%)" />
                <div style={{ width: "27.7%" }} className="bg-zinc-700" title="YouTube (27.7%)" />
                <div style={{ width: "18.9%" }} className="bg-zinc-500" title="X (18.9%)" />
                <div style={{ width: "7.4%" }} className="bg-zinc-400" title="Facebook (7.4%)" />
                <div style={{ width: "3.4%" }} className="bg-zinc-300" title="LinkedIn (3.4%)" />
                <div style={{ width: "2.1%" }} className="bg-[#E90000]" title="WhatsApp (2.1%)" />
              </div>

              {/* Platform Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
                {platformSources.map((p) => (
                  <div key={p.platform} className="p-2.5 bg-[#FAFAF9] border border-zinc-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <PlatformIcon platform={p.platform} className="h-3.5 w-3.5 text-zinc-700" />
                      <span className="font-mono font-bold text-zinc-950">{p.count}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{p.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 7. BRAND SECTION: CREATOR DISCOVERY MARKETPLACE    */}
      {/* ================================================== */}
      <section id="brands" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="border-t border-zinc-200 pt-16 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-semibold tracking-wider uppercase text-zinc-900">
                For Brands
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
                The right creator is easier to find.
              </h2>
              <p className="text-sm text-zinc-600">
                Filter creators by authenticated cross-platform reach, verified engagement, and authentic niche.
              </p>
            </div>
            <Link href="/brand/discover">
              <Button variant="secondary" size="md" className="gap-2 cursor-pointer bg-white shrink-0">
                <Search className="h-3.5 w-3.5" />
                <span>Search All Creators</span>
              </Button>
            </Link>
          </div>

          {/* Clean Creator Discovery Marketplace Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCreators.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 hover:border-zinc-300 transition-colors shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-950 flex items-center gap-1">
                          <span>{c.name}</span>
                          <ShieldCheck className="h-3 w-3 text-[#E90000]" />
                        </div>
                        <span className="text-xs text-zinc-500">{c.niche}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#FAFAF9] rounded-lg border border-zinc-200 text-center">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">Audience</div>
                      <div className="font-bold text-xs text-zinc-950 font-mono mt-0.5">{c.totalReach}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">Eng.</div>
                      <div className="font-bold text-xs text-zinc-950 font-mono mt-0.5">{c.engagement}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase">Growth</div>
                      <div className="font-bold text-xs text-zinc-950 font-mono mt-0.5">{c.growth}</div>
                    </div>
                  </div>

                  {/* Connected Platforms */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-zinc-400 font-medium mr-1">Channels:</span>
                    {c.platforms.map((p) => (
                      <div key={p} className="p-1 rounded-sm bg-zinc-100 text-zinc-600">
                        <PlatformIcon platform={p} className="h-3 w-3" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions: View Profile & Propose Collaboration */}
                <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                  <Link href={`/brand/creators/${c.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs py-1.5">
                      View Profile
                    </Button>
                  </Link>
                  <Link href={`/brand/creators/${c.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full text-xs py-1.5">
                      Propose
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 8. COLLABORATION SECTION                           */}
      {/* ================================================== */}
      <section id="collaboration" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="border-t border-zinc-200 pt-16 space-y-10">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#E90000]">
              Partnership Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              From discovery to collaboration.
            </h2>
            <p className="text-sm text-zinc-600">
              A structured lifecycle that turns casual sponsor inquiries into committed partnerships.
            </p>
          </div>

          {/* Step Progression Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Step 1</span>
              <div className="font-bold text-xs text-zinc-950">Brand discovers creator</div>
              <p className="text-[11px] text-zinc-500">Searches by reach, niche, and verified stats.</p>
            </div>

            <div className="hidden md:flex justify-center text-zinc-300">
              <ArrowRight className="h-4 w-4" />
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Step 2</span>
              <div className="font-bold text-xs text-zinc-950">Brand sends proposal</div>
              <p className="text-[11px] text-zinc-500">Clear deliverables, timelines, and budget offer.</p>
            </div>

            <div className="hidden md:flex justify-center text-zinc-300">
              <ArrowRight className="h-4 w-4" />
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Step 3</span>
              <div className="font-bold text-xs text-zinc-950">Creator accepts</div>
              <p className="text-[11px] text-zinc-500">Reviews scope and accepts in 1 click.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#E90000] uppercase">Step 4</span>
              <div className="font-bold text-xs text-zinc-950">Conversation starts</div>
              <p className="text-[11px] text-zinc-500">Direct structured deal thread activates inside Infurizz with messaging.</p>
            </div>

            <div className="p-4 bg-white border-2 border-zinc-950 rounded-xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-950 uppercase">Step 5</span>
              <div className="font-bold text-xs text-zinc-950">Partnership executed</div>
              <p className="text-[11px] text-zinc-500">Deliverables tracked, terms met, and long-term brand relationships built.</p>
            </div>
          </div>

          {/* Real UI Preview of Collaboration Proposal */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                  Active Collaboration Proposal
                </span>
                <h4 className="text-sm font-bold text-zinc-950 mt-0.5">
                  SoundWave Audio · Q3 Studio Hardware Review
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full self-start">
                <Check className="h-3 w-3 text-[#E90000]" />
                Proposal Accepted
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-zinc-500">Brand</span>
                <div className="font-semibold text-zinc-900 mt-0.5">SoundWave Audio</div>
              </div>
              <div>
                <span className="text-zinc-500">Creator</span>
                <div className="font-semibold text-zinc-900 mt-0.5">Kai Zhang</div>
              </div>
              <div>
                <span className="text-zinc-500">Agreed Budget</span>
                <div className="font-bold text-zinc-950 font-mono mt-0.5">$4,500</div>
              </div>
              <div>
                <span className="text-zinc-500">Deliverables</span>
                <div className="font-semibold text-zinc-900 mt-0.5">1x YouTube + 1x Reel</div>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAFAF9] border border-zinc-200 rounded-lg text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-700 truncate">
                  <strong>Kai Zhang:</strong> &ldquo;Proposal accepted! Draft video script will be shared by Friday.&rdquo;
                </span>
              </div>
              <Link href="/creator/messages" className="shrink-0 text-[#E90000] font-medium hover:underline text-xs">
                Open Deal Thread →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 9. PRIVACY / DATA CLARITY                         */}
      {/* ================================================== */}
      <section id="privacy" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E90000]">
                Data & Privacy Standard
              </span>
              <h3 className="text-lg font-bold text-zinc-950">
                Zero DM Access · Read-Only Follower Telemetry
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed pt-1">
                Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
              </p>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-md">
                <ShieldCheck className="h-4 w-4 text-[#E90000]" />
                Privacy Verified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 10. FINAL CTA SECTION                              */}
      {/* ================================================== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-16 space-y-6 shadow-xs">
          <div className="flex justify-center">
            <Logo size="md" priority />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              Your audience is already everywhere.
              <br />
              <span className="text-[#E90000]">Bring it together with Infurizz.</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Create your unified creator identity or discover vetted creators with verified cross-platform reach.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/signup">
              <Button
                variant="primary"
                size="lg"
                className="text-sm px-8 py-3.5 gap-2 cursor-pointer shadow-sm hover:shadow transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/brand/discover">
              <Button
                variant="outline"
                size="lg"
                className="text-sm px-8 py-3.5 cursor-pointer bg-white text-zinc-800 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
              >
                For Brands
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
