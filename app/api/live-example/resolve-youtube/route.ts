import { NextResponse } from "next/server";
import { resolveYouTubeChannel } from "@/lib/live-example/youtube";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle") || searchParams.get("url");

  if (!handle || !handle.trim()) {
    return NextResponse.json(
      { success: false, error: "Please provide a valid YouTube handle or channel URL." },
      { status: 400 }
    );
  }

  try {
    const result = await resolveYouTubeChannel(handle);
    return NextResponse.json(result, {
      status: result.success ? 200 : result.missingEnv ? 200 : 400,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error resolving YouTube channel.",
      },
      { status: 500 }
    );
  }
}
