"use client";

import { useActionState, useState } from "react";
import {
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  type FormState,
} from "@/lib/actions";
import { PLATFORMS } from "@/lib/options";
import { FormError, inputClass, labelClass, primaryButton, quietButton } from "@/components/form-styles";

export type PortfolioItem = {
  id: string;
  title: string;
  platform: string;
  description: string | null;
  mediaUrl: string | null;
  externalUrl: string | null;
  sortOrder: number;
};

export function CreatorPortfolioManager({ items }: { items: PortfolioItem[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-serif text-2xl">Portfolio Showcase</h3>
          <p className="mt-1 text-sm text-muted">
            Showcase genuine previous collaborations and creative work samples.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd(!showAdd);
            setEditingId(null);
          }}
          className={quietButton}
        >
          {showAdd ? "Cancel" : "+ Add work sample"}
        </button>
      </div>

      {showAdd ? (
        <div className="border border-ink bg-card p-6">
          <h4 className="font-serif text-xl">Add Collaboration Sample</h4>
          <p className="mt-1 text-xs text-muted">
            Link to legitimate past videos, posts, or articles that highlight your style.
          </p>
          <PortfolioForm mode="create" onSuccess={() => setShowAdd(false)} />
        </div>
      ) : null}

      {items.length === 0 && !showAdd ? (
        <div className="border border-line bg-card p-6 text-center">
          <p className="font-serif text-xl">No portfolio pieces uploaded yet.</p>
          <p className="mt-2 text-sm text-muted">
            Add live links to your best brand integrations or organic high-performing content.
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className={`${primaryButton} mt-4`}
          >
            Add first sample
          </button>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="card-interactive flex flex-col justify-between border border-line bg-card p-5">
              {editingId === item.id ? (
                <PortfolioForm
                  mode="edit"
                  item={item}
                  onSuccess={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div>
                    <span className="badge-interactive border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                      {item.platform}
                    </span>
                    <h4 className="mt-3 font-serif text-xl">{item.title}</h4>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                    ) : null}
                    {item.externalUrl ? (
                      <p className="mt-3 text-xs">
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-tactile group inline-flex items-center gap-1 text-oxblood underline underline-offset-4 hover:text-ink"
                        >
                          <span>View work link</span>
                          <span className="icon-arrow-motion">↗</span>
                        </a>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="btn-tactile text-ink underline underline-offset-4 hover:text-oxblood"
                    >
                      Edit
                    </button>
                    <form action={deletePortfolioItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className="btn-tactile text-oxblood hover:underline"
                        onClick={(e) => {
                          if (!confirm("Delete this portfolio sample?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PortfolioForm({
  mode,
  item,
  onSuccess,
}: {
  mode: "create" | "edit";
  item?: PortfolioItem;
  onSuccess: () => void;
}) {
  const actionFn = mode === "create" ? createPortfolioItem : updatePortfolioItem;
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const res = await actionFn(prev, formData);
    if (!res?.error) {
      onSuccess();
    }
    return res;
  }, {} as FormState);

  return (
    <form action={action} className="mt-4 space-y-4">
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}

      <label className={labelClass}>
        Work Title / Campaign Name
        <input
          className={inputClass}
          name="title"
          defaultValue={item?.title}
          placeholder="e.g. Summer Trail Series · Sponsored Film"
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Platform
          <select className={inputClass} name="platform" defaultValue={item?.platform ?? "YouTube"} required>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
            <option value="UGC Video">UGC Video</option>
            <option value="Brand Direct">Brand Direct</option>
          </select>
        </label>

        <label className={labelClass}>
          Live External Link (URL)
          <input
            className={inputClass}
            type="url"
            name="externalUrl"
            defaultValue={item?.externalUrl ?? ""}
            placeholder="https://..."
          />
        </label>
      </div>

      <label className={labelClass}>
        Context / Description
        <textarea
          className={inputClass}
          name="description"
          rows={3}
          defaultValue={item?.description ?? ""}
          placeholder="Brief description of the collaboration deliverables and role."
        />
      </label>

      <FormError error={state?.error} />

      <div className="flex gap-3">
        <button type="button" onClick={onSuccess} className={quietButton}>
          Cancel
        </button>
        <button className={primaryButton} disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Add to Portfolio" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
