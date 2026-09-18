import { SocialPlatform } from "@prisma/client";
import { SocialMetricsResult, SocialProfileResult } from "./types";

/**
 * Deterministic, realistic development/mock datasets for testing when external APIs
 * are unconfigured or credentials are not provided.
 *
 * Reflects the canonical example:
 * - Instagram: 600,000 followers
 * - YouTube: 30,000 subscribers
 * - X: 120,000 followers
 * - Facebook: 250,000 followers
 * - LinkedIn: 80,000 followers
 * - WhatsApp Channel: 400,000 followers
 * Combined: ~1,480,000 audience reach!
 */
export const MOCK_SOCIAL_DATA: Record<
  SocialPlatform,
  { profile: SocialProfileResult; metrics: SocialMetricsResult }
> = {
  INSTAGRAM: {
    profile: {
      platform: "INSTAGRAM",
      platformAccountId: "ig_mock_101",
      username: "creator_studio",
      displayName: "Creator Studio",
      profileUrl: "https://instagram.com/creator_studio",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      bio: "Visual storyteller & tech enthusiast",
      isVerified: true,
    },
    metrics: {
      platform: "INSTAGRAM",
      followersCount: 600000,
      followingCount: 840,
      postsCount: 412,
      engagementRate: 3.85,
      impressionsLast30Days: 2400000,
      isMockData: true,
      fetchedAt: new Date(),
    },
  },
  YOUTUBE: {
    profile: {
      platform: "YOUTUBE",
      platformAccountId: "yt_mock_202",
      username: "creatorstudiovlogs",
      displayName: "Creator Studio Vlogs",
      profileUrl: "https://youtube.com/@creatorstudiovlogs",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      bio: "Weekly tech breakdowns & lifestyle vlogs",
      isVerified: true,
    },
    metrics: {
      platform: "YOUTUBE",
      followersCount: 30000,
      postsCount: 85,
      engagementRate: 7.2,
      impressionsLast30Days: 450000,
      isMockData: true,
      fetchedAt: new Date(),
    },
  },
  X_TWITTER: {
    profile: {
      platform: "X_TWITTER",
      platformAccountId: "x_mock_303",
      username: "creator_studio",
      displayName: "Creator Studio",
      profileUrl: "https://x.com/creator_studio",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      bio: "Thoughts on tech, media & building",
      isVerified: true,
    },
    metrics: {
      platform: "X_TWITTER",
      followersCount: 120000,
      followingCount: 350,
      postsCount: 2310,
      engagementRate: 2.45,
      impressionsLast30Days: 1100000,
      isMockData: true,
      fetchedAt: new Date(),
    },
  },
  FACEBOOK: {
    profile: {
      platform: "FACEBOOK",
      platformAccountId: "fb_mock_404",
      username: "CreatorStudioPage",
      displayName: "Creator Studio Official",
      profileUrl: "https://facebook.com/CreatorStudioPage",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      bio: "Official community page for fans & creators",
      isVerified: true,
    },
    metrics: {
      platform: "FACEBOOK",
      followersCount: 250000,
      postsCount: 520,
      engagementRate: 1.95,
      impressionsLast30Days: 950000,
      isMockData: true,
      fetchedAt: new Date(),
    },
  },
  LINKEDIN: {
    profile: {
      platform: "LINKEDIN",
      platformAccountId: "li_mock_505",
      username: "creator-studio-inc",
      displayName: "Creator Studio & Co",
      profileUrl: "https://linkedin.com/in/creator-studio-inc",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      bio: "Content strategy & digital creator insights",
      isVerified: true,
    },
    metrics: {
      platform: "LINKEDIN",
      followersCount: 80000,
      postsCount: 190,
      engagementRate: 4.15,
      impressionsLast30Days: 320000,
      isMockData: true,
      fetchedAt: new Date(),
    },
  },
  WHATSAPP_CHANNEL: {
    profile: {
      platform: "WHATSAPP_CHANNEL",
      platformAccountId: "wa_mock_606",
      username: "creator_broadcast",
      displayName: "Creator Insider Channel",
      profileUrl: "https://whatsapp.com/channel/creator_broadcast",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      bio: "Exclusive drops, live announcements & backstage",
      isVerified: true,
    },
    metrics: {
      platform: "WHATSAPP_CHANNEL",
      followersCount: 400000,
      postsCount: 120,
      engagementRate: 18.5, // High active read/reaction rate
      impressionsLast30Days: 1600000,
      isMockData: true,
      fetchedAt: new Date(),
    },
  },
};
