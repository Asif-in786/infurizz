"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  applyToCampaign,
  withdrawApplication,
  reviewApplication,
  type FormState,
} from "@/lib/actions";
import { FormError, inputClass, labelClass, primaryButton, quietButton } from "@/components/form-styles";
import { money } from "@/lib/format";
import { Monogram } from "@/components/profile-bits";

export type CreatorServiceOption = {
  id: string;
  title: string;
  platform: string;
  price: number;
  turnaroundDays: number;
  deliverables: string;
};

export type ApplicationItem = {
  id: string;
  proposedRate: number;
  pitchMessage: string;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    username: string | null;
    category: string;
    location: string;
  };
  service?: {
    id: string;
    title: string;
    platform: string;
    price: number;
    turnaroundDays: number;
    deliverables: string;
  } | null;
  conversation?: {
    id: string;
  } | null;
};

export function CreatorApplicationForm({
  campaignId,
  services,
  budgetMin,
  budgetMax,
  existingApplication,
}: {
  campaignId: string;
  services: CreatorServiceOption[];
  budgetMin: number;
  budgetMax: number;
  existingApplication?: {
    id: string;
    status: string;
    proposedRate: number;
    pitchMessage: string;
    service?: { title: string; platform: string } | null;
    conversation?: { id: string } | null;
  } | null;
}) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [rate, setRate] = useState<number>(budgetMin);
  const [state, formAction, pending] = useActionState(applyToCampaign, {} as FormState);

  // If already applied, show current status card
  if (existingApplication) {
    const { status, proposedRate, pitchMessage, service, conversation } = existingApplication;
    const isPending = status === "PENDING";
    const isAccepted = status === "ACCEPTED";
    const isRejected = status === "REJECTED";
    const isWithdrawn = status === "WITHDRAWN";

    return (
      <div className="border border-line bg-card p-6">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Your Application</p>
            <h3 className="mt-1 font-serif text-2xl">Application Status</h3>
          </div>
          <span
            className={`border px-3 py-1 text-xs tracking-wider uppercase ${
              isAccepted
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : isRejected
                ? "border-rose-400 bg-rose-50 text-rose-800"
                : isWithdrawn
                ? "border-line bg-paper text-muted"
                : "border-oxblood bg-paper text-oxblood"
            }`}
          >
            {status}
          </span>
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Proposed Rate</dt>
            <dd className="font-serif text-xl text-ink">{money(proposedRate)}</dd>
          </div>
          {service ? (
            <div>
              <dt className="text-xs text-muted">Attached Package</dt>
              <dd className="text-ink">
                {service.title} ({service.platform})
              </dd>
            </div>
          ) : (
            <div>
              <dt className="text-xs text-muted">Scope</dt>
              <dd className="text-ink">Custom scope proposal</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted">Your Pitch</dt>
            <dd className="mt-1 rounded border border-line bg-paper p-3 text-sm leading-6 text-ink whitespace-pre-wrap">
              {pitchMessage}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-4">
          {isAccepted && conversation ? (
            <Link
              href={`/conversations/${conversation.id}`}
              className="inline-flex min-h-11 items-center bg-ink px-5 text-xs tracking-[0.1em] text-paper uppercase transition-colors hover:bg-oxblood"
            >
              Open Marketplace Conversation ↗
            </Link>
          ) : null}

          {isPending ? (
            <form action={withdrawApplication}>
              <input type="hidden" name="applicationId" value={existingApplication.id} />
              <button
                type="submit"
                className="text-xs text-muted underline underline-offset-4 hover:text-ink"
              >
                Withdraw application
              </button>
            </form>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-line bg-card p-6">
      <div className="border-b border-line pb-4">
        <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Marketplace Action</p>
        <h3 className="mt-1 font-serif text-2xl">Apply to this Campaign</h3>
        <p className="mt-1 text-xs text-muted">
          Submit your proposal and pitch directly to the brand. Brand budget: {money(budgetMin)}–{money(budgetMax)}.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="campaignId" value={campaignId} />

        {services.length > 0 ? (
          <label className={labelClass}>
            Offer one of your storefront packages (optional)
            <select
              className={inputClass}
              name="serviceId"
              value={selectedServiceId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedServiceId(id);
                const s = services.find((srv) => srv.id === id);
                if (s) setRate(s.price);
              }}
            >
              <option value="">Custom proposal (no package attached)</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.platform}) — {money(s.price)} · {s.turnaroundDays}d turnaround
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className={labelClass}>
          Proposed rate (USD)
          <input
            className={inputClass}
            type="number"
            name="proposedRate"
            min={0}
            required
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>

        <label className={labelClass}>
          Pitch message & creative angle
          <textarea
            className={inputClass}
            name="pitchMessage"
            rows={4}
            required
            placeholder="Introduce your concept, why your audience fits this brief, and your expected timeline."
          />
        </label>

        <FormError error={state.error} />

        <div className="pt-2">
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Submitting application…" : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function BrandApplicationReviewList({
  applications,
}: {
  applications: ApplicationItem[];
}) {
  const [reviewState, setReviewState] = useState<Record<string, { error?: string; loading?: boolean }>>({});

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">Applicants</p>
          <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Creator Applications ({applications.length})</h2>
        </div>
        <p className="text-xs text-muted">Review proposals and open collaboration conversations</p>
      </div>

      {applications.length === 0 ? (
        <div className="mt-6 border border-line bg-card p-8 text-center text-sm text-muted">
          No creators have applied to this campaign yet.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {applications.map((app) => {
            const isPending = app.status === "PENDING";
            const isAccepted = app.status === "ACCEPTED";
            const isRejected = app.status === "REJECTED";
            const isWithdrawn = app.status === "WITHDRAWN";

            return (
              <article
                key={app.id}
                className="border border-line bg-card p-6 transition-all hover:border-ink/40"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <Monogram name={app.creator.name} />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/creators/${app.creator.username || app.creator.id}`}
                          className="font-serif text-2xl hover:text-oxblood"
                        >
                          {app.creator.name}
                        </Link>
                        {app.creator.username ? (
                          <span className="font-mono text-xs text-oxblood">@{app.creator.username}</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted">
                        {app.creator.category} · {app.creator.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block border px-2.5 py-0.5 text-xs tracking-wider uppercase ${
                        isAccepted
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : isRejected
                          ? "border-rose-400 bg-rose-50 text-rose-800"
                          : isWithdrawn
                          ? "border-line bg-paper text-muted"
                          : "border-oxblood bg-paper text-oxblood"
                      }`}
                    >
                      {app.status}
                    </span>
                    <p className="mt-2 font-serif text-2xl text-ink">{money(app.proposedRate)}</p>
                    <p className="text-[11px] text-muted">Proposed rate</p>
                  </div>
                </div>

                {app.service ? (
                  <div className="mt-4 rounded border border-line bg-paper p-3 text-xs">
                    <span className="font-medium text-ink">Selected Package: </span>
                    <span className="text-muted">
                      {app.service.title} ({app.service.platform}) · {money(app.service.price)} · {app.service.turnaroundDays}d turnaround
                    </span>
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs font-medium tracking-wider text-muted uppercase">Pitch</p>
                  <p className="mt-1 text-sm leading-6 text-ink whitespace-pre-wrap">
                    {app.pitchMessage}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                  <Link
                    href={`/creators/${app.creator.username || app.creator.id}`}
                    className="text-xs underline underline-offset-4 hover:text-oxblood"
                  >
                    View creator storefront & portfolio ↗
                  </Link>

                  {isPending ? (
                    <div className="flex items-center gap-3">
                      <form
                        action={async (formData) => {
                          setReviewState((prev) => ({ ...prev, [app.id]: { loading: true } }));
                          formData.set("applicationId", app.id);
                          formData.set("decision", "REJECT");
                          const res = await reviewApplication({}, formData);
                          if (res?.error) {
                            setReviewState((prev) => ({ ...prev, [app.id]: { error: res.error } }));
                          }
                        }}
                      >
                        <button
                          type="submit"
                          className={quietButton}
                          disabled={reviewState[app.id]?.loading}
                        >
                          Decline
                        </button>
                      </form>

                      <form
                        action={async (formData) => {
                          setReviewState((prev) => ({ ...prev, [app.id]: { loading: true } }));
                          formData.set("applicationId", app.id);
                          formData.set("decision", "ACCEPT");
                          const res = await reviewApplication({}, formData);
                          if (res?.error) {
                            setReviewState((prev) => ({ ...prev, [app.id]: { error: res.error } }));
                          }
                        }}
                      >
                        <button
                          type="submit"
                          className={primaryButton}
                          disabled={reviewState[app.id]?.loading}
                        >
                          Accept Application
                        </button>
                      </form>
                    </div>
                  ) : isAccepted && app.conversation ? (
                    <Link
                      href={`/conversations/${app.conversation.id}`}
                      className="inline-flex min-h-11 items-center bg-ink px-4 text-xs tracking-[0.1em] text-paper uppercase transition-colors hover:bg-oxblood"
                    >
                      Open Conversation ↗
                    </Link>
                  ) : null}
                </div>

                {reviewState[app.id]?.error ? (
                  <p className="mt-2 text-xs text-rose-600">{reviewState[app.id]?.error}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
