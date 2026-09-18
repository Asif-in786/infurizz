import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { SocialPlatform } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const minReach = searchParams.get("minReach");
    const platform = searchParams.get("platform");

    const where: Record<string, unknown> = {};

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (minReach && parseInt(minReach, 10) > 0) {
      where.totalReach = { gte: parseInt(minReach, 10) };
    }

    if (platform && platform !== "ALL") {
      const normalized = platform.toUpperCase().replace("-", "_");
      if (Object.values(SocialPlatform).includes(normalized as SocialPlatform)) {
        where.socialAccounts = {
          some: {
            platform: normalized as SocialPlatform,
            isConnected: true,
          },
        };
      }
    }

    if (query && query.trim().length > 0) {
      where.OR = [
        { displayName: { contains: query.trim() } },
        { handle: { contains: query.trim() } },
        { bio: { contains: query.trim() } },
      ];
    }

    const creators = await prisma.creatorProfile.findMany({
      where,
      include: {
        socialAccounts: {
          where: { isConnected: true },
          orderBy: { followersCount: "desc" },
        },
      },
      orderBy: {
        totalReach: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      creators,
      count: creators.length,
    });
  } catch (error) {
    console.error("Failed to fetch creators:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
