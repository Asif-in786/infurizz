import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { CampaignStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        brand: true,
        collaborations: {
          include: {
            creator: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
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
    const {
      title,
      description,
      budget,
      currency,
      targetCategory,
      targetPlatforms,
      status,
      deadline,
    } = body;

    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (status && !Object.values(CampaignStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid campaign status" }, { status: 400 });
    }

    if (budget !== undefined && (typeof budget !== "number" || budget < 0)) {
      return NextResponse.json({ error: "Budget must be a non-negative number" }, { status: 400 });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(budget !== undefined && { budget }),
        ...(currency && { currency }),
        ...(targetCategory !== undefined && { targetCategory }),
        ...(targetPlatforms !== undefined && { targetPlatforms }),
        ...(status && { status }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
      },
      include: {
        brand: true,
        collaborations: {
          include: { creator: true },
        },
      },
    });

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
