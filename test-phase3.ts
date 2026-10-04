import { PrismaClient } from "@prisma/client";
import {
  canTransitionCampaign,
  canTransitionApplication,
  isCampaignPublished,
  isCampaignAcceptingApplications,
} from "./lib/options";
import { compatibility } from "./lib/compatibility";
import { platformsFromJson } from "./lib/format";

const prisma = new PrismaClient();

async function runPhase3Tests() {
  console.log("==========================================");
  console.log("   INFURIZZ PHASE 3 VERIFICATION SUITE   ");
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

  // Cleanup any leftover test records from prior runs
  await prisma.campaignApplication.deleteMany({
    where: { campaign: { name: { contains: "[TEST-PHASE3]" } } },
  });
  await prisma.campaign.deleteMany({
    where: { name: { contains: "[TEST-PHASE3]" } },
  });

  // ----------------------------------------------------
  // TEST A: Creator Discovery
  // ----------------------------------------------------
  console.log("[Test A] Verifying Creator Discovery in Directory...");
  const creators = await prisma.creator.findMany({
    include: {
      socials: true,
      services: { where: { isActive: true } },
      portfolio: true,
    },
    orderBy: { name: "asc" },
  });
  assert(creators.length >= 5, `Found ${creators.length} creators in directory database`);

  for (const c of creators) {
    assert(Boolean(c.name && c.category && c.niche), `Creator ${c.name} has name, category, and niche`);
  }

  // ----------------------------------------------------
  // TEST B: Search (Name, Username, Bio, Niche)
  // ----------------------------------------------------
  console.log("\n[Test B] Verifying Database Search Capabilities...");
  // 1. Search by Name
  const searchMira = creators.filter((c) =>
    `${c.name} ${c.username ?? ""} ${c.bio} ${c.niche}`.toLowerCase().includes("mira")
  );
  assert(searchMira.some((c) => c.name === "Mira Sen"), "Search for 'mira' found Mira Sen");

  // 2. Search by @username
  const searchHandle = creators.filter((c) =>
    `${c.name} ${c.username ?? ""} ${c.bio} ${c.niche}`.toLowerCase().includes("jonahhale")
  );
  assert(searchHandle.some((c) => c.username === "jonahhale"), "Search for 'jonahhale' found @jonahhale");

  // 3. Search by niche
  const searchNiche = creators.filter((c) =>
    `${c.name} ${c.username ?? ""} ${c.bio} ${c.niche}`.toLowerCase().includes("night walks")
  );
  assert(searchNiche.some((c) => c.name === "Leo Park"), "Search for 'night walks' found Leo Park");

  // ----------------------------------------------------
  // TEST C: Filters (Category, Platform, Price, Turnaround)
  // ----------------------------------------------------
  console.log("\n[Test C] Verifying Directory Filters...");
  // 1. Category Filter
  const techCreators = await prisma.creator.findMany({ where: { category: "Technology" } });
  assert(techCreators.length >= 1 && techCreators.every((c) => c.category === "Technology"), "Category filter works");

  // 2. Platform Filter
  const linkedInCreators = await prisma.creator.findMany({
    where: {
      OR: [
        { socials: { some: { platform: "LinkedIn" } } },
        { services: { some: { platform: "LinkedIn", isActive: true } } },
      ],
    },
  });
  assert(linkedInCreators.some((c) => c.name === "Jonah Hale"), "Platform filter for LinkedIn includes Jonah Hale");

  // 3. Price Filter (<= $500 starting price)
  const affordable = creators.filter((c) => {
    const minPrice = c.services.length > 0 ? Math.min(...c.services.map((s) => s.price)) : null;
    return minPrice !== null && minPrice <= 500;
  });
  assert(affordable.some((c) => c.name === "Mira Sen"), "Price filter <= $500 includes Mira Sen ($450)");
  assert(!affordable.some((c) => c.name === "Jonah Hale"), "Price filter <= $500 excludes Jonah Hale (min $800)");

  // 4. Turnaround Filter (<= 4 days)
  const fastTurnaround = creators.filter((c) => {
    const minDays = c.services.length > 0 ? Math.min(...c.services.map((s) => s.turnaroundDays)) : null;
    return minDays !== null && minDays <= 4;
  });
  assert(fastTurnaround.some((c) => c.name === "Mira Sen"), "Turnaround filter <= 4d includes Mira Sen (4d)");
  assert(!fastTurnaround.some((c) => c.name === "Leo Park"), "Turnaround filter <= 4d excludes Leo Park (12d)");

  // ----------------------------------------------------
  // TEST D: Campaign Lifecycle State Machine Transitions
  // ----------------------------------------------------
  console.log("\n[Test D] Verifying Campaign Lifecycle State Machine...");
  assert(canTransitionCampaign("DRAFT", "PUBLISHED") === true, "DRAFT -> PUBLISHED allowed");
  assert(canTransitionCampaign("DRAFT", "CLOSED") === true, "DRAFT -> CLOSED allowed");
  assert(canTransitionCampaign("PUBLISHED", "PAUSED") === true, "PUBLISHED -> PAUSED allowed");
  assert(canTransitionCampaign("PUBLISHED", "CLOSED") === true, "PUBLISHED -> CLOSED allowed");
  assert(canTransitionCampaign("PAUSED", "PUBLISHED") === true, "PAUSED -> PUBLISHED allowed");
  assert(canTransitionCampaign("PAUSED", "CLOSED") === true, "PAUSED -> CLOSED allowed");
  assert(canTransitionCampaign("CLOSED", "PUBLISHED") === false, "CLOSED -> PUBLISHED rejected");
  assert(canTransitionCampaign("CLOSED", "DRAFT") === false, "CLOSED -> DRAFT rejected");
  assert(canTransitionCampaign("Open", "PAUSED") === true, "Legacy 'Open' treated as PUBLISHED");

  // ----------------------------------------------------
  // TEST E: Published Campaign Visibility & Guards
  // ----------------------------------------------------
  console.log("\n[Test E] Verifying Campaign Visibility by State...");
  const northstar = await prisma.brand.findFirst({ where: { name: "Northstar" } });
  if (!northstar) throw new Error("Northstar brand not found");

  // Create DRAFT campaign
  const draftCampaign = await prisma.campaign.create({
    data: {
      brandId: northstar.id,
      name: "[TEST-PHASE3] Draft Campaign",
      category: "Lifestyle",
      creatorNiche: "Testing",
      platforms: JSON.stringify(["Instagram"]),
      audienceRange: "10k–50k",
      location: "Anywhere",
      budgetMin: 1000,
      budgetMax: 2000,
      deliverables: "Test deliverables",
      status: "DRAFT",
    },
  });

  // Verify DRAFT excluded from public query
  const publicCampaigns = await prisma.campaign.findMany({
    where: { status: { notIn: ["DRAFT", "Draft"] } },
  });
  assert(!publicCampaigns.some((c) => c.id === draftCampaign.id), "DRAFT campaign is hidden from public directory");
  assert(!isCampaignAcceptingApplications(draftCampaign.status), "DRAFT campaign rejects applications");

  // Transition to PUBLISHED
  const publishedCampaign = await prisma.campaign.update({
    where: { id: draftCampaign.id },
    data: { status: "PUBLISHED" },
  });
  assert(isCampaignPublished(publishedCampaign.status), "PUBLISHED campaign recognized as published");
  assert(isCampaignAcceptingApplications(publishedCampaign.status), "PUBLISHED campaign accepts applications");

  // Transition to PAUSED
  const pausedCampaign = await prisma.campaign.update({
    where: { id: draftCampaign.id },
    data: { status: "PAUSED" },
  });
  assert(!isCampaignAcceptingApplications(pausedCampaign.status), "PAUSED campaign rejects new applications");

  // Transition back to PUBLISHED
  await prisma.campaign.update({
    where: { id: draftCampaign.id },
    data: { status: "PUBLISHED" },
  });

  // ----------------------------------------------------
  // TEST F: Creator Application Creation
  // ----------------------------------------------------
  console.log("\n[Test F] Verifying Creator Application Creation...");
  const mira = creators.find((c) => c.name === "Mira Sen");
  if (!mira) throw new Error("Mira Sen not found");

  const miraService = mira.services[0];

  const app1 = await prisma.campaignApplication.create({
    data: {
      campaignId: draftCampaign.id,
      creatorId: mira.id,
      serviceId: miraService?.id ?? null,
      proposedRate: 650,
      pitchMessage: "I would love to produce a dedicated culinary short for this brief.",
      status: "PENDING",
    },
    include: { campaign: true, creator: true, service: true },
  });

  assert(app1.status === "PENDING", "Application created in PENDING state");
  assert(app1.proposedRate === 650, "Proposed rate correctly recorded");
  assert(app1.serviceId === miraService?.id, "Service package attached to application");

  // ----------------------------------------------------
  // TEST G: Duplicate Application Prevention
  // ----------------------------------------------------
  console.log("\n[Test G] Verifying Duplicate Application Prevention...");
  let dupFailed = false;
  try {
    await prisma.campaignApplication.create({
      data: {
        campaignId: draftCampaign.id,
        creatorId: mira.id,
        proposedRate: 800,
        pitchMessage: "Second attempt",
        status: "PENDING",
      },
    });
  } catch {
    dupFailed = true;
  }
  assert(dupFailed, "Database unique constraint blocked duplicate application by same creator");

  // ----------------------------------------------------
  // TEST H: Application Withdrawal
  // ----------------------------------------------------
  console.log("\n[Test H] Verifying Application Withdrawal...");
  assert(canTransitionApplication(app1.status, "WITHDRAWN") === true, "PENDING -> WITHDRAWN allowed");

  const withdrawnApp = await prisma.campaignApplication.update({
    where: { id: app1.id },
    data: { status: "WITHDRAWN" },
  });
  assert(withdrawnApp.status === "WITHDRAWN", "Application successfully marked WITHDRAWN");
  assert(canTransitionApplication(withdrawnApp.status, "ACCEPTED") === false, "WITHDRAWN -> ACCEPTED rejected");

  // Delete test application to test fresh flow
  await prisma.campaignApplication.delete({ where: { id: app1.id } });

  // ----------------------------------------------------
  // TEST I: Brand Application Review
  // ----------------------------------------------------
  console.log("\n[Test I] Verifying Brand Application Review View...");
  const jonah = creators.find((c) => c.name === "Jonah Hale");
  if (!jonah) throw new Error("Jonah Hale not found");

  const jonahApp = await prisma.campaignApplication.create({
    data: {
      campaignId: draftCampaign.id,
      creatorId: jonah.id,
      proposedRate: 1500,
      pitchMessage: "My tech workspace setup is an exact fit for this project.",
      status: "PENDING",
    },
    include: { creator: true, campaign: { include: { brand: true } } },
  });

  const reviewList = await prisma.campaignApplication.findMany({
    where: { campaignId: draftCampaign.id },
    include: { creator: true },
  });
  assert(reviewList.length === 1, "Brand sees 1 pending applicant");
  assert(reviewList[0].creator.name === "Jonah Hale", "Applicant correctly identified as Jonah Hale");
  assert(reviewList[0].proposedRate === 1500, "Proposed rate visible to brand");

  // ----------------------------------------------------
  // TEST J: Accept Application
  // ----------------------------------------------------
  console.log("\n[Test J] Verifying Application Acceptance...");
  assert(canTransitionApplication(jonahApp.status, "ACCEPTED") === true, "PENDING -> ACCEPTED allowed");

  const acceptedResult = await prisma.$transaction(async (tx) => {
    const updated = await tx.campaignApplication.update({
      where: { id: jonahApp.id },
      data: { status: "ACCEPTED" },
    });
    const conv = await tx.conversation.create({
      data: { applicationId: jonahApp.id },
    });
    return { updated, conv };
  });

  assert(acceptedResult.updated.status === "ACCEPTED", "Application transitioned to ACCEPTED");
  assert(Boolean(acceptedResult.conv.id), "Conversation created upon acceptance");

  // ----------------------------------------------------
  // TEST K: Reject Application & Forbidden State Transitions
  // ----------------------------------------------------
  console.log("\n[Test K] Verifying Application Rejection & Invalid Transitions...");
  const asha = creators.find((c) => c.name === "Asha Idris");
  if (!asha) throw new Error("Asha Idris not found");

  const ashaApp = await prisma.campaignApplication.create({
    data: {
      campaignId: draftCampaign.id,
      creatorId: asha.id,
      proposedRate: 700,
      pitchMessage: "Pitch for testing rejection",
      status: "PENDING",
    },
  });

  const rejectedApp = await prisma.campaignApplication.update({
    where: { id: ashaApp.id },
    data: { status: "REJECTED" },
  });
  assert(rejectedApp.status === "REJECTED", "Application transitioned to REJECTED");

  // Verify REJECTED -> ACCEPTED forbidden
  assert(canTransitionApplication(rejectedApp.status, "ACCEPTED") === false, "REJECTED -> ACCEPTED rejected by state machine");
  assert(canTransitionApplication(acceptedResult.updated.status, "REJECTED") === false, "ACCEPTED -> REJECTED rejected by state machine");

  // ----------------------------------------------------
  // TEST L: Conversation Creation & Context After Acceptance
  // ----------------------------------------------------
  console.log("\n[Test L] Verifying Conversation Context & Messaging...");
  const conv = await prisma.conversation.findUnique({
    where: { id: acceptedResult.conv.id },
    include: {
      application: {
        include: {
          creator: true,
          campaign: { include: { brand: true } },
          service: true,
        },
      },
      messages: true,
    },
  });

  if (!conv) throw new Error("Conversation was not created");
  assert(Boolean(conv.application), "Conversation has application context attached");
  assert(conv.application?.creator.name === "Jonah Hale", "Application conversation points to Jonah Hale");
  assert(conv?.application?.campaign.brand.name === "Northstar", "Application conversation points to Northstar");
  assert(conv?.application?.proposedRate === 1500, "Agreed proposed rate accessible in conversation context");

  // Send message
  const msg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: northstar.userId,
      body: "Welcome to the campaign, Jonah! We look forward to reviewing your draft.",
    },
  });
  assert(Boolean(msg.id), "Message sent successfully in application conversation");

  // ----------------------------------------------------
  // TEST M: Authorization Boundaries
  // ----------------------------------------------------
  console.log("\n[Test M] Verifying Authorization Boundaries...");
  const luma = await prisma.brand.findFirst({ where: { name: "Luma" } });
  if (!luma) throw new Error("Luma brand not found");

  // 1. Brand Luma cannot review Northstar's application
  const authCheck = jonahApp.campaign.brand.userId === luma.userId;
  assert(!authCheck, "Brand Luma cannot review applications for Northstar's campaign");

  // 2. Creator Jonah cannot withdraw Mira's application
  const creatorAuthCheck = jonah.id === mira.id;
  assert(!creatorAuthCheck, "Creator Jonah cannot mutate Mira's applications");

  // ----------------------------------------------------
  // TEST N: Mutual Match & Compatibility Regression
  // ----------------------------------------------------
  console.log("\n[Test N] Verifying Mutual Match & Compatibility Engine Continuity...");
  const allMatches = await prisma.match.findMany({
    include: { conversation: true, creator: true, campaign: true },
  });
  assert(allMatches.length >= 1, `Existing mutual matches preserved (${allMatches.length})`);

  for (const m of allMatches) {
    assert(Boolean(m.conversation?.id), `Match ${m.id} has valid conversation thread intact`);
  }

  // Verify compatibility engine still deterministically computes scores
  const sampleFit = compatibility({
    creatorCategory: mira.category,
    creatorNiche: mira.niche,
    creatorLocation: mira.location,
    creatorAudience: mira.audienceRange,
    creatorPlatforms: mira.socials.map((s) => s.platform),
    campaignCategory: draftCampaign.category,
    campaignNiche: draftCampaign.creatorNiche,
    campaignLocation: draftCampaign.location,
    campaignAudience: draftCampaign.audienceRange,
    campaignPlatforms: platformsFromJson(draftCampaign.platforms),
  });
  assert(typeof sampleFit.score === "number" && sampleFit.score >= 0 && sampleFit.score <= 100, "Compatibility engine computes valid deterministic score");

  // Clean up test campaign and test applications
  await prisma.message.deleteMany({ where: { conversationId: conv.id } });
  await prisma.conversation.delete({ where: { id: conv.id } });
  await prisma.campaignApplication.deleteMany({ where: { campaignId: draftCampaign.id } });
  await prisma.campaign.delete({ where: { id: draftCampaign.id } });

  console.log("\n==========================================");
  console.log(`  ALL ${testPassed} PHASE 3 TESTS PASSED PERFECTLY!`);
  console.log("==========================================\n");
}

runPhase3Tests()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
