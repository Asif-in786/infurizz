import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

function getOrigin(request: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "https://infurizzv1.vercel.app";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || "/live-example";
  const handle = searchParams.get("handle") || "";
  const origin = getOrigin(request);

  const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID;

  // If Meta credentials are not yet configured in environment variables
  if (!clientId) {
    const fallbackUrl = new URL(returnTo, origin);
    fallbackUrl.searchParams.set("metaAuthNotice", "unconfigured");
    if (handle) fallbackUrl.searchParams.set("handle", handle);
    return NextResponse.redirect(fallbackUrl);
  }

  const redirectUri = `${origin}/api/auth/instagram/callback`;
  const state = crypto.randomBytes(24).toString("hex");

  const jar = await cookies();
  jar.set("infurizz_meta_oauth_state", state, {
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

  const metaAuthUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  metaAuthUrl.searchParams.set("client_id", clientId);
  metaAuthUrl.searchParams.set("redirect_uri", redirectUri);
  metaAuthUrl.searchParams.set("response_type", "code");
  metaAuthUrl.searchParams.set(
    "scope",
    "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement"
  );
  metaAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(metaAuthUrl.toString());
}
