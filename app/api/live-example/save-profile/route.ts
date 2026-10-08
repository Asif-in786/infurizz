import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { normalizeYouTubeInput } from "@/lib/live-example/youtube";
import { normalizeInstagramInput } from "@/lib/live-example/instagram";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required to persist creator profile." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      bio,
      avatarUrl,
      category = "Lifestyle",
      niche = "Content Creation",
      secondaryNiches = [],
      location = "Global",
      services = "Brand Partnerships, Dedicated Content",
      audienceType = "10k–50k",
      website = "",
      youtubeHandle = "",
      instagramHandle = "",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Creator name is required." },
        { status: 400 }
      );
    }

    const creatorName = name.trim();
    const creatorBio = (bio || "").trim() || "Multi-platform creator & storyteller.";
    const creatorLocation = (location || "").trim() || "Global";

    const updatedCreator = await prisma.$transaction(async (tx) => {
      // If user is UNASSIGNED, upgrade to CREATOR
      if (user.role === "UNASSIGNED") {
        await tx.user.update({
          where: { id: user.id },
          data: { role: "CREATOR" },
        });
      }

      const existingCreator = user.creator;
      const creator = existingCreator
        ? await tx.creator.update({
            where: { id: existingCreator.id },
            data: {
              name: creatorName,
              bio: creatorBio,
              avatarUrl: avatarUrl ? avatarUrl.trim() : existingCreator.avatarUrl,
              category,
              location: creatorLocation,
              niche,
              audienceRange: audienceType,
              collabPrefs: services,
              contentTypes: JSON.stringify(Array.isArray(secondaryNiches) ? secondaryNiches : [secondaryNiches].filter(Boolean)),
            },
          })
        : await tx.creator.create({
            data: {
              userId: user.id,
              name: creatorName,
              bio: creatorBio,
              avatarUrl: avatarUrl ? avatarUrl.trim() : null,
              category,
              location: creatorLocation,
              niche,
              audienceRange: audienceType,
              collabPrefs: services,
              languages: JSON.stringify(["English"]),
              contentTypes: JSON.stringify(Array.isArray(secondaryNiches) ? secondaryNiches : [secondaryNiches].filter(Boolean)),
              isDemo: false,
            },
          });

      // Connect YouTube handle if provided
      if (youtubeHandle && youtubeHandle.trim()) {
        const normYt = normalizeYouTubeInput(youtubeHandle);
        await tx.socialProfile.upsert({
          where: {
            id: `yt_${creator.id}`,
          },
          update: {
            handle: normYt.displayHandle,
            connectionStatus: "CONNECTED",
          },
          create: {
            id: `yt_${creator.id}`,
            creatorId: creator.id,
            platform: "YouTube",
            handle: normYt.displayHandle,
            connectionStatus: "CONNECTED",
          },
        });
      }

      // Connect Instagram handle if provided
      if (instagramHandle && instagramHandle.trim()) {
        const normIg = normalizeInstagramInput(instagramHandle);
        await tx.socialProfile.upsert({
          where: {
            id: `ig_${creator.id}`,
          },
          update: {
            handle: normIg.handle,
            connectionStatus: "CONNECTED",
          },
          create: {
            id: `ig_${creator.id}`,
            creatorId: creator.id,
            platform: "Instagram",
            handle: normIg.handle,
            connectionStatus: "CONNECTED",
          },
        });
      }

      return creator;
    });

    revalidatePath("/live-example");
    revalidatePath("/analytics");
    revalidatePath("/account");
    revalidatePath(`/creators/${updatedCreator.id}`);

    return NextResponse.json({
      success: true,
      creatorId: updatedCreator.id,
      creatorName: updatedCreator.name,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save creator profile." },
      { status: 500 }
    );
  }
}
