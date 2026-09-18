import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  collaborationId: z.string().optional(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().trim().min(1, "Message cannot be empty"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    let userId = searchParams.get("userId");

    if (!userId && !conversationId) {
      const cookieStore = await cookies();
      userId = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
    }

    // If conversationId is provided, get all messages in that conversation
    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, name: true, email: true, role: true } },
          receiver: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ messages });
    }

    // If userId is provided, return all conversations for that user
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          creatorProfile: true,
          brandProfile: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const creatorId = user.creatorProfile?.id;
      const brandId = user.brandProfile?.id;

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            ...(creatorId ? [{ creatorId }] : []),
            ...(brandId ? [{ brandId }] : []),
          ],
        },
        include: {
          creator: {
            include: { user: true },
          },
          brand: {
            include: { user: true },
          },
          collaboration: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });

      return NextResponse.json({ conversations });
    }

    return NextResponse.json({ error: "Missing conversationId or userId query parameter" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: validated.senderId },
        include: { creatorProfile: true, brandProfile: true },
      }),
      prisma.user.findUnique({
        where: { id: validated.receiverId },
        include: { creatorProfile: true, brandProfile: true },
      }),
    ]);

    if (!sender || !receiver) {
      return NextResponse.json({ error: "Sender or receiver user not found" }, { status: 404 });
    }

    let convId = validated.conversationId;

    if (convId) {
      const convExists = await prisma.conversation.findUnique({
        where: { id: convId },
      });
      if (!convExists) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      // Look up or create conversation
      const creatorId = sender.creatorProfile?.id || receiver.creatorProfile?.id;
      const brandId = sender.brandProfile?.id || receiver.brandProfile?.id;

      if (creatorId && brandId) {
        let conv = await prisma.conversation.findFirst({
          where: { creatorId, brandId },
        });

        if (!conv) {
          conv = await prisma.conversation.create({
            data: {
              creatorId,
              brandId,
              collaborationId: validated.collaborationId,
            },
          });
        }
        convId = conv.id;
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        collaborationId: validated.collaborationId,
        senderId: validated.senderId,
        receiverId: validated.receiverId,
        content: validated.content,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
        receiver: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (convId) {
      await prisma.conversation.update({
        where: { id: convId },
        data: { lastMessageAt: new Date() },
      });
    }

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: validated.receiverId,
        title: `New message from ${message.sender.name || "Partner"}`,
        message: validated.content.slice(0, 100),
        link: message.sender.role === "BRAND" ? "/creator/messages" : "/brand/messages",
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
