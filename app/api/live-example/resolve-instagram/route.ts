import { NextResponse } from "next/server";
import { resolveInstagramProfile } from "@/lib/live-example/instagram";
import { getCurrentUser } from "@/lib/current";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle") || searchParams.get("url");

  if (!handle || !handle.trim()) {
    return NextResponse.json(
      { success: false, error: "Please provide a valid Instagram handle or profile URL." },
      { status: 400 }
    );
  }

  try {
    const user = await getCurrentUser();
    const result = await resolveInstagramProfile(handle, user?.creator?.id);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error resolving Instagram handle.",
      },
      { status: 500 }
    );
  }
}
