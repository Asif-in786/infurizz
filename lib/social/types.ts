export const SUPPORTED_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
  "Twitch",
  "LinkedIn",
] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export type ProviderLifecycleStatus =
  | "UNCONFIGURED"
  | "CONFIGURED"
  | "AVAILABLE"
  | "REQUIRES_REVIEW"
  | "TEMPORARILY_UNAVAILABLE"
  | "RESTRICTED"
  | "DISABLED";

export type SocialAccountStatus =
  | "NOT_CONNECTED"
  | "PENDING"
  | "CONNECTED"
  | "EXPIRED"
  | "REVOKED"
  | "DISCONNECTED"
  | "ERROR";

export type MetricProvenanceType = "PROVIDER_REPORTED" | "DERIVED";

export type MetricValueType = "INTEGER" | "DECIMAL" | "PERCENTAGE" | "TEXT" | "JSON";

/**
 * Three distinct trust concepts preserved across INFURIZZ:
 * 1. Account Authorization (OAuth 2.0 authenticated connection)
 * 2. Provider Provenance (Data directly reported by the platform API vs Platform-calculated)
 * 3. Platform Verification (Official verification checkmark / badge granted by the platform itself)
 */
export interface ProviderTrustProfile {
  isAccountAuthorized: boolean;
  provenanceType: MetricProvenanceType;
  isPlatformVerifiedBadge: boolean;
}

export interface ProviderCapabilityContract {
  supportsReach: boolean;
  supportsDemographics: boolean;
  supportsHistoricalAnalytics: boolean;
  supportsContentSync: boolean;
  pricingTierNotes?: string;
  documentationReviewedAt?: string;
}

export interface ContentItemDTO {
  providerContentId: string;
  contentType: string; // 'video' | 'short' | 'post' | 'reel' | 'stream'
  publishedAt: Date;
  title?: string | null;
  permalink?: string | null;
  thumbnailUrl?: string | null;
  // Strict rule: Canonical count metrics must NEVER use JavaScript number. Strictly BigInt.
  viewCount?: bigint | null;
  likeCount?: bigint | null;
  commentCount?: bigint | null;
  shareCount?: bigint | null;
  saveCount?: bigint | null;
}

export interface CanonicalMetricDTO {
  canonicalMetricName: string;
  metricValueType: MetricValueType;
  valueInt?: bigint | null;
  valueDecimal?: string | null; // Safe string representation for Decimals/Percentages
  sourceType: MetricProvenanceType;
  calculationMethod?: string | null;
  capturedAt: Date;
}

export interface AudienceSnapshotDTO {
  countryBreakdown?: Record<string, number>;
  ageGenderBreakdown?: Record<string, number>;
  deviceBreakdown?: Record<string, number>;
  capturedAt: Date;
}

export interface ProviderAccountResult {
  providerAccountId: string;
  handle: string;
  displayName?: string | null;
  profileUrl?: string | null;
  avatarUrl?: string | null;
  isPlatformVerifiedBadge: boolean;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  scope?: string | null;
}

export interface DerivedMetricContract {
  name: string;
  formula: string;
  window: string;
  denominator: string;
  missingInputBehavior: string;
  sourceMetricNames: string[];
}

export interface ISocialProviderAdapter {
  readonly platform: SupportedPlatform;
  readonly displayName: string;
  readonly status: ProviderLifecycleStatus;
  readonly capabilities: ProviderCapabilityContract;

  isConfigured(): boolean;
  isOAuthConfigured?: boolean;
  getAuthorizationUrl(creatorId: string, stateToken?: string): Promise<string | null>;
  handleCallback(code: string, state: string): Promise<{ success: boolean; account?: ProviderAccountResult; error?: string }>;
  fetchMetrics?(handle: string): Promise<SocialMetrics | null>;
  fetchLiveMetrics?(socialAccountId: string, accessToken: string): Promise<CanonicalMetricDTO[]>;
  fetchRecentContent?(socialAccountId: string, accessToken: string, limit?: number): Promise<ContentItemDTO[]>;
  fetchAudienceDemographics?(socialAccountId: string, accessToken: string): Promise<AudienceSnapshotDTO | null>;
}

// Backwards-compatible legacy types and aliases
export type ConnectionStatus = SocialAccountStatus;

export interface SocialMetrics {
  followerCount?: bigint | number;
  subscriberCount?: bigint | number;
  engagementRate?: string | number;
  lastSyncedAt?: Date;
}

export interface SocialConnectionState {
  platform: SupportedPlatform;
  status: SocialAccountStatus;
  handle: string;
  profileUrl?: string;
  audienceNote?: string;
  isSample: boolean;
  isPlatformVerifiedBadge?: boolean;
  verifiedAt?: Date | null;
  metrics?: SocialMetrics;
}

export type SocialProvider = ISocialProviderAdapter;
