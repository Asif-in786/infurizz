import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageIntro, Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { connectPlatform, disconnectPlatform } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Creator Analytics · Multi-Platform Intelligence",
  description: "Cross-platform performance analytics across Instagram, YouTube, X, LinkedIn, Facebook, and WhatsApp.",
};

const ALL_PLATFORMS = [
  { id: "Instagram", name: "Instagram", primaryMetric: "Followers", secondaryMetric: "Reach & ER" },
  { id: "YouTube", name: "YouTube", primaryMetric: "Subscribers", secondaryMetric: "Watch Time & Views" },
  { id: "LinkedIn", name: "LinkedIn", primaryMetric: "Followers", secondaryMetric: "Post Impressions" },
  { id: "X", name: "X (Twitter)", primaryMetric: "Followers", secondaryMetric: "Impressions & Engagement" },
  { id: "Facebook", name: "Facebook", primaryMetric: "Page Followers", secondaryMetric: "Reach & Shares" },
  { id: "WhatsApp", name: "WhatsApp", primaryMetric: "Channel Followers", secondaryMetric: "Updates Reach" },
] as const;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "BRAND") {
    redirect("/campaigns");
  }

  if (!user.creator) {
    redirect("/onboarding/role");
  }

  const params = await searchParams;
  const currentTab = params.tab || "overview";

  // Query creator's connected accounts and metric snapshots
  const [socialAccounts, socialProfiles] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { creatorId: user.creator.id },
      include: {
        snapshots: {
          orderBy: { snapshotDate: "desc" },
          take: 10,
        },
        contentItems: {
          orderBy: { publishedAt: "desc" },
          take: 8,
        },
      },
    }),
    prisma.socialProfile.findMany({
      where: { creatorId: user.creator.id },
    }),
  ]);

  // Map connected accounts by platform
  const accountByPlatform = new Map(socialAccounts.map((a) => [a.platform, a]));
  const profileByPlatform = new Map(socialProfiles.map((p) => [p.platform, p]));

  // Calculate real aggregates strictly across connected accounts
  let totalAudienceCount = BigInt(0);
  let totalReachCount = BigInt(0);
  let connectedPlatformsCount = 0;
  let engagementRates: number[] = [];

  const platformStats: Record<
    string,
    {
      isConnected: boolean;
      handle: string | null;
      followers: bigint | null;
      reach: bigint | null;
      engagementRate: string | null;
      lastSyncedAt: Date | null;
      content: typeof socialAccounts[0]["contentItems"];
    }
  > = {};

  for (const plat of ALL_PLATFORMS) {
    const acc = accountByPlatform.get(plat.id);
    const prof = profileByPlatform.get(plat.id);
    const isConnected = acc?.connectionStatus === "CONNECTED" || prof?.connectionStatus === "CONNECTED";

    if (isConnected) connectedPlatformsCount++;

    const followerSnap = acc?.snapshots.find((s) => s.canonicalMetricName === "AUDIENCE_FOLLOWER_COUNT");
    const reachSnap = acc?.snapshots.find((s) => s.canonicalMetricName === "CONTENT_LIFETIME_VIEWS");
    const erSnap = acc?.snapshots.find((s) => s.canonicalMetricName === "ENGAGEMENT_RATE_30D");

    const followers = followerSnap?.valueInt ?? null;
    const reach = reachSnap?.valueInt ?? null;
    const engagementRate = erSnap?.valueDecimal ? `${erSnap.valueDecimal.toString()}%` : null;

    if (followers) totalAudienceCount += followers;
    if (reach) totalReachCount += reach;
    if (erSnap?.valueDecimal) engagementRates.push(Number(erSnap.valueDecimal));

    platformStats[plat.id] = {
      isConnected,
      handle: acc?.handle || prof?.handle || null,
      followers,
      reach,
      engagementRate,
      lastSyncedAt: acc?.lastSyncedAt || null,
      content: acc?.contentItems || [],
    };
  }

  const avgEngagementRate =
    engagementRates.length > 0
      ? `${(engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length).toFixed(1)}%`
      : connectedPlatformsCount > 0
      ? "Calculating"
      : "Not connected";

  const totalContentSynced = socialAccounts.reduce((sum, a) => sum + a.contentItems.length, 0);

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Layer 03 · Creator Analytics"
          title="Social Intelligence"
          lede="Unified performance metrics across your social platforms. Data is pulled from authorized accounts or explicitly declared handles without simulated numbers."
        />

        <Link
          href="#connections"
          className="inline-flex min-h-11 items-center border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink"
        >
          Manage Platform Connections ↓
        </Link>
      </div>

      {/* 1. Overall Summary Metric Blocks */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-interactive animate-fade-up border border-line bg-card p-5">
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Total Audience</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">
            {connectedPlatformsCount > 0 ? Number(totalAudienceCount).toLocaleString() : "Not connected"}
          </p>
          <span className="mt-1 block text-xs text-muted">
            {connectedPlatformsCount} connected platform{connectedPlatformsCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="card-interactive animate-fade-up border border-line bg-card p-5" style={{ animationDelay: "60ms" }}>
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Total Reach &amp; Views</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">
            {totalReachCount > BigInt(0) ? Number(totalReachCount).toLocaleString() : connectedPlatformsCount > 0 ? "0 synced" : "Not connected"}
          </p>
          <span className="mt-1 block text-xs text-muted">Lifetime video &amp; post views</span>
        </div>

        <div className="card-interactive animate-fade-up border border-line bg-card p-5" style={{ animationDelay: "120ms" }}>
          <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Avg Engagement Rate</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">{avgEngagementRate}</p>
          <span className="mt-1 block text-xs text-muted">Across connected platforms</span>
        </div>

        <div className="card-interactive animate-fade-up border border-line bg-card p-5" style={{ animationDelay: "180ms" }}>
          <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">Content Tracked</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">{totalContentSynced}</p>
          <span className="mt-1 block text-xs text-muted">Synced posts &amp; videos</span>
        </div>
      </div>

      {/* Transparency & Provenance Alert */}
      <div className="mt-6 flex items-center justify-between border border-line bg-paper p-4 text-xs">
        <p className="text-muted">
          <strong className="text-ink">Provenance Standard: </strong>
          INFURIZZ reports audited numbers directly from authorized provider connections. Unconnected platforms display &ldquo;Not connected&rdquo;.
        </p>
        <span className="border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-emerald-800">
          ✓ Verified Architecture
        </span>
      </div>

      {/* 2. Platform Navigation Tabs */}
      <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs">
        <Link
          href="/analytics?tab=overview"
          className={`px-3 py-1.5 transition-colors ${
            currentTab === "overview"
              ? "bg-ink text-paper font-medium"
              : "border border-line bg-card text-muted hover:text-ink"
          }`}
        >
          Overview (All Platforms)
        </Link>

        {ALL_PLATFORMS.map((plat) => {
          const stats = platformStats[plat.id];
          return (
            <Link
              key={plat.id}
              href={`/analytics?tab=${plat.id.toLowerCase()}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                currentTab === plat.id.toLowerCase()
                  ? "bg-ink text-paper font-medium"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              <span>{plat.name}</span>
              {stats.isConnected ? (
                <span className="text-[10px] text-emerald-700 font-bold">✓</span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {currentTab === "overview" ? (
        <div className="mt-8 space-y-10">
          {/* Infographic Audience Distribution */}
          <section className="border border-line bg-card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-line pb-4">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Infographic Distribution</span>
                <h3 className="mt-1 font-serif text-2xl text-ink">Platform Audience Breakdown</h3>
              </div>
              <p className="text-xs text-muted">Proportional audience share across connected profiles</p>
            </div>

            {connectedPlatformsCount === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No social platforms connected yet. Connect your Instagram, YouTube, or LinkedIn below to generate distribution graphics.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {ALL_PLATFORMS.filter((p) => platformStats[p.id].isConnected).map((p) => {
                  const stat = platformStats[p.id];
                  const count = stat.followers ? Number(stat.followers) : 0;
                  const total = Number(totalAudienceCount) || 1;
                  const percentage = total > 0 && count > 0 ? Math.round((count / total) * 100) : 0;

                  return (
                    <div key={p.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-ink">{p.name} ({stat.handle || "Connected"})</span>
                        <span className="font-mono text-muted">{count.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="h-3 w-full bg-paper border border-line">
                        <div
                          className="h-full bg-ink transition-all"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Platform Performance Cards Grid */}
          <section>
            <h3 className="font-serif text-2xl text-ink mb-4">Platform Intelligence Cards</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ALL_PLATFORMS.map((plat) => {
                const stat = platformStats[plat.id];
                return (
                  <article
                    key={plat.id}
                    className="flex flex-col justify-between border border-line bg-card p-6 transition-all hover:border-ink/50"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-2xl text-ink">{plat.name}</h4>
                        <span
                          className={`border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                            stat.isConnected
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                              : "border-line bg-paper text-muted"
                          }`}
                        >
                          {stat.isConnected ? "Connected ✓" : "Not connected"}
                        </span>
                      </div>

                      {stat.handle ? (
                        <p className="mt-1 font-mono text-xs text-oxblood">{stat.handle}</p>
                      ) : null}

                      <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">{plat.primaryMetric}:</span>
                          <strong className="text-ink">
                            {stat.followers ? Number(stat.followers).toLocaleString() : stat.isConnected ? "Synced" : "–"}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{plat.secondaryMetric}:</span>
                          <strong className="text-ink">
                            {stat.engagementRate || (stat.reach ? Number(stat.reach).toLocaleString() : stat.isConnected ? "Active" : "–")}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-line pt-3">
                      <Link
                        href={`/analytics?tab=${plat.id.toLowerCase()}`}
                        className="block text-center text-xs text-ink underline underline-offset-4 hover:text-oxblood"
                      >
                        View {plat.name} Analytics Breakdown →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {/* TAB CONTENT: Granular Platform Detail */}
      {currentTab !== "overview" ? (
        (() => {
          const selectedPlatform = ALL_PLATFORMS.find((p) => p.id.toLowerCase() === currentTab) || ALL_PLATFORMS[0];
          const stat = platformStats[selectedPlatform.id];

          return (
            <div className="mt-8 space-y-8">
              <div className="border border-line bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-oxblood uppercase">
                      Platform Detail
                    </span>
                    <h2 className="mt-1 font-serif text-3xl text-ink">{selectedPlatform.name} Performance</h2>
                    {stat.handle ? (
                      <p className="font-mono text-sm text-oxblood mt-1">{stat.handle}</p>
                    ) : (
                      <p className="text-xs text-muted mt-1">This platform is not currently connected to your profile.</p>
                    )}
                  </div>

                  <span
                    className={`border px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                      stat.isConnected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-line bg-paper text-muted"
                    }`}
                  >
                    {stat.isConnected ? "Connected & Synced ✓" : "Not connected"}
                  </span>
                </div>

                {stat.isConnected ? (
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted">
                        {selectedPlatform.id === "YouTube" ? "Subscribers" : "Followers"}
                      </span>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        {stat.followers ? Number(stat.followers).toLocaleString() : "Synced"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted">
                        {selectedPlatform.id === "YouTube" ? "Total Views" : "Impressions / Reach"}
                      </span>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        {stat.reach ? Number(stat.reach).toLocaleString() : "Synced"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted">Engagement Rate</span>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        {stat.engagementRate || "Calculated"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted">Recent Content</span>
                      <p className="mt-1 font-serif text-2xl text-ink">{stat.content.length} posts</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-line pt-6 text-sm text-muted">
                    <p>Connect your {selectedPlatform.name} account below to begin tracking verified reach, follower growth, and post performance.</p>
                  </div>
                )}
              </div>

              {/* Top Recent Content Items if connected */}
              {stat.content.length > 0 ? (
                <div className="border border-line bg-card p-6">
                  <h3 className="font-serif text-2xl text-ink mb-4">Recent Synced Content</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stat.content.map((item) => (
                      <div key={item.id} className="rounded border border-line bg-paper p-4 text-xs">
                        <span className="text-[10px] uppercase font-semibold text-oxblood">{item.contentType}</span>
                        <h4 className="font-medium text-ink mt-1 line-clamp-2">{item.title || "Untitled content"}</h4>
                        <div className="mt-3 space-y-1 border-t border-line pt-2 text-muted">
                          <div>Views: <strong className="text-ink">{item.viewCount ? Number(item.viewCount).toLocaleString() : "–"}</strong></div>
                          <div>Likes: <strong className="text-ink">{item.likeCount ? Number(item.likeCount).toLocaleString() : "–"}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })()
      ) : null}

      {/* 3. Connect Your Platforms Section */}
      <section id="connections" className="mt-16 border-t border-line pt-10">
        <div className="border border-line bg-card p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-line pb-4">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Identity &amp; Connections</span>
              <h2 className="mt-1 font-serif text-3xl text-ink">Connect Your Platforms</h2>
            </div>
            <p className="text-xs text-muted">Manage linked social accounts and authorization status</p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ALL_PLATFORMS.map((plat) => {
              const stat = platformStats[plat.id];
              return (
                <div key={plat.id} className="border border-line bg-paper p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-xl text-ink">{plat.name}</h4>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border ${
                        stat.isConnected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-line bg-card text-muted"
                      }`}
                    >
                      {stat.isConnected ? "Connected ✓" : "Not connected"}
                    </span>
                  </div>

                  {stat.isConnected ? (
                    <div className="mt-3 space-y-3">
                      <p className="font-mono text-xs text-oxblood">{stat.handle}</p>
                      <form action={disconnectPlatform}>
                        <input type="hidden" name="platform" value={plat.id} />
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!confirm(`Disconnect ${plat.name}?`)) e.preventDefault();
                          }}
                          className="text-xs text-muted hover:text-oxblood underline"
                        >
                          Disconnect Platform
                        </button>
                      </form>
                    </div>
                  ) : (
                    <form action={connectPlatform} className="mt-4 space-y-3">
                      <input type="hidden" name="platform" value={plat.id} />
                      <input
                        type="text"
                        name="handle"
                        required
                        placeholder={`@your_${plat.id.toLowerCase()}_handle`}
                        className="w-full border border-line bg-card px-2.5 py-1.5 text-xs text-ink outline-none focus:border-ink"
                      />
                      <button
                        type="submit"
                        className="w-full bg-ink py-1.5 text-xs uppercase tracking-wider text-paper hover:bg-oxblood"
                      >
                        Connect {plat.name} →
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}
