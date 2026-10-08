import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateOAuthState, getAppOrigin, getGoogleAuthorizationUrl, isGoogleOAuthConfigured } from "@/lib/auth/oauth";

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.",
      },
      { status: 501 },
    );
  }

  const origin = getAppOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = generateOAuthState();
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");

  const jar = await cookies();
  jar.set("infurizz_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  if (returnTo && returnTo.startsWith("/")) {
    jar.set("infurizz_oauth_return_to", returnTo, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
  }

  const authUrl = getGoogleAuthorizationUrl(state, redirectUri);
  return NextResponse.redirect(authUrl);
}
