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

export class FacebookConnector implements SocialConnector {
  readonly platform = SocialPlatform.FACEBOOK;
  readonly name = "Facebook";

  get isConfigured(): boolean {
    return Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
  }

  async getProfile(accountIdentifier: string): Promise<SocialProfileResult> {
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      const mock = MOCK_SOCIAL_DATA.FACEBOOK.profile;
      return {
        ...mock,
        username: accountIdentifier || mock.username,
      };
    }

    if (!this.isConfigured) {
      throw new Error("Facebook API credentials (FACEBOOK_APP_ID / FACEBOOK_APP_SECRET) are not configured.");
    }

    throw new Error("Facebook Graph API requires active Page Access Token.");
  }

  async getMetrics(_accountIdentifier: string): Promise<SocialMetricsResult> {
    void _accountIdentifier;
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      return {
        ...MOCK_SOCIAL_DATA.FACEBOOK.metrics,
        fetchedAt: new Date(),
      };
    }

    if (!this.isConfigured) {
      throw new Error("Facebook API credentials (FACEBOOK_APP_ID / FACEBOOK_APP_SECRET) are not configured.");
    }

    throw new Error("Facebook API credentials required for live metrics.");
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

export const facebookConnector = new FacebookConnector();
