import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Shell } from "@/components/page-intro";
import { PostComposer } from "@/components/post-composer";
import { PostCard, type PostItem } from "@/components/post-card";
import { getCurrentUser } from "@/lib/current";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Professional Network · Posts & Community",
  description: "Share updates, project milestones, and collaboration announcements across the creator and brand ecosystem.",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const filterType = params.type || "";

  const user = await getCurrentUser();

  const [postsFromDb, activeCampaigns] = await Promise.all([
    prisma.post.findMany({
      where: filterType ? { postType: filterType } : {},
      include: {
        author: {
          include: {
            creator: true,
            brand: true,
          },
        },
        reactions: true,
        comments: {
          include: {
            user: {
              include: {
                creator: true,
                brand: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.campaign.findMany({
      where: { status: { in: ["Open", "PUBLISHED", "Published"] } },
      include: { brand: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const posts: PostItem[] = postsFromDb.map((p) => {
    const authorName =
      p.author.creator?.name ||
      p.author.brand?.name ||
      p.author.email.split("@")[0] ||
      "Member";

    const profileUrl = p.author.creator
      ? `/creators/${p.author.creator.username || p.author.creator.id}`
      : p.author.brand
      ? `/brands/${p.author.brand.id}`
      : "#";

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(p.tags);
    } catch {
      parsedTags = [];
    }

    const hasUserReacted = user ? p.reactions.some((r) => r.userId === user.id) : false;

    return {
      id: p.id,
      content: p.content,
      mediaUrl: p.mediaUrl,
      postType: p.postType,
      tags: parsedTags,
      createdAt: p.createdAt.toISOString(),
      author: {
        id: p.author.id,
        role: p.author.role,
        name: authorName,
        profileUrl,
      },
      reactionsCount: p.reactions.length,
      hasUserReacted,
      comments: p.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        userName:
          c.user.creator?.name ||
          c.user.brand?.name ||
          c.user.email.split("@")[0] ||
          "Member",
        userId: c.userId,
      })),
    };
  });

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <PageIntro
          eyebrow="Layer 01 · Professional Network"
          title="Community Posts"
          lede="Where creators and brands share milestones, project completions, new service packages, and partnership announcements."
        />

        {user?.role === "BRAND" ? (
          <Link
            href="/campaigns/new"
            className="inline-flex min-h-11 items-center bg-ink px-4 text-xs tracking-[0.1em] text-paper uppercase transition-colors hover:bg-oxblood"
          >
            + Start a Campaign Brief
          </Link>
        ) : user?.role === "CREATOR" ? (
          <Link
            href="/campaigns"
            className="inline-flex min-h-11 items-center border border-ink/20 px-4 text-xs tracking-[0.1em] text-ink uppercase transition-colors hover:border-ink"
          >
            Explore Brand Briefs ↗
          </Link>
        ) : null}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Main Feed Column */}
        <div className="space-y-6">
          {user ? (
            <PostComposer
              userRole={user.role}
              userName={user.creator?.name || user.brand?.name || user.email.split("@")[0]}
            />
          ) : (
            <div className="border border-line bg-card p-6">
              <h3 className="font-serif text-2xl">Join the conversation</h3>
              <p className="mt-2 text-xs text-muted">
                Log in or sign up to share your updates and engage with verified creators and brands.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/join"
                  className="bg-ink px-4 py-2 text-xs font-medium text-paper uppercase tracking-wider hover:bg-oxblood"
                >
                  Join INFURIZZ
                </Link>
                <Link
                  href="/login"
                  className="border border-line px-4 py-2 text-xs text-ink hover:border-ink"
                >
                  Log in
                </Link>
              </div>
            </div>
          )}

          {/* Feed Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Filter:</span>
            {[
              { label: "All Posts", value: "" },
              { label: "Milestones", value: "MILESTONE" },
              { label: "Projects", value: "PROJECT" },
              { label: "Collaborations", value: "COLLAB_ANNOUNCEMENT" },
              { label: "Product Launches", value: "PRODUCT_LAUNCH" },
            ].map((f) => (
              <Link
                key={f.value}
                href={f.value ? `/posts?type=${f.value}` : "/posts"}
                className={`px-2.5 py-1 transition-colors ${
                  filterType === f.value
                    ? "bg-ink text-paper font-medium"
                    : "border border-line bg-card text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="animate-fade-in border border-line bg-card p-12 text-center text-sm text-muted">
                <p className="font-serif text-2xl text-ink">No updates in this feed yet.</p>
                <p className="mt-2 text-xs">
                  {user ? "Be the first to share an update with the community above!" : "Check back soon for new announcements."}
                </p>
              </div>
            ) : (
              posts.map((post, idx) => (
                <div
                  key={post.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(idx * 45, 500)}ms` }}
                >
                  <PostCard
                    post={post}
                    currentUserId={user?.id}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Marketplace Integration */}
        <aside className="space-y-8">
          {/* Post vs Campaign Clarification */}
          <div className="border border-line bg-card p-6">
            <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">
              Community Architecture
            </span>
            <h3 className="mt-2 font-serif text-2xl text-ink">Posts vs. Campaigns</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              <strong>Posts:</strong> Open updates, achievements, milestone celebrations, and project reflections.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              <strong>Campaigns:</strong> Structured hiring briefs with verified deliverables, budgets, and application deadlines.
            </p>
            {user?.role === "BRAND" ? (
              <Link
                href="/campaigns/new"
                className="mt-4 block border border-ink bg-paper py-2 text-center text-xs font-medium uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
              >
                Post a Hiring Requirement →
              </Link>
            ) : (
              <Link
                href="/campaigns"
                className="mt-4 block border border-ink bg-paper py-2 text-center text-xs font-medium uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
              >
                Browse Open Briefs →
              </Link>
            )}
          </div>

          {/* Open Opportunities Spotlight */}
          <div className="border border-line bg-card p-6">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-xs font-semibold tracking-wider text-oxblood uppercase">Active Briefs</span>
              <Link href="/campaigns" className="text-[11px] text-muted hover:text-ink">
                View all ({activeCampaigns.length}) →
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {activeCampaigns.map((c) => (
                <div key={c.id} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="font-serif text-base font-medium text-ink hover:text-oxblood"
                    >
                      {c.name}
                    </Link>
                    <span className="font-serif text-xs text-ink">
                      {money(c.budgetMin)}–{money(c.budgetMax)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    by{" "}
                    <Link href={`/brands/${c.brand.id}`} className="hover:underline text-ink">
                      {c.brand.name}
                    </Link>{" "}
                    · {c.category}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
