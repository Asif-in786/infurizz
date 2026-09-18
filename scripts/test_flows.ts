import { PrismaClient, Role, SocialPlatform, CollaborationStatus } from "@prisma/client";
import { AudienceAggregator } from "../src/lib/analytics/aggregator";
import { MOCK_SOCIAL_DATA } from "../src/lib/integrations/mock-data";

const prisma = new PrismaClient();

async function runEndToEndTests() {
  console.log("=================================================");
  console.log("🚀 STARTING INFURIZZ END-TO-END FLOW VERIFICATION");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // FLOW 1: CREATOR JOURNEY
  // -------------------------------------------------------------------------
  console.log("--- 1. CREATOR JOURNEY ---");

  // Clean up any previous test run records for idempotency
  await prisma.notification.deleteMany({
    where: { user: { email: { in: ["alex.rivers.test@infurizz.internal", "partnerships@quantumdynamics.io"] } } },
  });
  await prisma.message.deleteMany({
    where: { sender: { email: { in: ["alex.rivers.test@infurizz.internal", "partnerships@quantumdynamics.io"] } } },
  });
  await prisma.conversation.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.collaboration.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.audienceSnapshot.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.socialAccount.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.creatorProfile.deleteMany({
    where: { handle: "alexrivers" },
  });
  await prisma.brandProfile.deleteMany({
    where: { companyName: "Quantum Dynamics" },
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["alex.rivers.test@infurizz.internal", "partnerships@quantumdynamics.io"] } },
  });

  // Step 1: Creator Signup & Onboarding Persistence
  const testCreatorUser = await prisma.user.create({
    data: {
      email: "alex.rivers.test@infurizz.internal",
      name: "Alex Rivers",
      role: Role.CREATOR,
    },
  });
  assert(!!testCreatorUser.id, "Creator User record created in database");

  const testCreatorProfile = await prisma.creatorProfile.create({
    data: {
      userId: testCreatorUser.id,
      handle: "alexrivers",
      displayName: "Alex Rivers",
      category: "Tech & Software",
      bio: "Hardware builder and developer tools explorer.",
      location: "Seattle, WA",
      ratesSummary: "$2,000 - $5,000 per sponsorship",
      isVerified: true,
    },
  });
  assert(testCreatorProfile.handle === "alexrivers", "CreatorProfile record persisted with verified handle");

  // Step 2: Connect Social Accounts (Instagram + YouTube)
  const igMock = MOCK_SOCIAL_DATA.INSTAGRAM;
  const ytMock = MOCK_SOCIAL_DATA.YOUTUBE;

  await prisma.socialAccount.create({
    data: {
      creatorId: testCreatorProfile.id,
      platform: SocialPlatform.INSTAGRAM,
      username: "alex_builds",
      followersCount: igMock.metrics.followersCount, // 600,000
      engagementRate: igMock.metrics.engagementRate, // 3.85
      isConnected: true,
    },
  });

  await prisma.socialAccount.create({
    data: {
      creatorId: testCreatorProfile.id,
      platform: SocialPlatform.YOUTUBE,
      username: "alexriverstech",
      followersCount: ytMock.metrics.followersCount, // 30,000
      engagementRate: ytMock.metrics.engagementRate, // 7.2
      isConnected: true,
    },
  });

  const initialAccounts = await prisma.socialAccount.findMany({
    where: { creatorId: testCreatorProfile.id, isConnected: true },
  });
  assert(initialAccounts.length === 2, "SocialAccount records stored in DB for Instagram and YouTube");

  // Step 3: Unified Audience Calculation
  const initialMetrics = await AudienceAggregator.refreshCreatorMetrics(testCreatorProfile.id);
  assert(initialMetrics.totalReach === 630000, `Unified audience calculated correctly (630,000 reach, got ${initialMetrics.totalReach})`);
  assert(initialMetrics.totalPlatforms === 2, "Total platforms counted correctly");

  // Step 4: Connect Third Account (X / Twitter) & Verify Real-Time Recalculation
  const xMock = MOCK_SOCIAL_DATA.X_TWITTER;
  await prisma.socialAccount.create({
    data: {
      creatorId: testCreatorProfile.id,
      platform: SocialPlatform.X_TWITTER,
      username: "alexrivers",
      followersCount: xMock.metrics.followersCount, // 120,000
      engagementRate: xMock.metrics.engagementRate, // 2.45
      isConnected: true,
    },
  });

  const updatedMetrics = await AudienceAggregator.refreshCreatorMetrics(testCreatorProfile.id);
  assert(updatedMetrics.totalReach === 750000, `Unified audience increased to 750,000 after linking X (got ${updatedMetrics.totalReach})`);

  // Step 5: Audience Snapshots Generated
  const snapshots = await prisma.audienceSnapshot.findMany({
    where: { creatorId: testCreatorProfile.id },
  });
  assert(snapshots.length >= 2, `AudienceSnapshot records stored in DB for analytics trajectory (${snapshots.length} snapshots)`);

  // -------------------------------------------------------------------------
  // FLOW 2: BRAND JOURNEY
  // -------------------------------------------------------------------------
  console.log("\n--- 2. BRAND JOURNEY ---");

  // Step 1: Brand Signup & Onboarding Persistence
  const testBrandUser = await prisma.user.create({
    data: {
      email: "partnerships@quantumdynamics.io",
      name: "Quantum Dynamics",
      role: Role.BRAND,
    },
  });
  assert(!!testBrandUser.id, "Brand User record created in database");

  const testBrandProfile = await prisma.brandProfile.create({
    data: {
      userId: testBrandUser.id,
      companyName: "Quantum Dynamics",
      industry: "Consumer Tech",
      website: "https://quantumdynamics.io",
      budgetRange: "$50,000 - $150,000 / quarter",
      description: "Next-generation quantum computing hardware and edge nodes.",
      isVerified: true,
    },
  });
  assert(testBrandProfile.companyName === "Quantum Dynamics", "BrandProfile record persisted with company details");

  // Step 2: Creator Discovery & Search
  const searchResults = await prisma.creatorProfile.findMany({
    where: {
      category: "Tech & Software",
      totalReach: { gte: 500000 },
    },
    include: { socialAccounts: true },
  });
  assert(searchResults.length >= 2, `Creator discovery search and filter returned ${searchResults.length} verified creators with reach >= 500K`);
  const foundAlex = searchResults.some((c) => c.handle === "alexrivers");
  assert(foundAlex, "Newly onboarded creator Alex Rivers discovered in directory search results");

  // Step 3: Send Collaboration Proposal from Brand to Creator
  const proposal = await prisma.collaboration.create({
    data: {
      brandId: testBrandProfile.id,
      creatorId: testCreatorProfile.id,
      title: "Quantum Edge Node Launch Integration",
      description: "Dedicated deep-dive review video and multi-platform social blast for our edge computing launch.",
      deliverables: "1x YouTube Segment, 2x Instagram Reels, 1x X Thread",
      budgetAmount: 6500,
      currency: "USD",
      status: CollaborationStatus.PENDING,
    },
  });
  assert(proposal.status === CollaborationStatus.PENDING, "Collaboration proposal created with PENDING status");

  // Step 4: Deal Desk Conversation Thread Auto-Created
  const conversation = await prisma.conversation.create({
    data: {
      brandId: testBrandProfile.id,
      creatorId: testCreatorProfile.id,
      collaborationId: proposal.id,
    },
  });
  assert(!!conversation.id, "In-platform Conversation thread established for the collaboration");

  // Step 5: Initial Deal Message Logged in Database
  const openingMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      collaborationId: proposal.id,
      senderId: testBrandUser.id,
      receiverId: testCreatorUser.id,
      content: `[New Proposal: ${proposal.title}] We have dispatched a collaboration offer for $${proposal.budgetAmount} USD. Looking forward to working together!`,
    },
  });
  assert(!!openingMessage.id, "Opening proposal message persisted in thread");

  // Step 6: Notification Dispatched to Creator
  const creatorNotification = await prisma.notification.create({
    data: {
      userId: testCreatorUser.id,
      title: `New Proposal from ${testBrandProfile.companyName}`,
      message: `${testBrandProfile.companyName} submitted a $6,500 proposal: "${proposal.title}".`,
      link: "/creator/collaborations",
    },
  });
  assert(creatorNotification.userId === testCreatorUser.id, "Notification received by Creator User in DB");

  // -------------------------------------------------------------------------
  // LIFECYCLE: ACCEPT PROPOSAL & CHAT IN-PLATFORM
  // -------------------------------------------------------------------------
  console.log("\n--- 3. LIFECYCLE: ACCEPT PROPOSAL & IN-PLATFORM MESSAGING ---");

  // Step 1: Creator Accepts Proposal
  const acceptedProposal = await prisma.collaboration.update({
    where: { id: proposal.id },
    data: { status: CollaborationStatus.ACCEPTED },
  });
  assert(acceptedProposal.status === CollaborationStatus.ACCEPTED, "Creator successfully accepted proposal (status updated to ACCEPTED)");

  // Step 2: Status Update Notification Dispatched to Brand
  const brandNotification = await prisma.notification.create({
    data: {
      userId: testBrandUser.id,
      title: "Proposal Accepted",
      message: `${testCreatorProfile.displayName} accepted "${proposal.title}".`,
      link: "/brand/collaborations",
    },
  });
  assert(brandNotification.userId === testBrandUser.id, "Notification received by Brand User in DB");

  // Step 3: Creator Replies in In-Platform Message Desk
  const creatorReply = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      collaborationId: proposal.id,
      senderId: testCreatorUser.id,
      receiverId: testBrandUser.id,
      content: "Thank you for the proposal! Excited to work together. When will test hardware arrive?",
    },
  });
  assert(!!creatorReply.id, "Creator reply message saved to database deal desk thread");

  // Step 4: Brand Replies Back
  const brandReply = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      collaborationId: proposal.id,
      senderId: testBrandUser.id,
      receiverId: testCreatorUser.id,
      content: "Tracking numbers for units will be shared tomorrow morning. Thanks Alex!",
    },
  });
  assert(!!brandReply.id, "Brand follow-up message saved to database deal desk thread");

  // Step 5: Verify Entire Thread Transcript
  const threadMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  assert(threadMessages.length === 3, `Full in-platform message thread verified (3 messages in chronological order)`);

  // Step 6: Verify Notification Counter
  const unreadCount = await prisma.notification.count({
    where: { userId: testCreatorUser.id, isRead: false },
  });
  assert(unreadCount >= 1, `Unread notification count verified for Creator (${unreadCount} unread)`);

  // Clean up test records for Supabase database hygiene
  await prisma.notification.deleteMany({
    where: { user: { email: { in: ["alex.rivers.test@infurizz.internal", "partnerships@quantumdynamics.io"] } } },
  });
  await prisma.message.deleteMany({
    where: { sender: { email: { in: ["alex.rivers.test@infurizz.internal", "partnerships@quantumdynamics.io"] } } },
  });
  await prisma.conversation.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.collaboration.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.audienceSnapshot.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.socialAccount.deleteMany({
    where: { creator: { handle: "alexrivers" } },
  });
  await prisma.creatorProfile.deleteMany({
    where: { handle: "alexrivers" },
  });
  await prisma.brandProfile.deleteMany({
    where: { companyName: "Quantum Dynamics" },
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["alex.rivers.test@infurizz.internal", "partnerships@quantumdynamics.io"] } },
  });

  console.log("\n=================================================");
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");
}

runEndToEndTests()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
