import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageForm } from "@/components/account-forms";
import { Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { prisma } from "@/lib/prisma";

import { RevolvingBorder } from "@/components/revolving-border";

export const metadata: Metadata = {
  title: "Conversation",
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
      creator: true,
      campaign: { include: { brand: true } },
      conversation: { include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } } },
    },
  });
  if (!match?.conversation) notFound();
  const allowed = match.creator.userId === user.id || match.campaign.brand.userId === user.id;
  if (!allowed) notFound();

  return (
    <Shell>
      <div className="animate-fade-up">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Conversation Desk</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[0.95]">
          {match.creator.name} and {match.campaign.brand.name}
        </h1>

        <RevolvingBorder className="mt-6 max-w-2xl" contentClassName="bg-card p-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
            Mutual Agreement Verified
          </span>
          <h2 className="mt-1 font-serif text-2xl text-ink">
            Collaboration Unlocked
          </h2>
          <p className="mt-2 text-sm text-muted">
            Both parties have mutually agreed to connect on <strong>{match.campaign.name}</strong>. Discuss deliverables, timelines, and sample shipments below.
          </p>
          <div className="mt-4 flex gap-4 text-xs font-mono uppercase tracking-wider">
            <Link className="text-oxblood underline underline-offset-4 hover:text-ink" href={`/campaigns/${match.campaignId}`}>
              Campaign Brief ↗
            </Link>
            <Link className="text-oxblood underline underline-offset-4 hover:text-ink" href={`/creators/${match.creatorId}`}>
              Creator Storefront ↗
            </Link>
          </div>
        </RevolvingBorder>
      </div>

      <ol className="mt-10 max-w-2xl space-y-4">
        {match.conversation.messages.length === 0 ? (
          <li className="text-sm text-muted">No messages yet.</li>
        ) : null}
        {match.conversation.messages.map((message, idx) => {
          const mine = message.senderId === user.id;
          const label = message.sender.role === "BRAND" ? match.campaign.brand.name : match.creator.name;
          return (
            <li
              key={message.id}
              style={{ animationDelay: `${Math.min(idx * 30, 400)}ms` }}
              className={`animate-fade-up max-w-[min(100%,32rem)] border-t border-line py-4 ${mine ? "ml-auto border-ink" : ""}`}
            >
              <p className="text-xs tracking-[0.12em] text-muted uppercase">{label}</p>
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-ink">{message.body}</p>
            </li>
          );
        })}
      </ol>
      <div className="mt-8 max-w-2xl">
        <MessageForm key={match.conversation.messages.length} matchId={match.id} />
      </div>
    </Shell>
  );
}
