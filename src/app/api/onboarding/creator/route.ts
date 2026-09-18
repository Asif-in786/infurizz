import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { Role } from "@prisma/client";
import { AudienceAggregator } from "@/lib/analytics/aggregator";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const creatorOnboardingSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  handle: z.string().min(2),
  displayName: z.string().min(2),
  category: z.string().default("Tech & Software"),
  bio: z.string().optional(),
  location: z.string().optional(),
  ratesSummary: z.string().optional(),
  selectedPlatforms: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = creatorOnboardingSchema.parse(body);

    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    // 1. Find or create User
    let user = null;
    if (sessionUserId) {
      user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { creatorProfile: true },
      });
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { creatorProfile: true },
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name || data.displayName,
          role: Role.CREATOR,
        },
        include: { creatorProfile: true },
      });
    }

    // 2. Create or update CreatorProfile
    const cleanHandle = data.handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
    let creatorProfile = user.creatorProfile;

    if (!creatorProfile) {
      // Check if handle is taken, if so append random suffix
      const existingWithHandle = await prisma.creatorProfile.findUnique({
        where: { handle: cleanHandle },
      });
      const finalHandle = existingWithHandle ? `${cleanHandle}_${Math.floor(Math.random() * 1000)}` : cleanHandle;

      creatorProfile = await prisma.creatorProfile.create({
        data: {
          userId: user.id,
          handle: finalHandle,
          displayName: data.displayName,
          category: data.category,
          bio: data.bio || `Content creator specializing in ${data.category}.`,
          location: data.location || "San Francisco, CA",
          ratesSummary: data.ratesSummary || "$1,500 - $4,500 per sponsorship",
          isVerified: true,
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        },
      });
    } else {
      creatorProfile = await prisma.creatorProfile.update({
        where: { id: creatorProfile.id },
        data: {
          displayName: data.displayName,
          category: data.category,
          bio: data.bio || creatorProfile.bio,
          location: data.location || creatorProfile.location,
          ratesSummary: data.ratesSummary || creatorProfile.ratesSummary,
        },
      });
    }

    // 3. Recalculate unified audience totals (only from genuine connected accounts)
    const aggregated = await AudienceAggregator.refreshCreatorMetrics(creatorProfile.id);

    // 4. Create a welcome notification
    const welcomeMsg = aggregated.totalReach > 0
      ? `Your creator profile @${creatorProfile.handle} is online with ${aggregated.totalReach.toLocaleString()} verified reach across ${aggregated.totalPlatforms} connected channels.`
      : `Your creator profile @${creatorProfile.handle} is online! Connect your social accounts to verify and showcase your audience.`;

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to INFURIZZ Protocol",
        message: welcomeMsg,
        link: "/creator/dashboard",
      },
    });

    // 5. Set session cookie
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: user.id,
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      creator: creatorProfile,
      aggregated,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Error in POST /api/onboarding/creator:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
