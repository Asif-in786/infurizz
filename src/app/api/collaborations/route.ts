import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const createCollabSchema = z.object({
  brandId: z.string(),
  creatorId: z.string(),
  campaignId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(5),
  deliverables: z.string().optional(),
  budgetAmount: z.number().positive().optional(),
  currency: z.string().default("USD"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creatorId");
    const brandId = searchParams.get("brandId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (creatorId) {
      where.creatorId = creatorId;
    } else if (brandId) {
      where.brandId = brandId;
    } else {
      const cookieStore = await cookies();
      const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (sessionUserId) {
        const user = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { creatorProfile: { select: { id: true } }, brandProfile: { select: { id: true } } },
        });
        if (user?.creatorProfile) {
          where.creatorId = user.creatorProfile.id;
        } else if (user?.brandProfile) {
          where.brandId = user.brandProfile.id;
        }
      }
    }
    if (status && status !== "ALL") where.status = status;

    const collaborations = await prisma.collaboration.findMany({
      where,
      include: {
        brand: true,
        creator: true,
        campaign: true,
        conversations: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ collaborations });
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCollabSchema.parse(body);

    const brand = await prisma.brandProfile.findUnique({
      where: { id: validated.brandId },
      include: { user: true },
    });
    if (!brand || !brand.user) {
      return NextResponse.json({ error: "Brand profile or brand user not found" }, { status: 404 });
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { id: validated.creatorId },
      include: { user: true },
    });
    if (!creator || !creator.user) {
      return NextResponse.json({ error: "Creator profile or creator user not found" }, { status: 404 });
    }

    if (validated.campaignId) {
      const camp = await prisma.campaign.findUnique({
        where: { id: validated.campaignId },
      });
      if (!camp) {
        return NextResponse.json({ error: "Linked campaign not found" }, { status: 404 });
      }
    }

    // Check for duplicate pending proposal
    const duplicate = await prisma.collaboration.findFirst({
      where: {
        brandId: validated.brandId,
        creatorId: validated.creatorId,
        title: validated.title,
        status: "PENDING",
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A pending proposal with this title already exists for this creator." },
        { status: 409 }
      );
    }

    const collaboration = await prisma.collaboration.create({
      data: {
        brandId: validated.brandId,
        creatorId: validated.creatorId,
        campaignId: validated.campaignId,
        title: validated.title,
        description: validated.description,
        deliverables: validated.deliverables,
        budgetAmount: validated.budgetAmount,
        currency: validated.currency,
        status: "PENDING",
      },
      include: {
        brand: { include: { user: true } },
        creator: { include: { user: true } },
      },
    });

    // Create conversation thread for in-platform messaging
    const conversation = await prisma.conversation.create({
      data: {
        creatorId: validated.creatorId,
        brandId: validated.brandId,
        collaborationId: collaboration.id,
      },
    });

    // Create opening message in the in-platform deal desk
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        collaborationId: collaboration.id,
        senderId: collaboration.brand.user.id,
        receiverId: collaboration.creator.user.id,
        content: `[New Proposal: ${validated.title}] We have dispatched a collaboration offer for $${validated.budgetAmount?.toLocaleString() || "0"} ${validated.currency}. Deliverables: ${validated.deliverables || "Standard package"}. Looking forward to working together!`,
      },
    });

    // Create notification for creator
    await prisma.notification.create({
      data: {
        userId: collaboration.creator.user.id,
        title: `New Proposal from ${collaboration.brand.companyName}`,
        message: `${collaboration.brand.companyName} submitted a $${validated.budgetAmount?.toLocaleString() || "0"} proposal: "${validated.title}".`,
        link: "/creator/collaborations",
      },
    });

    return NextResponse.json({
      collaboration,
      conversationId: conversation.id,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Error creating collaboration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
