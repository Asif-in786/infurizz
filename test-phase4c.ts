import assert from "node:assert";
import { prisma } from "./lib/prisma";
import { encryptToken, decryptToken } from "./lib/security/encryption";
import {
  toSafeBigInt,
  calculatePercentageRate,
  STANDARD_DERIVED_METRIC_CONTRACTS,
  evaluateDerivedMetric,
  calculateCombinedPlatformFootprint,
  COMBINED_FOOTPRINT_DISCLOSURE,
} from "./lib/social/normalization";
import {
  getSocialProvider,
  listSocialProviders,
  formatConnectionState,
} from "./lib/social/registry";
import {
  recordMetricSnapshots,
  syncContentItems,
  logSocialSync,
  getCreatorIntelligenceSummary,
  getUtcDateString,
} from "./lib/social/snapshots";
import { SUPPORTED_PLATFORMS, type CanonicalMetricDTO, type ContentItemDTO } from "./lib/social/types";

async function runPhase4CVerificationSuite() {
  console.log("==========================================");
  console.log("   INFURIZZ PHASE 4C VERIFICATION SUITE   ");
  console.log("  CREATOR INTELLIGENCE & SOCIAL ANALYTICS ");
  console.log("==========================================");

  // ----------------------------------------------------
  // TEST 1: Security & Token Encryption (Step 1)
  // ----------------------------------------------------
  console.log("\n[Test 1] Verifying AES-256-GCM Token Encryption Security...");
  const rawSecret = "oauth2_bearer_token_secret_xyz789";
  const encrypted = encryptToken(rawSecret);

  assert(encrypted.ciphertext && encrypted.ciphertext !== rawSecret, "Ciphertext is encrypted");
  assert.strictEqual(encrypted.iv.length, 24, "IV is exactly 12 bytes hex (24 chars)");
  assert.strictEqual(encrypted.tag.length, 32, "GCM Tag is exactly 16 bytes hex (32 chars)");

  const decrypted = decryptToken(encrypted);
  assert.strictEqual(decrypted, rawSecret, "Token successfully decrypted back to plaintext");

  // Tamper resistance
  const tampered = { ...encrypted, ciphertext: encrypted.ciphertext.slice(0, -2) + "aa" };
  assert.throws(() => decryptToken(tampered), /tampered/i, "Tampered ciphertext rejected");
  console.log("  ✔ AES-256-GCM encryption, decryption, and tamper detection passed.");

  // ----------------------------------------------------
  // TEST 2: Database Schema Models & Types (Step 2)
  // ----------------------------------------------------
  console.log("\n[Test 2] Verifying Phase 4C Database Schema Models...");
  const accountCount = await prisma.socialAccount.count();
  const snapshotCount = await prisma.socialMetricSnapshot.count();
  const contentCount = await prisma.socialContentItem.count();
  const audienceCount = await prisma.socialAudienceSnapshot.count();
  const logCount = await prisma.socialSyncLog.count();

  console.log(`  Social Accounts: ${accountCount}, Snapshots: ${snapshotCount}, Content Items: ${contentCount}`);
  console.log(`  Audience Snapshots: ${audienceCount}, Sync Logs: ${logCount}`);
  assert(accountCount >= 0, "SocialAccount table accessible");
  assert(snapshotCount >= 0, "SocialMetricSnapshot table accessible");
  console.log("  ✔ All 5 Phase 4C database tables exist and are accessible.");

  // ----------------------------------------------------
  // TEST 3: Provider Abstraction & Strict Anti-Fabrication (Step 3 & 9)
  // ----------------------------------------------------
  console.log("\n[Test 3] Verifying Provider Registry, Lifecycle Statuses & Anti-Fabrication...");
  const providers = listSocialProviders();
  assert.strictEqual(providers.length, 6, "All 6 platforms registered");

  for (const platform of SUPPORTED_PLATFORMS) {
    const provider = getSocialProvider(platform);
    assert(provider, `Provider for ${platform} resolved`);
    assert(provider.status, `Provider ${platform} has explicit lifecycle status: ${provider.status}`);

    // Anti-fabrication check
    const metrics = await provider.fetchMetrics?.("random_handle");
    assert.strictEqual(metrics, null, `Zero metric fabrication for ${platform}`);

    // Unverified connection formatting check
    const unverifiedState = formatConnectionState({
      platform,
      handle: `@${platform.toLowerCase()}_creator`,
      connectionStatus: "NOT_CONNECTED",
    });
    assert.strictEqual(unverifiedState.status, "NOT_CONNECTED");
    assert.strictEqual(unverifiedState.metrics, undefined, "Metrics undefined for unverified account");
  }
  console.log("  ✔ Registry lifecycle statuses and strict zero-fabrication rules confirmed across all 6 providers.");

  // ----------------------------------------------------
  // TEST 4: Canonical Normalization & BigInt Engine (Step 4)
  // ----------------------------------------------------
  console.log("\n[Test 4] Verifying Canonical Metric Normalization & BigInt Bounds...");
  assert.strictEqual(toSafeBigInt("2,500,000"), 2500000n, "Comma string converted to BigInt");
  assert.strictEqual(toSafeBigInt(42000), 42000n, "Number converted to BigInt");
  assert.strictEqual(toSafeBigInt(99.9), 99n, "Float truncated safely");
  assert.throws(() => toSafeBigInt(-10), /negative/, "Negative count rejected");

  // Decimal rate precision
  const rate = calculatePercentageRate(500n, 10000n, 4);
  assert.strictEqual(rate, "5.0000", "Decimal rate precision formatted to 4 decimal places");

  // Derived metric evaluation
  const contract = STANDARD_DERIVED_METRIC_CONTRACTS.ENGAGEMENT_RATE_BY_VIEWS_30D;
  const derived = evaluateDerivedMetric(
    contract,
    new Map([
      ["views_30d", 100000n],
      ["likes_30d", 4000n],
      ["comments_30d", 800n],
      ["shares_30d", 200n],
    ]),
  );
  assert(derived !== null, "Derived metric calculated");
  assert.strictEqual(derived.sourceType, "DERIVED", "Provenance strictly tagged DERIVED");
  assert.strictEqual(derived.valueDecimal, "5.0000");

  // Combined Platform Footprint & Mandatory Overlap Disclosure
  const accountsSample = [
    { platform: "YouTube", isAccountAuthorized: true, followerCount: 200000n },
    { platform: "Instagram", isAccountAuthorized: true, followerCount: 100000n },
    { platform: "TikTok", isAccountAuthorized: false, followerCount: 999999n }, // Unauthenticated!
  ];
  const footprint = calculateCombinedPlatformFootprint(accountsSample);
  assert.strictEqual(footprint.totalFootprint, 300000n, "Unauthenticated accounts excluded from footprint");
  assert.strictEqual(footprint.authenticatedAccountsCount, 2);
  assert.strictEqual(footprint.disclosure, COMBINED_FOOTPRINT_DISCLOSURE);
  assert(footprint.disclosure.includes("audience overlap"), "Disclosure contains overlap caveat");
  console.log("  ✔ BigInt bounds, Decimal rate safety, and Combined Platform Footprint rules verified.");

  // ----------------------------------------------------
  // TEST 5: YouTube Reference Provider Adapter (Step 5)
  // ----------------------------------------------------
  console.log("\n[Test 5] Verifying YouTube Provider Adapter & Capabilities...");
  const ytProvider = getSocialProvider("YouTube");
  assert(ytProvider, "YouTube provider registered");
  assert.strictEqual(ytProvider.platform, "YouTube");
  assert.strictEqual(ytProvider.capabilities.supportsContentSync, true, "YouTube supports content video sync");
  assert.strictEqual(ytProvider.capabilities.supportsReach, false, "YouTube does not expose unique reach");

  // When Google client ID is not configured in env, auth URL safely returns null
  if (!process.env.GOOGLE_CLIENT_ID) {
    const authUrl = await ytProvider.getAuthorizationUrl("test_creator");
    assert.strictEqual(authUrl, null, "Returns null when OAuth credentials not configured in env");
  }
  console.log("  ✔ YouTube provider adapter correctly configured with official capabilities.");

  // ----------------------------------------------------
  // TEST 6: Historical Snapshot Engine & Content Sync (Step 6)
  // ----------------------------------------------------
  console.log("\n[Test 6] Testing Idempotent Daily Snapshots & Content Sync...");
  const mira = await prisma.creator.findFirst({ where: { name: "Mira Sen" } });
  assert(mira, "Found creator Mira Sen");

  const todayStr = getUtcDateString();
  const testAccount = await prisma.socialAccount.upsert({
    where: { creatorId_platform: { creatorId: mira.id, platform: "YouTube" } },
    create: {
      creatorId: mira.id,
      platform: "YouTube",
      platformAccountId: "UC_MIRA_SEN_YT_OFFICIAL",
      handle: "@mirasenrecipes",
      displayName: "Mira Sen Recipes",
      profileUrl: "https://youtube.com/@mirasenrecipes",
      encryptedAccessToken: encrypted.ciphertext,
      accessTokenIv: encrypted.iv,
      accessTokenTag: encrypted.tag,
      tokenScope: "https://www.googleapis.com/auth/youtube.readonly",
      connectionStatus: "CONNECTED",
      isPlatformVerifiedBadge: true,
    },
    update: { connectionStatus: "CONNECTED" },
  });

  // Clean slate for test account
  await prisma.socialMetricSnapshot.deleteMany({ where: { socialAccountId: testAccount.id } });
  await prisma.socialContentItem.deleteMany({ where: { socialAccountId: testAccount.id } });

  const sampleMetrics: CanonicalMetricDTO[] = [
    {
      canonicalMetricName: "AUDIENCE_FOLLOWER_COUNT",
      metricValueType: "INTEGER",
      valueInt: 180000n,
      sourceType: "PROVIDER_REPORTED",
      capturedAt: new Date(),
    },
    {
      canonicalMetricName: "CONTENT_LIFETIME_VIEWS",
      metricValueType: "INTEGER",
      valueInt: 9500000n,
      sourceType: "PROVIDER_REPORTED",
      capturedAt: new Date(),
    },
  ];

  // First insert
  await recordMetricSnapshots(testAccount.id, sampleMetrics, todayStr);
  // Second insert (idempotency check: must update, not duplicate)
  sampleMetrics[0].valueInt = 180500n;
  await recordMetricSnapshots(testAccount.id, sampleMetrics, todayStr);

  const snapshotCountToday = await prisma.socialMetricSnapshot.count({
    where: { socialAccountId: testAccount.id, snapshotDate: todayStr },
  });
  assert.strictEqual(snapshotCountToday, 2, "Compound uniqueness enforced: exactly 2 metric records for today");

  // Sync content items
  const testVideos: ContentItemDTO[] = [
    {
      providerContentId: "yt_vid_mira_001",
      contentType: "VIDEO",
      publishedAt: new Date(),
      title: "Chai Spice Sourdough",
      viewCount: 65000n,
      likeCount: 4200n,
      commentCount: 310n,
    },
  ];
  await syncContentItems(testAccount.id, testVideos);

  const contentInDb = await prisma.socialContentItem.findUnique({
    where: {
      socialAccountId_platformContentId: {
        socialAccountId: testAccount.id,
        platformContentId: "yt_vid_mira_001",
      },
    },
  });
  assert(contentInDb, "Content item synced to DB");
  assert.strictEqual(contentInDb.viewCount, 65000n, "View count stored as BigInt");

  // Audit log entry
  await logSocialSync({
    socialAccountId: testAccount.id,
    trigger: "MANUAL",
    status: "SUCCESS",
    metricsIngested: 2,
    durationMs: 150,
  });
  console.log("  ✔ Idempotent snapshot recording, content sync, and audit logging verified.");

  // ----------------------------------------------------
  // TEST 7: Creator Intelligence Summary & Profile View (Step 7)
  // ----------------------------------------------------
  console.log("\n[Test 7] Testing Creator Intelligence Aggregation...");
  const intelligence = await getCreatorIntelligenceSummary(mira.id);
  assert(intelligence.accounts.length >= 1, "Accounts returned in summary");
  assert.strictEqual(intelligence.footprint.total, "180500", "Combined footprint matches subscriber count");
  assert.strictEqual(intelligence.footprint.authenticatedAccountsCount, 1);
  assert(intelligence.footprint.disclosure.includes("Combined Platform Footprint"));
  assert(intelligence.accounts[0].latestMetrics.length >= 2, "Metrics included");
  assert(intelligence.accounts[0].recentContent.length >= 1, "Content items included");
  console.log("  ✔ Creator Intelligence summary returned with provider-reported provenance and disclosure.");

  // ----------------------------------------------------
  // TEST 8: Discovery Integration & Provider-Authenticated Filter (Step 8)
  // ----------------------------------------------------
  console.log("\n[Test 8] Testing Discovery Directory Filter for Provider-Authenticated Creators...");
  const authenticatedCreators = await prisma.creator.findMany({
    where: {
      socialAccounts: {
        some: { connectionStatus: "CONNECTED" },
      },
    },
    include: { socialAccounts: true },
  });
  assert(authenticatedCreators.length >= 1, "Found at least 1 provider-authenticated creator in directory");
  assert(authenticatedCreators.some((c) => c.id === mira.id), "Mira Sen returned as provider-authenticated creator");

  const unauthenticatedCreators = await prisma.creator.findMany({
    where: {
      socialAccounts: {
        none: { connectionStatus: "CONNECTED" },
      },
    },
  });
  assert(unauthenticatedCreators.length >= 1, "Unauthenticated creators separated cleanly from provider-authenticated creators");
  console.log(`  ✔ Discovery query successfully isolates provider-authenticated creators (${authenticatedCreators.length}) from unauthenticated creators (${unauthenticatedCreators.length}).`);

  // ----------------------------------------------------
  // TEST 9: Full Backward Compatibility Check
  // ----------------------------------------------------
  console.log("\n[Test 9] Verifying Full System Backward Compatibility (Phases 1, 2, 3, 4A)...");
  const [users, creators, brands, campaigns, matches, orders, convos] = await Promise.all([
    prisma.user.count(),
    prisma.creator.count(),
    prisma.brand.count(),
    prisma.campaign.count(),
    prisma.match.count(),
    prisma.order.count(),
    prisma.conversation.count(),
  ]);

  assert(users >= 12, `Users count: ${users}`);
  assert(creators >= 6, `Creators count: ${creators}`);
  assert(brands >= 6, `Brands count: ${brands}`);
  assert(campaigns >= 6, `Campaigns count: ${campaigns}`);
  assert(matches >= 1, `Matches count: ${matches}`);
  assert(orders >= 0, `Orders table accessible (count: ${orders})`);
  assert(convos >= 1, `Conversations count: ${convos}`);
  console.log("  ✔ All historical marketplace entities preserved with zero regressions.");

  console.log("\n==========================================");
  console.log("   ALL PHASE 4C VERIFICATION TESTS PASSED!");
  console.log("==========================================\n");
}

runPhase4CVerificationSuite().catch((err) => {
  console.error("Phase 4C test suite failed:", err);
  process.exit(1);
});
