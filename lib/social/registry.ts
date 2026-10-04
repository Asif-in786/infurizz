import {
  SUPPORTED_PLATFORMS,
  type ISocialProviderAdapter,
  type SocialAccountStatus,
  type SocialConnectionState,
  type SupportedPlatform,
} from "./types";
import { BaseSocialProviderAdapter, UnconfiguredProviderAdapter } from "./base";
export { BaseSocialProviderAdapter, UnconfiguredProviderAdapter };
import { YouTubeProviderAdapter } from "./providers/youtube";

// Registry map of all 6 supported platforms with real capability profiles
export const socialProviders: Record<SupportedPlatform, ISocialProviderAdapter> = {
  Instagram: new UnconfiguredProviderAdapter(
    "Instagram",
    "Instagram",
    "REQUIRES_REVIEW",
    {
      supportsReach: false,
      supportsDemographics: false,
      supportsHistoricalAnalytics: false,
      supportsContentSync: false,
      pricingTierNotes: "Requires Meta App Review, Business/Creator Account requirement",
      documentationReviewedAt: "Pending",
    },
  ),
  TikTok: new UnconfiguredProviderAdapter(
    "TikTok",
    "TikTok",
    "REQUIRES_REVIEW",
    {
      supportsReach: false,
      supportsDemographics: false,
      supportsHistoricalAnalytics: false,
      supportsContentSync: false,
      pricingTierNotes: "Requires TikTok for Developers commercial review",
      documentationReviewedAt: "Pending",
    },
  ),
  YouTube: new YouTubeProviderAdapter(),
  X: new UnconfiguredProviderAdapter(
    "X",
    "X (Twitter)",
    "RESTRICTED",
    {
      supportsReach: false,
      supportsDemographics: false,
      supportsHistoricalAnalytics: false,
      supportsContentSync: false,
      pricingTierNotes: "Twitter API v2 Free tier: Write-only / strict read limitations ($100/mo Basic required for post reads)",
      documentationReviewedAt: "Pending",
    },
  ),
  Twitch: new UnconfiguredProviderAdapter(
    "Twitch",
    "Twitch",
    "UNCONFIGURED",
    {
      supportsReach: false,
      supportsDemographics: false,
      supportsHistoricalAnalytics: false,
      supportsContentSync: false,
      pricingTierNotes: "Free developer tier available; requires client ID & secret",
      documentationReviewedAt: "Pending",
    },
  ),
  LinkedIn: new UnconfiguredProviderAdapter(
    "LinkedIn",
    "LinkedIn",
    "RESTRICTED",
    {
      supportsReach: false,
      supportsDemographics: false,
      supportsHistoricalAnalytics: false,
      supportsContentSync: false,
      pricingTierNotes: "Requires Community Management API approval / enterprise partnership",
      documentationReviewedAt: "Pending",
    },
  ),
};

export function registerProvider(platform: SupportedPlatform, provider: ISocialProviderAdapter): void {
  socialProviders[platform] = provider;
}

export function getSocialProvider(platform: string): ISocialProviderAdapter | null {
  if (SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform)) {
    return socialProviders[platform as SupportedPlatform];
  }
  return null;
}

export function listSocialProviders(): ISocialProviderAdapter[] {
  return SUPPORTED_PLATFORMS.map((platform) => socialProviders[platform]);
}

/**
 * Normalizes connection state for UI display.
 * Distinguishes:
 * 1. Account Authorization (OAuth 2.0 connected)
 * 2. Provider Provenance (Metrics from provider API)
 * 3. Platform Verification (isPlatformVerifiedBadge)
 */
export function formatConnectionState(profile: {
  platform: string;
  handle: string;
  audienceNote?: string | null;
  connectionStatus?: string | null;
  verifiedAt?: Date | null;
  isSample?: boolean;
  isPlatformVerifiedBadge?: boolean;
}): SocialConnectionState {
  const isConnected = Boolean(profile.verifiedAt && profile.connectionStatus === "CONNECTED");
  const platform = (
    SUPPORTED_PLATFORMS.includes(profile.platform as SupportedPlatform)
      ? profile.platform
      : "Instagram"
  ) as SupportedPlatform;

  const status: SocialAccountStatus = isConnected ? "CONNECTED" : "NOT_CONNECTED";

  return {
    platform,
    handle: profile.handle,
    status,
    audienceNote: profile.audienceNote ?? undefined,
    isSample: Boolean(profile.isSample),
    isPlatformVerifiedBadge: Boolean(profile.isPlatformVerifiedBadge),
    verifiedAt: profile.verifiedAt ?? null,
    metrics: undefined, // Strictly undefined when no authenticated connection exists
  };
}
