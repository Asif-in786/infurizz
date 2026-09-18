import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { SocialPlatform } from "@prisma/client";
import { connectorRegistry } from "@/lib/integrations/registry";
import { AudienceAggregator } from "@/lib/analytics/aggregator";
import { env } from "@/lib/env";
import { z } from "zod";

const connectAccountSchema = z.object({
  creatorId: z.string(),
  platform: z.nativeEnum(SocialPlatform),
  username: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creatorId");

    let resolvedCreatorId = creatorId;
    if (!resolvedCreatorId) {
      const cookieStore = await cookies();
      const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (sessionUserId) {
        const profile = await prisma.creatorProfile.findUnique({
          where: { userId: sessionUserId },
          select: { id: true },
        });
        resolvedCreatorId = profile?.id ?? null;
      }
    }

    if (!resolvedCreatorId) {
      return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { creatorId: resolvedCreatorId },
      orderBy: { followersCount: "desc" },
    });

    return NextResponse.json({ accounts, isMockDataEnabled: env.ENABLE_MOCK_SOCIAL_DATA });
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, platform, username } = connectAccountSchema.parse(body);

    const creatorExists = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
    });
    if (!creatorExists) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const connector = connectorRegistry.get(platform);
    const syncResult = await connector.syncAccount(creatorId, username);

    if (!syncResult.success) {
      return NextResponse.json({ error: syncResult.error || "Failed to connect account" }, { status: 500 });
    }

    const account = await prisma.socialAccount.findUnique({
      where: {
        creatorId_platform: {
          creatorId,
          platform,
        },
      },
    });

    // Refresh aggregated totals in creator profile
    const updatedMetrics = await AudienceAggregator.refreshCreatorMetrics(creatorId);

    // Record platform snapshot
    if (account) {
      await prisma.audienceSnapshot.create({
        data: {
          creatorId,
          platform,
          followersCount: account.followersCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      account,
      updatedMetrics,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Error connecting social account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creatorId");
    const platform = searchParams.get("platform") as SocialPlatform;
    const accountId = searchParams.get("accountId");

    if (!creatorId) {
      return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
    }

    const creatorExists = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
    });
    if (!creatorExists) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    if (accountId) {
      await prisma.socialAccount.delete({
        where: { id: accountId },
      });
    } else if (platform) {
      await prisma.socialAccount.deleteMany({
        where: { creatorId, platform },
      });
    } else {
      return NextResponse.json({ error: "platform or accountId is required" }, { status: 400 });
    }

    const updatedMetrics = await AudienceAggregator.refreshCreatorMetrics(creatorId);

    return NextResponse.json({
      success: true,
      updatedMetrics,
    });
  } catch (error) {
    console.error("Error disconnecting social account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
