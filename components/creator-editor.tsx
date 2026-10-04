"use client";

import { useActionState } from "react";
import { updateCreator, type FormState } from "@/lib/actions";
import { AUDIENCE_RANGES, CATEGORIES, PLATFORMS } from "@/lib/options";
import { FormError, inputClass, labelClass, primaryButton } from "@/components/form-styles";

export function CreatorEditor({
  creator,
}: {
  creator: {
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
    bio: string;
    category: string;
    location: string;
    niche: string;
    audienceRange: string;
    collabPrefs: string;
    languages?: string;
    contentTypes?: string;
    socials: { platform: string; handle: string; audienceNote: string; isSample: boolean }[];
  };
}) {
  const [state, action, pending] = useActionState(updateCreator, {} as FormState);

  const parseList = (raw?: string) => {
    if (!raw) return "";
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.join(", ");
    } catch {
      // return as is
    }
    return raw;
  };

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Display Name
          <input className={inputClass} name="name" defaultValue={creator.name} required />
        </label>
        <label className={labelClass}>
          Username (@handle)
          <input
            className={inputClass}
            name="username"
            defaultValue={creator.username ?? ""}
            placeholder="e.g. mira-sen"
          />
        </label>
      </div>

      <label className={labelClass}>
        Bio
        <textarea className={inputClass} name="bio" rows={4} defaultValue={creator.bio} required />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Category
          <select className={inputClass} name="category" defaultValue={creator.category}>
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Location
          <input className={inputClass} name="location" defaultValue={creator.location} required />
        </label>
        <label className={labelClass}>
          Content Niche
          <input className={inputClass} name="niche" defaultValue={creator.niche} required />
        </label>
        <label className={labelClass}>
          Audience Range
          <select className={inputClass} name="audienceRange" defaultValue={creator.audienceRange}>
            {AUDIENCE_RANGES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Languages Spoken (comma separated)
          <input
            className={inputClass}
            name="languages"
            defaultValue={parseList(creator.languages)}
            placeholder="English, French, Hindi"
          />
        </label>
        <label className={labelClass}>
          Content Formats (comma separated)
          <input
            className={inputClass}
            name="contentTypes"
            defaultValue={parseList(creator.contentTypes)}
            placeholder="Reels, UGC Video, Reviews, Stories"
          />
        </label>
      </div>

      <label className={labelClass}>
        Collaboration Preferences
        <textarea className={inputClass} name="collabPrefs" rows={3} defaultValue={creator.collabPrefs} required />
      </label>

      <fieldset className="space-y-4 border border-line p-4">
        <legend className="px-1 text-sm">Platforms You List</legend>
        <p className="text-xs text-muted">
          Handles entered manually are clearly labeled as unverified in the marketplace.
        </p>
        {PLATFORMS.map((platform) => {
          const social = creator.socials.find((item) => item.platform === platform);
          return (
            <div key={platform} className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                {platform} Handle
                <input className={inputClass} name={`handle:${platform}`} defaultValue={social?.handle ?? ""} placeholder="@handle" />
              </label>
              <label className={labelClass}>
                Context Note
                <input className={inputClass} name={`note:${platform}`} defaultValue={social?.audienceNote ?? ""} placeholder="Audience focus" />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name={`sample:${platform}`} defaultChecked={social?.isSample ?? false} />
                Sample data
              </label>
            </div>
          );
        })}
      </fieldset>

      <FormError error={state.error} />
      <button className={primaryButton} disabled={pending}>
        {pending ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
