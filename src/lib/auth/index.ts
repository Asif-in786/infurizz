import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/client";

export const SESSION_COOKIE_NAME = "infurizz_user_id";

export interface AuthSessionUser {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  creatorProfileId?: string;
  creatorHandle?: string;
  brandProfileId?: string;
  companyName?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: AuthSessionUser | null;
  isAuthenticated: boolean;
}

/**
 * Gets the current authenticated user from session cookie and database.
 * Returns null if the user is unauthenticated or not found in the database.
 * Strictly no mock or fake demo user fallbacks.
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: {
          creatorProfile: true,
          brandProfile: true,
        },
      });

      if (dbUser) {
        return {
          id: dbUser.id,
          name: dbUser.name || (dbUser.creatorProfile?.displayName ?? dbUser.brandProfile?.companyName ?? "User"),
          email: dbUser.email,
          role: dbUser.role,
          creatorProfileId: dbUser.creatorProfile?.id,
          creatorHandle: dbUser.creatorProfile?.handle,
          brandProfileId: dbUser.brandProfile?.id,
          companyName: dbUser.brandProfile?.companyName,
          avatarUrl: dbUser.creatorProfile?.avatarUrl || dbUser.brandProfile?.logoUrl || undefined,
        };
      }
    }
  } catch (error) {
    console.warn("Could not read session cookie:", error);
  }

  return null;
}

/**
 * Server-side session provider contract.
 */
export async function getDevSession(): Promise<AuthSession> {
  const user = await getCurrentUser();
  return {
    isAuthenticated: Boolean(user),
    user,
  };
}
