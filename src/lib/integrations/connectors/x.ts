import { SocialPlatform } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { env } from "@/lib/env";
import { MOCK_SOCIAL_DATA } from "../mock-data";
import {
  SocialConnector,
  SocialMetricsResult,
  SocialProfileResult,
  SocialSyncResult,
} from "../types";

export class XConnector implements SocialConnector {
  readonly platform = SocialPlatform.X_TWITTER;
  readonly name = "X (Twitter)";

  get isConfigured(): boolean {
    return Boolean(env.X_BEARER_TOKEN || (env.X_API_KEY && env.X_API_SECRET));
  }

  async getProfile(accountIdentifier: string): Promise<SocialProfileResult> {
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      const mock = MOCK_SOCIAL_DATA.X_TWITTER.profile;
      return {
        ...mock,
        username: accountIdentifier.replace(/^@/, "") || mock.username,
      };
    }

    if (!this.isConfigured) {
      throw new Error("X API credentials (X_BEARER_TOKEN or X_API_KEY / X_API_SECRET) are not configured.");
    }

    // X API v2 pipeline:
    // Endpoint: https://api.twitter.com/2/users/by/username/{username}?user.fields=public_metrics,description,profile_image_url
    throw new Error("X API v2 requires valid Bearer Token.");
  }

  async getMetrics(_accountIdentifier: string): Promise<SocialMetricsResult> {
    void _accountIdentifier;
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      return {
        ...MOCK_SOCIAL_DATA.X_TWITTER.metrics,
        fetchedAt: new Date(),
      };
    }

    if (!this.isConfigured) {
      throw new Error("X API credentials (X_BEARER_TOKEN or X_API_KEY / X_API_SECRET) are not configured.");
    }

    throw new Error("X API credentials required for live sync.");
  }

  async syncAccount(creatorId: string, accountIdentifier: string): Promise<SocialSyncResult> {
    try {
      const profile = await this.getProfile(accountIdentifier);
      const metrics = await this.getMetrics(accountIdentifier);

      await prisma.socialAccount.upsert({
        where: {
          creatorId_platform: {
            creatorId,
            platform: this.platform,
          },
        },
        update: {
          username: profile.username,
          profileUrl: profile.profileUrl,
          followersCount: metrics.followersCount,
          followingCount: metrics.followingCount ?? 0,
          postsCount: metrics.postsCount ?? 0,
          engagementRate: metrics.engagementRate,
          metricsJson: JSON.stringify(metrics),
          lastSyncedAt: new Date(),
        },
        create: {
          creatorId,
          platform: this.platform,
          platformAccountId: profile.platformAccountId,
          username: profile.username,
          profileUrl: profile.profileUrl,
          followersCount: metrics.followersCount,
          followingCount: metrics.followingCount ?? 0,
          postsCount: metrics.postsCount ?? 0,
          engagementRate: metrics.engagementRate,
          metricsJson: JSON.stringify(metrics),
          lastSyncedAt: new Date(),
        },
      });

      return {
        success: true,
        platform: this.platform,
        followersCount: metrics.followersCount,
        engagementRate: metrics.engagementRate,
        syncedAt: new Date(),
        isMockData: metrics.isMockData,
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        followersCount: 0,
        engagementRate: 0,
        syncedAt: new Date(),
        isMockData: env.ENABLE_MOCK_SOCIAL_DATA,
        error: error instanceof Error ? error.message : "Sync failed",
      };
    }
  }
}

export const xConnector = new XConnector();
