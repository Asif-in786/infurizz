import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Shell } from "@/components/page-intro";
import { money, platformsFromJson } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, PLATFORMS } from "@/lib/options";
import { getCurrentUser } from "@/lib/current";

export const metadata: Metadata = { title: "Campaigns · Marketplace Opportunities" };

export default async function CampaignsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    platform?: string;
    location?: string;
    tab?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const category = params.category || "";
  const platform = params.platform || "";
  const location = params.location?.trim() || "";
  const tab = params.tab || "active";
  const forceDirectoryView = params.view === "directory";

  const user = await getCurrentUser();

  // If user is a Brand and hasn't explicitly chosen the global directory view, render the dedicated Brand Campaigns Workspace
  if (user?.role === "BRAND" && user.brand && !forceDirectoryView) {
    const brandCampaigns = await prisma.campaign.findMany({
      where: { brandId: user.brand.id },
      include: {
        applications: {
          include: {
            creator: true,
            service: true,
            order: true,
            conversation: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeCampaigns = brandCampaigns.filter((c) => ["Open", "PUBLISHED", "Published"].includes(c.status));
    const draftCampaigns = brandCampaigns.filter((c) => ["Draft", "DRAFT"].includes(c.status));
    const completedCampaigns = brandCampaigns.filter((c) => ["Closed", "CLOSED", "Completed"].includes(c.status));
    const allApplications = brandCampaigns.flatMap((c) => c.applications.map((app) => ({ ...app, campaignName: c.name })));

    return (
      <Shell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <PageIntro
            eyebrow="Brand Workspace · Layer 02"
            title="Campaign Briefs"
            lede="Publish structured hiring requirements, review incoming creator applications &amp; rates, and manage active collaboration orders."
          />

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/campaigns/new"
              className="inline-flex min-h-11 items-center bg-ink px-5 text-xs tracking-[0.1em] text-paper uppercase transition-colors hover:bg-oxblood"
            >
              + Start a Campaign
            </Link>
            <Link
              href="/campaigns?view=directory"
              className="inline-flex min-h-11 items-center border border-line bg-card px-4 text-xs tracking-[0.1em] text-muted uppercase hover:text-ink"
            >
              Marketplace View ↗
            </Link>
          </div>
        </div>

        {/* Brand KPI Summary */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="border border-line bg-card p-5">
            <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Active Briefs</span>
            <p className="mt-2 font-serif text-3xl font-medium text-ink">{activeCampaigns.length}</p>
            <span className="mt-1 block text-xs text-muted">Accepting creator pitches</span>
          </div>

          <div className="border border-line bg-card p-5">
            <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Total Applicants</span>
            <p className="mt-2 font-serif text-3xl font-medium text-ink">{allApplications.length}</p>
            <span className="mt-1 block text-xs text-muted">Proposals received</span>
          </div>

          <div className="border border-line bg-card p-5">
            <span className="text-[11px] font-semibold tracking-wider text-amber-800 uppercase">Drafts</span>
            <p className="mt-2 font-serif text-3xl font-medium text-ink">{draftCampaigns.length}</p>
            <span className="mt-1 block text-xs text-muted">Unpublished briefs</span>
          </div>

          <div className="border border-line bg-card p-5">
            <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">Completed</span>
            <p className="mt-2 font-serif text-3xl font-medium text-ink">{completedCampaigns.length}</p>
            <span className="mt-1 block text-xs text-muted">Fulfilled partnerships</span>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs">
          {[
            { label: `Active (${activeCampaigns.length})`, value: "active" },
            { label: `Applications Received (${allApplications.length})`, value: "applications" },
            { label: `Drafts (${draftCampaigns.length})`, value: "drafts" },
            { label: `Completed (${completedCampaigns.length})`, value: "completed" },
          ].map((t) => (
            <Link
              key={t.value}
              href={`/campaigns?tab=${t.value}`}
              className={`px-3 py-1.5 transition-colors ${
                tab === t.value
                  ? "bg-ink text-paper font-medium"
                  : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab 1: Active Briefs */}
        {tab === "active" ? (
          <div className="mt-6 space-y-4">
            {activeCampaigns.length === 0 ? (
              <div className="border border-line bg-card p-12 text-center text-sm text-muted">
                <p className="font-serif text-2xl text-ink">No active campaigns right now.</p>
                <p className="mt-2 text-xs">Post a structured brief to receive proposals from verified creators.</p>
                <Link
                  href="/campaigns/new"
                  className="mt-6 inline-block bg-ink px-5 py-2.5 text-xs uppercase tracking-wider text-paper hover:bg-oxblood"
                >
                  + Start a Campaign Brief
                </Link>
              </div>
            ) : (
              activeCampaigns.map((c) => {
                const plats = platformsFromJson(c.platforms);
                return (
                  <article key={c.id} className="border border-line bg-card p-6 transition-all hover:border-ink/50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-emerald-800">
                            {c.status}
                          </span>
                          <span className="text-xs text-muted">{c.category} · {c.creatorNiche}</span>
                        </div>
                        <h3 className="mt-2 font-serif text-2xl text-ink">
                          <Link href={`/campaigns/${c.id}`} className="hover:text-oxblood">
                            {c.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          Deliverables: <strong className="text-ink">{c.deliverables}</strong>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[11px] uppercase tracking-wider text-muted">Budget Range</span>
                        <p className="font-serif text-2xl font-medium text-ink">
                          {money(c.budgetMin)}–{money(c.budgetMax)}
                        </p>
                        <span className="mt-1 block text-xs text-oxblood font-medium">
                          {c.applications.length} Creator Proposal{c.applications.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {plats.map((p) => (
                          <span key={p} className="border border-line bg-paper px-2 py-0.5 text-[11px] text-muted">
                            {p}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="font-medium text-ink underline underline-offset-4 hover:text-oxblood"
                        >
                          Review Applications ({c.applications.length}) →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        ) : null}

        {/* Tab 2: Applications Received */}
        {tab === "applications" ? (
          <div className="mt-6 space-y-4">
            {allApplications.length === 0 ? (
              <div className="border border-line bg-card p-12 text-center text-sm text-muted">
                <p className="font-serif text-2xl text-ink">No creator proposals received yet.</p>
                <p className="mt-2 text-xs">Make sure your campaigns are published and active in the marketplace.</p>
              </div>
            ) : (
              allApplications.map((app) => (
                <article key={app.id} className="card-interactive border border-line bg-card p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">Applied to brief:</span>
                        <Link href={`/campaigns/${app.campaignId}`} className="font-medium text-ink hover:underline">
                          {app.campaignName}
                        </Link>
                      </div>

                      <h3 className="mt-2 font-serif text-2xl text-ink">
                        <Link href={`/creators/${app.creator.username || app.creator.id}`} className="hover:text-oxblood">
                          {app.creator.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-muted">
                        Category: {app.creator.category} · Niche: {app.creator.niche} · Location: {app.creator.location}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-muted">Proposed Rate</span>
                      <p className="font-serif text-2xl font-medium text-ink">{money(app.proposedRate)}</p>
                      <span className="border border-line px-2 py-0.5 text-[10px] uppercase text-muted">
                        {app.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded border border-line bg-paper p-3 text-xs leading-relaxed text-muted">
                    <strong className="text-ink">Creator Pitch: </strong>
                    {app.pitchMessage}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs">
                    <Link
                      href={`/creators/${app.creator.username || app.creator.id}`}
                      className="text-muted underline underline-offset-4 hover:text-ink"
                    >
                      View Creator Storefront ↗
                    </Link>

                    <Link
                      href={`/campaigns/${app.campaignId}`}
                      className="font-medium text-oxblood hover:underline"
                    >
                      Review &amp; Accept Proposal in Brief Workspace →
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {/* Tab 3: Drafts */}
        {tab === "drafts" ? (
          <div className="mt-6 space-y-4">
            {draftCampaigns.length === 0 ? (
              <div className="border border-line bg-card p-12 text-center text-sm text-muted">
                <p className="font-serif text-xl text-ink">No drafts saved.</p>
              </div>
            ) : (
              draftCampaigns.map((c) => (
                <article key={c.id} className="border border-line bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="border border-amber-600 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 uppercase">
                        Draft
                      </span>
                      <h3 className="mt-2 font-serif text-2xl text-ink">{c.name}</h3>
                      <p className="mt-1 text-xs text-muted">{c.deliverables}</p>
                    </div>
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="border border-ink px-4 py-2 text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
                    >
                      Edit &amp; Publish →
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {/* Tab 4: Completed */}
        {tab === "completed" ? (
          <div className="mt-6 space-y-4">
            {completedCampaigns.length === 0 ? (
              <div className="border border-line bg-card p-12 text-center text-sm text-muted">
                <p className="font-serif text-xl text-ink">No completed campaigns yet.</p>
              </div>
            ) : (
              completedCampaigns.map((c) => (
                <article key={c.id} className="border border-line bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="border border-line bg-paper px-2 py-0.5 text-[10px] uppercase text-muted">
                        Closed
                      </span>
                      <h3 className="mt-2 font-serif text-2xl text-ink">{c.name}</h3>
                    </div>
                    <Link href={`/campaigns/${c.id}`} className="text-xs text-muted hover:text-ink underline">
                      View Summary
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </Shell>
    );
  }

  // -------------------------------------------------------------
  // Public / Creator Marketplace Directory View
  // -------------------------------------------------------------
  const allCampaigns = await prisma.campaign.findMany({
    where: {
      status: { notIn: ["DRAFT", "Draft"] },
      ...(category ? { category } : {}),
      ...(location ? { location: { contains: location } } : {}),
    },
    include: { brand: true },
    orderBy: { createdAt: "desc" },
  });

  const campaigns = allCampaigns.filter((c) => {
    if (q) {
      const matchText = `${c.name} ${c.brand.name} ${c.creatorNiche} ${c.category} ${c.deliverables}`.toLowerCase();
      if (!matchText.includes(q.toLowerCase())) return false;
    }
    if (platform) {
      const plats = platformsFromJson(c.platforms);
      if (!plats.includes(platform)) return false;
    }
    return true;
  });

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Marketplace Directory · Layer 02"
          title="Open Brand Campaigns"
          lede="Discover active briefs from brands. Apply directly with your proposed rate, portfolio, and creative pitch."
        />

        {user?.role === "BRAND" ? (
          <Link
            href="/campaigns"
            className="inline-flex min-h-11 items-center border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink"
          >
            ← Back to Brand Campaign Desk
          </Link>
        ) : null}
      </div>

      {/* Filter Bar */}
      <form method="GET" className="mt-8 border border-line bg-card p-6" suppressHydrationWarning>
        {forceDirectoryView ? <input type="hidden" name="view" value="directory" /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Search Briefs</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="E.g. recipe, tech review, walking..."
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
            <label className="text-xs font-medium tracking-wider text-muted uppercase">Location</label>
            <input
              type="text"
              name="location"
              defaultValue={location}
              placeholder="City or Anywhere"
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <p className="text-xs text-muted">
            Showing <strong className="text-ink">{campaigns.length}</strong> campaign{campaigns.length === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            {(q || category || platform || location) ? (
              <Link href={forceDirectoryView ? "/campaigns?view=directory" : "/campaigns"} className="border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">
                Clear Filters
              </Link>
            ) : null}
            <button
              type="submit"
              suppressHydrationWarning
              className="bg-ink px-4 py-1.5 text-xs tracking-wider text-paper uppercase hover:bg-oxblood"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </form>

      {/* Campaigns Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.length === 0 ? (
          <div className="col-span-full animate-fade-in border border-line bg-card p-12 text-center text-sm text-muted">
            <p className="font-serif text-2xl text-ink">No Active Campaigns Match</p>
            <p className="mt-2 text-xs">Try clearing search terms or selecting &ldquo;All Categories&rdquo;.</p>
            <div className="mt-6 flex justify-center">
              <Link
                href={forceDirectoryView ? "/campaigns?view=directory" : "/campaigns"}
                className="btn-tactile inline-flex min-h-11 items-center justify-center border border-ink bg-paper px-5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
              >
                Reset Campaign Filters
              </Link>
            </div>
          </div>
        ) : (
          campaigns.map((c, idx) => {
            const plats = platformsFromJson(c.platforms);
            const isPaused = c.status.toUpperCase() === "PAUSED";
            const isClosed = c.status.toUpperCase() === "CLOSED";

            return (
              <article
                key={c.id}
                style={{ animationDelay: `${Math.min(idx * 45, 600)}ms` }}
                className="group card-interactive animate-fade-up flex flex-col justify-between border border-line bg-card p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                      {c.category}
                    </span>
                    <span className="font-serif text-2xl font-medium text-ink">
                      {money(c.budgetMin)}–{money(c.budgetMax)}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl tracking-tight text-ink">
                    <Link href={`/campaigns/${c.id}`} className="transition-colors hover:text-oxblood">
                      {c.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    by{" "}
                    <Link
                      href={`/brands/${c.brand.id}`}
                      className="font-medium text-ink hover:text-oxblood hover:underline"
                    >
                      {c.brand.name}
                    </Link>{" "}
                    · {c.location}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-muted line-clamp-3">
                    {c.deliverables}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {plats.map((p) => (
                      <span key={p} className="border border-line bg-paper px-2 py-0.5 text-[11px] text-muted">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="btn-tactile group flex min-h-10 w-full items-center justify-center gap-1 border border-ink py-2 text-center text-xs tracking-wider uppercase transition-colors hover:bg-ink hover:text-paper"
                  >
                    <span>{isPaused ? "View Brief (Paused)" : isClosed ? "View Brief (Closed)" : "View Brief & Apply"}</span>
                    {!isPaused && !isClosed ? <span className="icon-arrow-motion">↗</span> : null}
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
