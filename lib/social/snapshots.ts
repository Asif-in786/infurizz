import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { calculateCombinedPlatformFootprint } from "./normalization";
import type { CanonicalMetricDTO, ContentItemDTO } from "./types";

/**
 * Returns UTC date string in YYYY-MM-DD format.
 */
export function getUtcDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Records daily metric snapshots with idempotent upsert.
 * Guaranteed: One record per (socialAccountId, canonicalMetricName, snapshotDate).
 */
export async function recordMetricSnapshots(
  socialAccountId: string,
  metrics: CanonicalMetricDTO[],
  targetDate?: string,
): Promise<number> {
  const snapshotDate = targetDate ?? getUtcDateString();
  let count = 0;

  for (const m of metrics) {
    const valueDecimal = m.valueDecimal ? new Prisma.Decimal(m.valueDecimal) : null;
    const providerMetricIdentifier = m.sourceType === "DERIVED" ? "platform_derived" : m.canonicalMetricName.toLowerCase();

    await prisma.socialMetricSnapshot.upsert({
      where: {
        socialAccountId_canonicalMetricName_snapshotDate: {
          socialAccountId,
          canonicalMetricName: m.canonicalMetricName,
          snapshotDate,
        },
      },
      create: {
        socialAccountId,
        canonicalMetricName: m.canonicalMetricName,
        providerMetricIdentifier,
        valueInt: m.valueInt ?? null,
        valueDecimal,
        metricValueType: m.metricValueType,
        unit: m.metricValueType === "PERCENTAGE" ? "PERCENTAGE" : "COUNT",
        sourceType: m.sourceType,
        calculationMethod: m.calculationMethod ?? null,
        snapshotDate,
        capturedAt: m.capturedAt ?? new Date(),
        freshnessState: "FRESH",
      },
      update: {
        valueInt: m.valueInt ?? null,
        valueDecimal,
        metricValueType: m.metricValueType,
        sourceType: m.sourceType,
        calculationMethod: m.calculationMethod ?? null,
        capturedAt: m.capturedAt ?? new Date(),
        freshnessState: "FRESH",
      },
    });
    count++;
  }

  return count;
}

/**
 * Synchronizes content items (videos, reels, posts) idempotently.
 */
export async function syncContentItems(
  socialAccountId: string,
  items: ContentItemDTO[],
): Promise<number> {
  let count = 0;

  for (const item of items) {
    await prisma.socialContentItem.upsert({
      where: {
        socialAccountId_platformContentId: {
          socialAccountId,
          platformContentId: item.providerContentId,
        },
      },
      create: {
        socialAccountId,
        platformContentId: item.providerContentId,
        contentType: item.contentType,
        url: item.permalink ?? `https://youtube.com/watch?v=${item.providerContentId}`,
        title: item.title ?? null,
        publishedAt: item.publishedAt,
        viewCount: item.viewCount ?? null,
        likeCount: item.likeCount ?? null,
        commentCount: item.commentCount ?? null,
        shareCount: item.shareCount ?? null,
        saveCount: item.saveCount ?? null,
        lastSyncedAt: new Date(),
      },
      update: {
        title: item.title ?? null,
        viewCount: item.viewCount ?? null,
        likeCount: item.likeCount ?? null,
        commentCount: item.commentCount ?? null,
        shareCount: item.shareCount ?? null,
        saveCount: item.saveCount ?? null,
        lastSyncedAt: new Date(),
      },
    });
    count++;
  }

  return count;
}

/**
 * Creates an audit log entry in SocialSyncLog.
 */
export async function logSocialSync(params: {
  socialAccountId: string;
  trigger: "OAUTH_INIT" | "SCHEDULED" | "MANUAL";
  status: "SUCCESS" | "FAILED" | "RATE_LIMITED" | "REVOKED";
  metricsIngested?: number;
  durationMs: number;
  errorMessage?: string;
}): Promise<void> {
  await prisma.socialSyncLog.create({
    data: {
      socialAccountId: params.socialAccountId,
      trigger: params.trigger,
      status: params.status,
      metricsIngested: params.metricsIngested ?? 0,
      durationMs: params.durationMs,
      errorMessage: params.errorMessage ?? null,
    },
  });
}

/**
 * Retrieves time-series metric history for a creator across authenticated accounts.
 */
export async function getCreatorMetricHistory(
  creatorId: string,
  metricName: string,
  limitDays: number = 30,
) {
  const accounts = await prisma.socialAccount.findMany({
    where: { creatorId, connectionStatus: "CONNECTED" },
    select: { id: true, platform: true, handle: true },
  });

  if (accounts.length === 0) return [];

  const accountIds = accounts.map((a) => a.id);
  const snapshots = await prisma.socialMetricSnapshot.findMany({
    where: {
      socialAccountId: { in: accountIds },
      canonicalMetricName: metricName,
    },
    orderBy: { snapshotDate: "asc" },
    take: limitDays,
    include: { socialAccount: { select: { platform: true, handle: true } } },
  });

  return snapshots.map((s) => ({
    id: s.id,
    platform: s.socialAccount.platform,
    handle: s.socialAccount.handle,
    snapshotDate: s.snapshotDate,
    valueInt: s.valueInt ? s.valueInt.toString() : null, // Stringified for safe JSON transport
    valueDecimal: s.valueDecimal ? s.valueDecimal.toString() : null,
    metricValueType: s.metricValueType,
    sourceType: s.sourceType,
    capturedAt: s.capturedAt,
  }));
}

/**
 * Computes the Creator Intelligence Summary.
 */
export async function getCreatorIntelligenceSummary(creatorId: string) {
  const accounts = await prisma.socialAccount.findMany({
    where: { creatorId },
    include: {
      snapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 10,
      },
      contentItems: {
        orderBy: { publishedAt: "desc" },
        take: 6,
      },
    },
  });

  // Calculate footprint strictly from authenticated accounts
  const footprintInput = accounts.map((acc) => {
    const isAccountAuthorized = acc.connectionStatus === "CONNECTED";
    const followerSnapshot = acc.snapshots.find(
      (s) => s.canonicalMetricName === "AUDIENCE_FOLLOWER_COUNT",
    );
    return {
      platform: acc.platform,
      isAccountAuthorized,
      followerCount: followerSnapshot?.valueInt ?? null,
    };
  });

  const footprint = calculateCombinedPlatformFootprint(footprintInput);

  return {
    accounts: accounts.map((acc) => ({
      id: acc.id,
      platform: acc.platform,
      handle: acc.handle,
      displayName: acc.displayName,
      profileUrl: acc.profileUrl,
      avatarUrl: acc.avatarUrl,
      isPlatformVerifiedBadge: acc.isPlatformVerifiedBadge,
      connectionStatus: acc.connectionStatus,
      lastSyncedAt: acc.lastSyncedAt,
      latestMetrics: acc.snapshots.map((s) => ({
        canonicalMetricName: s.canonicalMetricName,
        valueInt: s.valueInt ? s.valueInt.toString() : null,
        valueDecimal: s.valueDecimal ? s.valueDecimal.toString() : null,
        metricValueType: s.metricValueType,
        sourceType: s.sourceType,
        calculationMethod: s.calculationMethod,
        snapshotDate: s.snapshotDate,
      })),
      recentContent: acc.contentItems.map((c) => ({
        id: c.id,
        platformContentId: c.platformContentId,
        contentType: c.contentType,
        url: c.url,
        title: c.title,
        publishedAt: c.publishedAt,
        viewCount: c.viewCount ? c.viewCount.toString() : null,
        likeCount: c.likeCount ? c.likeCount.toString() : null,
        commentCount: c.commentCount ? c.commentCount.toString() : null,
      })),
    })),
    footprint: {
      total: footprint.totalFootprint.toString(),
      authenticatedAccountsCount: footprint.authenticatedAccountsCount,
      platforms: footprint.platforms,
      disclosure: footprint.disclosure,
    },
  };
}
