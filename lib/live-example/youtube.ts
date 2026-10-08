import { prisma } from "@/lib/prisma";

export interface NormalizedYouTubeInput {
  type: "handle" | "channelId" | "username";
  value: string;
  displayHandle: string;
}

export function normalizeYouTubeInput(raw: string): NormalizedYouTubeInput {
  let cleaned = raw.trim();

  // Strip trailing slashes and query strings
  cleaned = cleaned.split("?")[0].replace(/\/+$/, "");

  // Detect URL variants
  // e.g. https://www.youtube.com/@GoogleDevelopers
  // or https://youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw
  // or https://youtube.com/c/CreatorName
  // or https://youtube.com/user/LegacyUser
  if (cleaned.includes("youtube.com") || cleaned.includes("youtu.be")) {
    const urlParts = cleaned.split("/");
    const lastPart = urlParts[urlParts.length - 1];
    const prevPart = urlParts[urlParts.length - 2];

    if (lastPart.startsWith("@")) {
      const handle = lastPart.replace(/^@+/, "");
      return { type: "handle", value: handle, displayHandle: `@${handle}` };
    } else if (prevPart === "channel" || lastPart.startsWith("UC")) {
      return { type: "channelId", value: lastPart, displayHandle: `@${lastPart}` };
    } else if (prevPart === "c" || prevPart === "user") {
      return { type: "username", value: lastPart, displayHandle: `@${lastPart}` };
    } else {
      const handle = lastPart.replace(/^@+/, "");
      return { type: "handle", value: handle, displayHandle: `@${handle}` };
    }
  }

  // Handle direct handle or channel ID input
  if (cleaned.startsWith("UC") && cleaned.length >= 20) {
    return { type: "channelId", value: cleaned, displayHandle: `@${cleaned}` };
  }

  const handle = cleaned.replace(/^@+/, "");
  return { type: "handle", value: handle, displayHandle: `@${handle}` };
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagement: number;
  engagementRate: number; // Percentage
  permalink: string;
}

export interface YouTubeChannelResult {
  success: boolean;
  isLiveApi: boolean;
  isDatabaseSnapshot?: boolean;
  configured: boolean;
  missingEnv?: string;
  error?: string;
  channel?: {
    id: string;
    handle: string;
    title: string;
    description: string;
    avatarUrl: string;
    customUrl?: string;
    country?: string;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
    hiddenSubscriberCount: boolean;
  };
  videos?: YouTubeVideoItem[];
  kpis?: {
    totalAudience: number;
    totalViews: number;
    totalEngagement: number;
    avgEngagementRate: number;
    contentPublished: number;
  };
}

export async function resolveYouTubeChannel(rawInput: string): Promise<YouTubeChannelResult> {
  const normalized = normalizeYouTubeInput(rawInput);
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 1. If official YOUTUBE_API_KEY is configured, query the YouTube Data API v3 directly
  if (apiKey) {
    try {
      let channelEndpoint = "";
      if (normalized.type === "channelId") {
        channelEndpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${encodeURIComponent(normalized.value)}&key=${apiKey}`;
      } else {
        // First try forHandle
        channelEndpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&forHandle=${encodeURIComponent(normalized.value)}&key=${apiKey}`;
      }

      let res = await fetch(channelEndpoint, { next: { revalidate: 300 } });
      let data = await res.json();

      // If forHandle didn't find the channel, attempt fallback search by username or id
      if ((!data.items || data.items.length === 0) && normalized.type === "handle") {
        const fallbackEndpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&forUsername=${encodeURIComponent(normalized.value)}&key=${apiKey}`;
        const fallbackRes = await fetch(fallbackEndpoint, { next: { revalidate: 300 } });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.items && fallbackData.items.length > 0) {
          data = fallbackData;
        }
      }

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          return {
            success: false,
            isLiveApi: true,
            configured: true,
            error: "YouTube API quota limit reached. Please verify quota or try again in a few minutes.",
          };
        }
        return {
          success: false,
          isLiveApi: true,
          configured: true,
          error: data.error?.message || "YouTube API error while looking up channel.",
        };
      }

      const item = data.items?.[0];
      if (!item) {
        return {
          success: false,
          isLiveApi: true,
          configured: true,
          error: `No YouTube channel found matching "${normalized.displayHandle}". Please verify the handle.`,
        };
      }

      const snippet = item.snippet || {};
      const stats = item.statistics || {};
      const contentDetails = item.contentDetails || {};

      const subscriberCount = Number(stats.subscriberCount || 0);
      const totalViews = Number(stats.viewCount || 0);
      const videoCount = Number(stats.videoCount || 0);
      const uploadsPlaylistId = contentDetails.relatedPlaylists?.uploads;

      let videos: YouTubeVideoItem[] = [];

      // Fetch recent videos if upload playlist is accessible
      if (uploadsPlaylistId) {
        try {
          const playlistRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=8&key=${apiKey}`,
            { next: { revalidate: 300 } }
          );

          if (playlistRes.ok) {
            const playlistData = await playlistRes.json();
            const playlistItems = playlistData.items || [];
            const videoIds = playlistItems
              .map((p: any) => p.contentDetails?.videoId)
              .filter(Boolean);

            if (videoIds.length > 0) {
              const videosRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${apiKey}`,
                { next: { revalidate: 300 } }
              );

              if (videosRes.ok) {
                const videosData = await videosRes.json();
                videos = (videosData.items || []).map((v: any) => {
                  const vSnippet = v.snippet || {};
                  const vStats = v.statistics || {};
                  const viewCount = Number(vStats.viewCount || 0);
                  const likeCount = Number(vStats.likeCount || 0);
                  const commentCount = Number(vStats.commentCount || 0);
                  const engagement = likeCount + commentCount;
                  const engagementRate = viewCount > 0 ? Number(((engagement / viewCount) * 100).toFixed(2)) : 0;

                  return {
                    id: v.id,
                    title: vSnippet.title || "Untitled video",
                    publishedAt: vSnippet.publishedAt || new Date().toISOString(),
                    thumbnailUrl:
                      vSnippet.thumbnails?.high?.url ||
                      vSnippet.thumbnails?.medium?.url ||
                      vSnippet.thumbnails?.default?.url ||
                      "",
                    viewCount,
                    likeCount,
                    commentCount,
                    engagement,
                    engagementRate,
                    permalink: `https://www.youtube.com/watch?v=${v.id}`,
                  };
                });
              }
            }
          }
        } catch {
          // Graceful handling if video stats fail
        }
      }

      const totalEngagement = videos.reduce((acc, v) => acc + v.engagement, 0);
      const avgEngagementRate =
        videos.length > 0
          ? Number((videos.reduce((acc, v) => acc + v.engagementRate, 0) / videos.length).toFixed(2))
          : 0;

      return {
        success: true,
        isLiveApi: true,
        configured: true,
        channel: {
          id: item.id,
          handle: normalized.displayHandle,
          title: snippet.title || normalized.displayHandle,
          description: snippet.description || "",
          avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
          customUrl: snippet.customUrl,
          country: snippet.country,
          subscriberCount,
          viewCount: totalViews,
          videoCount,
          hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
        },
        videos,
        kpis: {
          totalAudience: subscriberCount,
          totalViews,
          totalEngagement,
          avgEngagementRate,
          contentPublished: videoCount,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        isLiveApi: true,
        configured: true,
        error: err?.message || "Network error communicating with YouTube Data API.",
      };
    }
  }

  // 2. Fallback: Search existing verified creator social accounts in local/Supabase database
  const dbAccount = await prisma.socialAccount.findFirst({
    where: {
      platform: "YouTube",
      OR: [
        { handle: { equals: normalized.displayHandle, mode: "insensitive" } },
        { handle: { equals: normalized.value, mode: "insensitive" } },
        { handle: { contains: normalized.value, mode: "insensitive" } },
      ],
    },
    include: {
      creator: true,
      snapshots: { orderBy: { capturedAt: "desc" }, take: 10 },
      contentItems: { orderBy: { publishedAt: "desc" }, take: 8 },
    },
  });

  if (dbAccount) {
    const subscriberSnap = dbAccount.snapshots.find(
      (s) => s.canonicalMetricName === "AUDIENCE_FOLLOWER_COUNT"
    );
    const viewSnap = dbAccount.snapshots.find(
      (s) => s.canonicalMetricName === "CONTENT_LIFETIME_VIEWS"
    );
    const uploadSnap = dbAccount.snapshots.find(
      (s) => s.canonicalMetricName === "CONTENT_TOTAL_UPLOADS"
    );

    const subscriberCount = Number(subscriberSnap?.valueInt || 0);
    const totalViews = Number(viewSnap?.valueInt || 0);
    const videoCount = Number(uploadSnap?.valueInt || dbAccount.contentItems.length);

    const videos: YouTubeVideoItem[] = dbAccount.contentItems.map((item) => {
      const views = Number(item.viewCount || 0);
      const likes = Number(item.likeCount || 0);
      const comments = Number(item.commentCount || 0);
      const engagement = likes + comments;
      const engagementRate = views > 0 ? Number(((engagement / views) * 100).toFixed(2)) : 0;

      return {
        id: item.platformContentId,
        title: item.title || "Video content",
        publishedAt: item.publishedAt.toISOString(),
        thumbnailUrl: "/placeholder-video.jpg",
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        engagement,
        engagementRate,
        permalink: item.url,
      };
    });

    const totalEngagement = videos.reduce((acc, v) => acc + v.engagement, 0);
    const avgEngagementRate =
      videos.length > 0
        ? Number((videos.reduce((acc, v) => acc + v.engagementRate, 0) / videos.length).toFixed(2))
        : 0;

    return {
      success: true,
      isLiveApi: false,
      isDatabaseSnapshot: true,
      configured: false,
      channel: {
        id: dbAccount.platformAccountId,
        handle: dbAccount.handle,
        title: dbAccount.displayName || dbAccount.creator.name,
        description: dbAccount.creator.bio,
        avatarUrl: dbAccount.avatarUrl || dbAccount.creator.avatarUrl || "",
        subscriberCount,
        viewCount: totalViews,
        videoCount,
        hiddenSubscriberCount: false,
      },
      videos,
      kpis: {
        totalAudience: subscriberCount,
        totalViews,
        totalEngagement,
        avgEngagementRate,
        contentPublished: videoCount,
      },
    };
  }

  // 3. If no API key and no matching database account, return exact missing configuration state
  return {
    success: false,
    isLiveApi: false,
    configured: false,
    missingEnv: "YOUTUBE_API_KEY",
    error: `YOUTUBE_API_KEY environment variable is not configured. To enable live public channel lookups for "${normalized.displayHandle}", provide a valid Google Cloud YouTube Data API v3 key in your environment.`,
  };
}
