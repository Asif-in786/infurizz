import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageIntro, Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Messages · Conversations & Collaboration Inquiries",
  description: "Direct communication between creators and brands across applications and mutual matches.",
};

export default async function ConversationsInboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "UNASSIGNED") {
    redirect("/onboarding/role");
  }

  // Fetch conversations tied directly to the authenticated creator or brand
  const conversations = await prisma.conversation.findMany({
    where: user.creator
      ? {
          OR: [
            { application: { creatorId: user.creator.id } },
            { match: { creatorId: user.creator.id } },
          ],
        }
      : user.brand
      ? {
          OR: [
            { application: { campaign: { brandId: user.brand.id } } },
            { match: { campaign: { brandId: user.brand.id } } },
          ],
        }
      : { id: "none" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: true },
      },
      order: true,
      application: {
        include: {
          creator: true,
          campaign: { include: { brand: true } },
          order: true,
        },
      },
      match: {
        include: {
          creator: true,
          campaign: { include: { brand: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Communications · Layer 02"
          title="Direct Messages"
          lede="Conversations with brands and creators tied to active campaign applications, mutual matches, and contract orders."
        />

        {user.role === "CREATOR" ? (
          <Link
            href="/proposals"
            className="inline-flex min-h-11 items-center border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink"
          >
            Review Proposals Tracker ↗
          </Link>
        ) : user.role === "BRAND" ? (
          <Link
            href="/campaigns"
            className="inline-flex min-h-11 items-center border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase hover:border-ink"
          >
            Review Campaign Briefs ↗
          </Link>
        ) : null}
      </div>

      <div className="mt-8 space-y-4">
        {conversations.length === 0 ? (
          <div className="border border-line bg-card p-12 text-center text-sm text-muted">
            <p className="font-serif text-2xl text-ink">No conversations opened yet.</p>
            <p className="mt-2 text-xs leading-relaxed max-w-md mx-auto">
              {user.role === "CREATOR"
                ? "Conversations unlock when you apply to brand requirements or when a brand expresses mutual interest in your profile."
                : "Conversations unlock when creators submit pitches to your campaign briefs or when you match with a creator."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {user.role === "CREATOR" ? (
                <Link
                  href="/campaigns"
                  className="bg-ink px-5 py-2.5 text-xs uppercase tracking-wider text-paper hover:bg-oxblood"
                >
                  Browse Brand Requirements →
                </Link>
              ) : (
                <Link
                  href="/campaigns/new"
                  className="bg-ink px-5 py-2.5 text-xs uppercase tracking-wider text-paper hover:bg-oxblood"
                >
                  + Start a Campaign Brief
                </Link>
              )}
            </div>
          </div>
        ) : (
          conversations.map((c) => {
            const creator = c.application?.creator ?? c.match?.creator;
            const brand = c.application?.campaign.brand ?? c.match?.campaign.brand;
            const campaign = c.application?.campaign ?? c.match?.campaign;
            const order = c.order ?? c.application?.order;
            const lastMessage = c.messages[0];

            if (!creator || !brand || !campaign) return null;

            const otherPartyName = user.creator ? brand.name : creator.name;
            const otherPartyRole = user.creator ? "Brand" : "Creator";
            const lastMessageText = lastMessage
              ? lastMessage.body
              : "Conversation opened. Send a message to start coordinating.";
            const lastMessageTime = lastMessage
              ? new Date(lastMessage.createdAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })
              : new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });

            return (
              <article
                key={c.id}
                className="card-interactive animate-fade-up border border-line bg-card p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tracking-wider text-oxblood uppercase">
                        {otherPartyRole}
                      </span>
                      <span className="text-line">·</span>
                      <span className="text-xs text-muted">
                        Brief: <strong className="text-ink">{campaign.name}</strong>
                      </span>
                      {c.application ? (
                        <span className="border border-line bg-paper px-2 py-0.5 text-[10px] uppercase text-muted">
                          Proposal ({c.application.status})
                        </span>
                      ) : (
                        <span className="border border-oxblood/30 bg-oxblood/10 px-2 py-0.5 text-[10px] uppercase text-oxblood">
                          Mutual Match
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-2xl text-ink">
                      <Link href={`/conversations/${c.id}`} className="hover:text-oxblood">
                        {otherPartyName}
                      </Link>
                    </h3>

                    <p className="line-clamp-2 text-sm text-muted pt-1">
                      {lastMessageText}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-muted block">{lastMessageTime}</span>
                    {order ? (
                      <span className="mt-1 inline-block border border-ink bg-paper px-2 py-0.5 text-[10px] uppercase tracking-wider text-oxblood font-mono">
                        Order #{order.orderNumber} ({order.status})
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs">
                  <span className="text-muted text-[11px]">
                    {c.messages.length > 0 ? "Latest reply saved" : "Awaiting first response"}
                  </span>

                  <Link
                    href={`/conversations/${c.id}`}
                    className="font-medium text-ink underline underline-offset-4 hover:text-oxblood"
                  >
                    Open Full Discussion &amp; Worklog →
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
