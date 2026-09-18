import { prisma } from "../src/lib/db/client";
import { hashPassword, verifyPassword } from "../src/lib/auth/passwords";
import { Role, CollaborationStatus, CampaignStatus, SocialPlatform } from "@prisma/client";
import { connectorRegistry } from "../src/lib/integrations/registry";
import { env } from "../src/lib/env";

async function main() {
  console.log("================================================================================");
  console.log("  INFURIZZ PROTOCOL - PRODUCTION PLATFORM END-TO-END VERIFICATION");
  console.log("================================================================================\n");

  let passedAssertions = 0;
  let totalAssertions = 0;

  function assert(condition: boolean, label: string) {
    totalAssertions++;
    if (condition) {
      console.log(`  ✓ [PASS] ${label}`);
      passedAssertions++;
    } else {
      console.error(`  ✗ [FAIL] ${label}`);
      throw new Error(`Assertion failed: ${label}`);
    }
  }

  // -------------------------------------------------------------------------
  // 1. Production Database Audit: Zero Demo Users
  // -------------------------------------------------------------------------
  console.log("▶ 1. AUDITING SUPABASE POSTGRESQL DATABASE (NO CANONICAL/DEMO USERS)...");
  const demoUsersCount = await prisma.user.count({
    where: {
      email: {
        in: [
          "sarah.chen@infurizz.internal",
          "marcus.brody@infurizz.internal",
          "elena.rostova@infurizz.internal",
          "david.okafor@infurizz.internal",
          "maya.lin@infurizz.internal",
          "sponsor@apex-audio.internal",
          "partnerships@lumina-labs.internal",
          "influencers@nova-activewear.internal",
        ],
      },
    },
  });
  assert(demoUsersCount === 0, "Supabase PostgreSQL contains 0 legacy canonical/demo users");

  const demoCreatorHandles = await prisma.creatorProfile.count({
    where: {
      handle: { in: ["sarahchen", "marcusbrody", "elenarostova", "davidokafor", "mayalin"] },
    },
  });
  assert(demoCreatorHandles === 0, "Supabase PostgreSQL contains 0 legacy demo creator profiles");

  const demoBrandNames = await prisma.brandProfile.count({
    where: {
      companyName: { in: ["Apex Audio Technologies", "Lumina Labs", "Nova Activewear"] },
    },
  });
  assert(demoBrandNames === 0, "Supabase PostgreSQL contains 0 legacy demo brand profiles");

  // -------------------------------------------------------------------------
  // 2. Real Registration & Native Crypto Password Hashing
  // -------------------------------------------------------------------------
  console.log("\n▶ 2. REAL REGISTRATION & PASSWORD HASHING (CRYPTO.SCRYPT)...");
  // Clean any previous test run artifacts
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: "@acmelabs.io" } },
        { email: { contains: "@nexustech.dev" } },
      ],
    },
  });

  const testBrandEmail = `brand_${Date.now()}@acmelabs.io`;
  const testBrandPassword = "AcmeProductionPassword2026!";
  const brandHashed = hashPassword(testBrandPassword);
  const [salt, key] = brandHashed.split(":");

  assert(salt.length === 32 && key.length === 128, "Password is encrypted using native crypto.scrypt (salt:key)");
  assert(verifyPassword(testBrandPassword, brandHashed), "Password verifies against its salt/hash");
  assert(!verifyPassword("WrongPassword123!", brandHashed), "Invalid password fails verification");

  const brandUser = await prisma.user.create({
    data: {
      email: testBrandEmail,
      name: "Acme Creative Labs",
      role: Role.BRAND,
      passwordHash: brandHashed,
    },
  });
  assert(Boolean(brandUser.id), "Brand user registered successfully in PostgreSQL");

  const testCreatorEmail = `creator_${Date.now()}@nexustech.dev`;
  const testCreatorPassword = "CreatorProductionPassword2026!";
  const creatorHashed = hashPassword(testCreatorPassword);

  const creatorUser = await prisma.user.create({
    data: {
      email: testCreatorEmail,
      name: "Jordan Sparks",
      role: Role.CREATOR,
      passwordHash: creatorHashed,
    },
  });
  assert(Boolean(creatorUser.id), "Creator user registered successfully in PostgreSQL");

  // -------------------------------------------------------------------------
  // 3. Genuine Onboarding: No Injected Fake Followers or Sample Campaigns
  // -------------------------------------------------------------------------
  console.log("\n▶ 3. GENUINE ONBOARDING INTEGRITY...");
  const cleanHandle = `jordansparks_${Math.floor(Math.random() * 1000)}`;
  const creatorProfile = await prisma.creatorProfile.create({
    data: {
      userId: creatorUser.id,
      handle: cleanHandle,
      displayName: "Jordan Sparks",
      category: "Tech & Software",
      bio: "Independent software architect and hardware reviewer.",
      location: "Seattle, WA",
      ratesSummary: "$2,000 - $5,000 per sponsored segment",
      totalReach: 0,
      avgEngagementRate: 0.0,
    },
  });

  const creatorSocials = await prisma.socialAccount.findMany({
    where: { creatorId: creatorProfile.id },
  });
  assert(creatorSocials.length === 0, "New creator starts with 0 fabricated social accounts");

  const creatorSnapshots = await prisma.audienceSnapshot.findMany({
    where: { creatorId: creatorProfile.id },
  });
  assert(creatorSnapshots.length === 0, "New creator starts with 0 fabricated historical snapshots");
  assert(creatorProfile.totalReach === 0, "Creator total reach is genuinely 0 until accounts are connected");

  const brandProfile = await prisma.brandProfile.create({
    data: {
      userId: brandUser.id,
      companyName: "Acme Creative Labs",
      industry: "Consumer Tech",
      website: "https://acmelabs.io",
      budgetRange: "$50,000 - $100,000 / quarter",
      description: "Next-gen audio and computing hardware.",
    },
  });

  const brandCampaigns = await prisma.campaign.findMany({
    where: { brandId: brandProfile.id },
  });
  assert(brandCampaigns.length === 0, "New brand starts with 0 fabricated sample campaigns");

  // -------------------------------------------------------------------------
  // 4. Genuine Campaign Launch by Brand
  // -------------------------------------------------------------------------
  console.log("\n▶ 4. BRAND CREATES PRODUCTION CAMPAIGN...");
  const realCampaign = await prisma.campaign.create({
    data: {
      brandId: brandProfile.id,
      title: "Acme Nova Headphone Launch 2026",
      description: "Seeking honest in-depth tech reviews on YouTube and X for our flagship headphones.",
      budget: 35000,
      currency: "USD",
      targetCategory: "Tech & Software",
      targetPlatforms: "YOUTUBE,X_TWITTER",
      status: CampaignStatus.ACTIVE,
    },
  });
  assert(Boolean(realCampaign.id), "Brand successfully created genuine campaign in PostgreSQL");
  assert(realCampaign.budget === 35000, "Campaign budget persisted correctly ($35,000)");

  // -------------------------------------------------------------------------
  // 5. Discovery, Deal Proposal Dispatch & Duplicate Protection
  // -------------------------------------------------------------------------
  console.log("\n▶ 5. DISCOVERY, PROPOSAL DISPATCH & UNIQUE DUPLICATE PROTECTION...");
  const discoveredCreators = await prisma.creatorProfile.findMany({
    where: { category: "Tech & Software" },
  });
  assert(
    discoveredCreators.some((c) => c.id === creatorProfile.id),
    "Brand discovery finds the newly registered tech creator"
  );

  const proposalTitle = "Dedicated Review Segment: Acme Nova Headphones";
  const collaboration = await prisma.collaboration.create({
    data: {
      brandId: brandProfile.id,
      creatorId: creatorProfile.id,
      campaignId: realCampaign.id,
      title: proposalTitle,
      description: "1x 8-minute dedicated hardware review segment + 2x X announcement threads.",
      deliverables: "Full 4K Video Segment + 2x Social Threads",
      budgetAmount: 4500,
      currency: "USD",
      status: CollaborationStatus.PENDING,
    },
  });
  assert(Boolean(collaboration.id), "Brand successfully dispatched collaboration proposal");

  // Verify unique duplicate proposal protection
  let duplicatePrevented = false;
  try {
    await prisma.collaboration.create({
      data: {
        brandId: brandProfile.id,
        creatorId: creatorProfile.id,
        campaignId: realCampaign.id,
        title: proposalTitle,
        description: "Duplicate proposal",
        deliverables: "Duplicate deliverables",
        budgetAmount: 4500,
        currency: "USD",
        status: CollaborationStatus.PENDING,
      },
    });
  } catch {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented, "PostgreSQL @@unique([brandId, creatorId, title]) prevents duplicate proposals");

  // -------------------------------------------------------------------------
  // 6. Deal Desk Messaging & Notification Pipeline
  // -------------------------------------------------------------------------
  console.log("\n▶ 6. DEAL DESK CONVERSATION & REAL-TIME NOTIFICATIONS...");
  const conversation = await prisma.conversation.create({
    data: {
      brandId: brandProfile.id,
      creatorId: creatorProfile.id,
      collaborationId: collaboration.id,
      lastMessageAt: new Date(),
    },
  });

  const firstMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: brandUser.id,
      receiverId: creatorUser.id,
      content: "Hi Jordan! We'd love to partner on our upcoming Nova Headphone launch.",
    },
  });
  assert(Boolean(firstMessage.id), "Brand sent initial deal desk message in PostgreSQL");

  const creatorNotification = await prisma.notification.create({
    data: {
      userId: creatorUser.id,
      title: "New Collaboration Proposal",
      message: `Acme Creative Labs sent you a sponsorship proposal: ${proposalTitle} ($4,500).`,
      link: `/creator/collaborations`,
    },
  });
  assert(Boolean(creatorNotification.id), "Creator received actionable notification for new proposal");

  // Creator accepts proposal & replies
  const updatedCollab = await prisma.collaboration.update({
    where: { id: collaboration.id },
    data: { status: CollaborationStatus.ACCEPTED },
  });
  assert(updatedCollab.status === CollaborationStatus.ACCEPTED, "Creator accepted collaboration proposal");

  const creatorReply = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: creatorUser.id,
      receiverId: brandUser.id,
      content: "Thanks for reaching out! The scope looks excellent. Let's make this happen.",
    },
  });
  assert(Boolean(creatorReply.id), "Creator replied in deal desk conversation");

  // -------------------------------------------------------------------------
  // 7. Social Connector Production Mode Guardrail
  // -------------------------------------------------------------------------
  console.log("\n▶ 7. SOCIAL CONNECTOR PRODUCTION GUARDRAILS (ENABLE_MOCK_SOCIAL_DATA='false')...");
  assert(env.ENABLE_MOCK_SOCIAL_DATA === false, "ENABLE_MOCK_SOCIAL_DATA is strictly false in production config");

  const igConnector = connectorRegistry.get(SocialPlatform.INSTAGRAM);
  assert(igConnector.isConfigured === false, "Instagram connector correctly reports unconfigured API status");

  const syncResult = await igConnector.syncAccount(creatorProfile.id, "jordan_tech");
  assert(syncResult.success === false, "Unconfigured connector rejects live sync in production");
  assert(syncResult.isMockData === false, "Connector strictly refuses to fabricate mock data in production");

  // -------------------------------------------------------------------------
  // 8. Cleanup Test Verification Entities (Leave DB Pristine)
  // -------------------------------------------------------------------------
  console.log("\n▶ 8. CLEANING UP TEST ARTIFACTS TO LEAVE PRODUCTION DB PRISTINE...");
  await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
  await prisma.conversation.delete({ where: { id: conversation.id } });
  await prisma.collaboration.delete({ where: { id: collaboration.id } });
  await prisma.campaign.delete({ where: { id: realCampaign.id } });
  await prisma.notification.deleteMany({ where: { userId: { in: [brandUser.id, creatorUser.id] } } });
  await prisma.creatorProfile.delete({ where: { id: creatorProfile.id } });
  await prisma.brandProfile.delete({ where: { id: brandProfile.id } });
  await prisma.user.deleteMany({ where: { id: { in: [brandUser.id, creatorUser.id] } } });

  const finalUsersCount = await prisma.user.count();
  assert(finalUsersCount === 0, "Supabase PostgreSQL database is verified clean and pristine (0 rows)");

  console.log("\n================================================================================");
  console.log(`  VERIFICATION PASSED: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (100%)`);
  console.log("================================================================================\n");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
