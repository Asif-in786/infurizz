import { prisma } from "@/lib/prisma";

export interface NormalizedInstagramInput {
  handle: string;
  cleanHandle: string;
  profileUrl: string;
}

export function normalizeInstagramInput(raw: string): NormalizedInstagramInput {
  let cleaned = raw.trim();

  // Strip trailing slashes and query strings
  cleaned = cleaned.split("?")[0].replace(/\/+$/, "");

  if (cleaned.includes("instagram.com")) {
    const parts = cleaned.split("/");
    const lastPart = parts[parts.length - 1];
    const username = lastPart.replace(/^@+/, "");
    return {
      handle: `@${username}`,
      cleanHandle: username,
      profileUrl: `https://instagram.com/${username}`,
    };
  }

  const username = cleaned.replace(/^@+/, "");
  return {
    handle: `@${username}`,
    cleanHandle: username,
    profileUrl: `https://instagram.com/${username}`,
  };
}

export interface InstagramPostItem {
  id: string;
  caption?: string;
  permalink: string;
  publishedAt: string;
  viewCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  engagement?: number | null;
}

export interface InstagramResolveResult {
  success: boolean;
  platform: "Instagram";
  handle: string;
  profileUrl: string;
  connectionStatus: "CONNECTED" | "PUBLIC_HANDLE_DECLARED" | "NOT_CONNECTED";
  isLiveApi: boolean;
  isDatabaseSnapshot: boolean;
  requiresAuthorization: boolean;
  authorizationNotice: string;
  complianceNote: string;
  verifiedAt?: string | null;
  followers?: number | null;
  mediaCount?: number | null;
  reach?: number | null;
  impressions?: number | null;
  likes?: number | null;
  comments?: number | null;
  engagement?: number | null;
  engagementRate?: string | null;
  recentPosts?: InstagramPostItem[];
}

export async function resolveInstagramProfile(
  rawInput: string,
  creatorId?: string
): Promise<InstagramResolveResult> {
  const normalized = normalizeInstagramInput(rawInput);

  // 1. Check if the creator has an authenticated/authorized account in database
  const dbAccount = await prisma.socialAccount.findFirst({
    where: {
      platform: "Instagram",
      ...(creatorId
        ? { creatorId }
        : {
            OR: [
              { handle: { equals: normalized.handle, mode: "insensitive" } },
              { handle: { equals: normalized.cleanHandle, mode: "insensitive" } },
            ],
          }),
    },
    include: {
      snapshots: { orderBy: { capturedAt: "desc" }, take: 10 },
      contentItems: { orderBy: { publishedAt: "desc" }, take: 8 },
    },
  });

  if (dbAccount && dbAccount.connectionStatus === "CONNECTED") {
    const followerSnap = dbAccount.snapshots.find(
      (s) => s.canonicalMetricName === "AUDIENCE_FOLLOWER_COUNT"
    );
    const reachSnap = dbAccount.snapshots.find(
      (s) => s.canonicalMetricName === "CONTENT_LIFETIME_VIEWS"
    );
    const erSnap = dbAccount.snapshots.find(
      (s) => s.canonicalMetricName === "ENGAGEMENT_RATE_30D"
    );
    const uploadSnap = dbAccount.snapshots.find(
      (s) => s.canonicalMetricName === "CONTENT_TOTAL_UPLOADS"
    );

    const followers = followerSnap ? Number(followerSnap.valueInt || 0) : null;
    const reach = reachSnap ? Number(reachSnap.valueInt || 0) : null;
    const mediaCount = uploadSnap ? Number(uploadSnap.valueInt || 0) : dbAccount.contentItems.length;

    const recentPosts: InstagramPostItem[] = dbAccount.contentItems.map((c) => {
      const views = c.viewCount ? Number(c.viewCount) : null;
      const likes = c.likeCount ? Number(c.likeCount) : 0;
      const comments = c.commentCount ? Number(c.commentCount) : 0;
      const engagement = likes + comments;

      return {
        id: c.platformContentId,
        caption: c.title || undefined,
        permalink: c.url,
        publishedAt: c.publishedAt.toISOString(),
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        engagement,
      };
    });

    const totalLikes = recentPosts.reduce((acc, p) => acc + (p.likeCount || 0), 0);
    const totalComments = recentPosts.reduce((acc, p) => acc + (p.commentCount || 0), 0);
    const totalEngagement = totalLikes + totalComments;

    return {
      success: true,
      platform: "Instagram",
      handle: dbAccount.handle,
      profileUrl: dbAccount.profileUrl,
      connectionStatus: "CONNECTED",
      isLiveApi: true,
      isDatabaseSnapshot: true,
      requiresAuthorization: false,
      authorizationNotice: "Instagram professional account verified via Meta Graph API.",
      complianceNote: "Verified OAuth connection active. Showing provider-reported insights.",
      verifiedAt: dbAccount.updatedAt.toISOString(),
      followers,
      mediaCount,
      reach,
      impressions: reach,
      likes: totalLikes,
      comments: totalComments,
      engagement: totalEngagement,
      engagementRate: erSnap?.valueDecimal ? `${erSnap.valueDecimal.toString()}%` : null,
      recentPosts,
    };
  }

  // 2. Public profile declaration (unauthorized public handle)
  return {
    success: true,
    platform: "Instagram",
    handle: normalized.handle,
    profileUrl: normalized.profileUrl,
    connectionStatus: "PUBLIC_HANDLE_DECLARED",
    isLiveApi: false,
    isDatabaseSnapshot: false,
    requiresAuthorization: true,
    authorizationNotice:
      "Connect your Instagram professional account to unlock verified performance analytics.",
    complianceNote:
      "Meta Graph API requires an authorized Instagram Professional (Creator or Business) account to access verified reach, impressions, audience demographics, and media metrics. Unofficial scraping is strictly prohibited under Meta Platform Terms.",
    followers: null,
    mediaCount: null,
    reach: null,
    impressions: null,
    likes: null,
    comments: null,
    engagement: null,
    engagementRate: null,
    recentPosts: [],
  };
}
