import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/campaign-form";
import {
  CreatorApplicationForm,
  BrandApplicationReviewList,
  type ApplicationItem,
} from "@/components/campaign-applications";
import { InterestForm } from "@/components/interest-form";
import { PageIntro, Shell } from "@/components/page-intro";
import { CompatibilityList, SampleMark } from "@/components/profile-bits";
import { compatibility } from "@/lib/compatibility";
import { getCurrentUser } from "@/lib/current";
import { money, platformsFromJson } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isCampaignAcceptingApplications, isCampaignPublished } from "@/lib/options";
import { RevolvingBorder } from "@/components/revolving-border";
import { ScrollReveal } from "@/components/scroll-reveal";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { brand: true },
  });

  if (!campaign) {
    return {
      title: "Campaign Brief",
      description: "Explore creator campaign briefs and collaboration opportunities.",
    };
  }

  const isPublic = ["Open", "PUBLISHED", "Published"].includes(campaign.status);
  const title = `${campaign.name} · Creator Campaign Brief`;
  const description = `${campaign.name} campaign by ${campaign.brand?.name || "Brand"} in ${campaign.category}. Deliverables: ${campaign.deliverables}. Budget: $${campaign.budgetMin}–$${campaign.budgetMax}. Apply on INFURIZZ.`;
  const canonicalUrl = `/campaigns/${campaign.id}`;

  return {
    title,
    description,
    robots: isPublic
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: isPublic
      ? { canonical: canonicalUrl }
      : undefined,
    openGraph: {
      title: `${title} | INFURIZZ`,
      description,
      url: `https://infurizzv1.vercel.app${canonicalUrl}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | INFURIZZ`,
      description,
    },
  };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { brand: true } });
  if (!campaign) notFound();

  const viewer = await getCurrentUser();
  const platforms = platformsFromJson(campaign.platforms);
  const owns = viewer?.brand?.id === campaign.brandId;

  // If campaign is in draft mode and viewer is not the owner brand, return 404
  if (campaign.status.toUpperCase() === "DRAFT" && !owns) {
    notFound();
  }

  const [match, existingInterest, creatorApplication, creatorServices, brandApplications] =
    await Promise.all([
      viewer?.creator
        ? prisma.match.findUnique({
            where: { creatorId_campaignId: { creatorId: viewer.creator.id, campaignId: campaign.id } },
            include: { conversation: true },
          })
        : Promise.resolve(null),
      viewer?.creator
        ? prisma.interest.findUnique({
            where: {
              creatorId_campaignId_fromRole: {
                creatorId: viewer.creator.id,
                campaignId: campaign.id,
                fromRole: "CREATOR",
              },
            },
          })
        : Promise.resolve(null),
      viewer?.creator
        ? prisma.campaignApplication.findUnique({
            where: {
              campaignId_creatorId: {
                campaignId: campaign.id,
                creatorId: viewer.creator.id,
              },
            },
            include: { service: true, conversation: true },
          })
        : Promise.resolve(null),
      viewer?.creator
        ? prisma.creatorService.findMany({
            where: { creatorId: viewer.creator.id, isActive: true },
            orderBy: { price: "asc" },
          })
        : Promise.resolve([]),
      owns
        ? prisma.campaignApplication.findMany({
            where: { campaignId: campaign.id },
            include: {
              creator: true,
              service: true,
              conversation: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

  const fit = viewer?.creator
    ? compatibility({
        creatorCategory: viewer.creator.category,
        creatorNiche: viewer.creator.niche,
        creatorLocation: viewer.creator.location,
        creatorAudience: viewer.creator.audienceRange,
        creatorPlatforms: viewer.creator.socials.map((social) => social.platform),
        campaignCategory: campaign.category,
        campaignNiche: campaign.creatorNiche,
        campaignLocation: campaign.location,
        campaignAudience: campaign.audienceRange,
        campaignPlatforms: platforms,
      })
    : null;

  const accepting = isCampaignAcceptingApplications(campaign.status);
  const isPublished = isCampaignPublished(campaign.status);

  const formattedApplications: ApplicationItem[] = brandApplications.map((app) => ({
    id: app.id,
    proposedRate: app.proposedRate,
    pitchMessage: app.pitchMessage,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    creator: {
      id: app.creator.id,
      name: app.creator.name,
      username: app.creator.username,
      category: app.creator.category,
      location: app.creator.location,
    },
    service: app.service
      ? {
          id: app.service.id,
          title: app.service.title,
          platform: app.service.platform,
          price: app.service.price,
          turnaroundDays: app.service.turnaroundDays,
          deliverables: app.service.deliverables,
        }
      : null,
    conversation: app.conversation ? { id: app.conversation.id } : null,
  }));

  const campaignJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: campaign.name,
    description: `${campaign.name} campaign brief by ${campaign.brand.name}. Deliverables: ${campaign.deliverables}.`,
    url: `https://infurizzv1.vercel.app/campaigns/${campaign.id}`,
    provider: {
      "@type": "Organization",
      name: campaign.brand.name,
      url: `https://infurizzv1.vercel.app/brands/${campaign.brand.id}`,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: campaign.budgetMin,
      highPrice: campaign.budgetMax,
    },
  };

  return (
    <Shell>
      <JsonLd data={campaignJsonLd} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <Link
            href={`/brands/${campaign.brand.id}`}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-oxblood uppercase hover:underline"
          >
            <span>{campaign.brand.name}</span>
            <span className="text-[10px] text-muted group-hover:text-oxblood">↗ View Brand Profile</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`border px-3 py-1 text-xs tracking-wider uppercase ${
              isPublished
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : campaign.status.toUpperCase() === "PAUSED"
                ? "border-amber-500 bg-amber-50 text-amber-800"
                : "border-line bg-paper text-muted"
            }`}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      <PageIntro title={campaign.name} lede={campaign.brand.about} />

      <ScrollReveal className="mt-10">
        <dl className="grid gap-5 border-y border-line py-6 sm:grid-cols-2 lg:grid-cols-4">
          <Item label="Category" value={campaign.category} />
          <Item label="Creator niche" value={campaign.creatorNiche} />
          <Item label="Platforms" value={platforms.join(", ")} />
          <Item label="Audience target" value={campaign.audienceRange} />
          <Item label="Location" value={campaign.location} />
          <Item label="Budget range" value={`${money(campaign.budgetMin)}–${money(campaign.budgetMax)}`} />
          <Item label="Deliverables" value={campaign.deliverables} />
          <Item label="Status" value={campaign.status} />
        </dl>
      </ScrollReveal>

      {/* Main Campaign Interaction Grid */}
      <ScrollReveal className="mt-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-10">
          {/* Creator Marketplace Application Section */}
          {viewer?.creator && !owns ? (
            <div>
              {accepting || creatorApplication ? (
                <CreatorApplicationForm
                  campaignId={campaign.id}
                  services={creatorServices}
                  budgetMin={campaign.budgetMin}
                  budgetMax={campaign.budgetMax}
                  existingApplication={
                    creatorApplication
                      ? {
                          id: creatorApplication.id,
                          status: creatorApplication.status,
                          proposedRate: creatorApplication.proposedRate,
                          pitchMessage: creatorApplication.pitchMessage,
                          service: creatorApplication.service
                            ? {
                                title: creatorApplication.service.title,
                                platform: creatorApplication.service.platform,
                              }
                            : null,
                          conversation: creatorApplication.conversation
                            ? { id: creatorApplication.conversation.id }
                            : null,
                        }
                      : null
                  }
                />
              ) : (
                <div className="border border-line bg-card p-6 text-sm text-muted">
                  This campaign is currently <strong className="text-ink">{campaign.status}</strong> and is not accepting new applications.
                </div>
              )}

              {/* Secondary Mutual Interest / Quick Match */}
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-xs tracking-[0.14em] text-muted uppercase">Secondary Discovery</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {accepting && !match && !existingInterest ? (
                    <InterestForm creatorId={viewer.creator.id} campaignId={campaign.id} label="Express Quick-Match Interest" />
                  ) : null}
                  {existingInterest && !match ? (
                    <p className="text-xs text-muted">
                      Quick-match interest recorded. A conversation opens if the brand reciprocates.
                    </p>
                  ) : null}
                  {match?.conversation ? (
                    <Link
                      className="inline-flex min-h-11 items-center bg-ink px-4 text-xs tracking-[0.1em] text-paper uppercase hover:bg-oxblood"
                      href={`/conversations/${match.conversation.id}`}
                    >
                      Open Mutual Match Conversation ↗
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* Signed-out / Non-creator visitor */}
          {!viewer ? (
            <RevolvingBorder className="mt-6 max-w-xl">
              <div className="p-6">
                <h3 className="font-serif text-2xl">Want to apply to this brief?</h3>
                <p className="mt-2 text-sm text-muted">
                  Join INFURIZZ as a creator or log in to submit your proposed rate and pitch.
                </p>
                <div className="mt-5 flex gap-3">
                  <Link
                    href="/join?role=creator"
                    className="inline-flex min-h-11 items-center bg-ink px-5 text-xs tracking-[0.1em] text-paper uppercase hover:bg-oxblood transition-colors"
                  >
                    Join as Creator
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center border border-ink/20 px-5 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink transition-colors"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </RevolvingBorder>
          ) : null}

          {/* Brand Owner Campaign Management */}
          {owns ? (
            <div>
              <BrandApplicationReviewList applications={formattedApplications} />

              <section className="mt-12 border-t border-line pt-8">
                <h3 className="mb-4 font-serif text-3xl">Edit Campaign Brief</h3>
                <CampaignForm
                  mode="edit"
                  campaign={{
                    id: campaign.id,
                    name: campaign.name,
                    category: campaign.category,
                    creatorNiche: campaign.creatorNiche,
                    platforms,
                    audienceRange: campaign.audienceRange,
                    location: campaign.location,
                    budgetMin: campaign.budgetMin,
                    budgetMax: campaign.budgetMax,
                    deliverables: campaign.deliverables,
                    status: campaign.status,
                  }}
                />
              </section>
            </div>
          ) : null}
        </div>

        {/* Sidebar: Brand Information & Compatibility */}
        <div className="space-y-8">
          <div className="rounded border border-line bg-card p-6">
            <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Posted by Brand</span>
            <h4 className="mt-2 font-serif text-2xl text-ink">{campaign.brand.name}</h4>
            <p className="mt-1 text-xs text-muted">{campaign.brand.location}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-3">
              {campaign.brand.about}
            </p>
            <Link
              href={`/brands/${campaign.brand.id}`}
              className="mt-4 block border border-line bg-paper py-2 text-center text-xs font-medium text-ink hover:border-ink hover:text-oxblood"
            >
              View Full Brand Profile &amp; Requirements ↗
            </Link>
          </div>

          {fit ? (
            <div className="sticky top-24">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">Compatibility</p>
              <div className="mt-3">
                <CompatibilityList score={fit.score} parts={fit.parts} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ScrollReveal>
    </Shell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-6 text-ink">{value}</dd>
    </div>
  );
}
