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

export class InstagramConnector implements SocialConnector {
  readonly platform = SocialPlatform.INSTAGRAM;
  readonly name = "Instagram";

  get isConfigured(): boolean {
    return Boolean(env.INSTAGRAM_CLIENT_ID && env.INSTAGRAM_CLIENT_SECRET);
  }

  async getProfile(accountIdentifier: string): Promise<SocialProfileResult> {
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      const mock = MOCK_SOCIAL_DATA.INSTAGRAM.profile;
      return {
        ...mock,
        username: accountIdentifier.replace(/^@/, "") || mock.username,
      };
    }

    if (!this.isConfigured) {
      throw new Error("Instagram API credentials (INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET) are not configured.");
    }

    // Production Meta Graph API pipeline
    // Endpoint: https://graph.facebook.com/v19.0/{ig_user_id}?fields=id,username,name,biography,profile_picture_url
    throw new Error("Instagram live API requires authenticated user access token.");
  }

  async getMetrics(_accountIdentifier: string): Promise<SocialMetricsResult> {
    void _accountIdentifier;
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      return {
        ...MOCK_SOCIAL_DATA.INSTAGRAM.metrics,
        fetchedAt: new Date(),
      };
    }

    if (!this.isConfigured) {
      throw new Error("Instagram API credentials (INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET) are not configured.");
    }

    // Production Meta Insights API:
    // Endpoint: https://graph.facebook.com/v19.0/{ig_user_id}/insights?metric=impressions,reach,profile_views
    throw new Error("Instagram live API requires valid access token.");
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

export const instagramConnector = new InstagramConnector();
