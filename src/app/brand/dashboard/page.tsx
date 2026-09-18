import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import {
  Users,
  Search,
  Briefcase,
  Megaphone,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BrandDashboardPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      brandProfile: {
        include: {
          campaigns: { orderBy: { createdAt: "desc" } },
          collaborations: {
            include: {
              creator: true,
              conversations: { take: 1 },
            },
            orderBy: { createdAt: "desc" },
          },
          conversations: {
            include: {
              creator: true,
              messages: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role === Role.CREATOR) {
    redirect("/creator/dashboard");
  }

  if (!user.brandProfile) {
    redirect("/onboarding/brand");
  }

  const brand = user.brandProfile;

  // Calculate total reach of collaborated creators
  const totalPartnerReach = brand.collaborations.reduce(
    (sum, c) => sum + (c.creator.totalReach || 0),
    0
  );
  const totalPartnerReachFormatted =
    totalPartnerReach >= 1_000_000
      ? `${(totalPartnerReach / 1_000_000).toFixed(2)}M`
      : totalPartnerReach >= 1000
      ? `${Math.round(totalPartnerReach / 1000)}K`
      : totalPartnerReach.toLocaleString();

  const activeCollabs = brand.collaborations.filter(
    (c) => c.status === "IN_PROGRESS" || c.status === "ACCEPTED"
  );
  const totalCommittedBudget = brand.collaborations.reduce(
    (sum, c) => sum + (c.budgetAmount || 0),
    0
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-zinc-100 border border-zinc-200 p-0.5 shrink-0 overflow-hidden shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.logoUrl || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200"}
              alt={brand.companyName}
              className="h-full w-full object-cover rounded-[10px]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{brand.companyName}</h1>
              <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700 gap-1 py-0.5 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-[#E90000]" />
                Verified Brand
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {brand.industry} · {brand.location} · {brand.budgetRange}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/brand/discover">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs font-medium cursor-pointer">
              <Search className="h-3.5 w-3.5" />
              <span>Discover Creators</span>
            </Button>
          </Link>
          <Link href="/brand/campaigns">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer font-medium">
              <Megaphone className="h-3.5 w-3.5 text-zinc-500" />
              <span>New Campaign</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Partner Creator Reach"
          value={totalPartnerReachFormatted}
          subtext="Total unified audience across active partners"
          trend={activeCollabs.length > 0 ? { value: `${activeCollabs.length} Active Deals`, isPositive: true } : undefined}
          icon={<Users className="h-5 w-5 text-zinc-600" />}
        />
        <StatCard
          label="Active Campaigns"
          value={brand.campaigns.length}
          subtext={brand.campaigns.length > 0 ? brand.campaigns[0].title : "Active Marketing Initiatives"}
          icon={<Megaphone className="h-5 w-5 text-zinc-600" />}
        />
        <StatCard
          label="Active Collaborations"
          value={activeCollabs.length}
          subtext={`${brand.collaborations.length} total dispatched offers`}
          icon={<Briefcase className="h-5 w-5 text-zinc-600" />}
        />
        <StatCard
          label="Budget Committed"
          value={`$${totalCommittedBudget.toLocaleString()}`}
          subtext="Direct in-platform milestone allocations"
          icon={<TrendingUp className="h-5 w-5 text-zinc-600" />}
        />
      </div>

      {/* Discovery Prompt & Active Collaborations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Collaborations Table */}
        <Card className="lg:col-span-2 border-zinc-200 bg-white rounded-xl shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900">Current Collaborations</CardTitle>
                <CardDescription className="text-xs text-zinc-500 mt-0.5">Deliverables and review status with sponsored creators</CardDescription>
              </div>
              <Link href="/brand/collaborations" className="text-xs text-[#E90000] hover:underline font-medium">
                View All ({brand.collaborations.length})
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {brand.collaborations.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No active collaborations yet. Find creators in the directory to propose partnerships.
              </div>
            ) : (
              brand.collaborations.map((collab) => (
                <div
                  key={collab.id}
                  className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center font-bold text-zinc-800 text-xs shadow-xs">
                      {collab.creator.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-xs">{collab.creator.displayName}</span>
                        <span className="text-xs text-zinc-500">@{collab.creator.handle}</span>
                        <span className="text-xs text-zinc-700 font-medium">
                          {collab.creator.totalReach >= 1000000 ? `${(collab.creator.totalReach / 1000000).toFixed(2)}M` : `${(collab.creator.totalReach / 1000).toFixed(0)}K`} Reach
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{collab.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-200 pt-2 sm:pt-0">
                    <span className="text-xs font-bold text-zinc-900 font-sans">
                      ${collab.budgetAmount?.toLocaleString()} USD
                    </span>
                    <Badge variant="outline" className="text-xs border-zinc-200 text-zinc-700 bg-white font-medium">
                      {collab.status.replace("_", " ")}
                    </Badge>
                    <Link href={collab.conversations?.[0]?.id ? `/brand/messages?conversationId=${collab.conversations[0].id}` : "/brand/messages"}>
                      <Button variant="ghost" size="sm" className="p-1.5 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer" title="Open Deal Desk Thread">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Discovery Action Card */}
        <Card className="border-zinc-200 bg-white rounded-xl shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700 text-xs font-medium">
              Creator Marketplace
            </Badge>
            <h3 className="text-lg font-bold text-zinc-900">Find Creators</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Explore multi-platform creators across Tech, Gaming, Fashion, and Finance. Filter by verified reach and engagement rates.
            </p>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-zinc-100">
            <Link href="/brand/discover" className="block">
              <Button variant="primary" size="md" className="w-full gap-2 text-xs font-medium cursor-pointer py-2.5">
                <Search className="h-3.5 w-3.5" />
                <span>Discover Creators</span>
              </Button>
            </Link>
            <Link href="/brand/messages" className="block">
              <Button variant="secondary" size="md" className="w-full gap-2 text-xs font-medium cursor-pointer py-2.5">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                <span>Deal Messages</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
