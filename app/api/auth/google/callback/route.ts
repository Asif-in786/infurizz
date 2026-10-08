import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppOrigin, handleGoogleCallback } from "@/lib/auth/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const origin = getAppOrigin(request);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_oauth_code", origin));
  }

  const jar = await cookies();
  const savedState = jar.get("infurizz_oauth_state")?.value;
  jar.delete("infurizz_oauth_state");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_oauth_state", origin));
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const { role } = await handleGoogleCallback(code, redirectUri);

    const returnTo = jar.get("infurizz_oauth_return_to")?.value;
    jar.delete("infurizz_oauth_return_to");

    if (returnTo && returnTo.startsWith("/")) {
      return NextResponse.redirect(new URL(returnTo, origin));
    }

    if (role === "UNASSIGNED") {
      return NextResponse.redirect(new URL("/onboarding/role", origin));
    }

    return NextResponse.redirect(new URL("/discover", origin));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, origin),
    );
  }
}
