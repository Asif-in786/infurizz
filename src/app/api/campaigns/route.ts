import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const createCampaignSchema = z.object({
  brandId: z.string(),
  title: z.string().min(3),
  description: z.string().min(10),
  budget: z.number().positive().optional(),
  currency: z.string().default("USD"),
  targetCategory: z.string().optional(),
  targetPlatforms: z.string().optional(),
  deadline: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    let resolvedBrandId = brandId;
    if (!resolvedBrandId) {
      const cookieStore = await cookies();
      const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (sessionUserId) {
        const profile = await prisma.brandProfile.findUnique({
          where: { userId: sessionUserId },
          select: { id: true },
        });
        resolvedBrandId = profile?.id ?? null;
      }
    }

    const where = resolvedBrandId ? { brandId: resolvedBrandId } : {};

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        brand: true,
        collaborations: {
          include: { creator: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCampaignSchema.parse(body);

    const brand = await prisma.brandProfile.findUnique({
      where: { id: validated.brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        brandId: validated.brandId,
        title: validated.title,
        description: validated.description,
        budget: validated.budget,
        currency: validated.currency,
        targetCategory: validated.targetCategory,
        targetPlatforms: validated.targetPlatforms,
        deadline: validated.deadline ? new Date(validated.deadline) : undefined,
      },
      include: { brand: true },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
