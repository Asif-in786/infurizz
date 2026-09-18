import { NextRequest, NextResponse } from "next/server";
import { connectorRegistry } from "@/lib/integrations/registry";
import { SocialPlatform } from "@prisma/client";
import { AudienceAggregator } from "@/lib/analytics/aggregator";
import { z } from "zod";

const syncSchema = z.object({
  creatorId: z.string(),
  platform: z.nativeEnum(SocialPlatform),
  accountIdentifier: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, platform, accountIdentifier } = syncSchema.parse(body);

    const connector = connectorRegistry.get(platform);
    const result = await connector.syncAccount(creatorId, accountIdentifier);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Sync failed" }, { status: 500 });
    }

    // Recalculate unified totals
    const aggregated = await AudienceAggregator.refreshCreatorMetrics(creatorId);

    return NextResponse.json({
      success: true,
      syncResult: result,
      updatedAggregates: aggregated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Error in social sync:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
