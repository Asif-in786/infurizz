"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { deletePost, updatePost, togglePostReaction, addPostComment, deletePostComment, type FormState } from "@/lib/actions";
import { Monogram } from "@/components/profile-bits";

export interface PostItem {
  id: string;
  content: string;
  mediaUrl: string | null;
  postType: string;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    role: string;
    name: string;
    profileUrl: string;
  };
  reactionsCount: number;
  hasUserReacted: boolean;
  comments: {
    id: string;
    content: string;
    createdAt: string;
    userName: string;
    userId: string;
  }[];
}

export function PostCard({
  post,
  currentUserId,
}: {
  post: PostItem;
  currentUserId?: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reacted, setReacted] = useState(post.hasUserReacted);
  const [reactionsCount, setReactionsCount] = useState(post.reactionsCount);
  const [isPopping, setIsPopping] = useState(false);

  const isAuthor = currentUserId === post.author.id;
  const [editState, editAction, editPending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await updatePost(prev, fd);
    if (!res?.error) {
      setIsEditing(false);
    }
    return res;
  }, {} as FormState);

  const handleOptimisticReact = () => {
    setIsPopping(true);
    if (reacted) {
      setReacted(false);
      setReactionsCount((prev) => Math.max(0, prev - 1));
    } else {
      setReacted(true);
      setReactionsCount((prev) => prev + 1);
    }
    setTimeout(() => setIsPopping(false), 450);
  };

  const typeLabels: Record<string, string> = {
    MILESTONE: "Milestone",
    PROJECT: "Project Showcase",
    COLLAB_ANNOUNCEMENT: "Collaboration",
    ACHIEVEMENT: "Recognition",
    SERVICE: "Service Launch",
    PRODUCT_LAUNCH: "Product Launch",
    PARTNERSHIP: "Partnership",
    HIRING: "Creator Callout",
    UPDATE: "Update",
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="card-interactive border border-line bg-card p-6">
      {/* Post Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="avatar-interactive h-10 w-10 shrink-0">
            <div className="grid h-10 w-10 place-items-center bg-ink font-serif text-sm text-paper">
              {post.author.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join("") || "–"}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Link
                href={post.author.profileUrl}
                className="font-serif text-lg font-medium text-ink hover:text-oxblood hover:underline"
              >
                {post.author.name}
              </Link>
              <span className="border border-line bg-paper px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-muted">
                {post.author.role}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{formattedDate}</span>
              <span>·</span>
              <span className="text-oxblood font-medium">
                {typeLabels[post.postType] || post.postType}
              </span>
            </div>
          </div>
        </div>

        {isAuthor ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-muted hover:text-ink"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
            <form action={deletePost}>
              <input type="hidden" name="postId" value={post.id} />
              <button
                type="submit"
                onClick={(e) => {
                  if (!confirm("Are you sure you want to delete this post?")) e.preventDefault();
                }}
                className="text-xs text-muted hover:text-oxblood"
                title="Delete post"
              >
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {/* Post Body & Editor */}
      {isEditing ? (
        <form action={editAction} className="mt-4 space-y-3">
          <input type="hidden" name="postId" value={post.id} />
          <textarea
            name="content"
            defaultValue={post.content}
            required
            rows={3}
            className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            placeholder="Edit your post content..."
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="url"
              name="mediaUrl"
              defaultValue={post.mediaUrl || ""}
              placeholder="Media URL (optional image link)"
              className="border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-ink"
            />
            <input
              type="text"
              name="tags"
              defaultValue={post.tags?.join(", ") || ""}
              placeholder="Tags e.g. #update, #launch"
              className="border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-ink"
            />
          </div>
          {editState?.error ? (
            <p className="text-xs text-oxblood">{editState.error}</p>
          ) : null}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={editPending}
              className="btn-tactile bg-ink px-4 py-1.5 text-xs font-medium text-paper hover:bg-oxblood disabled:opacity-50"
            >
              {editPending ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-4 text-sm leading-relaxed text-ink whitespace-pre-line">
            {post.content}
          </div>

          {post.mediaUrl ? (
            <div className="img-interactive-wrapper mt-4 overflow-hidden rounded border border-line bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.mediaUrl}
                alt={post.content ? `Attachment for post by ${post.author.name}: ${post.content.slice(0, 50)}` : "Post media attachment"}
                className="max-h-96 w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          ) : null}

          {post.tags && post.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* Interactions Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
        <div className="flex items-center gap-4">
          <form action={togglePostReaction} onSubmit={handleOptimisticReact}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="reaction" value="APPLAUD" />
            <button
              type="submit"
              className={`btn-tactile relative flex items-center gap-1.5 text-xs transition-colors ${
                reacted ? "font-semibold text-oxblood" : "text-muted hover:text-ink"
              }`}
            >
              {isPopping && (
                <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 animate-fade-up" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-oxblood animate-ping" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                </span>
              )}
              <span className={`inline-block ${isPopping ? "animate-pop" : ""}`}>
                {reacted ? "👏 Applauded" : "👏 Applaud"}
              </span>
              <span className="font-mono text-[11px] text-muted">({reactionsCount})</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="btn-tactile flex items-center gap-1.5 text-xs text-muted hover:text-ink"
          >
            <span>💬 Comments</span>
            <span className="font-mono text-[11px]">({post.comments.length})</span>
          </button>
        </div>

        <Link
          href={post.author.profileUrl}
          className="group inline-flex items-center gap-1 text-xs text-muted underline underline-offset-4 hover:text-ink transition-colors"
        >
          <span>View Profile</span>
          <span className="icon-arrow-motion">→</span>
        </Link>
      </div>

      {/* Comments Thread with smooth entrance */}
      {showComments ? (
        <div className="animate-fade-up mt-4 space-y-3 border-t border-line bg-paper/60 p-4">
          <h4 className="text-xs font-semibold tracking-wider text-muted uppercase">
            Discussion ({post.comments.length})
          </h4>

          {post.comments.length > 0 ? (
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="border-b border-line pb-2.5 last:border-b-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{comment.userName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">
                        {new Date(comment.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                      {currentUserId === comment.userId ? (
                        <form action={deletePostComment}>
                          <input type="hidden" name="commentId" value={comment.id} />
                          <button type="submit" className="text-muted hover:text-oxblood">
                            ✕
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-ink/90">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">No comments yet. Start the conversation!</p>
          )}

          {/* Add comment form */}
          <form action={addPostComment} className="mt-3 flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input
              type="text"
              name="content"
              required
              placeholder="Write a supportive comment..."
              className="flex-1 border border-line bg-paper px-3 py-1.5 text-xs text-ink outline-none focus:border-ink"
            />
            <button
              type="submit"
              className="btn-tactile bg-ink px-3 py-1.5 text-xs text-paper uppercase tracking-wider hover:bg-oxblood"
            >
              Reply
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
