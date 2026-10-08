"use client";

import { useActionState } from "react";
import { expressInterest, type InterestState } from "@/lib/actions";
import { MatchMoment } from "@/components/profile-bits";
import { FormError, inputClass, labelClass, primaryButton } from "@/components/form-styles";

export function InterestForm({
  creatorId,
  campaignId,
  label,
  campaigns,
}: {
  creatorId: string;
  campaignId?: string;
  label: string;
  campaigns?: { id: string; name: string; isDemo: boolean }[];
}) {
  const [state, action, pending] = useActionState(expressInterest, null as InterestState | null);

  if (state?.matched && state.matchId) {
    return (
      <MatchMoment
        matchId={state.matchId}
        creatorName={state.creatorName}
        brandName={state.brandName}
        campaignName={state.campaignName}
        creatorId={state.creatorId}
        campaignId={state.campaignId}
      />
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="creatorId" value={creatorId} />
      {campaignId ? <input type="hidden" name="campaignId" value={campaignId} /> : null}
      {campaigns ? (
        <label className={labelClass}>
          Campaign
          <select className={inputClass} name="campaignId" required>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
                {campaign.isDemo ? " · Sample" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button className={primaryButton} disabled={pending}>
        {pending ? "Saving…" : label}
      </button>
      <FormError error={state?.error} />
      {state?.pending ? (
        <div className="border border-line bg-paper/80 p-3.5 text-xs text-muted">
          <p className="font-medium text-ink">
            ✓ Quick-match interest successfully recorded
          </p>
          <p className="mt-1 leading-relaxed">
            {state.campaignName ? `Interest logged for "${state.campaignName}". ` : ""}
            If reciprocal interest is expressed by the other party, a mutual collaboration desk unlocks automatically with direct messaging.
          </p>
        </div>
      ) : null}
    </form>
  );
}
