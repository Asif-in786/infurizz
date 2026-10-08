import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageIntro, Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { prisma } from "@/lib/prisma";

import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Matches",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matches = await prisma.match.findMany({
    where: user.creator
      ? { creatorId: user.creator.id }
      : user.brand
        ? { campaign: { brandId: user.brand.id } }
        : { id: "none" },
    include: { campaign: { include: { brand: true } }, creator: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell>
      <PageIntro
        eyebrow="Matches"
        title="Mutual interest."
        lede="Each row is a creator and a campaign where both sides expressed reciprocal interest."
      />
      {matches.length === 0 ? (
        <div className="animate-fade-in my-10 border border-line bg-card p-12 text-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
            Mutual Matchmaking Desk
          </span>
          <h3 className="mt-2 font-serif text-3xl text-ink">No Mutual Matches Yet</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            A match appears automatically when both a creator and a brand express reciprocal interest on a campaign brief.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/discover"
              className="btn-tactile inline-flex min-h-11 items-center justify-center bg-ink px-5 text-xs uppercase tracking-wider text-paper hover:bg-oxblood"
            >
              Explore Directory
            </Link>
            <Link
              href="/campaigns"
              className="btn-tactile inline-flex min-h-11 items-center justify-center border border-ink/20 bg-paper px-5 text-xs uppercase tracking-wider text-ink hover:border-ink"
            >
              Browse Campaign Briefs
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {matches.map((match, idx) => (
            <li
              key={match.id}
              style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
              className="card-interactive animate-fade-up flex flex-col gap-4 p-5 transition-colors hover:bg-card/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-oxblood font-semibold">
                  Verified Mutual Match
                </span>
                <p className="mt-1 font-serif text-2xl text-ink">
                  {match.creator.name} &amp; {match.campaign.brand.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted">
                  <span>Campaign: <strong className="text-ink">{match.campaign.name}</strong></span>
                  <span>·</span>
                  <span>Category: {match.campaign.category}</span>
                  <span>·</span>
                  <span className="font-mono">Budget: {money(match.campaign.budgetMin)}–{money(match.campaign.budgetMax)}</span>
                </div>
              </div>
              <Link
                className="btn-tactile inline-flex min-h-10 items-center justify-center bg-ink px-5 text-xs uppercase tracking-widest text-paper hover:bg-oxblood transition-colors"
                href={`/matches/${match.id}`}
              >
                Open Desk →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
