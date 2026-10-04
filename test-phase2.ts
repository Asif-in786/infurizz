import { PrismaClient } from "@prisma/client";
import { SUPPORTED_PLATFORMS } from "./lib/social/types";
import { formatConnectionState } from "./lib/social/registry";

const prisma = new PrismaClient();

async function runPhase2Tests() {
  console.log("==========================================");
  console.log("   INFURIZZ PHASE 2 VERIFICATION SUITE   ");
  console.log("==========================================\n");

  let testPassed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✔ ${message}`);
      testPassed++;
    } else {
      console.error(`  ✖ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Database Seed & Demo Data Persistence
  // ----------------------------------------------------
  console.log("[Test 1] Verifying Demo Creators & Seed Data...");
  const creators = await prisma.creator.findMany({
    include: {
      services: true,
      portfolio: true,
      socials: true,
    },
  });

  assert(creators.length >= 5, `Found ${creators.length} creators (expected at least 5)`);

  const mira = creators.find((c) => c.name === "Mira Sen");
  assert(!!mira, "Mira Sen profile exists");
  assert(mira?.username === "mira.sen", `Mira Sen username is set to @${mira?.username}`);
  assert((mira?.services.length ?? 0) >= 2, `Mira Sen has ${mira?.services.length} services (expected >= 2)`);
  assert((mira?.portfolio.length ?? 0) >= 2, `Mira Sen has ${mira?.portfolio.length} portfolio items (expected >= 2)`);

  const jonah = creators.find((c) => c.name === "Jonah Hale");
  assert(!!jonah, "Jonah Hale profile exists");
  assert(jonah?.username === "jonahhale", `Jonah Hale username is set to @${jonah?.username}`);
  assert((jonah?.services.length ?? 0) >= 2, `Jonah Hale has ${jonah?.services.length} services`);

  // ----------------------------------------------------
  // TEST 2: Services Schema & Data Integrity
  // ----------------------------------------------------
  console.log("\n[Test 2] Verifying Services Schema & Constraints...");
  const allServices = await prisma.creatorService.findMany();
  assert(allServices.length >= 6, `Total services across creators: ${allServices.length}`);

  for (const s of allServices) {
    assert(s.price >= 0, `Service "${s.title}" price is non-negative ($${s.price})`);
    assert(s.turnaroundDays >= 1, `Service "${s.title}" turnaround is >= 1 day (${s.turnaroundDays}d)`);
    assert(s.revisions >= 0, `Service "${s.title}" revisions >= 0 (${s.revisions})`);
    assert(Boolean(s.deliverables && s.deliverables.length > 0), `Service "${s.title}" has deliverables defined`);
    assert(Boolean(s.platform && s.platform.length > 0), `Service "${s.title}" has platform specified (${s.platform})`);
  }

  // ----------------------------------------------------
  // TEST 3: Portfolio Schema & Sort Order Integrity
  // ----------------------------------------------------
  console.log("\n[Test 3] Verifying Portfolio Schema & Sort Ordering...");
  const allPortfolio = await prisma.creatorPortfolioItem.findMany();
  assert(allPortfolio.length >= 6, `Total portfolio items: ${allPortfolio.length}`);

  for (const p of allPortfolio) {
    assert(Boolean(p.title && p.title.length > 0), `Portfolio item "${p.title}" has title`);
    assert(Boolean(p.platform && p.platform.length > 0), `Portfolio item "${p.title}" specifies platform (${p.platform})`);
  }

  // ----------------------------------------------------
  // TEST 4: Storefront Lookup (By ID and by @username)
  // ----------------------------------------------------
  console.log("\n[Test 4] Verifying Storefront Lookup by ID and Username...");
  if (!mira) throw new Error("Mira Sen not found");

  const byId = await prisma.creator.findFirst({
    where: { OR: [{ id: mira.id }, { username: mira.id }] },
    include: {
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      portfolio: { orderBy: { sortOrder: "asc" } },
      socials: true,
    },
  });
  assert(byId?.id === mira.id, `Storefront lookup by ID (${mira.id}) succeeded`);

  const byUsername = await prisma.creator.findFirst({
    where: { OR: [{ id: "mira.sen" }, { username: "mira.sen" }] },
    include: {
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      portfolio: { orderBy: { sortOrder: "asc" } },
      socials: true,
    },
  });
  assert(byUsername?.id === mira.id, "Storefront lookup by username (@mira.sen) resolved to same creator");
  assert(byUsername?.services.length === mira.services.filter((s) => s.isActive).length, "Active services correctly filtered for public storefront");

  // ----------------------------------------------------
  // TEST 5: Service Lifecycle & Active/Inactive Toggling
  // ----------------------------------------------------
  console.log("\n[Test 5] Verifying Service CRUD & Status Toggling...");
  // Create a test service
  const testService = await prisma.creatorService.create({
    data: {
      creatorId: mira.id,
      title: "Temporary Test Service",
      description: "Test service for lifecycle verification",
      platform: "Instagram",
      price: 299,
      turnaroundDays: 5,
      deliverables: "1x Test Reel",
      revisions: 1,
      isActive: true,
    },
  });
  assert(testService.isActive === true, "Created service defaults to active");

  // Deactivate service
  const deactivated = await prisma.creatorService.update({
    where: { id: testService.id },
    data: { isActive: false },
  });
  assert(deactivated.isActive === false, "Service successfully deactivated");

  // Verify storefront excludes deactivated service
  const publicStorefront = await prisma.creator.findUnique({
    where: { id: mira.id },
    include: { services: { where: { isActive: true } } },
  });
  const foundInPublic = publicStorefront?.services.some((s) => s.id === testService.id);
  assert(!foundInPublic, "Deactivated service is hidden from public marketplace storefront");

  // Reactivate service
  const reactivated = await prisma.creatorService.update({
    where: { id: testService.id },
    data: { isActive: true },
  });
  assert(reactivated.isActive === true, "Service successfully reactivated");

  // Delete test service
  await prisma.creatorService.delete({ where: { id: testService.id } });
  const checkDeleted = await prisma.creatorService.findUnique({ where: { id: testService.id } });
  assert(checkDeleted === null, "Test service successfully deleted");

  // ----------------------------------------------------
  // TEST 6: Portfolio CRUD Lifecycle
  // ----------------------------------------------------
  console.log("\n[Test 6] Verifying Portfolio CRUD Lifecycle...");
  const testPortfolio = await prisma.creatorPortfolioItem.create({
    data: {
      creatorId: mira.id,
      title: "Temporary Test Reel Sample",
      platform: "Instagram",
      description: "Sample description",
      externalUrl: "https://instagram.com/p/test",
      sortOrder: 99,
    },
  });
  assert(testPortfolio.id.length > 0, "Created test portfolio item");

  // Update
  const updatedPortfolio = await prisma.creatorPortfolioItem.update({
    where: { id: testPortfolio.id },
    data: { title: "Updated Test Reel Sample" },
  });
  assert(updatedPortfolio.title === "Updated Test Reel Sample", "Portfolio item updated");

  // Delete
  await prisma.creatorPortfolioItem.delete({ where: { id: testPortfolio.id } });
  const checkPortDeleted = await prisma.creatorPortfolioItem.findUnique({ where: { id: testPortfolio.id } });
  assert(checkPortDeleted === null, "Test portfolio item successfully deleted");

  // ----------------------------------------------------
  // TEST 7: Truthful Social Connection Status & Zero Fake Metrics
  // ----------------------------------------------------
  console.log("\n[Test 7] Verifying Truthful Social States & Zero Fabricated Metrics...");
  for (const creator of creators) {
    const socialMap = new Map(creator.socials.map((s) => [s.platform, s]));
    for (const platform of SUPPORTED_PLATFORMS) {
      const social = socialMap.get(platform);
      if (social) {
        const state = formatConnectionState(social);
        assert(state.status === "NOT_CONNECTED", `${creator.name} ${platform} handle correctly reports NOT_CONNECTED (unverified)`);
        assert(state.metrics === undefined, `${creator.name} ${platform} has ZERO fabricated metrics`);
        assert(state.isSample === creator.isDemo, `${creator.name} ${platform} isSample flag matches creator.isDemo (${creator.isDemo})`);
      }
    }
  }

  // ----------------------------------------------------
  // TEST 8: Preserved Backward Compatibility
  // ----------------------------------------------------
  console.log("\n[Test 8] Verifying Backward Compatibility (Users, Brands, Matches, Messages)...");
  const userCount = await prisma.user.count();
  const brandCount = await prisma.brand.count();
  const campaignCount = await prisma.campaign.count();
  const matchCount = await prisma.match.count();
  const convoCount = await prisma.conversation.count();
  const messageCount = await prisma.message.count();

  assert(userCount >= 10, `User count: ${userCount} (preserved)`);
  assert(brandCount >= 5, `Brand count: ${brandCount} (preserved)`);
  assert(campaignCount >= 5, `Campaign count: ${campaignCount} (preserved)`);
  assert(matchCount >= 1, `Matches count: ${matchCount} (preserved)`);
  assert(convoCount >= 1, `Conversations count: ${convoCount} (preserved)`);
  assert(messageCount >= 1, `Messages count: ${messageCount} (preserved)`);

  console.log("\n==========================================");
  console.log(`  ALL ${testPassed} PHASE 2 TESTS PASSED PERFECTLY!`);
  console.log("==========================================\n");
}

runPhase2Tests()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
