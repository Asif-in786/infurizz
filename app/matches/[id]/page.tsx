import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageForm } from "@/components/account-forms";
import { Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { compatibility } from "@/lib/compatibility";
import { money, platformsFromJson } from "@/lib/format";
import { RevolvingBorder } from "@/components/revolving-border";

export const metadata: Metadata = {
  title: "Conversation Desk · Mutual Match",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      creator: { include: { socials: true } },
      campaign: { include: { brand: true } },
      conversation: {
        include: {
          messages: {
            include: { sender: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!match?.conversation) notFound();
  const allowed = match.creator.userId === user.id || match.campaign.brand.userId === user.id;
  if (!allowed) notFound();

  const campaignPlatforms = platformsFromJson(match.campaign.platforms);
  const fit = compatibility({
    creatorCategory: match.creator.category,
    creatorNiche: match.creator.niche,
    creatorLocation: match.creator.location,
    creatorAudience: match.creator.audienceRange,
    creatorPlatforms: match.creator.socials.map((s) => s.platform),
    campaignCategory: match.campaign.category,
    campaignNiche: match.campaign.creatorNiche,
    campaignLocation: match.campaign.location,
    campaignAudience: match.campaign.audienceRange,
    campaignPlatforms,
  });

  return (
    <Shell>
      <div className="flex items-center gap-3 text-xs text-muted">
        <Link href="/matches" className="underline underline-offset-4 hover:text-ink">
          ← Back to Matches
        </Link>
        <span>/</span>
        <span className="font-mono uppercase tracking-wider text-oxblood font-semibold">
          Match #{match.id.slice(0, 8)}
        </span>
      </div>

      <div className="mt-4 animate-fade-up">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="max-w-3xl font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-[0.95] text-ink">
            {match.creator.name} &amp; {match.campaign.brand.name}
          </h1>
          <span className="border border-emerald-600 bg-emerald-50 px-3 py-1 text-xs uppercase font-mono tracking-wider text-emerald-800">
            ✓ Mutual Match Verified
          </span>
        </div>

        <RevolvingBorder className="mt-6 max-w-3xl" contentClassName="bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
                Collaboration Agreement
              </span>
              <h2 className="mt-1 font-serif text-2xl text-ink">
                Campaign: {match.campaign.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="font-serif text-2xl text-ink font-medium">
                {money(match.campaign.budgetMin)}–{money(match.campaign.budgetMax)}
              </span>
              <p className="text-[10px] text-muted font-mono uppercase">Budget Range</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs text-muted">
            <div>
              <span className="font-medium text-ink">Required Deliverables:</span>
              <p className="mt-0.5 leading-relaxed">{match.campaign.deliverables}</p>
            </div>
            <div>
              <span className="font-medium text-ink">Target Platforms:</span>
              <p className="mt-0.5 leading-relaxed font-mono">{campaignPlatforms.join(", ") || "All"}</p>
            </div>
          </div>

          {/* Compatibility Breakdown Chips */}
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                Deterministic Fit Score: <strong className="text-oxblood">{fit.score}%</strong>
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {fit.parts
                  .filter((p) => p.awarded > 0)
                  .map((p) => (
                    <span
                      key={p.label}
                      className="border border-line bg-paper px-2 py-0.5 text-[10px] font-mono text-ink"
                    >
                      ✓ {p.label}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-xs font-mono uppercase tracking-wider border-t border-line pt-4">
            <Link className="text-oxblood underline underline-offset-4 hover:text-ink font-medium" href={`/campaigns/${match.campaignId}`}>
              Campaign Brief ↗
            </Link>
            <Link className="text-oxblood underline underline-offset-4 hover:text-ink font-medium" href={`/creators/${match.creatorId}`}>
              Creator Storefront ↗
            </Link>
            <Link className="text-muted underline underline-offset-4 hover:text-ink" href={`/conversations/${match.conversation.id}`}>
              Direct Messages View ↗
            </Link>
          </div>
        </RevolvingBorder>
      </div>

      {/* Messages Feed */}
      <section className="mt-10 max-w-3xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-xs tracking-[0.16em] text-muted uppercase">Collaboration Dialogue</h3>
          <span className="text-xs font-mono text-muted">
            {match.conversation.messages.length} message{match.conversation.messages.length === 1 ? "" : "s"}
          </span>
        </div>

        <ol className="mt-6 space-y-4">
          {match.conversation.messages.length === 0 ? (
            <li className="border border-line bg-card p-6 text-center text-sm text-muted">
              <p className="font-serif text-xl text-ink">Collaboration Desk Unlocked</p>
              <p className="mt-2 text-xs max-w-md mx-auto leading-relaxed">
                Both parties have confirmed mutual interest. Discuss production timelines, creative treatment, sample shipments, or deliverable drafts below.
              </p>
            </li>
          ) : null}

          {match.conversation.messages.map((message, idx) => {
            const mine = message.senderId === user.id;
            const label = message.sender.role === "BRAND" ? match.campaign.brand.name : match.creator.name;

            return (
              <li
                key={message.id}
                style={{ animationDelay: `${Math.min(idx * 30, 400)}ms` }}
                className={`animate-fade-up max-w-[min(100%,32rem)] p-4 border ${
                  mine
                    ? "ml-auto border-ink bg-card shadow-sm"
                    : "border-line bg-paper"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs text-muted">
                  <span className="font-medium tracking-[0.1em] text-ink uppercase">
                    {label} {mine ? "(You)" : ""}
                  </span>
                  <span className="font-mono text-[11px]">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-ink">{message.body}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 border-t border-line pt-6">
          <MessageForm key={match.conversation.messages.length} matchId={match.id} />
        </div>
      </section>
    </Shell>
  );
}
