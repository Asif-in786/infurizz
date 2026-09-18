import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const industry = searchParams.get("industry");

    const where: Record<string, unknown> = {};
    if (industry) {
      where.industry = industry;
    }

    const brands = await prisma.brandProfile.findMany({
      where,
      orderBy: {
        companyName: "asc",
      },
      take: 20,
    });

    return NextResponse.json({
      brands,
      count: brands.length,
    });
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
