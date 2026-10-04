import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Shell } from "@/components/page-intro";
import { Monogram } from "@/components/profile-bits";
import { money, platformsFromJson } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current";

export const metadata: Metadata = {
  title: "Brand Directory · Discover Brands & Active Requirements",
  description:
    "Explore active brands hiring creators on INFURIZZ. Discover verified brand profiles, open campaign briefs, and partnership opportunities.",
  alternates: {
    canonical: "/brands",
  },
  openGraph: {
    title: "Brand Directory · Discover Brands & Active Requirements | INFURIZZ",
    description:
      "Explore active brands hiring creators on INFURIZZ. Discover verified brand profiles, open campaign briefs, and partnership opportunities.",
    url: "https://infurizzv1.vercel.app/brands",
  },
};

export default async function BrandsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
    hasRequirements?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase() || "";
  const location = params.location?.trim() || "";
  const hasRequirementsOnly = params.hasRequirements === "true";

  const user = await getCurrentUser();

  // Query brands with their open campaigns
  const brandsFromDb = await prisma.brand.findMany({
    include: {
      campaigns: {
        where: {
          status: { in: ["Open", "PUBLISHED", "Published"] },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Filter in memory for search query and open requirements
  const brands = brandsFromDb.filter((brand) => {
    if (hasRequirementsOnly && brand.campaigns.length === 0) {
      return false;
    }
    if (location && !brand.location.toLowerCase().includes(location.toLowerCase())) {
      return false;
    }
    if (q) {
      const match = `${brand.name} ${brand.about} ${brand.location}`.toLowerCase();
      const campaignMatch = brand.campaigns.some(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.creatorNiche.toLowerCase().includes(q)
      );
      if (!match.includes(q) && !campaignMatch) return false;
    }
    return true;
  });

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Marketplace Directory"
          title="Brands &amp; Hiring Companies"
          lede="Explore brand profiles, review their open campaign requirements, and apply directly with your creative pitch and custom package rates."
        />

        {user?.creator ? (
          <Link
            href="/campaigns"
            className="inline-flex min-h-11 items-center border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink"
          >
            Browse All Open Briefs ↗
          </Link>
        ) : null}
      </div>

      {/* Filter Bar */}
      <form method="GET" className="mt-8 border border-line bg-card p-6" suppressHydrationWarning>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Search Brands</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by brand name, industry, or requirement..."
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Location</label>
            <input
              type="text"
              name="location"
              defaultValue={location}
              placeholder="City or Remote"
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="hasRequirements"
              value="true"
              defaultChecked={hasRequirementsOnly}
              className="h-4 w-4 rounded border-line text-oxblood focus:ring-oxblood"
            />
            <span className="text-xs font-medium text-ink">Brands with Active Requirements Only</span>
          </label>

          <div className="flex items-center gap-2">
            {q || location || hasRequirementsOnly ? (
              <Link href="/brands" className="border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">
                Clear Filters
              </Link>
            ) : null}
            <button
              type="submit"
              suppressHydrationWarning
              className="bg-ink px-4 py-1.5 text-xs tracking-wider text-paper uppercase hover:bg-oxblood"
            >
              Filter Brands
            </button>
          </div>
        </div>
      </form>

      {/* Brands Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {brands.length === 0 ? (
          <div className="col-span-full animate-fade-in border border-line bg-card p-12 text-center text-sm text-muted">
            <p className="font-serif text-2xl text-ink">No Brands Found</p>
            <p className="mt-2 text-xs">Try clearing filters or search terms.</p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/brands"
                className="btn-tactile inline-flex min-h-11 items-center justify-center border border-ink bg-paper px-5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
              >
                Reset Brand Filters
              </Link>
            </div>
          </div>
        ) : (
          brands.map((brand, idx) => (
            <article
              key={brand.id}
              style={{ animationDelay: `${Math.min(idx * 45, 600)}ms` }}
              className="card-interactive animate-fade-up flex flex-col justify-between border border-line bg-card p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 transition-transform duration-300 hover:scale-105">
                      <Monogram name={brand.name} />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl tracking-tight text-ink">
                        <Link href={`/brands/${brand.id}`} className="transition-colors hover:text-oxblood">
                          {brand.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-muted">{brand.location}</p>
                    </div>
                  </div>

                  <span
                    className={`border px-2 py-0.5 text-xs font-medium ${
                      brand.campaigns.length > 0
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-line bg-paper text-muted"
                    }`}
                  >
                    {brand.campaigns.length} Active Requirement{brand.campaigns.length === 1 ? "" : "s"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted line-clamp-3">
                  {brand.about}
                </p>

                {/* Open Requirements list inside the brand card */}
                {brand.campaigns.length > 0 ? (
                  <div className="mt-5 space-y-2 border-t border-line pt-4">
                    <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
                      Open Campaign Requirements:
                    </span>
                    <ul className="space-y-2 text-xs">
                      {brand.campaigns.slice(0, 2).map((c) => {
                        const plats = platformsFromJson(c.platforms);
                        return (
                          <li
                            key={c.id}
                            className="rounded border border-line bg-paper p-3 transition-colors hover:border-ink/50"
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <Link
                                href={`/campaigns/${c.id}`}
                                className="font-medium text-ink hover:text-oxblood hover:underline"
                              >
                                {c.name}
                              </Link>
                              <span className="font-serif text-ink">
                                {money(c.budgetMin)}–{money(c.budgetMax)}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-muted">{c.deliverables}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] text-muted">
                                {plats.join(" · ")}
                              </span>
                              <Link
                                href={`/campaigns/${c.id}`}
                                className="group font-medium text-oxblood hover:underline text-[11px] inline-flex items-center gap-0.5"
                              >
                                <span>View &amp; Apply</span>
                                <span className="icon-arrow-motion">→</span>
                              </Link>
                            </div>
                          </li>
                        );
                      })}
                      {brand.campaigns.length > 2 ? (
                        <p className="text-right text-[11px] text-muted">
                          + {brand.campaigns.length - 2} more requirement{brand.campaigns.length - 2 === 1 ? "" : "s"} on profile
                        </p>
                      ) : null}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-4 border-t border-line pt-3 text-xs text-muted italic">
                    No open requirements currently posted by this brand.
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-4">
                <Link
                  href={`/brands/${brand.id}`}
                  className="btn-tactile group flex min-h-10 w-full items-center justify-center gap-1 border border-ink py-2 text-center text-xs tracking-wider uppercase transition-colors hover:bg-ink hover:text-paper"
                >
                  <span>View Brand Profile &amp; Requirements</span>
                  <span className="icon-arrow-motion">↗</span>
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </Shell>
  );
}
