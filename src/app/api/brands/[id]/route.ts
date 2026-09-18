import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const brand = await prisma.brandProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        campaigns: {
          orderBy: { createdAt: "desc" },
        },
        collaborations: {
          include: {
            creator: true,
          },
          orderBy: { createdAt: "desc" },
        },
        conversations: {
          include: {
            creator: true,
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error fetching brand profile:", error);
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
    const { companyName, industry, website, budgetRange, description, location, logoUrl } = body;

    const existing = await prisma.brandProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const updated = await prisma.brandProfile.update({
      where: { id: existing.id },
      data: {
        ...(companyName && { companyName }),
        ...(industry !== undefined && { industry }),
        ...(website !== undefined && { website }),
        ...(budgetRange !== undefined && { budgetRange }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
      include: {
        campaigns: true,
        collaborations: true,
      },
    });

    return NextResponse.json({ brand: updated });
  } catch (error) {
    console.error("Error updating brand profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
