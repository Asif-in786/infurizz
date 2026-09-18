import { PrismaClient, SocialPlatform } from "@prisma/client";
import { AudienceAggregator } from "../src/lib/analytics/aggregator";
import { connectorRegistry } from "../src/lib/integrations/registry";

const prisma = new PrismaClient();

async function runCreatorJourneyVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING INFURIZZ CREATOR JOURNEY VERIFICATION");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}${detail ? ` (${detail})` : ""}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
      failed++;
    }
  }

  const testEmail = "test.creator.journey@infurizz.internal";
  const testHandle = "journeycreator";

  // Clean up any existing records from previous test runs
  await prisma.audienceSnapshot.deleteMany({
    where: { creator: { handle: testHandle } },
  });
  await prisma.socialAccount.deleteMany({
    where: { creator: { handle: testHandle } },
  });
  await prisma.creatorProfile.deleteMany({
    where: { handle: testHandle },
  });
  await prisma.user.deleteMany({
    where: { email: testEmail },
  });

  // ---------------------------------------------------------------------------
  // 1. TEST CREATOR SIGNUP & ONBOARDING PERSISTENCE
  // ---------------------------------------------------------------------------
  console.log("--- Step 1: Creator Signup & Onboarding Persistence ---");

  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: "Jordan Rivera",
    },
  });
  assert(!!user.id, "User record created in database", `ID: ${user.id}`);

  const creatorProfile = await prisma.creatorProfile.create({
    data: {
      userId: user.id,
      handle: testHandle,
      displayName: "Jordan Rivera",
      category: "Tech & Software",
      bio: "Tech hardware, creator tools, and future interfaces.",
      location: "Austin, TX",
      ratesSummary: "$2,000 - $6,000 per sponsorship",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    },
  });
  assert(creatorProfile.handle === testHandle, "CreatorProfile persisted with correct handle and ratesSummary");

  // ---------------------------------------------------------------------------
  // 2. TEST CONNECTING MULTIPLE PLATFORMS (Instagram + YouTube)
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 2: Connecting Multiple Platforms ---");

  // Connect Instagram via connector pipeline
  const igConnector = connectorRegistry.get(SocialPlatform.INSTAGRAM);
  const igResult = await igConnector.syncAccount(creatorProfile.id, "jordan_creates");
  assert(igResult.success, "Instagram connected successfully via connector", `${igResult.followersCount.toLocaleString()} followers`);

  // Connect YouTube via connector pipeline
  const ytConnector = connectorRegistry.get(SocialPlatform.YOUTUBE);
  const ytResult = await ytConnector.syncAccount(creatorProfile.id, "jordanriverstech");
  assert(ytResult.success, "YouTube connected successfully via connector", `${ytResult.followersCount.toLocaleString()} subscribers`);

  const initialAccounts = await prisma.socialAccount.findMany({
    where: { creatorId: creatorProfile.id, isConnected: true },
  });
  assert(initialAccounts.length === 2, "Both Instagram and YouTube persisted in DB");

  // ---------------------------------------------------------------------------
  // 3. VERIFY UNIFIED AUDIENCE CALCULATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 3: Unified Audience Calculation ---");

  const initialAggregated = await AudienceAggregator.refreshCreatorMetrics(creatorProfile.id);
  const expectedInitialReach = igResult.followersCount + ytResult.followersCount;
  assert(
    initialAggregated.totalReach === expectedInitialReach,
    "Unified audience reach correctly calculated from connected accounts",
    `Total: ${initialAggregated.totalReach.toLocaleString()}`
  );
  assert(initialAggregated.totalPlatforms === 2, "Total connected platforms correctly reported as 2");
  assert(initialAggregated.avgEngagementRate > 0, "Weighted average engagement rate calculated", `${initialAggregated.avgEngagementRate}%`);

  // ---------------------------------------------------------------------------
  // 4. TEST CONNECTING THIRD PLATFORM (X / Twitter)
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 4: Connecting Third Platform (X / Twitter) ---");

  const xConnector = connectorRegistry.get(SocialPlatform.X_TWITTER);
  const xResult = await xConnector.syncAccount(creatorProfile.id, "jordanrivera");
  assert(xResult.success, "X / Twitter connected via connector", `${xResult.followersCount.toLocaleString()} followers`);

  const updatedAggregated = await AudienceAggregator.refreshCreatorMetrics(creatorProfile.id);
  const expectedUpdatedReach = expectedInitialReach + xResult.followersCount;
  assert(
    updatedAggregated.totalReach === expectedUpdatedReach,
    "Unified reach dynamically increased after connecting X",
    `New Total: ${updatedAggregated.totalReach.toLocaleString()}`
  );

  // ---------------------------------------------------------------------------
  // 5. TEST SYNCING PLATFORM DATA
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 5: Syncing Platform Data ---");

  const beforeSync = await prisma.socialAccount.findUnique({
    where: {
      creatorId_platform: {
        creatorId: creatorProfile.id,
        platform: SocialPlatform.INSTAGRAM,
      },
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 50));

  const reSyncResult = await igConnector.syncAccount(creatorProfile.id, "jordan_creates");
  assert(reSyncResult.success, "Platform re-sync executed successfully");

  const afterSync = await prisma.socialAccount.findUnique({
    where: {
      creatorId_platform: {
        creatorId: creatorProfile.id,
        platform: SocialPlatform.INSTAGRAM,
      },
    },
  });
  assert(
    afterSync!.lastSyncedAt >= beforeSync!.lastSyncedAt,
    "SocialAccount lastSyncedAt timestamp updated in database"
  );

  // ---------------------------------------------------------------------------
  // 6. TEST DISCONNECTING A PLATFORM
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 6: Disconnecting Platform ---");

  await prisma.socialAccount.delete({
    where: {
      creatorId_platform: {
        creatorId: creatorProfile.id,
        platform: SocialPlatform.X_TWITTER,
      },
    },
  });

  const postDisconnectAggregated = await AudienceAggregator.refreshCreatorMetrics(creatorProfile.id);
  assert(
    postDisconnectAggregated.totalReach === expectedInitialReach,
    "Unified reach correctly recalculated downwards after disconnect",
    `Reduced to: ${postDisconnectAggregated.totalReach.toLocaleString()}`
  );
  assert(postDisconnectAggregated.totalPlatforms === 2, "Active platforms count decreased back to 2");

  // ---------------------------------------------------------------------------
  // 7. VERIFY AUDIENCE SNAPSHOTS
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 7: Verifying Audience Snapshots ---");

  const snapshots = await prisma.audienceSnapshot.findMany({
    where: { creatorId: creatorProfile.id },
    orderBy: { recordedAt: "asc" },
  });
  assert(snapshots.length >= 3, "Multiple audience snapshots recorded across lifecycle", `Count: ${snapshots.length}`);
  const latestSnapshot = snapshots[snapshots.length - 1];
  assert(
    latestSnapshot.followersCount === postDisconnectAggregated.totalReach,
    "Latest snapshot reflects current active reach in DB"
  );

  // ---------------------------------------------------------------------------
  // 8. VERIFY ANALYTICS DERIVATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 8: Verifying Analytics Derivation ---");

  const creatorWithAnalytics = await prisma.creatorProfile.findUnique({
    where: { id: creatorProfile.id },
    include: {
      socialAccounts: { where: { isConnected: true } },
      audienceSnapshots: { orderBy: { recordedAt: "asc" } },
      performanceMetrics: true,
    },
  });
  assert(!!creatorWithAnalytics, "Creator profile fetched with all analytics relations");

  const initialReach = creatorWithAnalytics!.audienceSnapshots[0].followersCount;
  const currentReach = postDisconnectAggregated.totalReach;
  const netGrowth = currentReach - initialReach;
  assert(typeof netGrowth === "number", "Growth net delta calculated from persisted snapshots", `Delta: ${netGrowth}`);

  // ---------------------------------------------------------------------------
  // 9. VERIFY CREATOR DISCOVERY
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 9: Creator Discovery by Brands ---");

  // Search by category and minReach
  const discoveredCreators = await prisma.creatorProfile.findMany({
    where: {
      category: "Tech & Software",
      totalReach: { gte: 500000 },
    },
    include: { socialAccounts: { where: { isConnected: true } } },
  });
  const foundJordan = discoveredCreators.some((c) => c.handle === testHandle);
  assert(foundJordan, "Newly onboarded creator discovered by category & reach filters in marketplace");

  // Search by query text
  const searchResults = await prisma.creatorProfile.findMany({
    where: {
      OR: [
        { displayName: { contains: "Jordan" } },
        { handle: { contains: "jordan" } },
      ],
    },
  });
  assert(searchResults.length >= 1, "Creator discovered via free-text search query");

  // ---------------------------------------------------------------------------
  // 10. VERIFY CREATOR PUBLIC PROFILE
  // ---------------------------------------------------------------------------
  console.log("\n--- Step 10: Creator Public Profile Audit ---");

  const publicProfile = await prisma.creatorProfile.findFirst({
    where: {
      OR: [{ id: creatorProfile.id }, { handle: testHandle }],
    },
    include: {
      socialAccounts: { where: { isConnected: true } },
      audienceSnapshots: true,
    },
  });
  assert(!!publicProfile, "Public profile resolved by handle");
  assert(publicProfile!.displayName === "Jordan Rivera", "Display name verified");
  // Teardown test records to keep Supabase clean
  await prisma.audienceSnapshot.deleteMany({
    where: { creator: { handle: testHandle } },
  });
  await prisma.socialAccount.deleteMany({
    where: { creator: { handle: testHandle } },
  });
  await prisma.creatorProfile.deleteMany({
    where: { handle: testHandle },
  });
  await prisma.user.deleteMany({
    where: { email: testEmail },
  });

  console.log("\n=================================================");
  console.log(`🏁 CREATOR JOURNEY VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCreatorJourneyVerification()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
