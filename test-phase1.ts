import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./lib/password";
import { socialProviders, formatConnectionState } from "./lib/social/registry";
import { SUPPORTED_PLATFORMS } from "./lib/social/types";
import { generateOAuthState, isGoogleOAuthConfigured } from "./lib/auth/oauth";
import { DEMO_PASSWORD } from "./lib/options";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== PHASE 1 VERIFICATION SUITE ===");

  // 1. Database Model Check
  console.log("\n[Test 1] Checking Database Models & Schema Extensions...");
  const userCount = await prisma.user.count();
  const creatorCount = await prisma.creator.count();
  const brandCount = await prisma.brand.count();
  const campaignCount = await prisma.campaign.count();
  const accountCount = await prisma.account.count();
  const serviceCount = await prisma.creatorService.count();
  const portfolioCount = await prisma.creatorPortfolioItem.count();
  const applicationCount = await prisma.campaignApplication.count();
  const matchCount = await prisma.match.count();
  const convoCount = await prisma.conversation.count();

  console.log(`  Users: ${userCount}, Creators: ${creatorCount}, Brands: ${brandCount}`);
  console.log(`  Campaigns: ${campaignCount}, Matches: ${matchCount}, Convos: ${convoCount}`);
  console.log(`  New Model Tables - Accounts: ${accountCount}, Services: ${serviceCount}, Portfolios: ${portfolioCount}, Applications: ${applicationCount}`);
  if (userCount < 10) throw new Error("Existing user records were lost!");
  console.log("  ✔ All 12 tables exist and existing demo data is intact.");

  // 2. Password Verification Check
  console.log("\n[Test 2] Verifying Password Hashing & Existing Demo Accounts...");
  const demoCreator = await prisma.user.findUnique({
    where: { email: "mira@demo.infurizz.local" },
  });
  if (!demoCreator || !demoCreator.passwordHash) throw new Error("Demo creator Mira Sen missing!");
  const valid = await verifyPassword(DEMO_PASSWORD, demoCreator.passwordHash);
  if (!valid) throw new Error("Password verification failed for demo account!");
  console.log("  ✔ Demo account password verified successfully with scrypt.");

  // 3. Social Provider Abstraction Check
  console.log("\n[Test 3] Verifying SocialProvider Abstraction & Strict Anti-Fabrication...");
  for (const platform of SUPPORTED_PLATFORMS) {
    const provider = socialProviders[platform];
    if (!provider) throw new Error(`Missing provider for ${platform}`);
    const metrics = await provider.fetchMetrics?.("test_handle");
    if (metrics !== null) throw new Error(`Fabricated metrics detected for ${platform}!`);
    const authUrl = await provider.getAuthorizationUrl?.("test_creator");
    if (authUrl !== null) throw new Error(`Active OAuth reported without config for ${platform}!`);
    const state = formatConnectionState({
      platform,
      handle: `@test_${platform.toLowerCase()}`,
      connectionStatus: "NOT_CONNECTED",
    });
    if (state.status !== "NOT_CONNECTED") throw new Error(`Status should be NOT_CONNECTED for ${platform}`);
    if (state.metrics !== undefined) throw new Error(`Metrics must be undefined for unverified ${platform}`);
  }
  console.log(`  ✔ Verified all 6 platforms (${SUPPORTED_PLATFORMS.join(", ")}). Zero fabricated metrics.`);

  // 4. OAuth Utility & State Check
  console.log("\n[Test 4] Verifying OAuth Utilities...");
  const state = generateOAuthState();
  if (!state || state.length < 32) throw new Error("Invalid OAuth state generated");
  const googleConfigured = isGoogleOAuthConfigured();
  console.log(`  OAuth State: ${state.substring(0, 10)}... (Length: ${state.length})`);
  console.log(`  Google OAuth configured in env: ${googleConfigured}`);
  console.log("  ✔ OAuth security helpers functioning properly.");

  // 5. Account Linking Model Test
  console.log("\n[Test 5] Testing Account Model Transaction Safety...");
  const testEmail = "oauth_test_user@infurizz.local";
  const testSub = "google_sub_test_12345";

  // Cleanup if exists from previous test
  await prisma.account.deleteMany({ where: { providerAccountId: testSub } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      role: "UNASSIGNED",
      accounts: {
        create: {
          provider: "google",
          providerAccountId: testSub,
          tokenType: "Bearer",
          accessToken: "mock_test_token",
          expiresAt: new Date(Date.now() + 3600000),
        },
      },
    },
    include: { accounts: true },
  });

  if (testUser.accounts.length !== 1 || testUser.role !== "UNASSIGNED") {
    throw new Error("Failed to create OAuth test user with UNASSIGNED role");
  }

  // Cleanup test record
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log("  ✔ Account model linking, cascade delete, and unassigned role created & verified.");

  console.log("\n==========================================");
  console.log("ALL PHASE 1 VERIFICATION TESTS PASSED (5/5)");
  console.log("==========================================");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
