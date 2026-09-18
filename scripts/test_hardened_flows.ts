import { PrismaClient, Role, CampaignStatus, CollaborationStatus } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runHardenedFlowsVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING INFURIZZ HARDENED FLOWS VERIFICATION");
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

  const testBrandEmail = "hardened.brand@infurizz.internal";
  const testCreatorEmail = "hardened.creator@infurizz.internal";
  const testCreatorHandle = "hardenedcreator";

  try {
    // -----------------------------------------------------------------------
    // Cleanup prior test artifacts
    // -----------------------------------------------------------------------
    await prisma.notification.deleteMany({
      where: { user: { email: { in: [testBrandEmail, testCreatorEmail] } } },
    });
    await prisma.message.deleteMany({
      where: { sender: { email: { in: [testBrandEmail, testCreatorEmail] } } },
    });
    await prisma.conversation.deleteMany({
      where: { creator: { handle: testCreatorHandle } },
    });
    await prisma.collaboration.deleteMany({
      where: { creator: { handle: testCreatorHandle } },
    });
    await prisma.campaign.deleteMany({
      where: { brand: { user: { email: testBrandEmail } } },
    });
    await prisma.creatorProfile.deleteMany({
      where: { handle: testCreatorHandle },
    });
    await prisma.brandProfile.deleteMany({
      where: { user: { email: testBrandEmail } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [testBrandEmail, testCreatorEmail] } },
    });

    // -----------------------------------------------------------------------
    // Setup test users & profiles
    // -----------------------------------------------------------------------
    console.log("--- 1. SETTING UP TEST USERS ---");
    const brandUser = await prisma.user.create({
      data: {
        email: testBrandEmail,
        name: "Test Hardened Brand Admin",
        role: Role.BRAND,
      },
    });

    const brandProfile = await prisma.brandProfile.create({
      data: {
        userId: brandUser.id,
        companyName: "Hardened Brand Technologies",
        industry: "Hardware & Sound",
        website: "https://hardened.tech",
        location: "Austin, TX",
        budgetRange: "$10,000 - $50,000",
        description: "Leading acoustics and hardware innovators.",
      },
    });

    const creatorUser = await prisma.user.create({
      data: {
        email: testCreatorEmail,
        name: "Devin Stone",
        role: Role.CREATOR,
      },
    });

    const creatorProfile = await prisma.creatorProfile.create({
      data: {
        userId: creatorUser.id,
        handle: testCreatorHandle,
        displayName: "Devin Stone",
        category: "Tech & Audio",
        bio: "Reviewing audiophile hardware & audio gear.",
        totalReach: 750000,
        avgEngagementRate: 5.4,
      },
    });

    assert(Boolean(brandProfile.id && creatorProfile.id), "Brand and Creator profiles initialized");

    // -----------------------------------------------------------------------
    // TEST 2: CAMPAIGN LIFECYCLE & APIS
    // -----------------------------------------------------------------------
    console.log("\n--- 2. CAMPAIGN LIFECYCLE & APIS ---");

    // Create a campaign
    const createCampRes = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandProfile.id,
        title: "Fall Studio Sound Launch",
        description: "Promoting next-gen studio monitors to audio engineers.",
        budget: 25000,
        targetCategory: "Tech & Audio",
      }),
    });
    const createCampData = await createCampRes.json();
    assert(createCampRes.status === 201 && Boolean(createCampData.campaign?.id), "POST /api/campaigns creates campaign", createCampData.campaign?.title);
    const campaignId = createCampData.campaign?.id;

    // Fetch campaign by ID
    const getCampRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`);
    const getCampData = await getCampRes.json();
    assert(getCampRes.status === 200 && getCampData.campaign?.title === "Fall Studio Sound Launch", "GET /api/campaigns/[id] retrieves campaign");

    // Update campaign status to PAUSED
    const pauseCampRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: CampaignStatus.PAUSED }),
    });
    const pauseCampData = await pauseCampRes.json();
    assert(pauseCampRes.status === 200 && pauseCampData.campaign?.status === CampaignStatus.PAUSED, "PATCH /api/campaigns/[id] pauses campaign");

    // Resume campaign status to ACTIVE
    const resumeCampRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: CampaignStatus.ACTIVE }),
    });
    const resumeCampData = await resumeCampRes.json();
    assert(resumeCampRes.status === 200 && resumeCampData.campaign?.status === CampaignStatus.ACTIVE, "PATCH /api/campaigns/[id] activates campaign");

    // -----------------------------------------------------------------------
    // TEST 3: PROPOSAL CREATION WITH CAMPAIGN LINKING
    // -----------------------------------------------------------------------
    console.log("\n--- 3. PROPOSAL CREATION & CAMPAIGN LINKING ---");

    const proposalRes = await fetch(`${BASE_URL}/api/collaborations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandProfile.id,
        creatorId: creatorProfile.id,
        title: "Studio Monitor Long-form Review",
        description: "Hands-on breakdown and acoustic test.",
        deliverables: "1 YouTube Video, 1 X Thread",
        budgetAmount: 4500,
        currency: "USD",
        campaignId: campaignId,
      }),
    });
    const proposalData = await proposalRes.json();
    assert(proposalRes.status === 201 && Boolean(proposalData.collaboration?.id), "POST /api/collaborations creates proposal with campaign link");
    const collabId = proposalData.collaboration?.id;
    const initialConversationId = proposalData.conversationId;

    // Verify database links
    const dbCollab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: { campaign: true, conversations: true },
    });
    assert(dbCollab?.campaignId === campaignId, "Collaboration correctly associated with campaign foreign key");
    assert(Boolean(dbCollab?.conversations?.[0]?.id), "Deal desk conversation thread created for proposal");

    // -----------------------------------------------------------------------
    // TEST 4: FULL COLLABORATION MILESTONE PROGRESSION
    // -----------------------------------------------------------------------
    console.log("\n--- 4. FULL COLLABORATION MILESTONES ---");

    // Step 4.1: Creator accepts proposal
    const acceptRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.ACCEPTED,
        actorRole: "CREATOR",
      }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptData.collaboration?.status === CollaborationStatus.ACCEPTED, "Creator ACCEPTED proposal");

    // Verify notification was sent to Brand
    const brandNotifsAfterAccept = await prisma.notification.findMany({
      where: { userId: brandUser.id },
      orderBy: { createdAt: "desc" },
    });
    assert(
      brandNotifsAfterAccept.some((n) => n.title.includes("Proposal Accepted")),
      "Brand notified when Creator accepted proposal"
    );

    // Verify milestone message logged in conversation
    const messagesAfterAccept = await prisma.message.findMany({
      where: { conversationId: initialConversationId },
      orderBy: { createdAt: "desc" },
    });
    assert(
      messagesAfterAccept.some((m) => m.content.includes("accepted the proposal")),
      "Milestone system message recorded in deal conversation on ACCEPTED"
    );

    // Step 4.2: Creator starts production (IN_PROGRESS)
    const startProdRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.IN_PROGRESS,
        actorRole: "CREATOR",
      }),
    });
    const startProdData = await startProdRes.json();
    assert(startProdRes.status === 200 && startProdData.collaboration?.status === CollaborationStatus.IN_PROGRESS, "Creator transitioned status to IN_PROGRESS");

    // Step 4.3: Brand approves deliverables & marks COMPLETED
    const completeRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.COMPLETED,
        actorRole: "BRAND",
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200 && completeData.collaboration?.status === CollaborationStatus.COMPLETED, "Brand COMPLETED collaboration");

    // Verify notification was sent to Creator
    const creatorNotifsAfterComplete = await prisma.notification.findMany({
      where: { userId: creatorUser.id },
      orderBy: { createdAt: "desc" },
    });
    assert(
      creatorNotifsAfterComplete.some((n) => n.title.includes("Collaboration Completed")),
      "Creator notified when Brand marked collaboration completed"
    );

    // -----------------------------------------------------------------------
    // TEST 5: PROPOSAL CANCELLATION BY BRAND
    // -----------------------------------------------------------------------
    console.log("\n--- 5. PROPOSAL CANCELLATION ---");

    // Create a second proposal
    const proposal2Res = await fetch(`${BASE_URL}/api/collaborations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandProfile.id,
        creatorId: creatorProfile.id,
        title: "Shorts Teaser Sponsorship",
        description: "Quick unboxing highlight.",
        budgetAmount: 1200,
        currency: "USD",
      }),
    });
    const proposal2Data = await proposal2Res.json();
    const collab2Id = proposal2Data.collaboration?.id;

    // Brand cancels the proposal
    const cancelRes = await fetch(`${BASE_URL}/api/collaborations/${collab2Id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.CANCELLED,
        actorRole: "BRAND",
      }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.collaboration?.status === CollaborationStatus.CANCELLED, "Brand CANCELLED pending proposal");

    // Verify creator got cancellation notification
    const creatorNotifsAfterCancel = await prisma.notification.findMany({
      where: { userId: creatorUser.id },
      orderBy: { createdAt: "desc" },
    });
    assert(
      creatorNotifsAfterCancel.some((n) => n.title.includes("Offer Cancelled")),
      "Creator notified when Brand cancelled offer"
    );

    // -----------------------------------------------------------------------
    // TEST 6: BRAND PROFILE EDITING & GET
    // -----------------------------------------------------------------------
    console.log("\n--- 6. BRAND PROFILE EDITING ---");

    const editBrandRes = await fetch(`${BASE_URL}/api/brands/${brandProfile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Hardened Labs Global",
        industry: "Pro Audio & Studio",
        website: "https://hardenedlabs.global",
        location: "San Francisco, CA",
        budgetRange: "$20,000 - $100,000",
        description: "Global sound tech firm producing reference transducers.",
        logoUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400",
      }),
    });
    const editBrandData = await editBrandRes.json();
    assert(editBrandRes.status === 200 && editBrandData.brand?.companyName === "Hardened Labs Global", "PATCH /api/brands/[id] updates companyName");
    assert(editBrandData.brand?.location === "San Francisco, CA", "PATCH /api/brands/[id] updates location");
    assert(editBrandData.brand?.website === "https://hardenedlabs.global", "PATCH /api/brands/[id] updates website");

    const getBrandRes = await fetch(`${BASE_URL}/api/brands/${brandProfile.id}`);
    const getBrandData = await getBrandRes.json();
    assert(getBrandData.brand?.budgetRange === "$20,000 - $100,000", "GET /api/brands/[id] retrieves updated budget range");

    // -----------------------------------------------------------------------
    // TEST 7: NOTIFICATIONS READ/UNREAD APIS
    // -----------------------------------------------------------------------
    console.log("\n--- 7. NOTIFICATIONS INTERACTIONS ---");

    // Fetch unread notifications for Creator
    const creatorNotifs = await prisma.notification.findMany({
      where: { userId: creatorUser.id, isRead: false },
    });
    assert(creatorNotifs.length > 0, "Creator has unread notifications from flows", `${creatorNotifs.length} found`);

    // Mark single notification read
    const singleNotif = creatorNotifs[0];
    const markSingleRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: singleNotif.id }),
    });
    const markSingleData = await markSingleRes.json();
    assert(markSingleRes.status === 200 && markSingleData.notification?.isRead === true, "PATCH /api/notifications marks single notification as read");

    // Mark all read for creator
    const markAllRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true, userId: creatorUser.id }),
    });
    const markAllData = await markAllRes.json();
    assert(markAllRes.status === 200 && markAllData.success === true, "PATCH /api/notifications markAllRead clears unread flags");

    const remainingUnread = await prisma.notification.count({
      where: { userId: creatorUser.id, isRead: false },
    });
    assert(remainingUnread === 0, "All notifications confirmed read in database");

    // -----------------------------------------------------------------------
    // TEST 8: CAMPAIGN DELETION WITH SAFE COLLABORATION NULLIFY
    // -----------------------------------------------------------------------
    console.log("\n--- 8. CAMPAIGN DELETION CASCADE SAFETY ---");

    const deleteCampRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`, {
      method: "DELETE",
    });
    const deleteCampData = await deleteCampRes.json();
    assert(deleteCampRes.status === 200 && deleteCampData.success === true, "DELETE /api/campaigns/[id] deletes campaign");

    // Verify campaign is deleted from DB
    const campInDb = await prisma.campaign.findUnique({ where: { id: campaignId } });
    assert(campInDb === null, "Campaign no longer exists in database");

    // Verify collaboration is preserved with campaignId = null
    const collabAfterCampDelete = await prisma.collaboration.findUnique({ where: { id: collabId } });
    assert(collabAfterCampDelete !== null && collabAfterCampDelete.campaignId === null, "Collaboration preserved with campaignId set to null");

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    console.log("\n--- 9. CLEANUP ---");
    await prisma.notification.deleteMany({
      where: { user: { email: { in: [testBrandEmail, testCreatorEmail] } } },
    });
    await prisma.message.deleteMany({
      where: { sender: { email: { in: [testBrandEmail, testCreatorEmail] } } },
    });
    await prisma.conversation.deleteMany({
      where: { creator: { handle: testCreatorHandle } },
    });
    await prisma.collaboration.deleteMany({
      where: { creator: { handle: testCreatorHandle } },
    });
    await prisma.creatorProfile.deleteMany({
      where: { handle: testCreatorHandle },
    });
    await prisma.brandProfile.deleteMany({
      where: { user: { email: testBrandEmail } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [testBrandEmail, testCreatorEmail] } },
    });
    console.log("  🧹 Test data cleaned up successfully.");

    // Summary
    console.log("\n=================================================");
    console.log(`🎯 HARDENED FLOW VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Exception during hardened flows verification:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHardenedFlowsVerification();
