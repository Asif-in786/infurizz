import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { env } from "@/lib/env";
import { connectorRegistry } from "@/lib/integrations/registry";

export async function GET() {
  const timestamp = new Date().toISOString();

  let dbStatus = "unknown";
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
    console.error("Health check DB query failed:", error);
  }

  const supportedConnectors = connectorRegistry.getSupportedPlatforms();

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    platform: "INFURIZZ",
    version: "0.1.0",
    timestamp,
    environment: env.NODE_ENV,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    integrations: {
      mockDataMode: env.ENABLE_MOCK_SOCIAL_DATA,
      connectors: supportedConnectors,
    },
  });
}
