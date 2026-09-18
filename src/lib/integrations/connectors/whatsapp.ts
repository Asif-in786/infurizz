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

export class WhatsAppChannelConnector implements SocialConnector {
  readonly platform = SocialPlatform.WHATSAPP_CHANNEL;
  readonly name = "WhatsApp Channel";

  get isConfigured(): boolean {
    return Boolean(env.WHATSAPP_BUSINESS_ACCOUNT_ID && env.WHATSAPP_ACCESS_TOKEN);
  }

  async getProfile(accountIdentifier: string): Promise<SocialProfileResult> {
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      const mock = MOCK_SOCIAL_DATA.WHATSAPP_CHANNEL.profile;
      return {
        ...mock,
        username: accountIdentifier || mock.username,
      };
    }

    if (!this.isConfigured) {
      throw new Error("WhatsApp API credentials (WHATSAPP_BUSINESS_ACCOUNT_ID / WHATSAPP_ACCESS_TOKEN) are not configured.");
    }

    throw new Error("WhatsApp Cloud API credentials required.");
  }

  async getMetrics(_accountIdentifier: string): Promise<SocialMetricsResult> {
    void _accountIdentifier;
    if (env.ENABLE_MOCK_SOCIAL_DATA) {
      return {
        ...MOCK_SOCIAL_DATA.WHATSAPP_CHANNEL.metrics,
        fetchedAt: new Date(),
      };
    }

    if (!this.isConfigured) {
      throw new Error("WhatsApp API credentials (WHATSAPP_BUSINESS_ACCOUNT_ID / WHATSAPP_ACCESS_TOKEN) are not configured.");
    }

    throw new Error("WhatsApp Cloud API credentials required for channel metrics.");
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

export const whatsAppChannelConnector = new WhatsAppChannelConnector();
