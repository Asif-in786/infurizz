import { NextResponse } from "next/server";
import { getSupabaseServerClient, syncSupabaseUserToPrisma } from "@/lib/supabase";
import { writeSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured on the server" }, { status: 500 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return NextResponse.json({ error: error?.message || "Invalid Supabase session" }, { status: 401 });
    }

    const { userId, role } = await syncSupabaseUserToPrisma(user);
    await writeSession(userId);

    const redirectUrl = role === "UNASSIGNED" ? "/onboarding/role" : role === "CREATOR" ? "/campaigns" : "/discover";

    return NextResponse.json({ ok: true, redirectUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sync Supabase user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
