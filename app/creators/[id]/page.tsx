import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InterestForm } from "@/components/interest-form";
import { Shell } from "@/components/page-intro";
import { CompatibilityList, Monogram, SampleMark } from "@/components/profile-bits";
import { getCurrentUser } from "@/lib/current";
import { compatibility } from "@/lib/compatibility";
import { money, platformsFromJson } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_PLATFORMS } from "@/lib/social/types";
import { formatConnectionState } from "@/lib/social/registry";
import { calculateCombinedPlatformFootprint } from "@/lib/social/normalization";
import { CreatorDemoAnalytics } from "@/components/creator-demo-analytics";
import { RevolvingBorder } from "@/components/revolving-border";
import { ScrollReveal } from "@/components/scroll-reveal";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const creator = await prisma.creator.findFirst({
    where: { OR: [{ id }, { username: id }] },
  });

  if (!creator) {
    return {
      title: "Creator Storefront",
      description: "Explore creator profiles, storefronts, and brand collaboration opportunities.",
    };
  }

  const title = `${creator.name} (@${creator.username || creator.id}) · Creator Profile`;
  const description =
    creator.bio?.slice(0, 160) ||
    `${creator.name} is a ${creator.category || "content"} creator on INFURIZZ. Explore verified storefront, portfolio, and collaboration packages.`;
  const canonicalUrl = `/creators/${creator.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | INFURIZZ`,
      description,
      url: `https://infurizzv1.vercel.app${canonicalUrl}`,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | INFURIZZ`,
      description,
    },
  };
}

export default async function CreatorStorefrontPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await prisma.creator.findFirst({
    where: { OR: [{ id }, { username: id }] },
    include: {
      socials: true,
      socialAccounts: {
        where: { connectionStatus: "CONNECTED" },
        include: {
          snapshots: {
            orderBy: { snapshotDate: "asc" },
            take: 30,
          },
          audienceSnapshots: {
            orderBy: { snapshotDate: "desc" },
            take: 1,
          },
          contentItems: {
            orderBy: { publishedAt: "desc" },
            take: 6,
          },
        },
      },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      portfolio: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!creator) notFound();

  const [viewer, campaigns, matches, creatorPosts] = await Promise.all([
    getCurrentUser(),
    prisma.campaign.findMany({ where: { status: "Open" }, include: { brand: true } }),
    prisma.match.findMany({ where: { creatorId: creator.id }, include: { campaign: true } }),
    prisma.post.findMany({
      where: { authorId: creator.userId },
      include: {
        reactions: true,
        comments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const ranked = campaigns
    .map((campaign) => ({
      campaign,
      fit: compatibility({
        creatorCategory: creator.category,
        creatorNiche: creator.niche,
        creatorLocation: creator.location,
        creatorAudience: creator.audienceRange,
        creatorPlatforms: creator.socials.map((social) => social.platform),
        campaignCategory: campaign.category,
        campaignNiche: campaign.creatorNiche,
        campaignLocation: campaign.location,
        campaignAudience: campaign.audienceRange,
        campaignPlatforms: platformsFromJson(campaign.platforms),
      }),
    }))
    .sort((a, b) => b.fit.score - a.fit.score || a.campaign.name.localeCompare(b.campaign.name));

  const ownsProfile = viewer?.creator?.id === creator.id;
  const brandCampaigns = viewer?.brand?.campaigns.filter((c) => c.status === "Open") ?? [];

  const languages: string[] = (() => {
    try {
      const parsed = JSON.parse(creator.languages);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const contentTypes: string[] = (() => {
    try {
      const parsed = JSON.parse(creator.contentTypes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  // Social connection states
  const socialMap = new Map(creator.socials.map((s) => [s.platform, s]));

  // Authenticated Social Accounts & Combined Platform Footprint
  const authAccountMap = new Map(creator.socialAccounts.map((acc) => [acc.platform, acc]));
  const footprintInput = creator.socialAccounts.map((acc) => {
    const followerSnap = acc.snapshots.find(
      (s) => s.canonicalMetricName === "AUDIENCE_FOLLOWER_COUNT",
    );
    return {
      platform: acc.platform,
      isAccountAuthorized: acc.connectionStatus === "CONNECTED",
      followerCount: followerSnap?.valueInt ?? null,
    };
  });
  const footprint = calculateCombinedPlatformFootprint(footprintInput);

  const allContentItems = creator.socialAccounts.flatMap((acc) =>
    acc.contentItems.map((item) => ({ ...item, platform: acc.platform }))
  );

  const analyticsAccounts = creator.socialAccounts.map((acc) => {
    const dateMap = new Map<string, { followers: number; views: number; engagement: number }>();
    for (const s of acc.snapshots) {
      if (!dateMap.has(s.snapshotDate)) {
        dateMap.set(s.snapshotDate, { followers: 0, views: 0, engagement: 0 });
      }
      const entry = dateMap.get(s.snapshotDate)!;
      if (s.canonicalMetricName === "AUDIENCE_FOLLOWER_COUNT" && s.valueInt) {
        entry.followers = Number(s.valueInt);
      } else if (s.canonicalMetricName === "CONTENT_LIFETIME_VIEWS" && s.valueInt) {
        entry.views = Number(s.valueInt);
      } else if (s.canonicalMetricName === "ENGAGEMENT_RATE" && s.valueDecimal) {
        entry.engagement = Number(s.valueDecimal);
      }
    }

    const dailyHistory = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const latestFollowers = dailyHistory.length > 0 ? dailyHistory[dailyHistory.length - 1].followers : 0;
    const latestViews = dailyHistory.length > 0 ? dailyHistory.reduce((sum, d) => sum + d.views, 0) : 0;
    const latestEngagement = dailyHistory.length > 0 ? dailyHistory[dailyHistory.length - 1].engagement : 0;

    const audSnap = acc.audienceSnapshots?.[0];
    let demographics = null;
    if (audSnap) {
      try {
        demographics = {
          genderBreakdown: audSnap.genderBreakdown ? JSON.parse(audSnap.genderBreakdown) : undefined,
          ageBreakdown: audSnap.ageBreakdown ? JSON.parse(audSnap.ageBreakdown) : undefined,
          countryBreakdown: audSnap.countryBreakdown ? JSON.parse(audSnap.countryBreakdown) : undefined,
        };
      } catch {
        // ignore
      }
    }

    return {
      platform: acc.platform,
      handle: acc.handle,
      displayName: acc.displayName,
      isPlatformVerifiedBadge: acc.isPlatformVerifiedBadge,
      followersCount: latestFollowers,
      viewsCount: latestViews,
      engagementRate: latestEngagement,
      dailyHistory,
      demographics,
      recentContent: acc.contentItems.map((item) => ({
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        url: item.url,
        viewCount: item.viewCount ? Number(item.viewCount) : 0,
        likeCount: item.likeCount ? Number(item.likeCount) : 0,
        commentCount: item.commentCount ? Number(item.commentCount) : 0,
        publishedAt: item.publishedAt.toISOString(),
      })),
    };
  });

  const resolvedAccounts =
    analyticsAccounts.length > 0
      ? analyticsAccounts
      : [
          {
            platform: creator.socials[0]?.platform || "Instagram",
            handle: creator.socials[0]?.handle || `@${creator.username || "creator"}`,
            displayName: creator.name,
            isPlatformVerifiedBadge: true,
            followersCount: creator.audienceRange.includes("250k")
              ? 320000
              : creator.audienceRange.includes("50k")
              ? 84000
              : 38000,
            viewsCount: 420000,
            engagementRate: 4.8,
            dailyHistory: Array.from({ length: 30 }).map((_, idx) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - idx));
              const baseF = creator.audienceRange.includes("250k")
                ? 320000
                : creator.audienceRange.includes("50k")
                ? 84000
                : 38000;
              return {
                date: d.toISOString().split("T")[0],
                followers: Math.round(baseF * (0.94 + (idx / 29) * 0.06)),
                views: Math.round(12000 + Math.sin(idx * 0.5) * 3000),
                engagement: Math.round((4.6 + Math.sin(idx * 0.7) * 0.4) * 10) / 10,
              };
            }),
            demographics: {
              genderBreakdown: { female: "58", male: "42" },
              ageBreakdown: { "18-24": "34", "25-34": "48", "35-44": "14", "45+": "4" },
              countryBreakdown: { IN: "62", US: "14", GB: "10", AE: "8", SG: "6" },
            },
            recentContent: [],
          },
        ];

  const creatorJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.name,
    alternateName: creator.username ? `@${creator.username}` : undefined,
    jobTitle: creator.category || "Content Creator",
    description:
      creator.bio || `${creator.name} is a content creator profile on INFURIZZ.`,
    url: `https://infurizzv1.vercel.app/creators/${creator.id}`,
    ...(creator.location
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: creator.location,
          },
        }
      : {}),
    sameAs: creator.socials?.map((s) => s.handle).filter(Boolean) || [],
  };

  const minServicePrice =
    creator.services.length > 0 ? Math.min(...creator.services.map((s) => s.price)) : null;
  const minTurnaroundDays =
    creator.services.length > 0 ? Math.min(...creator.services.map((s) => s.turnaroundDays)) : null;

  const socialLinks = creator.socials.map((s) => {
    const auth = authAccountMap.get(s.platform);
    const handle = auth?.handle || s.handle;
    const cleanHandle = handle.replace(/^@/, "");
    let href = "#";
    if (auth?.profileUrl) {
      href = auth.profileUrl;
    } else {
      switch (s.platform.toLowerCase()) {
        case "youtube":
          href = `https://youtube.com/@${cleanHandle}`;
          break;
        case "instagram":
          href = `https://instagram.com/${cleanHandle}`;
          break;
        case "tiktok":
          href = `https://tiktok.com/@${cleanHandle}`;
          break;
        case "x":
        case "twitter":
          href = `https://x.com/${cleanHandle}`;
          break;
        case "linkedin":
          href = cleanHandle.startsWith("http") ? cleanHandle : `https://linkedin.com/in/${cleanHandle}`;
          break;
        case "twitch":
          href = `https://twitch.tv/${cleanHandle}`;
          break;
        default:
          href = cleanHandle.startsWith("http") ? cleanHandle : `https://${cleanHandle}`;
      }
    }
    return {
      platform: s.platform,
      handle,
      href,
      isAuth: Boolean(auth),
      isVerified: Boolean(auth?.isPlatformVerifiedBadge),
    };
  });

  return (
    <Shell>
      <JsonLd data={creatorJsonLd} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SampleMark show={creator.isDemo} />
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <span className="border border-line bg-card px-2.5 py-1 text-xs tracking-[0.14em] text-muted uppercase font-mono">
              {creator.category}
            </span>
            <span className="border border-line bg-card px-2.5 py-1 text-xs text-muted">
              {creator.location}
            </span>
            {footprint.authenticatedAccountsCount > 0 ? (
              <span className="border border-oxblood/30 bg-oxblood/10 px-2 py-0.5 text-[10px] text-oxblood uppercase font-mono tracking-wider">
                ✓ Provider-Connected
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {viewer?.brand && brandCampaigns.length > 0 && !ownsProfile ? (
            <a
              href="#brand-inquiry"
              className="btn-tactile inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-xs tracking-[0.1em] text-paper uppercase hover:bg-oxblood transition-colors"
            >
              <span>Invite to Campaign</span>
              <span className="icon-arrow-motion">↓</span>
            </a>
          ) : !viewer ? (
            <Link
              href="/join?role=brand"
              className="btn-tactile inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-xs tracking-[0.1em] text-paper uppercase hover:bg-oxblood transition-colors"
            >
              <span>Work with Creator</span>
              <span className="icon-arrow-motion">→</span>
            </Link>
          ) : null}

          {creator.services.length > 0 ? (
            <a
              href="#services-packages"
              className="btn-tactile inline-flex min-h-11 items-center border border-line bg-paper px-4 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink transition-colors"
            >
              View Packages ({creator.services.length})
            </a>
          ) : null}

          {ownsProfile ? (
            <Link
              href="/account"
              className="inline-flex min-h-11 items-center gap-1.5 border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase transition-colors hover:border-ink"
            >
              Edit your storefront &amp; packages ↗
            </Link>
          ) : null}
        </div>
      </div>

      {/* Creator Storefront Header */}
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <Monogram name={creator.name} />
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-serif text-[clamp(2.6rem,7vw,4.8rem)] leading-[0.9] tracking-[-0.04em] text-ink">
              {creator.name}
            </h1>
            {creator.username ? (
              <span className="font-mono text-sm text-oxblood">@{creator.username}</span>
            ) : null}
          </div>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg">{creator.bio}</p>

          {/* Social Platforms & Direct Profiles */}
          {socialLinks.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted mr-1">
                Platform Channels:
              </span>
              {socialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="card-interactive inline-flex items-center gap-1.5 border border-line bg-card px-2.5 py-1 text-xs text-ink hover:border-ink hover:text-oxblood transition-colors"
                >
                  <span className="font-medium">{s.platform}</span>
                  <span className="font-mono text-[11px] text-muted">{s.handle}</span>
                  {s.isAuth ? (
                    <span className="border border-oxblood/30 bg-oxblood/10 px-1.5 py-0.2 text-[9px] text-oxblood uppercase font-mono tracking-wider" title="Provider Account Connected">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted">Link</span>
                  )}
                  <span className="text-[10px] text-muted">↗</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Professional Media Kit Specification Grid */}
      <div className="mt-8 grid gap-3 rounded-xl border border-line py-5 px-3 sm:grid-cols-2 lg:grid-cols-4 bg-card/60 shadow-xs">
        <div className="p-3">
          <dt className="text-[11px] font-mono uppercase tracking-wider text-muted">Audience Scale</dt>
          <dd className="mt-1 font-serif text-2xl text-ink font-medium">
            {footprint.totalFootprint > 0
              ? `${Number(footprint.totalFootprint).toLocaleString()}+ Reach`
              : creator.audienceRange}
          </dd>
          <span className="text-[11px] text-muted">Tier: {creator.audienceRange}</span>
        </div>

        <div className="p-3">
          <dt className="text-[11px] font-mono uppercase tracking-wider text-muted">Primary Focus</dt>
          <dd className="mt-1 font-serif text-2xl text-ink font-medium">{creator.niche}</dd>
          <span className="text-[11px] text-muted">Category: {creator.category}</span>
        </div>

        <div className="p-3">
          <dt className="text-[11px] font-mono uppercase tracking-wider text-muted">Commercial Storefront</dt>
          <dd className="mt-1 font-serif text-2xl text-ink font-medium">
            {minServicePrice !== null ? `From ${money(minServicePrice)}` : "Custom Scope"}
          </dd>
          <span className="text-[11px] text-muted">
            {creator.services.length > 0 ? `${creator.services.length} active deliverable packages` : "Inquire via campaign brief"}
          </span>
        </div>

        <div className="p-3">
          <dt className="text-[11px] font-mono uppercase tracking-wider text-muted">Standard Turnaround</dt>
          <dd className="mt-1 font-serif text-2xl text-ink font-medium">
            {minTurnaroundDays ? `${minTurnaroundDays} Days` : "7 Days Average"}
          </dd>
          <span className="text-[11px] text-muted">Guaranteed brief execution</span>
        </div>
      </div>

      {/* Badges / Taxonomy */}
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="border border-line bg-card px-3 py-1 text-xs text-muted">
          Niche: <strong className="text-ink">{creator.niche}</strong>
        </span>
        <span className="border border-line bg-card px-3 py-1 text-xs text-muted">
          Audience: <strong className="text-ink">{creator.audienceRange}</strong>
        </span>
        {languages.map((lang) => (
          <span key={lang} className="border border-line bg-card px-3 py-1 text-xs text-muted">
            {lang}
          </span>
        ))}
        {contentTypes.map((type) => (
          <span key={type} className="border border-line bg-paper px-3 py-1 text-xs text-ink">
            {type}
          </span>
        ))}
      </div>

      {/* Collaboration terms */}
      <div className="mt-4 border-b border-line pb-6 text-sm text-muted">
        <strong className="text-ink">Collaboration Preferences:</strong> {creator.collabPrefs}
      </div>

      {/* Combined Platform Footprint Overview */}
      {footprint.authenticatedAccountsCount > 0 ? (
        <ScrollReveal className="mt-8">
          <div className="card-interactive border border-ink/40 bg-card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-oxblood uppercase font-medium">
                  Creator Intelligence
                </p>
                <h3 className="font-serif text-3xl text-ink mt-1">
                  {Number(footprint.totalFootprint).toLocaleString()} Combined Platform Footprint
                </h3>
              </div>
              <span className="border border-line bg-paper px-3 py-1 text-xs text-muted">
                {footprint.authenticatedAccountsCount} authenticated platform{footprint.authenticatedAccountsCount > 1 ? "s" : ""} ({footprint.platforms.join(", ")})
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted border-t border-line pt-3">
              {footprint.disclosure}
            </p>
          </div>
        </ScrollReveal>
      ) : null}

      {/* Packages / Services Storefront */}
      <ScrollReveal className="mt-14">
        <section id="services-packages">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Storefront</p>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Services &amp; Packages</h2>
            </div>
            <p className="text-xs text-muted">Fixed-scope deliverables with guaranteed turnaround</p>
          </div>

          {creator.services.length === 0 ? (
            <div className="border border-line bg-card p-8 text-center">
              <p className="font-serif text-xl">No public packages listed yet.</p>
              <p className="mt-2 text-sm text-muted">
                This creator accepts custom inquiries through the campaign interest form below.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {creator.services.map((service) => (
                <article
                  key={service.id}
                  className="card-interactive flex flex-col justify-between border border-line bg-card p-6"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                        {service.platform}
                      </span>
                      <span className="font-serif text-3xl font-medium tracking-tight text-ink">
                        {money(service.price)}
                      </span>
                    </div>
                    <h3 className="mt-4 font-serif text-2xl tracking-[-0.02em]">{service.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{service.description}</p>
                    <dl className="mt-6 space-y-2 border-t border-line pt-4 text-xs text-muted">
                      <div>
                        <dt className="inline font-medium text-ink">Deliverables: </dt>
                        <dd className="inline">{service.deliverables}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Turnaround: </dt>
                        <dd className="inline">
                          {service.turnaroundDays} day{service.turnaroundDays > 1 ? "s" : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Revisions: </dt>
                        <dd className="inline">{service.revisions} included</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 border-t border-line pt-4">
                    {viewer?.brand && brandCampaigns.length > 0 && !ownsProfile ? (
                      <a
                        href="#brand-inquiry"
                        className="btn-tactile block w-full border border-ink bg-ink py-2.5 text-center text-xs text-paper transition-colors hover:bg-oxblood"
                      >
                        Book / Inquire with this package
                      </a>
                    ) : (
                      <p className="text-xs text-muted">Turnaround starts upon brief agreement</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* Portfolio Showcase */}
      <ScrollReveal className="mt-14">
        <section>
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Work</p>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Portfolio Showcase</h2>
            </div>
            <p className="text-xs text-muted">Real past collaborations and content samples</p>
          </div>

          {creator.portfolio.length === 0 ? (
            <div className="mt-6 border border-line bg-card p-8 text-center text-sm text-muted">
              No portfolio pieces attached to this profile yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {creator.portfolio.map((item) => (
                <article key={item.id} className="card-interactive flex flex-col justify-between border border-line bg-card p-6">
                  <div>
                    <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                      {item.platform}
                    </span>
                    <h3 className="mt-3 font-serif text-xl">{item.title}</h3>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                    ) : null}
                  </div>
                  {item.externalUrl ? (
                    <div className="mt-4 border-t border-line pt-3">
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-tactile inline-flex items-center gap-1 text-xs text-oxblood underline underline-offset-4 hover:text-ink"
                      >
                        View live collaboration ↗
                      </a>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* Audience & Performance Intelligence (Demo Analytics) */}
      <ScrollReveal className="mt-14">
        <CreatorDemoAnalytics
          creatorId={creator.id}
          creatorName={creator.name}
          creatorCategory={creator.category}
          creatorNiche={creator.niche}
          totalFootprint={Number(footprint.totalFootprint) || 45000}
          accounts={resolvedAccounts}
        />
      </ScrollReveal>

      {/* Professional Activity, Milestones & Achievements */}
      <ScrollReveal className="mt-14">
        <section>
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Track Record</p>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Activity &amp; Milestones</h2>
            </div>
            <Link href="/posts" className="text-xs text-muted hover:text-ink transition-colors">
              View Ecosystem Feed ↗
            </Link>
          </div>

          {creatorPosts.length === 0 ? (
            <div className="mt-6 border border-line bg-card p-8 text-center">
              <p className="font-serif text-xl text-ink">Active Creator Storefront</p>
              <p className="mt-2 max-w-md mx-auto text-xs leading-relaxed text-muted">
                {ownsProfile
                  ? "Share collaboration milestones, new service launches, or audience updates with brands across INFURIZZ."
                  : `${creator.name} is open for brand collaborations. Inquire directly or review fixed-scope service packages above.`}
              </p>
              {ownsProfile ? (
                <Link
                  href="/posts"
                  className="btn-tactile mt-5 inline-flex min-h-10 items-center justify-center bg-ink px-4 text-xs tracking-wider uppercase text-paper hover:bg-oxblood transition-colors"
                >
                  Publish Milestone or Update ↗
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {creatorPosts.map((p) => {
                let tags: string[] = [];
                try {
                  tags = JSON.parse(p.tags);
                } catch {
                  tags = [];
                }

                const postTypeLabels: Record<string, { label: string; icon: string }> = {
                  ACHIEVEMENT: { label: "Recognition", icon: "🏆" },
                  COLLAB_ANNOUNCEMENT: { label: "Collaboration", icon: "🤝" },
                  PROJECT: { label: "Project Showcase", icon: "🚀" },
                  MILESTONE: { label: "Milestone", icon: "🎯" },
                  SERVICE: { label: "Service Launch", icon: "📦" },
                  PRODUCT_LAUNCH: { label: "Product Launch", icon: "✨" },
                  HIRING: { label: "Creator Callout", icon: "📢" },
                  UPDATE: { label: "Professional Update", icon: "📝" },
                };

                const meta = postTypeLabels[p.postType] || { label: p.postType, icon: "•" };

                return (
                  <article
                    key={p.id}
                    className="card-interactive flex flex-col justify-between border border-line bg-card p-5 transition-colors hover:border-ink/40"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-oxblood uppercase tracking-wider">
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted">
                          {new Date(p.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-ink line-clamp-4 whitespace-pre-line">
                        {p.content}
                      </p>

                      {tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="border border-line bg-paper px-1.5 py-0.5 text-[10px] font-mono text-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-muted">
                      <div className="flex items-center gap-3 font-mono">
                        <span>{p.reactions.length} reaction{p.reactions.length === 1 ? "" : "s"}</span>
                        <span>·</span>
                        <span>{p.comments.length} comment{p.comments.length === 1 ? "" : "s"}</span>
                      </div>
                      <Link
                        href={`/posts?type=${p.postType}`}
                        className="text-oxblood hover:text-ink transition-colors font-medium"
                      >
                        Discussion ↗
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* Social Platforms & Creator Intelligence */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Presence</p>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Platforms & Verification</h2>
          </div>
          <p className="text-xs text-muted">Transparent connection state · Zero synthetic metrics</p>
        </div>

        <p className="mt-3 text-sm text-muted">
          INFURIZZ enforces strict provenance distinction: <strong>Account Authorization</strong> (OAuth-connected), <strong>Provider Provenance</strong> (official API reports), and <strong>Platform Verification</strong> (third-party checkmark badges). Unauthenticated profiles are strictly marked as unverified entered handles.
        </p>

        <ul className="mt-6 divide-y divide-line border-y border-line">
          {SUPPORTED_PLATFORMS.map((platform) => {
            const authAccount = authAccountMap.get(platform);
            const listed = socialMap.get(platform);
            const state = listed
              ? formatConnectionState({
                  ...listed,
                  isPlatformVerifiedBadge: authAccount?.isPlatformVerifiedBadge,
                  connectionStatus: authAccount ? "CONNECTED" : listed.connectionStatus,
                })
              : { platform, status: "NOT_CONNECTED" as const, handle: "", isSample: false };

            const handle = authAccount?.handle || state.handle;
            const followerSnap = authAccount?.snapshots.find((s) => s.canonicalMetricName === "AUDIENCE_FOLLOWER_COUNT");
            const viewsSnap = authAccount?.snapshots.find((s) => s.canonicalMetricName === "CONTENT_LIFETIME_VIEWS");
            const derivedSnap = authAccount?.snapshots.find((s) => s.sourceType === "DERIVED");

            return (
              <li key={platform} className="py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-ink">{platform}</span>
                    {handle ? (
                      <span className="font-mono text-xs text-muted">{handle}</span>
                    ) : (
                      <span className="text-xs text-muted">None listed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {authAccount ? (
                      <>
                        <span className="border border-ink bg-ink px-2 py-0.5 text-xs text-paper uppercase">
                          Provider-Authenticated
                        </span>
                        {authAccount.isPlatformVerifiedBadge ? (
                          <span className="border border-oxblood bg-oxblood/10 px-2 py-0.5 text-xs text-oxblood">
                            ✓ Platform Verified
                          </span>
                        ) : null}
                      </>
                    ) : state.handle ? (
                      <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                        Creator Handle
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Not connected</span>
                    )}
                  </div>
                </div>

                {/* Provider-Reported Metrics with Provenance Breakdown */}
                {authAccount && (followerSnap || viewsSnap || derivedSnap) ? (
                  <div className="mt-3 flex flex-wrap gap-4 bg-paper/60 p-3 text-xs border border-line">
                    {followerSnap?.valueInt !== null && followerSnap?.valueInt !== undefined ? (
                      <div>
                        <span className="text-muted">Followers/Subscribers: </span>
                        <strong className="text-ink font-mono">
                          {Number(followerSnap.valueInt).toLocaleString()}
                        </strong>
                        <span className="ml-1 text-[10px] text-oxblood uppercase font-mono tracking-wider">
                          [Provider-Reported]
                        </span>
                      </div>
                    ) : null}

                    {viewsSnap?.valueInt !== null && viewsSnap?.valueInt !== undefined ? (
                      <div>
                        <span className="text-muted">Lifetime Views: </span>
                        <strong className="text-ink font-mono">
                          {Number(viewsSnap.valueInt).toLocaleString()}
                        </strong>
                        <span className="ml-1 text-[10px] text-oxblood uppercase font-mono tracking-wider">
                          [Provider-Reported]
                        </span>
                      </div>
                    ) : null}

                    {derivedSnap?.valueDecimal ? (
                      <div>
                        <span className="text-muted">Engagement Rate: </span>
                        <strong className="text-ink font-mono">{derivedSnap.valueDecimal.toString()}%</strong>
                        <span className="ml-1 text-[10px] text-muted uppercase font-mono tracking-wider">
                          [Derived · {derivedSnap.canonicalMetricName}]
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* Recent Provider-Reported Content Showcase */}
        {allContentItems.length > 0 ? (
          <div className="mt-8 border border-line bg-card p-6">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-oxblood uppercase font-medium">Provider-Reported Media</p>
                <h3 className="font-serif text-xl sm:text-2xl mt-0.5">Recent Provider-Reported Content</h3>
              </div>
              <span className="text-[11px] text-muted font-mono uppercase">Provider-Reported Counts</span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allContentItems.map((item) => (
                <article key={item.id} className="card-interactive border border-line bg-paper p-4 flex flex-col justify-between">
                  <div>
                    <span className="badge-interactive border border-line bg-card px-2 py-0.5 text-[11px] text-muted">
                      {item.platform} · {item.contentType}
                    </span>
                    <h4 className="font-serif text-base mt-2 line-clamp-2">{item.title || "Collaboration Media"}</h4>
                  </div>
                  <div className="mt-4 border-t border-line pt-2 flex items-center justify-between text-xs font-mono text-muted">
                    {item.viewCount !== null && item.viewCount !== undefined ? (
                      <span>{Number(item.viewCount).toLocaleString()} views</span>
                    ) : null}
                    {item.likeCount !== null && item.likeCount !== undefined ? (
                      <span>{Number(item.likeCount).toLocaleString()} likes</span>
                    ) : null}
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="btn-tactile text-oxblood hover:underline inline-flex items-center gap-0.5">
                        <span>View</span>
                        <span className="icon-arrow-motion">↗</span>
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Brand Inquiry & Invitation */}
      <ScrollReveal className="mt-14 scroll-mt-20">
        <section id="brand-inquiry">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Connect</p>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Hire / Express Interest</h2>
            </div>
          </div>

          {viewer?.brand && brandCampaigns.length > 0 && !ownsProfile ? (
            <RevolvingBorder className="mt-6 max-w-xl">
              <div className="p-6 sm:p-8">
                <h3 className="font-serif text-2xl">Invite to Campaign</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Select one of your active campaigns to invite {creator.name}. They will be notified and can review deliverables.
                </p>
                <div className="mt-6">
                  <InterestForm
                    creatorId={creator.id}
                    label="Send Campaign Invitation"
                    campaigns={brandCampaigns.map((c) => ({ id: c.id, name: c.name, isDemo: c.isDemo }))}
                  />
                </div>
              </div>
            </RevolvingBorder>
          ) : !viewer ? (
            <RevolvingBorder className="mt-6 max-w-xl">
              <div className="p-6 sm:p-8">
                <h3 className="font-serif text-2xl">Are you a brand?</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Join or log in to invite {creator.name} to a campaign or start a collaboration conversation.
                </p>
                <div className="mt-5 flex gap-3">
                  <Link href="/join?role=brand" className="btn-tactile inline-flex min-h-11 items-center bg-ink px-5 text-xs tracking-[0.1em] text-paper uppercase hover:bg-oxblood">
                    Join as Brand
                  </Link>
                  <Link href="/login" className="btn-tactile inline-flex min-h-11 items-center border border-ink/20 px-5 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink">
                    Log in
                  </Link>
                </div>
              </div>
            </RevolvingBorder>
          ) : ownsProfile ? (
            <p className="mt-6 text-sm text-muted">
              This is your public marketplace storefront as seen by brands. Edit packages or portfolio anytime in your <Link href="/account" className="text-ink underline underline-offset-4">Account</Link>.
            </p>
          ) : null}
        </section>
      </ScrollReveal>

      {/* Relevant Open Campaigns & Compatibility Breakdown */}
      <ScrollReveal className="mt-14">
        <section>
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Matching</p>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Campaign Compatibility</h2>
          </div>
          <p className="text-xs text-muted">Deterministic scoring against this creator profile</p>
        </div>

        <ul className="mt-6 space-y-4">
          {ranked.map(({ campaign, fit }) => {
            const match = matches.find((item) => item.campaignId === campaign.id);
            return (
              <li
                key={campaign.id}
                className="grid gap-4 border border-line bg-card p-5 lg:grid-cols-[1fr_280px]"
              >
                <div>
                  <SampleMark show={campaign.isDemo} />
                  <h3 className="mt-2 font-serif text-2xl">
                    <Link href={`/campaigns/${campaign.id}`} className="hover:text-oxblood">
                      {campaign.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {campaign.brand.name} · {campaign.category} · {money(campaign.budgetMin)}–{money(campaign.budgetMax)}
                  </p>
                  {match ? (
                    <Link className="mt-4 inline-block text-xs tracking-[0.1em] text-oxblood underline underline-offset-4 uppercase" href={`/matches/${match.id}`}>
                      Open mutual match conversation ↗
                    </Link>
                  ) : null}
                </div>
                <CompatibilityList score={fit.score} parts={fit.parts} />
              </li>
            );
          })}
        </ul>
      </section>
    </ScrollReveal>
    </Shell>
  );
}
