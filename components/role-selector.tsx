"use client";

import { useActionState, useState } from "react";
import { selectRole, type FormState } from "@/lib/actions";
import { FormError, inputClass, labelClass, primaryButton } from "@/components/form-styles";

export function RoleSelector({ userEmail }: { userEmail: string }) {
  const [role, setRole] = useState<"CREATOR" | "BRAND" | "">("");
  const [state, action, pending] = useActionState(selectRole, {} as FormState);

  return (
    <div className="max-w-xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setRole("CREATOR")}
          className={`border p-6 text-left transition-all ${
            role === "CREATOR"
              ? "border-ink bg-card ring-1 ring-ink"
              : "border-line bg-card hover:border-ink/50"
          }`}
        >
          <span className="text-[11px] tracking-[0.18em] text-oxblood uppercase">Marketplace</span>
          <h3 className="mt-2 font-serif text-3xl">Creator</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Build your storefront, list services & packages, showcase your portfolio, and apply to brand campaigns.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setRole("BRAND")}
          className={`border p-6 text-left transition-all ${
            role === "BRAND"
              ? "border-ink bg-card ring-1 ring-ink"
              : "border-line bg-card hover:border-ink/50"
          }`}
        >
          <span className="text-[11px] tracking-[0.18em] text-oxblood uppercase">Campaigns</span>
          <h3 className="mt-2 font-serif text-3xl">Brand</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Publish campaigns, review creator applications, discover storefronts, and invite creators.
          </p>
        </button>
      </div>

      {role ? (
        <form action={action} className="space-y-4 border-t border-line pt-6">
          <input type="hidden" name="role" value={role} />
          <label className={labelClass}>
            {role === "BRAND" ? "Brand / Company Name" : "Display Name"}
            <input
              className={inputClass}
              name="name"
              defaultValue={userEmail.split("@")[0]}
              required
            />
          </label>
          <label className={labelClass}>
            Location
            <input
              className={inputClass}
              name="location"
              placeholder="e.g. London, Austin, Mumbai, or Anywhere"
              required
            />
          </label>
          <FormError error={state.error} />
          <button className={primaryButton} disabled={pending}>
            {pending ? "Saving..." : `Continue as ${role === "CREATOR" ? "Creator" : "Brand"}`}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">Select either Creator or Brand to continue.</p>
      )}
    </div>
  );
}
