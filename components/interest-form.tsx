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
        <p className="text-sm text-muted">
          Interest recorded. A match is created only when the other side expresses interest too.
        </p>
      ) : null}
    </form>
  );
}
