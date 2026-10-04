import assert from "node:assert";
import { prisma } from "./lib/prisma";
import { encryptToken } from "./lib/security/encryption";
import {
  recordMetricSnapshots,
  syncContentItems,
  logSocialSync,
  getCreatorMetricHistory,
  getCreatorIntelligenceSummary,
  getUtcDateString,
} from "./lib/social/snapshots";
import type { CanonicalMetricDTO, ContentItemDTO } from "./lib/social/types";

async function runStep6Tests() {
  console.log("=== PHASE 4C: STEP 6 HISTORICAL SNAPSHOT & CONTENT SYNC TESTS ===");

  // Find a demo creator (Mira Sen)
  const creator = await prisma.creator.findFirst({
    where: { name: "Mira Sen" },
  });
  assert(creator, "Found demo creator Mira Sen");

  // 1. Create a test SocialAccount with encrypted tokens
  console.log("\n[Test 1] Creating test authenticated SocialAccount with AES-256-GCM tokens...");
  const encAccessToken = encryptToken("test_access_token_secret_12345");
  const encRefreshToken = encryptToken("test_refresh_token_secret_67890");

  const socialAccount = await prisma.socialAccount.upsert({
    where: {
      creatorId_platform: {
        creatorId: creator.id,
        platform: "YouTube",
      },
    },
    create: {
      creatorId: creator.id,
      platform: "YouTube",
      platformAccountId: "UC_TEST_MIRA_YOUTUBE",
      handle: "@mirasencooking",
      displayName: "Mira Sen Official",
      profileUrl: "https://youtube.com/@mirasencooking",
      isPlatformVerifiedBadge: true,
      encryptedAccessToken: encAccessToken.ciphertext,
      accessTokenIv: encAccessToken.iv,
      accessTokenTag: encAccessToken.tag,
      encryptedRefreshToken: encRefreshToken.ciphertext,
      refreshTokenIv: encRefreshToken.iv,
      refreshTokenTag: encRefreshToken.tag,
      tokenScope: "https://www.googleapis.com/auth/youtube.readonly",
      connectionStatus: "CONNECTED",
      lastSyncedAt: new Date(),
    },
    update: {
      connectionStatus: "CONNECTED",
      lastSyncedAt: new Date(),
    },
  });
  assert(socialAccount.id, "SocialAccount successfully created/updated");
  console.log(`  ✔ SocialAccount created with ID: ${socialAccount.id}`);

  // 2. Test Idempotent Daily Snapshot Recording
  console.log("\n[Test 2] Recording Canonical Metric Snapshots (Idempotent Upsert)...");
  const today = getUtcDateString();
  const testMetrics: CanonicalMetricDTO[] = [
    {
      canonicalMetricName: "AUDIENCE_FOLLOWER_COUNT",
      metricValueType: "INTEGER",
      valueInt: 145000n,
      valueDecimal: null,
      sourceType: "PROVIDER_REPORTED",
      calculationMethod: null,
      capturedAt: new Date(),
    },
    {
      canonicalMetricName: "CONTENT_LIFETIME_VIEWS",
      metricValueType: "INTEGER",
      valueInt: 12500000n,
      valueDecimal: null,
      sourceType: "PROVIDER_REPORTED",
      calculationMethod: null,
      capturedAt: new Date(),
    },
    {
      canonicalMetricName: "ENGAGEMENT_RATE_BY_VIEWS_30D",
      metricValueType: "PERCENTAGE",
      valueInt: null,
      valueDecimal: "5.4200",
      sourceType: "DERIVED",
      calculationMethod: "((likes_30d + comments_30d + shares_30d) / views_30d) * 100",
      capturedAt: new Date(),
    },
  ];

  const recorded1 = await recordMetricSnapshots(socialAccount.id, testMetrics, today);
  assert.strictEqual(recorded1, 3, "3 snapshots recorded on initial run");

  // Re-run with updated follower count to test idempotency (should update, not duplicate)
  testMetrics[0].valueInt = 145500n;
  const recorded2 = await recordMetricSnapshots(socialAccount.id, testMetrics, today);
  assert.strictEqual(recorded2, 3, "3 snapshots processed on second run");

  const totalSnapshotsForDate = await prisma.socialMetricSnapshot.count({
    where: { socialAccountId: socialAccount.id, snapshotDate: today },
  });
  assert.strictEqual(totalSnapshotsForDate, 3, "Exact compound uniqueness verified: no duplicates created for today");

  const updatedSubscriberSnapshot = await prisma.socialMetricSnapshot.findUnique({
    where: {
      socialAccountId_canonicalMetricName_snapshotDate: {
        socialAccountId: socialAccount.id,
        canonicalMetricName: "AUDIENCE_FOLLOWER_COUNT",
        snapshotDate: today,
      },
    },
  });
  assert.strictEqual(updatedSubscriberSnapshot?.valueInt, 145500n, "Snapshot value correctly updated to 145500n");
  console.log("  ✔ Idempotent snapshot recording passed with zero duplicate records.");

  // 3. Test Content Item Synchronization
  console.log("\n[Test 3] Testing Content Item Synchronization (Videos)...");
  const testVideos: ContentItemDTO[] = [
    {
      providerContentId: "vid_test_001",
      contentType: "VIDEO",
      publishedAt: new Date(Date.now() - 86400000),
      title: "Chai Spice Secrets & Autumn Bakes",
      permalink: "https://youtube.com/watch?v=vid_test_001",
      thumbnailUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
      viewCount: 45000n,
      likeCount: 3200n,
      commentCount: 280n,
      shareCount: null,
      saveCount: null,
    },
    {
      providerContentId: "vid_test_002",
      contentType: "VIDEO",
      publishedAt: new Date(Date.now() - 172800000),
      title: "Sunday Supper Club Prep",
      permalink: "https://youtube.com/watch?v=vid_test_002",
      thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
      viewCount: 82000n,
      likeCount: 5900n,
      commentCount: 410n,
      shareCount: null,
      saveCount: null,
    },
  ];

  const syncedCount = await syncContentItems(socialAccount.id, testVideos);
  assert.strictEqual(syncedCount, 2, "2 content items synced");

  const contentItemsInDb = await prisma.socialContentItem.findMany({
    where: { socialAccountId: socialAccount.id },
  });
  assert.strictEqual(contentItemsInDb.length, 2, "Found 2 content items in DB");
  assert.strictEqual(contentItemsInDb[0].viewCount, 45000n, "View count strictly stored as BigInt");
  console.log("  ✔ Content items successfully synced with BigInt metrics.");

  // 4. Test Sync Logging
  console.log("\n[Test 4] Testing SocialSyncLog Audit Trail...");
  await logSocialSync({
    socialAccountId: socialAccount.id,
    trigger: "OAUTH_INIT",
    status: "SUCCESS",
    metricsIngested: 3,
    durationMs: 420,
  });

  const latestLog = await prisma.socialSyncLog.findFirst({
    where: { socialAccountId: socialAccount.id },
    orderBy: { createdAt: "desc" },
  });
  assert(latestLog, "Found sync log entry");
  assert.strictEqual(latestLog.status, "SUCCESS");
  assert.strictEqual(latestLog.metricsIngested, 3);
  console.log("  ✔ Audit log entry successfully created in SocialSyncLog.");

  // 5. Test Metric History Retrieval
  console.log("\n[Test 5] Testing getCreatorMetricHistory time-series retrieval...");
  const history = await getCreatorMetricHistory(creator.id, "AUDIENCE_FOLLOWER_COUNT", 30);
  assert(history.length >= 1, "Retrieved history for AUDIENCE_FOLLOWER_COUNT");
  assert.strictEqual(history[0].valueInt, "145500", "Returned safe stringified BigInt representation");
  console.log("  ✔ Time-series metric history successfully retrieved.");

  // 6. Test Creator Intelligence Summary & Combined Footprint
  console.log("\n[Test 6] Testing getCreatorIntelligenceSummary & Footprint Disclosure...");
  const summary = await getCreatorIntelligenceSummary(creator.id);
  assert(summary.accounts.length >= 1, "Summary includes connected accounts");
  assert.strictEqual(summary.footprint.total, "145500", "Combined footprint matches authenticated subscriber count");
  assert.strictEqual(summary.footprint.authenticatedAccountsCount, 1);
  assert(summary.footprint.disclosure.includes("Combined Platform Footprint"));
  assert(summary.footprint.disclosure.includes("audience overlap"));
  console.log("  ✔ Creator Intelligence Summary computed with exact disclosure and provenance.");

  console.log("\n==========================================");
  console.log("  ALL STEP 6 SNAPSHOT ENGINE TESTS PASSED!");
  console.log("==========================================\n");
}

runStep6Tests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
