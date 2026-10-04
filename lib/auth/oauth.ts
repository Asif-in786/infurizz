import { prisma } from "@/lib/prisma";
import { writeSession } from "@/lib/session";
import { randomBytes } from "node:crypto";

export interface OAuthProvider {
  id: string;
  name: string;
  isConfigured: boolean;
  getAuthorizationUrl(state: string, redirectUri: string): string;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function getAppOrigin(request?: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    const host = request.headers.get("host");
    if (host) {
      const isHttps = request.url.startsWith("https") || process.env.NODE_ENV === "production";
      return `${isHttps ? "https" : "http"}://${host}`;
    }
    return new URL(request.url).origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing production URL: Set APP_URL or NEXT_PUBLIC_APP_URL in your environment.");
  }
  return "http://localhost:3000";
}

export function getGoogleAuthorizationUrl(state: string, redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in environment.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function handleGoogleCallback(code: string, redirectUri: string): Promise<{ userId: string; role: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  // 1. Exchange code for access & refresh tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  const { access_token, refresh_token, expires_in, token_type, scope, id_token } = tokenData;

  // 2. Fetch authenticated profile
  const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userinfoResponse.ok) {
    throw new Error("Failed to fetch user information from Google.");
  }

  const profile = (await userinfoResponse.json()) as GoogleProfile;
  if (!profile.email) {
    throw new Error("No verified email address provided by Google account.");
  }

  const email = profile.email.toLowerCase();
  const providerAccountId = profile.sub;
  const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

  // 3. Atomically upsert Account and User
  const result = await prisma.$transaction(async (tx) => {
    // Check if account link exists
    const existingAccount = await tx.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      // Update stored tokens securely
      await tx.account.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token ?? existingAccount.refreshToken,
          expiresAt: expiresAt ?? existingAccount.expiresAt,
          tokenType: token_type ?? existingAccount.tokenType,
          scope: scope ?? existingAccount.scope,
          idToken: id_token ?? existingAccount.idToken,
        },
      });
      return { userId: existingAccount.userId, role: existingAccount.user.role };
    }

    // Check if user with this email already exists
    let user = await tx.user.findUnique({ where: { email } });
    if (!user) {
      // Create new user with UNASSIGNED role until they pick Creator or Brand
      user = await tx.user.create({
        data: {
          email,
          role: "UNASSIGNED",
        },
      });
    }

    // Link the new Google Account
    await tx.account.create({
      data: {
        userId: user.id,
        provider: "google",
        providerAccountId,
        accessToken: access_token,
        refreshToken: refresh_token ?? null,
        expiresAt,
        tokenType: token_type ?? "Bearer",
        scope: scope ?? null,
        idToken: id_token ?? null,
      },
    });

    return { userId: user.id, role: user.role };
  });

  await writeSession(result.userId);
  return result;
}
