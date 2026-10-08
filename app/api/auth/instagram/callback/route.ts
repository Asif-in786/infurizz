import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/current";
import { prisma } from "@/lib/prisma";

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
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const origin = getOrigin(request);

  const jar = await cookies();
  const savedState = jar.get("infurizz_meta_oauth_state")?.value;
  const returnTo = jar.get("infurizz_oauth_return_to")?.value || "/live-example";

  jar.delete("infurizz_meta_oauth_state");
  jar.delete("infurizz_oauth_return_to");

  const redirectTarget = new URL(returnTo, origin);

  if (!code || !state || state !== savedState) {
    redirectTarget.searchParams.set("metaAuthError", "invalid_state");
    return NextResponse.redirect(redirectTarget);
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET;

  if (!clientId || !clientSecret) {
    redirectTarget.searchParams.set("metaAuthError", "unconfigured");
    return NextResponse.redirect(redirectTarget);
  }

  try {
    const redirectUri = `${origin}/api/auth/instagram/callback`;

    // 1. Exchange authorization code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&code=${encodeURIComponent(code)}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      redirectTarget.searchParams.set(
        "metaAuthError",
        tokenData.error?.message || "token_exchange_failed"
      );
      return NextResponse.redirect(redirectTarget);
    }

    const accessToken = tokenData.access_token;

    // 2. Query user's connected Facebook Pages & associated Instagram Business Accounts
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}&access_token=${encodeURIComponent(
        accessToken
      )}`
    );
    const pagesData = await pagesRes.json();

    const pageWithIg = (pagesData.data || []).find((p: any) => p.instagram_business_account);
    const igAccount = pageWithIg?.instagram_business_account;

    if (!igAccount) {
      redirectTarget.searchParams.set("metaAuthError", "no_instagram_business_account");
      return NextResponse.redirect(redirectTarget);
    }

    const igId = igAccount.id;
    const igUsername = igAccount.username ? `@${igAccount.username.replace(/^@+/, "")}` : "@instagram";
    const igName = igAccount.name || igUsername;
    const igFollowers = Number(igAccount.followers_count || 0);

    // 3. Optional: Link to signed-in creator in database
    const user = await getCurrentUser();
    if (user?.creator) {
      const creatorId = user.creator.id;
      const today = new Date().toISOString().slice(0, 10);

      await prisma.$transaction(async (tx) => {
        // Upsert SocialProfile
        const existingProfile = await tx.socialProfile.findFirst({
          where: { creatorId, platform: "Instagram" },
        });

        if (existingProfile) {
          await tx.socialProfile.update({
            where: { id: existingProfile.id },
            data: {
              handle: igUsername,
              connectionStatus: "CONNECTED",
              verifiedAt: new Date(),
            },
          });
        } else {
          await tx.socialProfile.create({
            data: {
              creatorId,
              platform: "Instagram",
              handle: igUsername,
              connectionStatus: "CONNECTED",
              verifiedAt: new Date(),
            },
          });
        }

        // Upsert SocialAccount
        const account = await tx.socialAccount.upsert({
          where: { creatorId_platform: { creatorId, platform: "Instagram" } },
          create: {
            creatorId,
            platform: "Instagram",
            platformAccountId: igId,
            handle: igUsername,
            displayName: igName,
            profileUrl: `https://instagram.com/${igUsername.replace("@", "")}`,
            avatarUrl: igAccount.profile_picture_url || null,
            isPlatformVerifiedBadge: true,
            encryptedAccessToken: "meta_vault_token",
            accessTokenIv: "iv",
            accessTokenTag: "tag",
            tokenScope: "instagram_manage_insights",
            connectionStatus: "CONNECTED",
            lastSyncedAt: new Date(),
          },
          update: {
            platformAccountId: igId,
            handle: igUsername,
            displayName: igName,
            profileUrl: `https://instagram.com/${igUsername.replace("@", "")}`,
            avatarUrl: igAccount.profile_picture_url || null,
            isPlatformVerifiedBadge: true,
            connectionStatus: "CONNECTED",
            lastSyncedAt: new Date(),
          },
        });

        // Record follower snapshot
        if (igFollowers > 0) {
          await tx.socialMetricSnapshot.create({
            data: {
              socialAccountId: account.id,
              canonicalMetricName: "AUDIENCE_FOLLOWER_COUNT",
              providerMetricIdentifier: "followers_count",
              valueInt: BigInt(igFollowers),
              metricValueType: "INTEGER",
              unit: "COUNT",
              sourceType: "PROVIDER_REPORTED",
              snapshotDate: today,
              capturedAt: new Date(),
              freshnessState: "FRESH",
            },
          });
        }
      });
    }

    redirectTarget.searchParams.set("instagramConnected", "true");
    redirectTarget.searchParams.set("handle", igUsername);
    return NextResponse.redirect(redirectTarget);
  } catch (err: any) {
    redirectTarget.searchParams.set("metaAuthError", err?.message || "oauth_failed");
    return NextResponse.redirect(redirectTarget);
  }
}
