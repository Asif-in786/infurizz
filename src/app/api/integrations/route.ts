import { NextResponse } from "next/server";
import { connectorRegistry } from "@/lib/integrations/registry";

export async function GET() {
  const platforms = connectorRegistry.getSupportedPlatforms();

  return NextResponse.json({
    platforms,
    totalSupported: platforms.length,
  });
}
