import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandEditor } from "@/components/account-forms";
import { CreatorEditor } from "@/components/creator-editor";
import { CreatorServicesManager } from "@/components/creator-services";
import { CreatorPortfolioManager } from "@/components/creator-portfolio";
import { PageIntro, Shell } from "@/components/page-intro";
import { SampleMark } from "@/components/profile-bits";
import { getCurrentUser } from "@/lib/current";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "UNASSIGNED") redirect("/onboarding/role");

  const [
    creatorInterests,
    brandInterests,
    creatorMatches,
    brandMatches,
    creatorServices,
    creatorPortfolio,
    creatorApplications,
    brandApplications,
    creatorOrders,
    brandOrders,
  ] = await Promise.all([
    user.creator
      ? prisma.interest.findMany({
          where: { creatorId: user.creator.id, fromRole: "CREATOR" },
          include: { campaign: { include: { brand: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    user.brand
      ? prisma.interest.findMany({
          where: { fromRole: "BRAND", campaign: { brandId: user.brand.id } },
          include: { campaign: true, creator: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    user.creator
      ? prisma.match.findMany({
          where: { creatorId: user.creator.id },
          include: { campaign: { include: { brand: true } } },
        })
      : Promise.resolve([]),
    user.brand
      ? prisma.match.findMany({
          where: { campaign: { brandId: user.brand.id } },
          include: { campaign: true, creator: true },
        })
      : Promise.resolve([]),
    user.creator
      ? prisma.creatorService.findMany({
          where: { creatorId: user.creator.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    user.creator
      ? prisma.creatorPortfolioItem.findMany({
          where: { creatorId: user.creator.id },
          orderBy: { sortOrder: "asc" },
        })
      : Promise.resolve([]),
    user.creator
      ? prisma.campaignApplication.findMany({
          where: { creatorId: user.creator.id },
          include: { campaign: { include: { brand: true } }, service: true, conversation: true, order: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    user.brand
      ? prisma.campaignApplication.findMany({
          where: { campaign: { brandId: user.brand.id } },
          include: { campaign: true, creator: true, service: true, conversation: true, order: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    user.creator
      ? prisma.order.findMany({
          where: { creatorId: user.creator.id },
          include: { campaign: { include: { brand: true } }, conversation: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    user.brand
      ? prisma.order.findMany({
          where: { brandId: user.brand.id },
          include: { campaign: true, creator: true, conversation: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const matchedCampaigns = new Set(creatorMatches.map((match) => match.campaignId));
  const matchedPairs = new Set(brandMatches.map((match) => `${match.creatorId}:${match.campaignId}`));

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Account"
          title={user.creator?.name ?? user.brand?.name ?? "Account"}
          lede={
            user.creator?.isDemo || user.brand?.isDemo
              ? "This profile is part of the sample set."
              : "Saved in the local database for this prototype."
          }
        />
        {user.creator ? (
          <Link
            href={`/creators/${user.creator.username || user.creator.id}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm underline underline-offset-4 hover:text-oxblood"
          >
            View public storefront ↗
          </Link>
        ) : null}
      </div>

      <SampleMark show={Boolean(user.creator?.isDemo || user.brand?.isDemo)} />

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-12">
          <div>
            <h2 className="mb-4 font-serif text-3xl">Profile Settings</h2>
            {user.creator ? (
              <CreatorEditor
                creator={{
                  name: user.creator.name,
                  username: user.creator.username,
                  avatarUrl: user.creator.avatarUrl,
                  bio: user.creator.bio,
                  category: user.creator.category,
                  location: user.creator.location,
                  niche: user.creator.niche,
                  audienceRange: user.creator.audienceRange,
                  collabPrefs: user.creator.collabPrefs,
                  languages: user.creator.languages,
                  contentTypes: user.creator.contentTypes,
                  socials: user.creator.socials.map((s) => ({
                    platform: s.platform,
                    handle: s.handle,
                    audienceNote: s.audienceNote,
                    isSample: s.isSample,
                  })),
                }}
              />
            ) : user.brand ? (
              <BrandEditor brand={user.brand} />
            ) : null}
          </div>

          {user.creator ? (
            <>
              <CreatorServicesManager services={creatorServices} />
              <CreatorPortfolioManager items={creatorPortfolio} />
            </>
          ) : null}
        </section>

        <div className="space-y-10">
          {/* Active Orders & Collaborations */}
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-3xl">Collaborations & Orders</h2>
              <span className="text-xs text-muted">
                {user.creator ? `${creatorOrders.length} total` : `${brandOrders.length} total`}
              </span>
            </div>

            {user.creator ? (
              <ul className="mt-4 space-y-3 text-sm">
                {creatorOrders.length === 0 ? (
                  <li className="border border-line bg-card p-4 text-muted">
                    No active collaborations yet. When a brand accepts your application, your contract workspace will appear here.
                  </li>
                ) : null}
                {creatorOrders.map((order) => (
                  <li key={order.id} className="border border-ink bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted">{order.orderNumber}</span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium hover:text-oxblood underline underline-offset-4"
                        >
                          {order.campaign.name}
                        </Link>
                      </div>
                      <span className="border border-ink bg-paper px-2 py-0.5 text-xs text-oxblood uppercase font-medium">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Brand: {order.campaign.brand.name} · Agreed: {money(order.agreedPriceInCents / 100)} · Target Deadline:{" "}
                      {new Date(order.deadlineAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <div className="mt-3 flex gap-3 text-xs">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-oxblood underline underline-offset-4 font-medium"
                      >
                        Open Workspace ↗
                      </Link>
                      {order.conversationId ? (
                        <Link
                          href={`/conversations/${order.conversationId}`}
                          className="underline underline-offset-4 hover:text-oxblood"
                        >
                          Messages ↗
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : user.brand ? (
              <ul className="mt-4 space-y-3 text-sm">
                {brandOrders.length === 0 ? (
                  <li className="border border-line bg-card p-4 text-muted">
                    No active orders yet. Accepting a creator&apos;s application creates an order contract and workspace here.
                  </li>
                ) : null}
                {brandOrders.map((order) => (
                  <li key={order.id} className="border border-ink bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted">{order.orderNumber}</span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium hover:text-oxblood underline underline-offset-4"
                        >
                          {order.campaign.name}
                        </Link>
                      </div>
                      <span className="border border-ink bg-paper px-2 py-0.5 text-xs text-oxblood uppercase font-medium">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Creator: {order.creator.name} · Agreed: {money(order.agreedPriceInCents / 100)} · Target Deadline:{" "}
                      {new Date(order.deadlineAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <div className="mt-3 flex gap-3 text-xs">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-oxblood underline underline-offset-4 font-medium"
                      >
                        Open Workspace ↗
                      </Link>
                      {order.conversationId ? (
                        <Link
                          href={`/conversations/${order.conversationId}`}
                          className="underline underline-offset-4 hover:text-oxblood"
                        >
                          Messages ↗
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* Marketplace Applications */}
          <section>
            <h2 className="font-serif text-3xl">Marketplace Applications</h2>
            {user.creator ? (
              <ul className="mt-4 space-y-3 text-sm">
                {creatorApplications.length === 0 ? (
                  <li className="border border-line bg-card p-4 text-muted">
                    You haven&apos;t applied to any campaigns yet.{" "}
                    <Link href="/campaigns" className="text-ink underline underline-offset-4">
                      Browse open briefs ↗
                    </Link>
                  </li>
                ) : null}
                {creatorApplications.map((app) => (
                  <li key={app.id} className="border border-line bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/campaigns/${app.campaign.id}`}
                        className="font-medium underline underline-offset-4 hover:text-oxblood"
                      >
                        {app.campaign.name}
                      </Link>
                      <span className="border border-line px-2 py-0.5 text-xs text-muted uppercase">
                        {app.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {app.campaign.brand.name} · Proposed rate: {money(app.proposedRate)}
                    </p>
                    {app.status === "ACCEPTED" ? (
                      <div className="mt-3 flex gap-3 text-xs">
                        {app.order ? (
                          <Link
                            href={`/orders/${app.order.id}`}
                            className="font-medium text-oxblood underline underline-offset-4"
                          >
                            Order Workspace ↗
                          </Link>
                        ) : null}
                        {app.conversation ? (
                          <Link
                            href={`/conversations/${app.conversation.id}`}
                            className="underline underline-offset-4 hover:text-oxblood"
                          >
                            Open Conversation ↗
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : user.brand ? (
              <ul className="mt-4 space-y-3 text-sm">
                {brandApplications.length === 0 ? (
                  <li className="border border-line bg-card p-4 text-muted">
                    No applications received yet.
                  </li>
                ) : null}
                {brandApplications.map((app) => (
                  <li key={app.id} className="border border-line bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{app.creator.name}</span>
                      <span className="border border-line px-2 py-0.5 text-xs text-muted uppercase">
                        {app.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Campaign: {app.campaign.name} · Proposed: {money(app.proposedRate)}
                    </p>
                    <div className="mt-3 flex gap-3 text-xs">
                      <Link
                        href={`/campaigns/${app.campaignId}`}
                        className="underline underline-offset-4 hover:text-oxblood"
                      >
                        Review on Campaign ↗
                      </Link>
                      {app.status === "ACCEPTED" && app.order ? (
                        <Link
                          href={`/orders/${app.order.id}`}
                          className="font-medium text-oxblood underline underline-offset-4"
                        >
                          Order Workspace ↗
                        </Link>
                      ) : null}
                      {app.status === "ACCEPTED" && app.conversation ? (
                        <Link
                          href={`/conversations/${app.conversation.id}`}
                          className="underline underline-offset-4 hover:text-oxblood"
                        >
                          Open Conversation ↗
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {user.brand ? (
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-3xl">Your campaigns</h2>
                <Link className="text-sm underline underline-offset-4" href="/campaigns/new">
                  New campaign
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {user.brand.campaigns.map((campaign) => (
                  <li key={campaign.id} className="py-3 text-sm">
                    <Link href={`/campaigns/${campaign.id}`} className="hover:text-oxblood">
                      {campaign.name}
                    </Link>
                    <span className="mt-1 block text-muted">
                      {campaign.status}
                      {campaign.isDemo ? " · Sample" : ""}
                    </span>
                  </li>
                ))}
                {user.brand.campaigns.length === 0 ? (
                  <li className="py-3 text-sm text-muted">No campaigns yet.</li>
                ) : null}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="font-serif text-3xl">Interest waiting</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {user.creator
                ? creatorInterests.filter((interest) => !matchedCampaigns.has(interest.campaignId)).length === 0
                  ? <li className="text-muted">No one-sided interest right now.</li>
                  : creatorInterests
                      .filter((interest) => !matchedCampaigns.has(interest.campaignId))
                      .map((interest) => (
                        <li key={interest.id}>
                          You are interested in{" "}
                          <Link className="underline underline-offset-4" href={`/campaigns/${interest.campaign.id}`}>
                            {interest.campaign.name}
                          </Link>{" "}
                          from {interest.campaign.brand.name}. Waiting on the brand.
                        </li>
                      ))
                : brandInterests.filter((interest) => !matchedPairs.has(`${interest.creatorId}:${interest.campaignId}`)).length === 0
                  ? <li className="text-muted">No one-sided interest right now.</li>
                  : brandInterests
                      .filter((interest) => !matchedPairs.has(`${interest.creatorId}:${interest.campaignId}`))
                      .map((interest) => (
                        <li key={interest.id}>
                          You invited{" "}
                          <Link className="underline underline-offset-4" href={`/creators/${interest.creator.id}`}>
                            {interest.creator.name}
                          </Link>{" "}
                          to {interest.campaign.name}.
                        </li>
                      ))}
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Mutual Matches</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {creatorMatches.length + brandMatches.length === 0 ? (
                <li className="text-muted">No mutual matches yet.</li>
              ) : null}
              {creatorMatches.map((match) => (
                <li key={match.id}>
                  <Link className="underline underline-offset-4 hover:text-oxblood" href={`/matches/${match.id}`}>
                    {match.campaign.brand.name} · {match.campaign.name} ↗
                  </Link>
                </li>
              ))}
              {brandMatches.map((match) => (
                <li key={match.id}>
                  <Link className="underline underline-offset-4 hover:text-oxblood" href={`/matches/${match.id}`}>
                    {match.creator.name} · {match.campaign.name} ↗
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </Shell>
  );
}
