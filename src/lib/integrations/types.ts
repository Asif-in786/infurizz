import { SocialPlatform } from "@prisma/client";

/**
 * Standardized profile data returned by any social platform connector.
 */
export interface SocialProfileResult {
  platform: SocialPlatform;
  platformAccountId: string;
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  bio?: string;
  isVerified?: boolean;
}

/**
 * Standardized audience & engagement metrics returned by any social connector.
 */
export interface SocialMetricsResult {
  platform: SocialPlatform;
  followersCount: number;
  followingCount?: number;
  postsCount?: number;
  engagementRate: number; // e.g., 3.8%
  impressionsLast30Days?: number;
  rawMetrics?: Record<string, unknown>;
  isMockData: boolean;
  fetchedAt: Date;
}

/**
 * Result of syncing a creator's social account into the INFURIZZ database.
 */
export interface SocialSyncResult {
  success: boolean;
  platform: SocialPlatform;
  followersCount: number;
  engagementRate: number;
  syncedAt: Date;
  isMockData: boolean;
  error?: string;
}

/**
 * The core adapter contract every platform connector must implement.
 * Allows new platforms to be plugged into INFURIZZ modularly without touching existing business logic.
 */
export interface SocialConnector {
  readonly platform: SocialPlatform;
  readonly name: string;
  readonly isConfigured: boolean;

  /**
   * Fetches the public/authorized profile for a given handle or platform user ID.
   */
  getProfile(accountIdentifier: string): Promise<SocialProfileResult>;

  /**
   * Fetches latest metrics, audience count, and engagement stats.
   */
  getMetrics(accountIdentifier: string): Promise<SocialMetricsResult>;

  /**
   * Syncs the platform data and saves/updates it in the INFURIZZ database.
   */
  syncAccount(creatorId: string, accountIdentifier: string): Promise<SocialSyncResult>;
}
