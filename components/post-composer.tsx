"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createPost, type FormState } from "@/lib/actions";
import { FormError, inputClass, labelClass, primaryButton } from "@/components/form-styles";

export function PostComposer({
  userRole,
  userName,
}: {
  userRole: string;
  userName: string;
}) {
  const [state, action, pending] = useActionState(createPost, {} as FormState);
  const [openMedia, setOpenMedia] = useState(false);

  const creatorPostTypes = [
    { value: "UPDATE", label: "General Update" },
    { value: "MILESTONE", label: "Milestone Achieved" },
    { value: "PROJECT", label: "Project Completed" },
    { value: "COLLAB_ANNOUNCEMENT", label: "Collaboration Announcement" },
    { value: "ACHIEVEMENT", label: "Award / Recognition" },
    { value: "SERVICE", label: "New Service Package" },
  ];

  const brandPostTypes = [
    { value: "UPDATE", label: "Company Update" },
    { value: "PRODUCT_LAUNCH", label: "Product Launch" },
    { value: "PARTNERSHIP", label: "Partnership Announcement" },
    { value: "HIRING", label: "Creator Callout" },
    { value: "COLLAB_ANNOUNCEMENT", label: "Creator Collaboration" },
  ];

  const postTypes = userRole === "BRAND" ? brandPostTypes : creatorPostTypes;

  return (
    <div className="border border-line bg-card p-6">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          <span className="text-xs font-semibold tracking-wider text-oxblood uppercase">
            {userRole === "BRAND" ? "Brand Desk" : "Creator Network"}
          </span>
          <span className="text-line">·</span>
          <span className="text-xs text-muted">Posting as <strong className="text-ink">{userName}</strong></span>
        </div>

        {userRole === "BRAND" ? (
          <Link
            href="/campaigns/new"
            className="text-[11px] font-medium text-oxblood underline underline-offset-4 hover:text-ink"
          >
            Looking to hire creators? Start a Campaign brief instead →
          </Link>
        ) : null}
      </div>

      <form action={action} className="mt-4 space-y-4">
        <div>
          <textarea
            name="content"
            rows={3}
            required
            placeholder={
              userRole === "BRAND"
                ? "Share a company milestone, product launch, or partnership announcement with creators..."
                : "Share what you are working on, a completed project, collaboration milestone, or new portfolio work..."
            }
            className="w-full resize-none border-b border-line bg-transparent p-1 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <select
                name="postType"
                defaultValue="UPDATE"
                className="border border-line bg-paper px-2.5 py-1 text-xs text-ink outline-none focus:border-ink"
              >
                {postTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setOpenMedia(!openMedia)}
              className="border border-line bg-paper px-2.5 py-1 text-xs text-muted hover:border-ink hover:text-ink"
            >
              {openMedia ? "✕ Remove Media URL" : "+ Add Media / Image URL"}
            </button>
          </div>

          <button className={primaryButton} disabled={pending}>
            {pending ? "Publishing..." : "Publish Post"}
          </button>
        </div>

        {openMedia ? (
          <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted">Image or Media Link</label>
              <input
                type="url"
                name="mediaUrl"
                placeholder="https://images.example.com/project.jpg"
                className="mt-1 w-full border border-line bg-paper px-2.5 py-1.5 text-xs text-ink outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted">Topic Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                placeholder="e.g. tech, review, milestone"
                className="mt-1 w-full border border-line bg-paper px-2.5 py-1.5 text-xs text-ink outline-none focus:border-ink"
              />
            </div>
          </div>
        ) : null}

        <FormError error={state.error} />
      </form>
    </div>
  );
}
