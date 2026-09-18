import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || sessionUserId;

    if (!userId) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAllRead, userId } = body;

    if (notificationId) {
      const existing = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ notification: updated });
    }

    if (markAllRead) {
      const cookieStore = await cookies();
      const targetUserId = userId || cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (targetUserId) {
        await prisma.notification.updateMany({
          where: { userId: targetUserId, isRead: false },
          data: { isRead: true },
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
