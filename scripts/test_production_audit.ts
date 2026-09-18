import { PrismaClient, Role, CollaborationStatus } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runProductionAuditVerification() {
  console.log("=================================================");
  console.log("🔍 STARTING INFURIZZ PRODUCTION-READINESS AUDIT");
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

  const auditBrandEmail = "audit.brand@infurizz.internal";
  const auditCreatorEmail = "audit.creator@infurizz.internal";
  const auditCreatorHandle = "auditcreator";

  try {
    // -----------------------------------------------------------------------
    // Cleanup prior run
    // -----------------------------------------------------------------------
    await prisma.notification.deleteMany({
      where: { user: { email: { in: [auditBrandEmail, auditCreatorEmail] } } },
    });
    await prisma.message.deleteMany({
      where: { sender: { email: { in: [auditBrandEmail, auditCreatorEmail] } } },
    });
    await prisma.conversation.deleteMany({
      where: { creator: { handle: auditCreatorHandle } },
    });
    await prisma.collaboration.deleteMany({
      where: { creator: { handle: auditCreatorHandle } },
    });
    await prisma.campaign.deleteMany({
      where: { brand: { user: { email: auditBrandEmail } } },
    });
    await prisma.creatorProfile.deleteMany({
      where: { handle: auditCreatorHandle },
    });
    await prisma.brandProfile.deleteMany({
      where: { user: { email: auditBrandEmail } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [auditBrandEmail, auditCreatorEmail] } },
    });

    // -----------------------------------------------------------------------
    // 1. AUTHENTICATION EDGE CASES & SESSION PERSISTENCE
    // -----------------------------------------------------------------------
    console.log("--- 1. AUTHENTICATION & LOGIN NORMALIZATION ---");

    // Login with uppercase / un-trimmed email
    const loginRes = await fetch(`${BASE_URL}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        email: "  AUDIT.BRAND@INFURIZZ.INTERNAL  ",
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.user?.email === "audit.brand@infurizz.internal", "Login normalizes email to trimmed lowercase");

    const brandUserId = loginData.user.id;

    // Create Brand Profile for this user
    const brandProfile = await prisma.brandProfile.create({
      data: {
        userId: brandUserId,
        companyName: "Audit Acoustics Lab",
        industry: "Hardware",
        website: "https://auditacoustics.internal",
        budgetRange: "$10,000 - $50,000",
      },
    });

    // Create Creator user and profile
    const creatorUser = await prisma.user.create({
      data: {
        email: auditCreatorEmail,
        name: "Audit Creator",
        role: Role.CREATOR,
      },
    });

    const creatorProfile = await prisma.creatorProfile.create({
      data: {
        userId: creatorUser.id,
        handle: auditCreatorHandle,
        displayName: "Audit Creator Pro",
        category: "Tech & Software",
        totalReach: 320000,
        avgEngagementRate: 5.1,
      },
    });

    assert(Boolean(brandProfile.id && creatorProfile.id), "Audit profiles persisted in SQLite");

    // -----------------------------------------------------------------------
    // 2. MISSING & INVALID IDS REJECTION
    // -----------------------------------------------------------------------
    console.log("\n--- 2. MISSING & INVALID ID REJECTION ---");

    // 2.1 POST /api/collaborations with non-existent brandId
    const badBrandCollabRes = await fetch(`${BASE_URL}/api/collaborations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: "non_existent_brand_id",
        creatorId: creatorProfile.id,
        title: "Test Bad Brand Collab",
        description: "Testing non-existent brand",
      }),
    });
    assert(badBrandCollabRes.status === 404, "POST /api/collaborations rejects non-existent brandId with 404");

    // 2.2 POST /api/collaborations with non-existent creatorId
    const badCreatorCollabRes = await fetch(`${BASE_URL}/api/collaborations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandProfile.id,
        creatorId: "non_existent_creator_id",
        title: "Test Bad Creator Collab",
        description: "Testing non-existent creator",
      }),
    });
    assert(badCreatorCollabRes.status === 404, "POST /api/collaborations rejects non-existent creatorId with 404");

    // 2.3 POST /api/campaigns with non-existent brandId
    const badCampRes = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: "non_existent_brand_id",
        title: "Bad Campaign",
        description: "Description long enough for schema validation",
      }),
    });
    assert(badCampRes.status === 404, "POST /api/campaigns rejects non-existent brandId with 404");

    // 2.4 POST /api/messages with non-existent senderId
    const badMsgSenderRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "non_existent_sender_id",
        receiverId: creatorUser.id,
        content: "Hello there",
      }),
    });
    assert(badMsgSenderRes.status === 404, "POST /api/messages rejects non-existent senderId with 404");

    // 2.5 POST /api/messages with non-existent conversationId
    const badMsgConvRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: "non_existent_conversation_id",
        senderId: brandUserId,
        receiverId: creatorUser.id,
        content: "Hello there",
      }),
    });
    assert(badMsgConvRes.status === 404, "POST /api/messages rejects non-existent conversationId with 404");

    // 2.6 POST /api/social-accounts with non-existent creatorId
    const badSocialRes = await fetch(`${BASE_URL}/api/social-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorId: "non_existent_creator_id",
        platform: "YOUTUBE",
        username: "fakeuser",
      }),
    });
    assert(badSocialRes.status === 404, "POST /api/social-accounts rejects non-existent creatorId with 404");

    // 2.7 PATCH /api/notifications with non-existent notificationId
    const badNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId: "non_existent_notif_id",
      }),
    });
    assert(badNotifRes.status === 404, "PATCH /api/notifications rejects non-existent notificationId with 404");

    // -----------------------------------------------------------------------
    // 3. DUPLICATE PROPOSAL REJECTION
    // -----------------------------------------------------------------------
    console.log("\n--- 3. DUPLICATE PROPOSAL REJECTION ---");

    // Create initial proposal
    const validCollabRes = await fetch(`${BASE_URL}/api/collaborations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandProfile.id,
        creatorId: creatorProfile.id,
        title: "Acoustic Audit Partnership",
        description: "Studio analysis and hardware tests.",
        deliverables: "1 Video",
        budgetAmount: 3000,
        currency: "USD",
      }),
    });
    const validCollabData = await validCollabRes.json();
    assert(validCollabRes.status === 201 && Boolean(validCollabData.collaboration?.id), "Initial proposal created successfully");
    const collabId = validCollabData.collaboration?.id;

    // Attempt to submit identical duplicate proposal
    const dupCollabRes = await fetch(`${BASE_URL}/api/collaborations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandProfile.id,
        creatorId: creatorProfile.id,
        title: "Acoustic Audit Partnership",
        description: "Studio analysis and hardware tests duplicate attempt.",
        deliverables: "1 Video",
        budgetAmount: 3000,
        currency: "USD",
      }),
    });
    const dupCollabData = await dupCollabRes.json();
    assert(dupCollabRes.status === 409, "Duplicate pending proposal rejected with 409 Conflict", dupCollabData.error);

    // -----------------------------------------------------------------------
    // 4. INVALID COLLABORATION STATUS TRANSITIONS
    // -----------------------------------------------------------------------
    console.log("\n--- 4. COLLABORATION STATE MACHINE VALIDATION ---");

    // 4.1 Valid transition: PENDING -> ACCEPTED
    const acceptRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.ACCEPTED,
        actorRole: "CREATOR",
      }),
    });
    assert(acceptRes.status === 200, "Valid transition: PENDING -> ACCEPTED allowed");

    // 4.2 Invalid transition: ACCEPTED -> DECLINED (cannot decline an already accepted deal)
    const invalidDeclineRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.DECLINED,
        actorRole: "CREATOR",
      }),
    });
    assert(invalidDeclineRes.status === 400, "Invalid transition: ACCEPTED -> DECLINED rejected with 400");

    // 4.3 Valid transition: ACCEPTED -> IN_PROGRESS
    const inProgressRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.IN_PROGRESS,
        actorRole: "CREATOR",
      }),
    });
    assert(inProgressRes.status === 200, "Valid transition: ACCEPTED -> IN_PROGRESS allowed");

    // 4.4 Valid transition: IN_PROGRESS -> COMPLETED
    const completeRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.COMPLETED,
        actorRole: "BRAND",
      }),
    });
    assert(completeRes.status === 200, "Valid transition: IN_PROGRESS -> COMPLETED allowed");

    // 4.5 Invalid transition: COMPLETED -> PENDING (terminal state cannot be reverted)
    const revertRes = await fetch(`${BASE_URL}/api/collaborations/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: CollaborationStatus.PENDING,
        actorRole: "BRAND",
      }),
    });
    assert(revertRes.status === 400, "Terminal state enforcement: COMPLETED -> PENDING rejected with 400");

    // -----------------------------------------------------------------------
    // 5. CAMPAIGN LIFECYCLE EDGE CASES (NEGATIVE BUDGET)
    // -----------------------------------------------------------------------
    console.log("\n--- 5. CAMPAIGN LIFECYCLE EDGE CASES ---");

    const createCampRes = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandProfile.id,
        title: "Audit Sound Initiative",
        description: "Checking hardware transducers in the wild.",
        budget: 12000,
      }),
    });
    const createCampData = await createCampRes.json();
    const testCampId = createCampData.campaign?.id;
    assert(Boolean(testCampId), "Campaign created for lifecycle edge testing");

    // Attempt negative budget update
    const negBudgetRes = await fetch(`${BASE_URL}/api/campaigns/${testCampId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budget: -5000,
      }),
    });
    assert(negBudgetRes.status === 400, "PATCH /api/campaigns/[id] rejects negative budget with 400");

    // Clean up test campaign
    await fetch(`${BASE_URL}/api/campaigns/${testCampId}`, { method: "DELETE" });

    // -----------------------------------------------------------------------
    // 6. EMPTY / WHITESPACE MESSAGE REJECTION
    // -----------------------------------------------------------------------
    console.log("\n--- 6. MESSAGE VALIDATION & EMPTY STATES ---");

    const emptyMsgRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: brandUserId,
        receiverId: creatorUser.id,
        content: "     ",
      }),
    });
    assert(emptyMsgRes.status === 400, "POST /api/messages rejects whitespace-only message with 400");

    // -----------------------------------------------------------------------
    // 7. CLEANUP
    // -----------------------------------------------------------------------
    console.log("\n--- 7. CLEANUP ---");
    await prisma.notification.deleteMany({
      where: { user: { email: { in: [auditBrandEmail, auditCreatorEmail] } } },
    });
    await prisma.message.deleteMany({
      where: { sender: { email: { in: [auditBrandEmail, auditCreatorEmail] } } },
    });
    await prisma.conversation.deleteMany({
      where: { creator: { handle: auditCreatorHandle } },
    });
    await prisma.collaboration.deleteMany({
      where: { creator: { handle: auditCreatorHandle } },
    });
    await prisma.campaign.deleteMany({
      where: { brand: { user: { email: auditBrandEmail } } },
    });
    await prisma.creatorProfile.deleteMany({
      where: { handle: auditCreatorHandle },
    });
    await prisma.brandProfile.deleteMany({
      where: { user: { email: auditBrandEmail } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [auditBrandEmail, auditCreatorEmail] } },
    });
    console.log("  🧹 Audit test data cleaned up successfully.");

    // Summary
    console.log("\n=================================================");
    console.log(`🎯 PRODUCTION AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Exception during production audit verification:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runProductionAuditVerification();
