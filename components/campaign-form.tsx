"use client";

import { useActionState } from "react";
import { createCampaign, updateCampaign, type FormState } from "@/lib/actions";
import { AUDIENCE_RANGES, CATEGORIES, PLATFORMS } from "@/lib/options";
import { FormError, inputClass, labelClass, primaryButton } from "@/components/form-styles";

export function CampaignForm({
  mode,
  campaign,
}: {
  mode: "create" | "edit";
  campaign?: {
    id: string;
    name: string;
    category: string;
    creatorNiche: string;
    platforms: string[];
    audienceRange: string;
    location: string;
    budgetMin: number;
    budgetMax: number;
    deliverables: string;
    status: string;
  };
}) {
  const action = mode === "create" ? createCampaign : updateCampaign;
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction} className="space-y-4">
      {campaign ? <input type="hidden" name="campaignId" value={campaign.id} /> : null}
      <label className={labelClass}>
        Campaign name
        <input className={inputClass} name="name" required defaultValue={campaign?.name} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Category
          <select className={inputClass} name="category" defaultValue={campaign?.category ?? ""} required>
            <option value="" disabled>
              Select
            </option>
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Creator niche
          <input className={inputClass} name="creatorNiche" required defaultValue={campaign?.creatorNiche} />
        </label>
        <label className={labelClass}>
          Audience range
          <select className={inputClass} name="audienceRange" defaultValue={campaign?.audienceRange ?? ""} required>
            <option value="" disabled>
              Select
            </option>
            {AUDIENCE_RANGES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Location
          <input className={inputClass} name="location" required defaultValue={campaign?.location} placeholder="City, or Anywhere" />
        </label>
        <label className={labelClass}>
          Budget minimum (USD)
          <input className={inputClass} name="budgetMin" type="number" min={0} required defaultValue={campaign?.budgetMin} />
        </label>
        <label className={labelClass}>
          Budget maximum (USD)
          <input className={inputClass} name="budgetMax" type="number" min={0} required defaultValue={campaign?.budgetMax} />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm">Target platforms</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {PLATFORMS.map((platform) => (
            <label key={platform} className="flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                name="platforms"
                value={platform}
                defaultChecked={campaign?.platforms.includes(platform)}
              />
              {platform}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={labelClass}>
        Deliverables
        <textarea className={inputClass} name="deliverables" rows={4} required defaultValue={campaign?.deliverables} />
      </label>
      <label className={labelClass}>
        Campaign status
        <select
          className={inputClass}
          name="status"
          defaultValue={
            campaign?.status === "Open" || campaign?.status === "Published"
              ? "PUBLISHED"
              : campaign?.status || "PUBLISHED"
          }
        >
          {mode === "create" ? (
            <>
              <option value="PUBLISHED">PUBLISHED (Active & visible in directory)</option>
              <option value="DRAFT">DRAFT (Hidden until ready)</option>
            </>
          ) : (
            <>
              <option value="PUBLISHED">PUBLISHED (Active & accepting applications)</option>
              <option value="PAUSED">PAUSED (Visible, but not accepting new applications)</option>
              <option value="CLOSED">CLOSED (Archived, no new applications)</option>
              <option value="DRAFT">DRAFT (Hidden from directory)</option>
            </>
          )}
        </select>
      </label>
      <p className="text-sm text-muted">Budget is a range the brand enters. This prototype does not take payment.</p>
      <FormError error={state.error} />
      <button className={primaryButton} disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Create campaign" : "Save campaign"}
      </button>
    </form>
  );
}
