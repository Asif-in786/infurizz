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

export interface InstagramResolveResult {
  success: boolean;
  platform: "Instagram";
  handle: string;
  profileUrl: string;
  connectionStatus: "CONNECTED" | "PUBLIC_HANDLE_DECLARED" | "NOT_CONNECTED";
  requiresAuthorization: boolean;
  authorizationNotice: string;
  complianceNote: string;
  verifiedAt?: string | null;
  followers?: number | null;
  reach?: number | null;
  engagementRate?: string | null;
  recentPosts?: Array<{
    id: string;
    caption?: string;
    permalink: string;
    publishedAt: string;
    viewCount?: number | null;
    likeCount?: number | null;
    commentCount?: number | null;
  }>;
}

export async function resolveInstagramProfile(
  rawInput: string,
  creatorId?: string
): Promise<InstagramResolveResult> {
  const normalized = normalizeInstagramInput(rawInput);

  // 1. Check if the creator has an authenticated/authorized account or profile
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

    return {
      success: true,
      platform: "Instagram",
      handle: dbAccount.handle,
      profileUrl: dbAccount.profileUrl,
      connectionStatus: "CONNECTED",
      requiresAuthorization: false,
      authorizationNotice: "Instagram account authorized via Meta Graph API.",
      complianceNote: "Verified OAuth connection active. Showing provider-reported insights.",
      followers: followerSnap ? Number(followerSnap.valueInt || 0) : null,
      reach: reachSnap ? Number(reachSnap.valueInt || 0) : null,
      engagementRate: erSnap?.valueDecimal ? `${erSnap.valueDecimal.toString()}%` : null,
      recentPosts: dbAccount.contentItems.map((c) => ({
        id: c.platformContentId,
        caption: c.title || undefined,
        permalink: c.url,
        publishedAt: c.publishedAt.toISOString(),
        viewCount: c.viewCount ? Number(c.viewCount) : null,
        likeCount: c.likeCount ? Number(c.likeCount) : null,
        commentCount: c.commentCount ? Number(c.commentCount) : null,
      })),
    };
  }

  // 2. Public profile declaration (without OAuth private Insights)
  return {
    success: true,
    platform: "Instagram",
    handle: normalized.handle,
    profileUrl: normalized.profileUrl,
    connectionStatus: "PUBLIC_HANDLE_DECLARED",
    requiresAuthorization: true,
    authorizationNotice: "Connect your Instagram account to unlock deeper analytics.",
    complianceNote:
      "Meta Graph API requires an authorized Instagram Business or Creator account to access reach, impressions, saves, and demographic insights. Scraping public profiles without authorization is strictly prohibited under Meta Platform Terms.",
    followers: null,
    reach: null,
    engagementRate: null,
    recentPosts: [],
  };
}
