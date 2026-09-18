import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { Role } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const brandOnboardingSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  companyName: z.string().min(2),
  industry: z.string().default("Consumer Tech"),
  website: z.string().optional(),
  budgetRange: z.string().default("$10,000 - $50,000 / quarter"),
  description: z.string().optional(),
  location: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = brandOnboardingSchema.parse(body);

    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    // 1. Find or create User
    let user = null;
    if (sessionUserId) {
      user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { brandProfile: true },
      });
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { brandProfile: true },
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name || data.companyName,
          role: Role.BRAND,
        },
        include: { brandProfile: true },
      });
    }

    // 2. Create or update BrandProfile
    let brandProfile = user.brandProfile;

    if (!brandProfile) {
      brandProfile = await prisma.brandProfile.create({
        data: {
          userId: user.id,
          companyName: data.companyName,
          industry: data.industry,
          website: data.website || `https://${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.io`,
          budgetRange: data.budgetRange,
          description: data.description || "Partnering with verified creators for multi-channel product launches.",
          location: data.location || "New York, NY",
          isVerified: true,
          logoUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80",
        },
      });
    } else {
      brandProfile = await prisma.brandProfile.update({
        where: { id: brandProfile.id },
        data: {
          companyName: data.companyName,
          industry: data.industry,
          website: data.website || brandProfile.website,
          budgetRange: data.budgetRange,
          description: data.description || brandProfile.description,
          location: data.location || brandProfile.location,
        },
      });
    }

    // 3. Create welcome notification if none exists
    const existingNotif = await prisma.notification.findFirst({
      where: { userId: user.id, title: "Brand Workspace Initialized" },
    });
    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Brand Workspace Initialized",
          message: `Welcome ${data.companyName}! Your brand desk is active with full discovery access.`,
          link: "/brand/dashboard",
        },
      });
    }

    // 4. Set session cookie
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
      brand: brandProfile,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Error in POST /api/onboarding/brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
