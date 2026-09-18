import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id }, { handle: id }],
      },
      include: {
        socialAccounts: {
          where: { isConnected: true },
          orderBy: { followersCount: "desc" },
        },
        audienceSnapshots: {
          orderBy: { recordedAt: "asc" },
          take: 12,
        },
        performanceMetrics: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({ creator });
  } catch (error) {
    console.error("Error fetching creator:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { displayName, bio, category, location, ratesSummary, website, contactEmail } = body;

    const existing = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id }, { handle: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const updated = await prisma.creatorProfile.update({
      where: { id: existing.id },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(category && { category }),
        ...(location !== undefined && { location }),
        ...(ratesSummary !== undefined && { ratesSummary }),
        ...(website !== undefined && { website }),
        ...(contactEmail !== undefined && { contactEmail }),
      },
      include: {
        socialAccounts: true,
      },
    });

    return NextResponse.json({ creator: updated });
  } catch (error) {
    console.error("Error updating creator profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
