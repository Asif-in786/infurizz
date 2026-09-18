import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { AudienceAggregator } from "@/lib/analytics/aggregator";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PlatformIcon } from "@/components/common/PlatformIcon";
import {
  MapPin,
  Globe,
  Mail,
  Share2,
  Check,
} from "lucide-react";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";
import { EditProfileModal } from "@/components/creator/EditProfileModal";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. EDITORIAL PRESS KIT MASTHEAD */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-xl bg-zinc-100 border border-zinc-200 p-0.5 shrink-0 overflow-hidden shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creator.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                alt={creator.displayName}
                className="h-full w-full object-cover rounded-[10px]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                  {creator.displayName}
                </h1>
                <Badge variant="outline" className="gap-1 text-zinc-700 border-zinc-200 bg-zinc-50 text-xs py-0.5 font-medium">
                  <Check className="h-3 w-3 text-[#E90000]" />
                  Verified Audience
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">@{creator.handle} · {creator.category}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
                {creator.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {creator.location}
                  </span>
                )}
                {creator.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-zinc-400" />
                    <a href={creator.website || "#"} target="_blank" rel="noreferrer" className="hover:text-zinc-900 underline">
                      {creator.website}
                    </a>
                  </span>
                )}
                {creator.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    {creator.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <EditProfileModal
              creatorId={creator.id}
              initialData={{
                displayName: creator.displayName,
                bio: creator.bio,
                category: creator.category,
                location: creator.location,
                ratesSummary: creator.ratesSummary,
                website: creator.website,
                contactEmail: creator.contactEmail,
              }}
            />
            <Link href="/creator/social-accounts">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium cursor-pointer">
                <Share2 className="h-3.5 w-3.5 text-zinc-500" />
                <span>Manage Channels</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Creator Bio */}
        {creator.bio && (
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">
            {creator.bio}
          </p>
        )}

        {/* High-Impact Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-100 pt-6">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">
              Total Audience
            </span>
            <div className="text-2xl font-bold text-zinc-900 mt-1 font-sans">
              {aggregated.totalReach >= 1000000
                ? `${(aggregated.totalReach / 1_000_000).toFixed(2)}M`
                : `${(aggregated.totalReach / 1000).toFixed(0)}K`}
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">{creator.socialAccounts.length} Connected Platforms</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">
              Avg. Engagement
            </span>
            <div className="text-2xl font-bold text-zinc-900 mt-1 font-sans">
              {aggregated.avgEngagementRate}%
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">Across all networks</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">
              Connected Platforms
            </span>
            <div className="text-2xl font-bold text-zinc-900 mt-1 font-sans">
              {creator.socialAccounts.length}
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">Verified Channels</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">
              Typical Rates
            </span>
            <div className="text-base font-bold text-zinc-900 mt-1 font-sans">
              {creator.ratesSummary || "$2,500 - $8,000"}
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">Standard deliverable</span>
          </div>
        </div>
      </div>

      {/* 2. VERIFIED SOCIAL FOOTPRINT LEDGER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Connected Platforms ({creator.socialAccounts.length})
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            Connected Data Sources
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creator.socialAccounts.map((acc) => (
            <div key={acc.id} className="p-5 bg-white border border-zinc-200 rounded-xl space-y-3 shadow-xs hover:border-zinc-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={acc.platform} className="h-4 w-4 text-zinc-700" />
                  <span className="font-semibold text-zinc-900 text-xs">
                    {acc.platform.replace("_", " ")}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] text-zinc-700 border-zinc-200 bg-zinc-50 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E90000] mr-1 inline-block" />
                  Verified
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold text-zinc-900 font-sans">
                  {acc.followersCount >= 1000000
                    ? `${(acc.followersCount / 1000000).toFixed(2)}M`
                    : `${(acc.followersCount / 1000).toFixed(0)}K`}
                </div>
                <p className="text-xs text-zinc-500 font-mono">@{acc.username}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-100">
                <span>Engagement:</span>
                <span className="font-bold text-zinc-900">{acc.engagementRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PARTNERSHIP PACKAGES */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Sponsorship Packages
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Available collaboration formats and standard delivery estimates.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            Escrow Protected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-900 font-semibold text-sm">Dedicated Deep-Dive</span>
              <span className="text-zinc-900 font-bold text-base">$4,500</span>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed">
              1x Longform YouTube breakdown (12-15m) + 1x LinkedIn executive review article + cross-promo to 120K X audience.
            </p>
            <div className="pt-2.5 border-t border-zinc-200/80 text-xs text-zinc-400">
              Turnaround: 10 business days
            </div>
          </div>

          <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-900 font-semibold text-sm">Multi-Channel Blast</span>
              <span className="text-zinc-900 font-bold text-base">$7,500</span>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed">
              1x YouTube video integration + 2x Instagram Reels (600K) + 1x WhatsApp Broadcast (400K) with tracking links.
            </p>
            <div className="pt-2.5 border-t border-zinc-200/80 text-xs text-zinc-400">
              Turnaround: 14 business days
            </div>
          </div>

          <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-900 font-semibold text-sm">Social Sprint</span>
              <span className="text-zinc-900 font-bold text-base">$2,800</span>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed">
              1x Instagram Story Sequence (3 frames with swipe) + 1x X Thread (5 tweets) highlighting product launch.
            </p>
            <div className="pt-2.5 border-t border-zinc-200/80 text-xs text-zinc-400">
              Turnaround: 5 business days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
