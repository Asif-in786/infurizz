import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/page-intro";
import { Monogram } from "@/components/profile-bits";
import { getCurrentUser } from "@/lib/current";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cancelOrder, transitionOrderStatus } from "@/lib/actions";
import { primaryButton } from "@/components/form-styles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  return { title: order ? `Order ${order.orderNumber} · Collaboration Workspace` : "Order Workspace" };
}

export default async function OrderWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      creator: true,
      brand: true,
      campaign: true,
      service: true,
      conversation: true,
    },
  });

  if (!order) notFound();

  const isCreator = order.creator.userId === user.id;
  const isBrand = order.brand.userId === user.id;
  if (!isCreator && !isBrand) notFound();

  const isPending = order.status === "PENDING";
  const isReady = order.status === "READY_TO_START";
  const isInProgress = order.status === "IN_PROGRESS";
  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";

  const statusColor = isCompleted
    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
    : isCancelled
    ? "border-rose-400 bg-rose-50 text-rose-800"
    : isInProgress
    ? "border-indigo-600 bg-indigo-50 text-indigo-800"
    : isReady
    ? "border-amber-600 bg-amber-50 text-amber-800"
    : "border-oxblood bg-paper text-oxblood";

  return (
    <Shell>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-xs text-muted underline underline-offset-4 hover:text-ink">
          ← Back to Account
        </Link>
        <span className="text-xs text-muted">/</span>
        <span className="text-xs tracking-[0.18em] text-oxblood uppercase">
          Order Workspace
        </span>
      </div>

      {/* Order Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="font-mono text-xs text-muted">{order.orderNumber}</span>
          <h1 className="mt-1 font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.95] tracking-tight">
            Collaboration Workspace
          </h1>
          <p className="mt-2 text-sm text-muted">
            Formal agreement for <strong className="text-ink">{order.campaign.name}</strong>
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className={`border px-3 py-1 text-xs tracking-wider uppercase ${statusColor}`}>
            {order.status}
          </span>
          <span className="text-xs text-muted">
            Created on {new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Participants Card */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-4 border border-line bg-card p-5">
          <Monogram name={order.creator.name} />
          <div>
            <p className="text-xs font-medium text-muted uppercase">Creator</p>
            <h3 className="font-serif text-xl">
              <Link
                href={`/creators/${order.creator.username || order.creator.id}`}
                className="hover:text-oxblood"
              >
                {order.creator.name}
              </Link>
            </h3>
            {order.creator.username ? (
              <p className="font-mono text-xs text-oxblood">@{order.creator.username}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted">{order.creator.category} · {order.creator.location}</p>
          </div>
        </div>

        <div className="flex items-start gap-4 border border-line bg-card p-5">
          <div className="flex h-12 w-12 items-center justify-center border border-line bg-paper font-serif text-lg">
            {order.brand.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase">Brand</p>
            <h3 className="font-serif text-xl">
              <Link href={`/campaigns/${order.campaignId}`} className="hover:text-oxblood">
                {order.brand.name}
              </Link>
            </h3>
            <p className="mt-1 text-xs text-muted">{order.brand.location}</p>
          </div>
        </div>
      </div>

      {/* Immutable Scope Snapshot */}
      <section className="mt-8 border border-ink bg-card p-6">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Contract Terms</p>
            <h2 className="mt-1 font-serif text-2xl">Agreed Commercial Snapshot</h2>
          </div>
          <p className="text-xs text-muted">Immutable scope locked at application acceptance</p>
        </div>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-muted uppercase">Agreed Rate</dt>
            <dd className="mt-1 font-serif text-3xl text-ink">
              {money(order.agreedPriceInCents / 100)}
            </dd>
            <span className="text-[11px] text-muted">{order.currency}</span>
          </div>

          <div>
            <dt className="text-xs font-medium text-muted uppercase">Target Deadline</dt>
            <dd className="mt-1 text-sm font-medium text-ink">
              {new Date(order.deadlineAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
            <span className="text-[11px] text-muted">
              {order.turnaroundDaysSnapshot} calendar day turnaround
            </span>
          </div>

          <div>
            <dt className="text-xs font-medium text-muted uppercase">Revisions</dt>
            <dd className="mt-1 text-sm font-medium text-ink">
              {order.revisionsUsed} used of {order.revisionsIncluded} included
            </dd>
            <span className="text-[11px] text-muted">Protected against scope creep</span>
          </div>

          <div>
            <dt className="text-xs font-medium text-muted uppercase">Service Package</dt>
            <dd className="mt-1 text-sm font-medium text-ink">
              {order.service ? order.service.title : "Custom Pitch Scope"}
            </dd>
            <span className="text-[11px] text-muted">
              {order.service ? order.service.platform : "As specified in campaign brief"}
            </span>
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-4">
          <dt className="text-xs font-medium text-muted uppercase">Agreed Deliverables</dt>
          <dd className="mt-2 rounded border border-line bg-paper p-4 text-sm leading-6 text-ink whitespace-pre-wrap">
            {order.deliverablesSnapshot}
          </dd>
        </div>
      </section>

      {/* Collaboration Actions & State Transitions */}
      <section className="mt-8 border border-line bg-card p-6">
        <h3 className="font-serif text-xl">Collaboration Actions</h3>
        <p className="mt-1 text-xs text-muted">
          Manage collaboration progress and coordinate deliverables with your partner.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {order.conversationId ? (
            <Link
              href={`/conversations/${order.conversationId}`}
              className="inline-flex min-h-11 items-center bg-ink px-5 text-xs tracking-[0.1em] text-paper uppercase transition-colors hover:bg-oxblood"
            >
              Open Collaboration Conversation ↗
            </Link>
          ) : null}

          {/* PENDING -> READY_TO_START */}
          {isPending && isBrand ? (
            <form action={transitionOrderStatus}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="targetStatus" value="READY_TO_START" />
              <button type="submit" className={primaryButton}>
                Authorize & Ready to Start
              </button>
            </form>
          ) : null}

          {/* READY_TO_START -> IN_PROGRESS (Creator starts work) */}
          {isReady && isCreator ? (
            <form action={transitionOrderStatus}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="targetStatus" value="IN_PROGRESS" />
              <button type="submit" className={primaryButton}>
                Acknowledge & Start Production
              </button>
            </form>
          ) : null}

          {/* Pre-work cancellation (while PENDING or READY_TO_START) */}
          {(isPending || isReady) ? (
            <form action={cancelOrder} className="flex items-center gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                className="text-xs text-rose-700 underline underline-offset-4 hover:text-rose-900"
              >
                Cancel Order (Pre-Work)
              </button>
            </form>
          ) : null}
        </div>

        {isCancelled ? (
          <div className="mt-6 rounded border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800">
            <strong>Order Cancelled:</strong> {order.cancellationReason || "Cancelled before work began."}{" "}
            {order.cancelledAt
              ? `on ${new Date(order.cancelledAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
              : ""}
          </div>
        ) : null}

        {isInProgress ? (
          <div className="mt-6 rounded border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-900">
            <strong>Production in Progress:</strong> Creator is working on agreed deliverables. Target completion:{" "}
            {new Date(order.deadlineAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}.
          </div>
        ) : null}
      </section>
    </Shell>
  );
}
