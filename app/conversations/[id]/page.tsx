import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageForm } from "@/components/account-forms";
import { Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Conversation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      order: true,
      application: {
        include: {
          creator: true,
          campaign: { include: { brand: true } },
          service: true,
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
  });

  if (!conversation) notFound();

  const creator = conversation.application?.creator ?? conversation.match?.creator;
  const brand = conversation.application?.campaign.brand ?? conversation.match?.campaign.brand;
  const campaign = conversation.application?.campaign ?? conversation.match?.campaign;
  const order = conversation.order ?? conversation.application?.order;

  if (!creator || !brand || !campaign) notFound();

  const isCreatorUser = creator.userId === user.id;
  const isBrandUser = brand.userId === user.id;
  if (!isCreatorUser && !isBrandUser) notFound();

  const isFromApplication = Boolean(conversation.application);

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <Link href="/conversations" className="text-xs text-muted underline underline-offset-4 hover:text-ink">
          ← Back to Messages
        </Link>
        <span className="text-xs text-muted">/</span>
        <span className="text-xs tracking-[0.18em] text-oxblood uppercase">
          {isFromApplication ? "Marketplace Conversation" : "Mutual Match Conversation"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] tracking-tight">
          {creator.name} & {brand.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-xs">
          {order ? (
            <Link
              className="font-medium text-oxblood underline underline-offset-4 hover:text-ink"
              href={`/orders/${order.id}`}
            >
              Order #{order.orderNumber} Workspace ↗
            </Link>
          ) : null}
          <Link
            className="underline underline-offset-4 hover:text-oxblood"
            href={`/campaigns/${campaign.id}`}
          >
            Campaign Brief ↗
          </Link>
          <Link
            className="underline underline-offset-4 hover:text-oxblood"
            href={`/creators/${creator.username || creator.id}`}
          >
            Creator Storefront ↗
          </Link>
        </div>
      </div>

      {/* Marketplace Context Card */}
      {conversation.application ? (
        <section className="mt-8 border border-ink bg-card p-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Collaboration Brief</p>
              <h2 className="mt-1 font-serif text-2xl">Accepted Application Context</h2>
            </div>
            <span className="border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 uppercase">
              Accepted
            </span>
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Agreed Rate</dt>
              <dd className="mt-1 font-serif text-2xl text-ink">
                {money(conversation.application.proposedRate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Campaign Deliverables</dt>
              <dd className="mt-1 text-sm text-ink">{campaign.deliverables}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Package Selected</dt>
              <dd className="mt-1 text-sm text-ink">
                {conversation.application.service
                  ? `${conversation.application.service.title} (${conversation.application.service.turnaroundDays}d turnaround)`
                  : "Custom Scope Proposal"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-line pt-3">
            <p className="text-xs font-medium text-muted">Application Pitch:</p>
            <p className="mt-1 text-xs leading-5 text-muted italic whitespace-pre-wrap">
              &ldquo;{conversation.application.pitchMessage}&rdquo;
            </p>
          </div>

          {order ? (
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted">Order:</span>
                <span className="font-mono text-xs">{order.orderNumber}</span>
                <span className="border border-line px-1.5 py-0.5 text-[10px] uppercase text-oxblood font-medium">
                  {order.status}
                </span>
              </div>
              <Link
                href={`/orders/${order.id}`}
                className="text-xs font-medium text-oxblood underline underline-offset-4 hover:text-ink"
              >
                Open Order Workspace ↗
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="mt-6 border border-line bg-card p-4 text-sm text-muted">
          Mutual interest matched for campaign: <strong className="text-ink">{campaign.name}</strong>.
        </div>
      )}

      {/* Message Thread */}
      <section className="mt-10">
        <h3 className="text-xs tracking-[0.16em] text-muted uppercase">Messages</h3>
        <ol className="mt-4 max-w-3xl space-y-4">
          {conversation.messages.length === 0 ? (
            <li className="border border-line bg-card p-6 text-center text-sm text-muted">
              No messages yet in this conversation. Start the dialogue below.
            </li>
          ) : null}

          {conversation.messages.map((message) => {
            const mine = message.senderId === user.id;
            const label = message.sender.role === "BRAND" ? brand.name : creator.name;

            return (
              <li
                key={message.id}
                className={`max-w-[min(100%,32rem)] border-t border-line py-4 ${
                  mine ? "ml-auto border-ink bg-card px-4" : "bg-paper"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs text-muted">
                  <span className="font-medium tracking-[0.1em] text-ink uppercase">{label}</span>
                  <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">{message.body}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 max-w-3xl">
          <MessageForm key={conversation.messages.length} conversationId={conversation.id} />
        </div>
      </section>
    </Shell>
  );
}
