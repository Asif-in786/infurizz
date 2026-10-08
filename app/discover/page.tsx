import type { Metadata } from "next";
import Link from "next/link";
import { DiscoverDeck, type CampaignCard, type CreatorCard } from "@/components/discover-deck";
import { PageIntro, Shell } from "@/components/page-intro";
import { Monogram, SampleMark } from "@/components/profile-bits";
import { getCurrentUser } from "@/lib/current";
import { compatibility } from "@/lib/compatibility";
import { money, platformsFromJson } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, PLATFORMS, isCampaignPublished } from "@/lib/options";

export const metadata: Metadata = {
  title: "Discover Creators · Marketplace Directory",
  description:
    "Explore verified creator storefronts across Instagram, YouTube, X, LinkedIn, and Facebook. Filter by category, platform, location, and audience reach.",
  alternates: {
    canonical: "/discover",
  },
  openGraph: {
    title: "Discover Creators · Marketplace Directory | INFURIZZ",
    description:
      "Explore verified creator storefronts across Instagram, YouTube, X, LinkedIn, and Facebook. Filter by category, platform, location, and audience reach.",
    url: "https://infurizzv1.vercel.app/discover",
  },
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    platform?: string;
    maxPrice?: string;
    maxTurnaround?: string;
    location?: string;
    view?: string;
    authenticatedOnly?: string;
    verifiedOnly?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const category = params.category || "";
  const platform = params.platform || "";
  const location = params.location?.trim() || "";
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : null;
  const maxTurnaround = params.maxTurnaround ? Number(params.maxTurnaround) : null;
  const authenticatedOnly = params.authenticatedOnly === "true" || params.verifiedOnly === "true";
  const view = params.view === "deck" ? "deck" : "grid";

  const user = await getCurrentUser();

  // If Deck view is selected, render the Quick Match Deck experience
  if (view === "deck") {
    return (
      <Shell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <PageIntro
            eyebrow="Quick Match"
            title={user?.role === "BRAND" ? "Creators for your campaign." : "Campaigns for your profile."}
            lede="One record at a time. Skip hides it for you. Interest is stored. A match appears only when both sides have said yes to the same pairing."
          />
          <Link
            href="/discover?view=grid"
            className="inline-flex min-h-11 items-center border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink"
          >
            ← Switch to Directory Grid
          </Link>
        </div>

        <div className="mt-10">
          {!user ? (
            <SignedOut />
          ) : user.creator ? (
            <CreatorDeck userId={user.id} creator={user.creator} />
          ) : user.brand ? (
            <BrandDeck userId={user.id} brandId={user.brand.id} />
          ) : (
            <Incomplete />
          )}
        </div>
      </Shell>
    );
  }

  // Primary Marketplace Directory Grid View
  // 1. Fetch brand campaigns if viewer is a brand (for compatibility calculation)
  const brandCampaigns = user?.brand
    ? await prisma.campaign.findMany({
        where: { brandId: user.brand.id },
      })
    : [];
  const openBrandCampaigns = brandCampaigns.filter((c) => isCampaignPublished(c.status));

  // 2. Query creators with server-side filters
  const creatorsFromDb = await prisma.creator.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(location ? { location: { contains: location } } : {}),
      ...(authenticatedOnly
        ? {
            socialAccounts: {
              some: { connectionStatus: "CONNECTED" },
            },
          }
        : {}),
      ...(platform
        ? {
            OR: [
              { socials: { some: { platform } } },
              { socialAccounts: { some: { platform, connectionStatus: "CONNECTED" } } },
              { services: { some: { platform, isActive: true } } },
            ],
          }
        : {}),
    },
    include: {
      socials: true,
      socialAccounts: {
        where: { connectionStatus: "CONNECTED" },
        include: {
          snapshots: {
            where: { canonicalMetricName: "AUDIENCE_FOLLOWER_COUNT" },
            orderBy: { snapshotDate: "desc" },
            take: 1,
          },
        },
      },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      portfolio: true,
      user: {
        select: {
          posts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              postType: true,
              content: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // 3. In-memory filter for text search, max price, and max turnaround
  const filteredCreators = creatorsFromDb.filter((creator) => {
    if (q) {
      const matchText = `${creator.name} ${creator.username ?? ""} ${creator.bio} ${creator.niche} ${creator.category} ${creator.location}`.toLowerCase();
      if (!matchText.includes(q.toLowerCase())) return false;
    }

    const startingPrice =
      creator.services.length > 0 ? Math.min(...creator.services.map((s) => s.price)) : null;
    const fastestTurnaround =
      creator.services.length > 0 ? Math.min(...creator.services.map((s) => s.turnaroundDays)) : null;

    if (maxPrice !== null) {
      if (startingPrice === null || startingPrice > maxPrice) return false;
    }

    if (maxTurnaround !== null) {
      if (fastestTurnaround === null || fastestTurnaround > maxTurnaround) return false;
    }

    return true;
  });

  // 4. Rank creators (if brand viewer, calculate highest compatibility score)
  const rankedCreators = filteredCreators.map((creator) => {
    let topFit: { score: number; campaignName: string } | null = null;

    if (openBrandCampaigns.length > 0) {
      for (const campaign of openBrandCampaigns) {
        const fit = compatibility({
          creatorCategory: creator.category,
          creatorNiche: creator.niche,
          creatorLocation: creator.location,
          creatorAudience: creator.audienceRange,
          creatorPlatforms: creator.socials.map((s) => s.platform),
          campaignCategory: campaign.category,
          campaignNiche: campaign.creatorNiche,
          campaignLocation: campaign.location,
          campaignAudience: campaign.audienceRange,
          campaignPlatforms: platformsFromJson(campaign.platforms),
        });
        if (!topFit || fit.score > topFit.score) {
          topFit = { score: fit.score, campaignName: campaign.name };
        }
      }
    }

    const startingPrice =
      creator.services.length > 0 ? Math.min(...creator.services.map((s) => s.price)) : null;
    const fastestTurnaround =
      creator.services.length > 0 ? Math.min(...creator.services.map((s) => s.turnaroundDays)) : null;

    return {
      creator,
      topFit,
      startingPrice,
      fastestTurnaround,
    };
  });

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Marketplace Directory"
          title="Discover Creators"
          lede="Find creators across YouTube, Instagram, TikTok, and LinkedIn. Filter by category, provider-authenticated accounts, fixed package pricing, and turnaround time."
        />

        {/* View Toggle */}
        <div className="flex items-center gap-2 border border-line p-1 text-xs">
          <span className="bg-ink px-3 py-1.5 font-medium text-paper">
            Directory Grid
          </span>
          <Link
            href="/discover?view=deck"
            className="px-3 py-1.5 text-muted hover:text-ink"
          >
            Quick Match Deck ↗
          </Link>
        </div>
      </div>

      {/* Discovery Layer Navigation Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs">
        <span className="bg-ink px-3 py-1.5 font-medium text-paper">
          Discover Creators
        </span>
        <Link
          href="/brands"
          className="border border-line bg-card px-3 py-1.5 text-muted hover:text-ink transition-colors"
        >
          Discover Brands ↗
        </Link>
        <Link
          href="/campaigns"
          className="border border-line bg-card px-3 py-1.5 text-muted hover:text-ink transition-colors"
        >
          Discover Campaign Briefs ↗
        </Link>
        <Link
          href="/posts"
          className="border border-line bg-card px-3 py-1.5 text-muted hover:text-ink transition-colors"
        >
          Community Posts ↗
        </Link>
      </div>

      {/* Matchmaking Protocol Stepper */}
      <div className="mt-6 border border-line bg-card/60 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
            INFURIZZ Matchmaking Protocol
          </span>
          <span className="text-[11px] text-muted">
            Direct &amp; deterministic pairing · Mutual agreement unlocks conversation
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          <div className="border border-line/60 bg-paper p-2.5">
            <span className="font-mono text-[10px] text-oxblood font-semibold">01 · Discover</span>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">Explore storefronts &amp; briefs</p>
          </div>
          <div className="border border-line/60 bg-paper p-2.5">
            <span className="font-mono text-[10px] text-oxblood font-semibold">02 · View Details</span>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">Review packages &amp; fit score</p>
          </div>
          <div className="border border-line/60 bg-paper p-2.5">
            <span className="font-mono text-[10px] text-oxblood font-semibold">03 · Express Interest</span>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">Pitch or quick-match invite</p>
          </div>
          <div className="border border-line/60 bg-paper p-2.5">
            <span className="font-mono text-[10px] text-oxblood font-semibold">04 · Mutual Match</span>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">Two-way interest locks match</p>
          </div>
          <div className="col-span-2 sm:col-span-1 border border-line/60 bg-paper p-2.5">
            <span className="font-mono text-[10px] text-oxblood font-semibold">05 · Connect</span>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">Direct messaging &amp; orders</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form method="GET" className="mt-8 border border-line bg-card p-6" suppressHydrationWarning>
        <input type="hidden" name="view" value="grid" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Search</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search name, handle, bio, niche..."
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Category</label>
            <select
              name="category"
              defaultValue={category}
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Platform</label>
            <select
              name="platform"
              defaultValue={platform}
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">All Platforms</option>
              {PLATFORMS.map((plat) => (
                <option key={plat} value={plat}>
                  {plat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Max Budget</label>
            <select
              name="maxPrice"
              defaultValue={maxPrice ? String(maxPrice) : ""}
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">Any Price</option>
              <option value="500">Under $500</option>
              <option value="1000">Under $1,000</option>
              <option value="2000">Under $2,000</option>
              <option value="5000">Under $5,000</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Turnaround</label>
            <select
              name="maxTurnaround"
              defaultValue={maxTurnaround ? String(maxTurnaround) : ""}
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">Any Time</option>
              <option value="3">Within 3 days</option>
              <option value="7">Within 7 days</option>
              <option value="14">Within 14 days</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2.5">
              <input
                type="checkbox"
                name="authenticatedOnly"
                value="true"
                defaultChecked={authenticatedOnly}
                className="h-4 w-4 rounded border-line text-oxblood focus:ring-oxblood"
              />
              <span className="text-xs font-medium text-ink">Provider-Authenticated Only</span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <p className="text-xs text-muted">
            Found <strong className="text-ink">{rankedCreators.length}</strong> creator{rankedCreators.length === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            {(q || category || platform || maxPrice || maxTurnaround || location || authenticatedOnly) ? (
              <Link href="/discover?view=grid" className="border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">
                Clear Filters
              </Link>
            ) : null}
            <button
              type="submit"
              suppressHydrationWarning
              className="bg-ink px-4 py-1.5 text-xs tracking-wider text-paper uppercase hover:bg-oxblood"
            >
              Filter Directory
            </button>
          </div>
        </div>
      </form>

      {/* Creator Marketplace Directory Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rankedCreators.length === 0 ? (
          <div className="col-span-full animate-fade-in border border-line bg-card p-12 text-center text-sm text-muted">
            <p className="font-serif text-2xl text-ink">No Creators Match Your Filter Criteria</p>
            <p className="mt-2 text-xs text-muted">
              Try broadening your category, resetting price constraints, or clearing search keywords.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/discover?view=grid"
                className="btn-tactile inline-flex min-h-11 items-center justify-center border border-ink bg-paper px-5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
              >
                Reset All Filters
              </Link>
            </div>
          </div>
        ) : (
          rankedCreators.map(({ creator, topFit, startingPrice, fastestTurnaround }, idx) => {
            const platforms = Array.from(new Set(creator.socials.map((s) => s.platform)));
            const isProviderAuthenticated = creator.socialAccounts && creator.socialAccounts.length > 0;

            return (
              <article
                key={creator.id}
                style={{ animationDelay: `${Math.min(idx * 45, 600)}ms` }}
                className="group card-interactive animate-fade-up flex flex-col justify-between border border-line bg-card p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                        {creator.category}
                      </span>
                      {isProviderAuthenticated ? (
                        <span className="border border-oxblood/40 bg-oxblood/10 px-2 py-0.5 text-[10px] text-oxblood uppercase font-mono tracking-wider">
                          ✓ Connected
                        </span>
                      ) : null}
                    </div>
                    {startingPrice !== null ? (
                      <span className="font-serif text-lg font-medium text-ink">
                        From {money(startingPrice)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Custom pricing</span>
                    )}
                  </div>

                  <SampleMark show={creator.isDemo} />

                  <div className="mt-4 flex items-start gap-4">
                    <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
                      <Monogram name={creator.name} />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl tracking-tight text-ink">
                        <Link
                          href={`/creators/${creator.username || creator.id}`}
                          className="transition-colors hover:text-oxblood"
                        >
                          {creator.name}
                        </Link>
                      </h3>
                      {creator.username ? (
                        <p className="font-mono text-xs text-oxblood">@{creator.username}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted">{creator.location}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted line-clamp-2">
                    {creator.bio}
                  </p>

                  <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
                    <span className="font-medium text-ink">Niche: </span>
                    <span>{creator.niche}</span>
                  </div>

                  {creator.services.length > 0 ? (
                    <div className="mt-2 text-xs text-muted">
                      <span className="font-medium text-ink">{creator.services.length} package{creator.services.length === 1 ? "" : "s"}</span>
                      {fastestTurnaround ? ` · from ${fastestTurnaround}d turnaround` : ""}
                    </div>
                  ) : null}

                  {/* Platforms */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {platforms.map((p) => (
                      <span key={p} className="border border-line bg-paper px-2 py-0.5 text-[11px] text-muted">
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Latest Professional Milestone / Activity */}
                  {creator.user?.posts?.[0] ? (
                    <div className="mt-3 rounded border border-line/70 bg-paper/60 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-oxblood font-semibold">
                          ✨ Recent {creator.user.posts[0].postType.replace("_", " ").toLowerCase()}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {new Date(creator.user.posts[0].createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] text-ink leading-tight">
                        &ldquo;{creator.user.posts[0].content}&rdquo;
                      </p>
                    </div>
                  ) : null}

                  {/* Compatibility Badge if Brand has campaigns */}
                  {topFit ? (
                    <div className="mt-4 rounded border border-line bg-paper p-2.5 text-xs transition-colors group-hover:border-oxblood/30">
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Campaign Fit:</span>
                        <strong className="text-oxblood font-semibold">{topFit.score}% match</strong>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        with &ldquo;{topFit.campaignName}&rdquo;
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <Link
                    href={`/creators/${creator.username || creator.id}`}
                    className="btn-tactile group flex min-h-10 w-full items-center justify-center gap-1 border border-ink py-2 text-center text-xs tracking-wider uppercase transition-colors hover:bg-ink hover:text-paper"
                  >
                    <span>View Storefront & Packages</span>
                    <span className="icon-arrow-motion">↗</span>
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </Shell>
  );
}

function SignedOut() {
  return (
    <div className="max-w-xl border border-line bg-card px-6 py-8">
      <p>Quick Match discovery uses your profile. Join or log in to review the other side.</p>
      <div className="mt-5 flex gap-3">
        <Link className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-sm text-paper" href="/join">
          Join INFURIZZ
        </Link>
        <Link className="inline-flex min-h-12 items-center justify-center border border-ink/20 px-5 text-sm" href="/login">
          Log in
        </Link>
      </div>
    </div>
  );
}

function Incomplete() {
  return <p>This account has no creator or brand profile yet.</p>;
}

function toCreator(creator: {
  id: string;
  isDemo: boolean;
  name: string;
  bio: string;
  category: string;
  location: string;
  niche: string;
  audienceRange: string;
  collabPrefs: string;
  socials: { platform: string }[];
}): CreatorCard {
  return {
    id: creator.id,
    isDemo: creator.isDemo,
    name: creator.name,
    bio: creator.bio,
    category: creator.category,
    location: creator.location,
    niche: creator.niche,
    audienceRange: creator.audienceRange,
    collabPrefs: creator.collabPrefs,
    platforms: creator.socials.map((social) => social.platform),
  };
}

function toCampaign(campaign: {
  id: string;
  isDemo: boolean;
  name: string;
  category: string;
  creatorNiche: string;
  platforms: string;
  audienceRange: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  deliverables: string;
  status: string;
  brand: { name: string };
}): CampaignCard {
  return {
    id: campaign.id,
    isDemo: campaign.isDemo,
    brandName: campaign.brand.name,
    name: campaign.name,
    category: campaign.category,
    creatorNiche: campaign.creatorNiche,
    platforms: platformsFromJson(campaign.platforms),
    audienceRange: campaign.audienceRange,
    location: campaign.location,
    budgetLabel: `${money(campaign.budgetMin)}–${money(campaign.budgetMax)}`,
    deliverables: campaign.deliverables,
    status: campaign.status,
  };
}

async function CreatorDeck({
  userId,
  creator,
}: {
  userId: string;
  creator: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>["creator"];
}) {
  if (!creator) return null;
  const [campaigns, interests, matches, skips] = await Promise.all([
    prisma.campaign.findMany({
      where: { status: { in: ["Open", "PUBLISHED", "Published"] } },
      include: { brand: true },
    }),
    prisma.interest.findMany({ where: { creatorId: creator.id, fromRole: "CREATOR" } }),
    prisma.match.findMany({ where: { creatorId: creator.id } }),
    prisma.skip.findMany({ where: { userId, targetType: "campaign" } }),
  ]);
  const hide = new Set([
    ...interests.map((item) => item.campaignId),
    ...matches.map((item) => item.campaignId),
    ...skips.map((item) => item.targetId),
  ]);
  const visible = campaigns.filter((campaign) => !hide.has(campaign.id)).map(toCampaign);

  return <DiscoverDeck mode="creator" me={toCreator(creator)} campaigns={visible} skipped={skips.length} />;
}

async function BrandDeck({ userId, brandId }: { userId: string; brandId: string }) {
  const [campaigns, creators, interests, matches, skips] = await Promise.all([
    prisma.campaign.findMany({ where: { brandId }, include: { brand: true }, orderBy: { name: "asc" } }),
    prisma.creator.findMany({ include: { socials: true }, orderBy: { name: "asc" } }),
    prisma.interest.findMany({ where: { fromRole: "BRAND", campaign: { brandId } } }),
    prisma.match.findMany({ where: { campaign: { brandId } } }),
    prisma.skip.findMany({ where: { userId, targetType: "creator" } }),
  ]);
  const skipped = new Set(skips.map((item) => item.targetId));
  const hiddenPairs = [...interests, ...matches].map((item) => `${item.creatorId}:${item.campaignId}`);

  return (
    <DiscoverDeck
      mode="brand"
      campaigns={campaigns.map(toCampaign)}
      creators={creators.filter((creator) => !skipped.has(creator.id)).map(toCreator)}
      hiddenPairs={hiddenPairs}
      skipped={skips.length}
    />
  );
}
