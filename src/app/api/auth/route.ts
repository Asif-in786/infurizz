import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    let user = null;
    if (sessionUserId) {
      user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: {
          creatorProfile: true,
          brandProfile: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Fetch unread notification count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name || (user.creatorProfile?.displayName ?? user.brandProfile?.companyName ?? "User"),
        email: user.email,
        role: user.role,
        creatorProfileId: user.creatorProfile?.id,
        creatorHandle: user.creatorProfile?.handle,
        brandProfileId: user.brandProfile?.id,
        companyName: user.brandProfile?.companyName,
        avatarUrl: user.creatorProfile?.avatarUrl || user.brandProfile?.logoUrl || undefined,
        totalReach: user.creatorProfile?.totalReach,
      },
      unreadNotifications: unreadCount,
    });
  } catch (error) {
    console.error("Error in GET /api/auth:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, userId } = body;
    const cookieStore = await cookies();

    if (action === "demo-switch") {
      return NextResponse.json(
        { error: "Demo switch is disabled in production mode. Please sign in with real credentials." },
        { status: 403 }
      );
    }

    if (action === "set-session" && userId) {
      cookieStore.set({
        name: SESSION_COOKIE_NAME,
        value: userId,
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });

      return NextResponse.json({ success: true, userId });
    }

    if (action === "signup") {
      const { name, email, password, role } = body;
      if (!email || !email.trim()) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { creatorProfile: true, brandProfile: true },
      });

      if (user) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      const assignedRole = role === "BRAND" ? Role.BRAND : Role.CREATOR;
      const hashedPassword = hashPassword(password);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name?.trim() || normalizedEmail.split("@")[0],
          role: assignedRole,
          passwordHash: hashedPassword,
        },
        include: { creatorProfile: true, brandProfile: true },
      });

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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }, { status: 201 });
    }

    if (action === "login" || !action) {
      if (!email || !email.trim()) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { password } = body;

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { creatorProfile: true, brandProfile: true },
      });

      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      if (user.passwordHash) {
        if (!password || !verifyPassword(password, user.passwordHash)) {
          return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }
      } else if (!password) {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }

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
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          creatorProfileId: user.creatorProfile?.id,
          brandProfileId: user.brandProfile?.id,
        },
      });
    }

    if (action === "logout") {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/auth:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
