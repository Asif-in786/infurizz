import { BaseSocialProviderAdapter } from "../base";
import { toSafeBigInt, toSafeBigIntOrNull } from "../normalization";
import type {
  CanonicalMetricDTO,
  ContentItemDTO,
  ISocialProviderAdapter,
  ProviderAccountResult,
  ProviderCapabilityContract,
} from "../types";

const YOUTUBE_CAPABILITIES: ProviderCapabilityContract = {
  supportsReach: false, // API does not expose unique viewer reach
  supportsDemographics: false, // YouTube Analytics API requires channel partner approval & yt-analytics scope
  supportsHistoricalAnalytics: false, // Snapshot engine provides platform-side daily history
  supportsContentSync: true, // Content video stats (views, likes, comments) supported via Data API v3
  pricingTierNotes: "YouTube Data API v3: Free quota 10,000 units/day. Video sync uses efficient playlistItems (3 quota units).",
  documentationReviewedAt: "2026-Q1",
};

function getYouTubeBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing production URL: configure APP_URL or NEXT_PUBLIC_APP_URL for YouTube OAuth callback.");
  }
  return "http://localhost:3000";
}

export class YouTubeProviderAdapter
  extends BaseSocialProviderAdapter
  implements ISocialProviderAdapter
{
  constructor() {
    const isConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    );
    super(
      "YouTube",
      "YouTube",
      isConfigured ? "AVAILABLE" : "UNCONFIGURED",
      YOUTUBE_CAPABILITIES,
    );
  }

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  /**
   * Generates Google OAuth 2.0 authorization URL for YouTube read-only access.
   */
  async getAuthorizationUrl(
    creatorId: string,
    stateToken?: string,
    redirectUri?: string,
  ): Promise<string | null> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return null;
    }

    const targetRedirectUri =
      redirectUri ??
      process.env.YOUTUBE_REDIRECT_URI ??
      `${getYouTubeBaseUrl()}/api/social/callback/youtube`;

    const statePayload = Buffer.from(
      JSON.stringify({
        creatorId,
        stateToken: stateToken ?? "default",
        platform: "YouTube",
        timestamp: Date.now(),
      }),
    ).toString("base64url");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: targetRedirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state: statePayload,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens and fetches the YouTube channel identity.
   */
  async handleCallback(
    code: string,
    state: string,
    redirectUri?: string,
  ): Promise<{ success: boolean; account?: ProviderAccountResult; error?: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: "Google OAuth credentials are not configured in environment.",
      };
    }

    const targetRedirectUri =
      redirectUri ??
      process.env.YOUTUBE_REDIRECT_URI ??
      `${getYouTubeBaseUrl()}/api/social/callback/youtube`;

    try {
      // 1. Exchange auth code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: targetRedirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        return { success: false, error: `Google token exchange failed: ${errorBody}` };
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token ?? null;
      const expiresIn = tokenData.expires_in;
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
      const scope = tokenData.scope ?? null;

      // 2. Fetch authenticated YouTube channel details
      const channelResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,status&mine=true",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!channelResponse.ok) {
        const errorText = await channelResponse.text();
        return { success: false, error: `YouTube channel retrieval failed: ${errorText}` };
      }

      const channelData = await channelResponse.json();
      const channel = channelData.items?.[0];

      if (!channel) {
        return { success: false, error: "No YouTube channel found for the authenticated Google account." };
      }

      const channelId = channel.id;
      const title = channel.snippet?.title ?? "YouTube Channel";
      const customUrl = channel.snippet?.customUrl ?? null;
      const handle = customUrl ? (customUrl.startsWith("@") ? customUrl : `@${customUrl}`) : `@${channelId}`;
      const avatarUrl = channel.snippet?.thumbnails?.default?.url ?? null;
      const profileUrl = customUrl
        ? `https://youtube.com/${customUrl}`
        : `https://youtube.com/channel/${channelId}`;

      return {
        success: true,
        account: {
          providerAccountId: channelId,
          handle,
          displayName: title,
          profileUrl,
          avatarUrl,
          isPlatformVerifiedBadge: false, // YouTube Data API v3 does not expose an isVerified boolean
          accessToken,
          refreshToken,
          tokenExpiresAt: expiresAt,
          scope,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error during YouTube callback",
      };
    }
  }

  /**
   * Fetches real-time channel statistics and maps them to canonical metrics with PROVIDER_REPORTED provenance.
   */
  async fetchLiveMetrics(
    _socialAccountId: string,
    accessToken: string,
  ): Promise<CanonicalMetricDTO[]> {
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!channelResponse.ok) {
      throw new Error(`YouTube live metrics request failed with status ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    const stats = channelData.items?.[0]?.statistics;
    if (!stats) return [];

    const capturedAt = new Date();
    const metrics: CanonicalMetricDTO[] = [];

    // 1. Subscriber Count
    if (stats.subscriberCount !== undefined && !stats.hiddenSubscriberCount) {
      metrics.push({
        canonicalMetricName: "AUDIENCE_FOLLOWER_COUNT",
        metricValueType: "INTEGER",
        valueInt: toSafeBigInt(stats.subscriberCount),
        valueDecimal: null,
        sourceType: "PROVIDER_REPORTED",
        calculationMethod: null,
        capturedAt,
      });
    }

    // 2. Lifetime View Count
    if (stats.viewCount !== undefined) {
      metrics.push({
        canonicalMetricName: "CONTENT_LIFETIME_VIEWS",
        metricValueType: "INTEGER",
        valueInt: toSafeBigInt(stats.viewCount),
        valueDecimal: null,
        sourceType: "PROVIDER_REPORTED",
        calculationMethod: null,
        capturedAt,
      });
    }

    // 3. Total Video Count
    if (stats.videoCount !== undefined) {
      metrics.push({
        canonicalMetricName: "CONTENT_TOTAL_UPLOADS",
        metricValueType: "INTEGER",
        valueInt: toSafeBigInt(stats.videoCount),
        valueDecimal: null,
        sourceType: "PROVIDER_REPORTED",
        calculationMethod: null,
        capturedAt,
      });
    }

    return metrics;
  }

  /**
   * Fetches recent videos using quota-efficient upload playlist lookup.
   * Costs 3 quota units total (channels -> playlistItems -> videos).
   */
  async fetchRecentContent(
    _socialAccountId: string,
    accessToken: string,
    limit: number = 5,
  ): Promise<ContentItemDTO[]> {
    // 1. Get uploads playlist ID
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!channelRes.ok) return [];

    const channelJson = await channelRes.json();
    const uploadsPlaylistId =
      channelJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    // 2. Get playlist items (video IDs)
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${limit}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!playlistRes.ok) return [];

    const playlistJson = await playlistRes.json();
    const items = playlistJson.items ?? [];
    if (items.length === 0) return [];

    const videoIds = items
      .map((it: { contentDetails?: { videoId?: string } }) => it.contentDetails?.videoId)
      .filter(Boolean)
      .join(",");

    // 3. Get detailed video stats (views, likes, comments)
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!videosRes.ok) return [];

    const videosJson = await videosRes.json();
    const videoItems = videosJson.items ?? [];

    return videoItems.map((v: {
      id: string;
      snippet: { title?: string; publishedAt?: string; thumbnails?: { high?: { url?: string }; default?: { url?: string } } };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
    }) => ({
      providerContentId: v.id,
      contentType: "VIDEO",
      publishedAt: v.snippet.publishedAt ? new Date(v.snippet.publishedAt) : new Date(),
      title: v.snippet.title ?? null,
      permalink: `https://youtube.com/watch?v=${v.id}`,
      thumbnailUrl: v.snippet.thumbnails?.high?.url ?? v.snippet.thumbnails?.default?.url ?? null,
      viewCount: toSafeBigIntOrNull(v.statistics.viewCount),
      likeCount: toSafeBigIntOrNull(v.statistics.likeCount),
      commentCount: toSafeBigIntOrNull(v.statistics.commentCount),
      shareCount: null, // YouTube Data API v3 does not expose video share counts
      saveCount: null,  // YouTube Data API v3 does not expose video save counts
    }));
  }
}
