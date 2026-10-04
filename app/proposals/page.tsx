import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageIntro, Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { money, platformsFromJson } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { withdrawApplication } from "@/lib/actions";

export const metadata: Metadata = {
  title: "My Proposals · Opportunities & Applications",
  description: "Track submitted proposals, brief review status, and active brand collaborations.",
};

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Only creators have the proposals tracker
  if (user.role === "BRAND") {
    redirect("/campaigns");
  }

  if (!user.creator) {
    redirect("/onboarding/role");
  }

  const params = await searchParams;
  const statusFilter = params.status?.toUpperCase() || "";

  const [applications, matches, orders] = await Promise.all([
    prisma.campaignApplication.findMany({
      where: { creatorId: user.creator.id },
      include: {
        campaign: { include: { brand: true } },
        service: true,
        conversation: true,
        order: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: { creatorId: user.creator.id },
      include: {
        campaign: { include: { brand: true } },
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { creatorId: user.creator.id },
      include: {
        campaign: { include: { brand: true } },
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Statistics
  const pendingCount = applications.filter((a) => a.status === "PENDING").length;
  const acceptedCount = applications.filter((a) => a.status === "ACCEPTED").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;
  const completedOrdersCount = orders.filter((o) => o.status === "COMPLETED").length;

  const filteredApplications = statusFilter
    ? applications.filter((a) => {
        if (statusFilter === "PENDING") return a.status === "PENDING";
        if (statusFilter === "ACCEPTED") return a.status === "ACCEPTED";
        if (statusFilter === "REJECTED") return a.status === "REJECTED";
        if (statusFilter === "COMPLETED") return a.order?.status === "COMPLETED";
        return true;
      })
    : applications;

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Layer 02 · Marketplace Opportunities"
          title="My Proposals"
          lede="Monitor pitches submitted to brand briefs, review status, mutual matches, and contract milestones."
        />

        <Link
          href="/campaigns"
          className="inline-flex min-h-11 items-center bg-ink px-4 text-xs tracking-[0.1em] text-paper uppercase transition-colors hover:bg-oxblood"
        >
          + Discover More Briefs
        </Link>
      </div>

      {/* Summary KPI Blocks */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="border border-line bg-card p-5">
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Total Proposals</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">{applications.length}</p>
          <span className="mt-1 block text-xs text-muted">Submitted across all brands</span>
        </div>

        <div className="border border-line bg-card p-5">
          <span className="text-[11px] font-semibold tracking-wider text-amber-800 uppercase">Under Review</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">{pendingCount}</p>
          <span className="mt-1 block text-xs text-muted">Awaiting brand decision</span>
        </div>

        <div className="border border-line bg-card p-5">
          <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">Accepted / Active</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">{acceptedCount}</p>
          <span className="mt-1 block text-xs text-muted">Contracts in progress</span>
        </div>

        <div className="border border-line bg-card p-5">
          <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Mutual Matches</span>
          <p className="mt-2 font-serif text-3xl font-medium text-ink">{matches.length}</p>
          <span className="mt-1 block text-xs text-muted">Conversations unlocked</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs">
        {[
          { label: "All Proposals", value: "" },
          { label: `Under Review (${pendingCount})`, value: "PENDING" },
          { label: `Accepted (${acceptedCount})`, value: "ACCEPTED" },
          { label: `Declined (${rejectedCount})`, value: "REJECTED" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/proposals?status=${tab.value}` : "/proposals"}
            className={`px-3 py-1.5 transition-colors ${
              statusFilter === tab.value
                ? "bg-ink text-paper font-medium"
                : "border border-line bg-card text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Proposals List */}
      <div className="mt-6 space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="border border-line bg-card p-12 text-center text-sm text-muted">
            <p className="font-serif text-2xl text-ink">No proposals match this filter.</p>
            <p className="mt-2 text-xs">
              Browse open brand requirements and submit creative proposals to start collaborating.
            </p>
            <Link
              href="/campaigns"
              className="mt-6 inline-block bg-ink px-5 py-2.5 text-xs uppercase tracking-wider text-paper hover:bg-oxblood"
            >
              Browse Open Brand Campaigns →
            </Link>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const plats = platformsFromJson(app.campaign.platforms);
            const isAccepted = app.status === "ACCEPTED";
            const isPending = app.status === "PENDING";
            const isRejected = app.status === "REJECTED";

            return (
              <article
                key={app.id}
                className="border border-line bg-card p-6 transition-all hover:border-ink/50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`border px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase ${
                          isAccepted
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                            : isPending
                            ? "border-amber-600 bg-amber-50 text-amber-800"
                            : isRejected
                            ? "border-line bg-paper text-muted"
                            : "border-line bg-paper text-muted"
                        }`}
                      >
                        {isPending ? "Under Review" : isAccepted ? "Accepted" : isRejected ? "Declined" : app.status}
                      </span>
                      <span className="text-xs text-muted">
                        Submitted {new Date(app.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <h3 className="mt-3 font-serif text-2xl tracking-tight text-ink">
                      <Link href={`/campaigns/${app.campaign.id}`} className="hover:text-oxblood">
                        {app.campaign.name}
                      </Link>
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Brand:{" "}
                      <Link
                        href={`/brands/${app.campaign.brand.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {app.campaign.brand.name}
                      </Link>{" "}
                      · Category: {app.campaign.category} · Audience target: {app.campaign.audienceRange}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-muted">Proposed Rate</span>
                    <p className="font-serif text-2xl font-medium text-ink">
                      {money(app.proposedRate)}
                    </p>
                    {app.service ? (
                      <span className="text-xs text-muted">
                        Package: {app.service.title}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Pitch Statement */}
                <div className="mt-4 rounded border border-line bg-paper p-4 text-xs leading-relaxed text-ink">
                  <span className="font-semibold text-oxblood uppercase tracking-wider block mb-1">
                    Your Creative Pitch:
                  </span>
                  <p className="whitespace-pre-line text-muted">{app.pitchMessage}</p>
                </div>

                {/* Actions & Next Steps */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    {app.conversation ? (
                      <Link
                        href={`/conversations/${app.conversation.id}`}
                        className="font-medium text-ink underline underline-offset-4 hover:text-oxblood"
                      >
                        💬 Open Conversation with {app.campaign.brand.name} →
                      </Link>
                    ) : null}

                    {app.order ? (
                      <Link
                        href={`/orders/${app.order.id}`}
                        className="font-medium text-oxblood underline underline-offset-4"
                      >
                        📄 View Contract Workspace ({app.order.orderNumber}) →
                      </Link>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/campaigns/${app.campaign.id}`}
                      className="text-muted hover:text-ink underline underline-offset-4"
                    >
                      View Campaign Brief
                    </Link>

                    {isPending ? (
                      <form action={withdrawApplication}>
                        <input type="hidden" name="applicationId" value={app.id} />
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!confirm("Are you sure you want to withdraw this proposal?")) e.preventDefault();
                          }}
                          className="text-oxblood hover:underline text-xs"
                        >
                          Withdraw
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </Shell>
  );
}
