import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { CollaborationStatus } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const collaboration = await prisma.collaboration.findUnique({
      where: { id },
      include: {
        brand: { include: { user: true } },
        creator: {
          include: {
            user: true,
            socialAccounts: { where: { isConnected: true } },
          },
        },
        campaign: true,
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
      },
    });

    if (!collaboration) {
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 });
    }

    return NextResponse.json({ collaboration });
  } catch (error) {
    console.error("Error fetching collaboration:", error);
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
    const { status } = body;

    if (!status || !Object.values(CollaborationStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.collaboration.findUnique({
      where: { id },
      include: {
        brand: { include: { user: true } },
        creator: { include: { user: true } },
        conversations: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 });
    }

    const VALID_TRANSITIONS: Record<CollaborationStatus, CollaborationStatus[]> = {
      [CollaborationStatus.PENDING]: [
        CollaborationStatus.ACCEPTED,
        CollaborationStatus.DECLINED,
        CollaborationStatus.CANCELLED,
      ],
      [CollaborationStatus.ACCEPTED]: [
        CollaborationStatus.IN_PROGRESS,
        CollaborationStatus.COMPLETED,
        CollaborationStatus.CANCELLED,
      ],
      [CollaborationStatus.IN_PROGRESS]: [
        CollaborationStatus.COMPLETED,
        CollaborationStatus.CANCELLED,
      ],
      [CollaborationStatus.COMPLETED]: [],
      [CollaborationStatus.DECLINED]: [],
      [CollaborationStatus.CANCELLED]: [],
    };

    if (existing.status === status) {
      return NextResponse.json({ collaboration: existing });
    }

    const allowedNext = VALID_TRANSITIONS[existing.status] || [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${existing.status} to ${status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.collaboration.update({
      where: { id },
      data: { status },
      include: {
        brand: { include: { user: true } },
        creator: { include: { user: true } },
        conversations: true,
      },
    });

    // Determine actor (Brand or Creator)
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const isBrandActor = body.actorRole === "BRAND" || sessionUserId === updated.brand.user.id;

    const senderId = isBrandActor ? updated.brand.user.id : updated.creator.user.id;
    const receiverId = isBrandActor ? updated.creator.user.id : updated.brand.user.id;
    const actorName = isBrandActor ? updated.brand.companyName : updated.creator.displayName;
    const notifLink = isBrandActor ? "/creator/collaborations" : "/brand/collaborations";

    // Ensure conversation thread exists for in-platform communication
    let conv = updated.conversations[0];
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          creatorId: updated.creatorId,
          brandId: updated.brandId,
          collaborationId: updated.id,
        },
      });
    }

    // Descriptive status update in deal desk
    let statusContent = `[Deal Status Update] Proposal "${updated.title}" status changed to: ${status}.`;
    if (status === "ACCEPTED") {
      statusContent = `[Deal Accepted] ${actorName} accepted the proposal "${updated.title}". Milestones are now locked.`;
    } else if (status === "IN_PROGRESS") {
      statusContent = `[Production Started] ${actorName} has begun production on agreed deliverables for "${updated.title}".`;
    } else if (status === "COMPLETED") {
      statusContent = `[Deal Completed] Deliverables for "${updated.title}" have been completed and verified!`;
    } else if (status === "DECLINED") {
      statusContent = `[Offer Declined] ${actorName} declined the proposal "${updated.title}".`;
    } else if (status === "CANCELLED") {
      statusContent = `[Offer Withdrawn] ${actorName} cancelled the collaboration offer "${updated.title}".`;
    }

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        collaborationId: updated.id,
        senderId,
        receiverId,
        content: statusContent,
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    // Create notification for counterpart
    let notifTitle = `Collaboration Update: ${status.replace("_", " ")}`;
    let notifMsg = `${actorName} updated "${updated.title}" to ${status.replace("_", " ")}.`;

    if (status === "ACCEPTED") {
      notifTitle = "Proposal Accepted";
      notifMsg = `${actorName} accepted the proposal "${updated.title}".`;
    } else if (status === "IN_PROGRESS") {
      notifTitle = "Production In Progress";
      notifMsg = `${actorName} started production for "${updated.title}".`;
    } else if (status === "COMPLETED") {
      notifTitle = "Collaboration Completed";
      notifMsg = `${actorName} marked "${updated.title}" as completed.`;
    } else if (status === "DECLINED") {
      notifTitle = "Proposal Declined";
      notifMsg = `${actorName} declined the proposal "${updated.title}".`;
    } else if (status === "CANCELLED") {
      notifTitle = "Offer Cancelled";
      notifMsg = `${actorName} cancelled the offer for "${updated.title}".`;
    }

    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: notifTitle,
        message: notifMsg,
        link: notifLink,
      },
    });

    return NextResponse.json({
      collaboration: updated,
      conversationId: conv.id,
    });
  } catch (error) {
    console.error("Error updating collaboration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
