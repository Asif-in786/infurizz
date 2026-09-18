import { SocialPlatform } from "@prisma/client";

export interface PlatformMetric {
  platform: SocialPlatform;
  handle: string;
  displayName: string;
  followersCount: number;
  followingCount?: number;
  postsCount?: number;
  engagementRate: number; // percentage, e.g. 3.8
  profileUrl?: string;
  lastSyncedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface AggregatedAudienceMetrics {
  totalReach: number;
  totalPlatforms: number;
  avgEngagementRate: number;
  platformBreakdown: {
    platform: SocialPlatform;
    followersCount: number;
    percentageOfTotal: number;
    engagementRate: number;
  }[];
  lastUpdated: Date;
}
