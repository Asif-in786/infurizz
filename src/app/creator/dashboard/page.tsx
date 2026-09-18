import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { AudienceAggregator } from "@/lib/analytics/aggregator";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AudienceGrowthChart } from "@/components/ui/AudienceGrowthChart";
import { PlatformIcon } from "@/components/common/PlatformIcon";
import {
  Share2,
  ArrowRight,
  MessageSquare,
  ExternalLink,
  Check,
  TrendingUp,
} from "lucide-react";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      creatorProfile: {
        include: {
          socialAccounts: { where: { isConnected: true }, orderBy: { followersCount: "desc" } },
          audienceSnapshots: { orderBy: { recordedAt: "asc" } },
          collaborations: {
            include: { brand: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role === Role.BRAND) {
    redirect("/brand/dashboard");
  }

  if (!user.creatorProfile) {
    redirect("/onboarding/creator");
  }

  const creator = user.creatorProfile;

  const aggregated = AudienceAggregator.calculate(creator.socialAccounts);
  const snapshots = creator.audienceSnapshots;
  const initialReach = snapshots.length > 0 ? snapshots[0].followersCount : aggregated.totalReach;
  const netGrowth = aggregated.totalReach - initialReach;
  const growthPercent = initialReach > 0 ? ((netGrowth / initialReach) * 100).toFixed(1) : "0.0";

  const chartData =
    snapshots.length > 0
      ? snapshots.map((snap) => ({
          label: snap.recordedAt.toLocaleDateString("en-US", { month: "short" }),
          value: snap.followersCount,
        }))
      : [
          { label: "M-1", value: Math.round(aggregated.totalReach * 0.85) },
          { label: "Today", value: aggregated.totalReach },
        ];

  const pendingCollabs = creator.collaborations.filter((c) => c.status === "PENDING");
  const activeCollabs = creator.collaborations.filter((c) => c.status === "IN_PROGRESS" || c.status === "ACCEPTED");
  const totalPipelineValue = creator.collaborations.reduce((sum, c) => sum + (c.budgetAmount || 0), 0);
  const distinctBrandsCount = new Set(creator.collaborations.map((c) => c.brandId)).size;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. CREATOR IDENTITY MASTHEAD */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-zinc-100 border border-zinc-200 p-0.5 shrink-0 overflow-hidden shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creator.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
              alt={creator.displayName}
              className="h-full w-full object-cover rounded-[10px]"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {creator.displayName}
              </h1>
              <Badge variant="outline" className="gap-1 text-zinc-700 border-zinc-200 bg-zinc-50 text-[11px] font-medium py-0.5">
                <Check className="h-3 w-3 text-[#E90000]" />
                Verified Creator
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 font-normal">
              @{creator.handle} · {creator.category} · {creator.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/creator/profile">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
              <span>Public Profile</span>
            </Button>
          </Link>
          <Link href="/creator/social-accounts">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs font-medium">
              <Share2 className="h-3.5 w-3.5" />
              <span>Manage Channels</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. UNIFIED AUDIENCE HERO ANCHOR */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-zinc-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span className="uppercase tracking-wider font-semibold text-[11px] text-zinc-400">Total Audience</span>
              <span className="text-zinc-300">·</span>
              <span>{creator.socialAccounts.length} Connected Data Sources</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 font-sans">
                {aggregated.totalReach >= 1000000
                  ? `${(aggregated.totalReach / 1_000_000).toFixed(2)}M`
                  : aggregated.totalReach.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-zinc-500 font-medium">
                Unified Followers & Subscribers
              </span>
            </div>
          </div>

          {/* Key Metric Pillars with Clear Hierarchy */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8">
            <div className="border-l border-zinc-200 pl-4 space-y-0.5">
              <span className="text-xs text-zinc-500 font-medium block">Avg. Engagement</span>
              <div className="text-xl font-bold text-zinc-900 font-sans">{aggregated.avgEngagementRate}%</div>
              <span className="text-[11px] text-zinc-400 block">Across active channels</span>
            </div>
            <div className="border-l border-zinc-200 pl-4 space-y-0.5">
              <span className="text-xs text-zinc-500 font-medium block">Deal Pipeline</span>
              <div className="text-xl font-bold text-zinc-900 font-sans">${totalPipelineValue.toLocaleString()}</div>
              <span className="text-[11px] text-zinc-400 block">Across {distinctBrandsCount} brand{distinctBrandsCount === 1 ? "" : "s"}</span>
            </div>
            <div className="border-l border-zinc-200 pl-4 space-y-0.5">
              <span className="text-xs text-zinc-500 font-medium block">Connected Channels</span>
              <div className="text-xl font-bold text-zinc-900 font-sans">{creator.socialAccounts.length} / 6</div>
              <span className="text-[11px] text-zinc-400 block">All syncing active</span>
            </div>
          </div>
        </div>

        {/* Platform Distribution Bar & Legend */}
        <div className="pt-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700">Platform Distribution</span>
            <span className="text-[11px] text-zinc-400">100% Consolidated</span>
          </div>

          <div className="h-2.5 w-full bg-zinc-100 rounded-full flex overflow-hidden">
            {aggregated.platformBreakdown.map((plat, idx) => {
              const colors = [
                "bg-[#E1306C]", // Instagram
                "bg-[#FF0000]", // YouTube
                "bg-[#000000]", // X / TikTok
                "bg-[#0A66C2]", // LinkedIn
                "bg-[#1877F2]", // Facebook
                "bg-[#25D366]", // WhatsApp
              ];
              return (
                <div
                  key={plat.platform}
                  style={{ width: `${plat.percentageOfTotal}%` }}
                  title={`${plat.platform.replace("_", " ")}: ${plat.percentageOfTotal}%`}
                  className={`${colors[idx % colors.length]} hover:opacity-90 transition-opacity`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs">
            {aggregated.platformBreakdown.map((plat) => (
              <span key={plat.platform} className="inline-flex items-center gap-1.5 text-zinc-700">
                <PlatformIcon platform={plat.platform} className="h-3.5 w-3.5 text-zinc-500" />
                <span>{plat.platform.replace("_", " ")}</span>
                <strong className="text-zinc-900 font-semibold">
                  {plat.followersCount >= 1000000
                    ? `${(plat.followersCount / 1000000).toFixed(1)}M`
                    : `${(plat.followersCount / 1000).toFixed(0)}K`}
                </strong>
                <span className="text-zinc-400 text-[11px]">({plat.percentageOfTotal}%)</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. AUDIENCE GROWTH & COLLABORATION REQUESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audience Growth Curve */}
        <div className="lg:col-span-8 rounded-xl border border-zinc-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Audience Growth
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Consolidated follower growth across all connected accounts
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-800 border border-zinc-200 bg-zinc-50 px-2.5 py-1 rounded-md font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-[#E90000]" />
              <span>{netGrowth >= 0 ? "+" : ""}{growthPercent}% Growth</span>
            </div>
          </div>
          <AudienceGrowthChart data={chartData} height={210} />
        </div>

        {/* Collaboration Requests Desk */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-200 bg-white p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  Brand Proposals
                </h2>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {pendingCollabs.length} pending · {activeCollabs.length} active
                </div>
              </div>
              <Link href="/creator/collaborations" className="text-xs text-[#E90000] hover:underline font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {creator.collaborations.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No collaboration requests yet. Proposals from brands will appear here.
                </div>
              ) : (
                creator.collaborations.slice(0, 2).map((collab) => (
                  <div
                    key={collab.id}
                    className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60 space-y-2 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900">{collab.brand.companyName}</span>
                      <Badge variant={collab.status === "PENDING" ? "warning" : "default"} className="text-[10px] font-medium">
                        {collab.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-600 line-clamp-1">{collab.title}</p>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-zinc-900 font-bold">${collab.budgetAmount?.toLocaleString()}</span>
                      <Link href="/creator/collaborations" className="text-zinc-600 hover:text-zinc-900 flex items-center gap-1 text-[11px] font-medium">
                        <span>Review Offer</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link href="/creator/messages" className="block pt-2">
            <Button variant="secondary" size="sm" className="w-full text-xs gap-2 font-medium">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
              <span>Open Deal Messages</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4. PERFORMANCE BY PLATFORM TABLE */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Performance by Platform
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Audience size, reach share, and engagement rates by connected channel
            </p>
          </div>
          <Link href="/creator/social-accounts">
            <Button variant="outline" size="sm" className="text-xs font-medium">
              Manage Connectors
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] text-zinc-500 font-medium">
              <tr>
                <th className="py-3 px-6">Platform</th>
                <th className="py-3 px-4">Handle</th>
                <th className="py-3 px-4 text-right">Audience</th>
                <th className="py-3 px-4 text-right">Share of Total</th>
                <th className="py-3 px-4 text-right">Engagement</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {aggregated.platformBreakdown.map((plat) => {
                const raw = creator.socialAccounts.find((a) => a.platform === plat.platform);
                return (
                  <tr key={plat.platform} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-zinc-900 flex items-center gap-2.5">
                      <PlatformIcon platform={plat.platform} className="h-4 w-4 text-zinc-500" />
                      <span>{plat.platform.replace("_", " ")}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">@{raw?.username}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-zinc-900 text-sm">
                      {plat.followersCount >= 1000000
                        ? `${(plat.followersCount / 1000000).toFixed(2)}M`
                        : `${(plat.followersCount / 1000).toFixed(0)}K`}
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-600 font-medium">
                      {plat.percentageOfTotal}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-900 font-bold">
                      {plat.engagementRate}%
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-700 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E90000]" />
                        Connected
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
