"use client";

import { useActionState } from "react";
import { sendMessage, updateBrand, type FormState } from "@/lib/actions";
import { FormError, inputClass, labelClass, primaryButton } from "@/components/form-styles";

export function BrandEditor({
  brand,
}: {
  brand: { name: string; about: string; location: string };
}) {
  const [state, action, pending] = useActionState(updateBrand, {} as FormState);
  return (
    <form action={action} className="space-y-4">
      <label className={labelClass}>
        Brand name
        <input className={inputClass} name="name" defaultValue={brand.name} required />
      </label>
      <label className={labelClass}>
        About
        <textarea className={inputClass} name="about" rows={4} defaultValue={brand.about} required />
      </label>
      <label className={labelClass}>
        Location
        <input className={inputClass} name="location" defaultValue={brand.location} required />
      </label>
      <FormError error={state.error} />
      <button className={primaryButton} disabled={pending}>
        {pending ? "Saving…" : "Save brand"}
      </button>
    </form>
  );
}

export function MessageForm({ matchId, conversationId }: { matchId?: string; conversationId?: string }) {
  const [state, action, pending] = useActionState(sendMessage, {} as FormState);
  return (
    <form action={action} className="space-y-3">
      {matchId ? <input type="hidden" name="matchId" value={matchId} /> : null}
      {conversationId ? <input type="hidden" name="conversationId" value={conversationId} /> : null}
      <label className={labelClass}>
        Message
        <textarea className={inputClass} name="body" rows={3} required placeholder="Write a message" />
      </label>
      <FormError error={state.error} />
      <button className={primaryButton} disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
