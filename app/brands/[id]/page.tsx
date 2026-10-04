import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro, Shell } from "@/components/page-intro";
import { Monogram } from "@/components/profile-bits";
import { JsonLd } from "@/components/json-ld";
import { getCurrentUser } from "@/lib/current";
import { money, platformsFromJson } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({ where: { id } });

  if (!brand) {
    return {
      title: "Brand Profile",
      description: "Explore verified brands, campaigns, and creator partnership opportunities.",
    };
  }

  const title = `${brand.name} · Brand Profile & Active Campaigns`;
  const description =
    brand.about?.slice(0, 160) ||
    `${brand.name} brand profile on INFURIZZ. Discover open campaign requirements, briefs, and partnership opportunities.`;
  const canonicalUrl = `/brands/${brand.id}`;

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

export default async function BrandProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        include: {
          applications: true,
        },
      },
    },
  });

  if (!brand) notFound();

  const viewer = await getCurrentUser();
  const ownsProfile = viewer?.brand?.id === brand.id;

  // Filter campaigns visible to the public or owner
  const openCampaigns = ownsProfile
    ? brand.campaigns
    : brand.campaigns.filter((c) => ["Open", "PUBLISHED", "Published"].includes(c.status));

  // If viewer is creator, check which campaigns they already applied to
  const [creatorApplications, brandPosts] = await Promise.all([
    viewer?.creator
      ? prisma.campaignApplication.findMany({
          where: {
            creatorId: viewer.creator.id,
            campaignId: { in: openCampaigns.map((c) => c.id) },
          },
        })
      : Promise.resolve([]),
    prisma.post.findMany({
      where: { authorId: brand.userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const appliedCampaignIds = new Map(creatorApplications.map((app) => [app.campaignId, app.status]));

  const brandJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    description:
      brand.about || `${brand.name} brand profile on INFURIZZ.`,
    url: `https://infurizzv1.vercel.app/brands/${brand.id}`,
    ...(brand.location
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: brand.location,
          },
        }
      : {}),
  };

  return (
    <Shell>
      <JsonLd data={brandJsonLd} />
      <div className="border border-line bg-card p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <Monogram name={brand.name} />
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                  Verified Brand
                </span>
                <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                  {brand.location}
                </span>
              </div>
              <h1 className="mt-1 font-serif text-4xl text-ink">{brand.name}</h1>
              <p className="mt-1 text-xs text-muted">
                Active on INFURIZZ since {new Date(brand.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {ownsProfile ? (
            <div className="flex gap-3">
              <Link
                href="/campaigns/new"
                className="bg-ink px-4 py-2 text-xs font-medium tracking-wider text-paper uppercase hover:bg-oxblood"
              >
                + Post New Requirement
              </Link>
              <Link
                href="/account"
                className="border border-line bg-paper px-4 py-2 text-xs font-medium text-ink hover:border-ink"
              >
                Brand Dashboard
              </Link>
            </div>
          ) : viewer?.creator ? (
            <Link
              href="/campaigns"
              className="border border-line bg-paper px-4 py-2 text-xs font-medium text-ink hover:border-ink"
            >
              ← Back to All Briefs
            </Link>
          ) : null}
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">About the Brand</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink whitespace-pre-line">
            {brand.about}
          </p>
        </div>
      </div>

      {/* Brand Announcements & Network Updates */}
      {brandPosts.length > 0 ? (
        <div className="mt-10 border border-line bg-card p-6">
          <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Network Updates</span>
          <h3 className="mt-1 font-serif text-2xl text-ink">Recent Brand Announcements</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {brandPosts.map((p) => (
              <div key={p.id} className="rounded border border-line bg-paper p-4 text-xs">
                <span className="font-semibold text-oxblood uppercase text-[10px] tracking-wider">{p.postType}</span>
                <p className="mt-1.5 leading-relaxed text-ink line-clamp-3 whitespace-pre-line">{p.content}</p>
                <span className="mt-3 block text-[11px] text-muted">
                  {new Date(p.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Brand Requirements Section */}
      <div className="mt-12 space-y-6">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-oxblood uppercase">Hiring Opportunities</span>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              Open Campaign Requirements ({openCampaigns.length})
            </h2>
          </div>
          <p className="text-xs text-muted">
            Apply with your creative pitch and custom service rates
          </p>
        </div>

        {openCampaigns.length === 0 ? (
          <div className="border border-line bg-card p-12 text-center text-sm text-muted">
            <p className="font-serif text-xl text-ink">No open requirements at this moment.</p>
            <p className="mt-2 text-xs">
              Check back soon or explore other brands actively looking for creator partnerships.
            </p>
            <Link
              href="/campaigns"
              className="mt-6 inline-block bg-ink px-5 py-2.5 text-xs tracking-wider text-paper uppercase hover:bg-oxblood"
            >
              Browse All Active Campaigns
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {openCampaigns.map((c) => {
              const plats = platformsFromJson(c.platforms);
              const applicationStatus = appliedCampaignIds.get(c.id);

              return (
                <article
                  key={c.id}
                  className="flex flex-col justify-between border border-line bg-card p-6 transition-all hover:border-ink/50"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                        {c.category} · {c.creatorNiche}
                      </span>
                      <span className="font-serif text-2xl text-ink">
                        {money(c.budgetMin)}–{money(c.budgetMax)}
                      </span>
                    </div>

                    <h3 className="mt-4 font-serif text-2xl tracking-tight text-ink">
                      <Link href={`/campaigns/${c.id}`} className="hover:text-oxblood">
                        {c.name}
                      </Link>
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Target Audience: {c.audienceRange} · Location: {c.location}
                    </p>

                    <div className="mt-4 rounded border border-line bg-paper p-3 text-xs leading-relaxed text-muted">
                      <span className="font-medium text-ink">Deliverables: </span>
                      {c.deliverables}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {plats.map((p) => (
                        <span key={p} className="border border-line bg-paper px-2 py-0.5 text-[11px] text-muted">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-line pt-4">
                    {applicationStatus ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-800 font-medium">
                          ✓ Application {applicationStatus}
                        </span>
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="text-xs text-ink underline underline-offset-4 hover:text-oxblood"
                        >
                          View Details →
                        </Link>
                      </div>
                    ) : ownsProfile ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">
                          {c.applications.length} application{c.applications.length === 1 ? "" : "s"} received
                        </span>
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="text-xs font-medium text-ink hover:text-oxblood"
                        >
                          Manage Campaign →
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="block w-full border border-ink bg-ink py-2.5 text-center text-xs tracking-wider text-paper uppercase transition-colors hover:bg-oxblood"
                      >
                        Review Brief &amp; Apply ↗
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
