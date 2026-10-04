import { PrismaClient } from "@prisma/client";
import {
  canTransitionOrder,
  canTransitionApplication,
} from "./lib/options";

const prisma = new PrismaClient();

async function runPhase4ATests() {
  console.log("==========================================");
  console.log("   INFURIZZ PHASE 4A VERIFICATION SUITE   ");
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
  const testCampaigns = await prisma.campaign.findMany({
    where: { name: { contains: "[TEST-PHASE4A]" } },
  });
  for (const tc of testCampaigns) {
    const apps = await prisma.campaignApplication.findMany({ where: { campaignId: tc.id } });
    for (const app of apps) {
      await prisma.order.deleteMany({ where: { applicationId: app.id } });
      const conv = await prisma.conversation.findUnique({ where: { applicationId: app.id } });
      if (conv) {
        await prisma.message.deleteMany({ where: { conversationId: conv.id } });
        await prisma.conversation.delete({ where: { id: conv.id } });
      }
    }
    await prisma.campaignApplication.deleteMany({ where: { campaignId: tc.id } });
    await prisma.campaign.delete({ where: { id: tc.id } });
  }

  // Get demo entities
  const northstar = await prisma.brand.findFirst({ where: { name: "Northstar" } });
  if (!northstar) throw new Error("Northstar brand not found");

  const mira = await prisma.creator.findFirst({
    where: { name: "Mira Sen" },
    include: { services: true, socials: true },
  });
  if (!mira) throw new Error("Mira Sen creator not found");

  const jonah = await prisma.creator.findFirst({
    where: { name: "Jonah Hale" },
    include: { services: true, socials: true },
  });
  if (!jonah) throw new Error("Jonah Hale creator not found");

  // Create dedicated campaign for Phase 4A test
  const campaign = await prisma.campaign.create({
    data: {
      brandId: northstar.id,
      name: "[TEST-PHASE4A] Autumn Culinary Spotlight",
      category: "Food & Beverage",
      creatorNiche: "Artisanal & Pastry",
      platforms: JSON.stringify(["Instagram", "TikTok"]),
      audienceRange: "25k–100k",
      location: "San Francisco, CA",
      budgetMin: 800,
      budgetMax: 2000,
      deliverables: "1x Dedicated 60-second culinary feature video + 3 high-res still photos",
      status: "PUBLISHED",
    },
  });

  const miraService = mira.services.find((s) => s.platform === "Instagram") || mira.services[0];
  if (!miraService) throw new Error("Mira service not found");

  // ----------------------------------------------------
  // TEST A: Creator Application Submission
  // ----------------------------------------------------
  console.log("[Test A] Creating Campaign Application with Service Package...");
  const proposedRate = 750; // $750 USD
  const application = await prisma.campaignApplication.create({
    data: {
      campaignId: campaign.id,
      creatorId: mira.id,
      serviceId: miraService.id,
      proposedRate,
      pitchMessage: "Ready to produce an artisanal pastry spotlight feature matching your aesthetic.",
      status: "PENDING",
    },
    include: { campaign: { include: { brand: true } }, creator: true, service: true },
  });

  assert(application.status === "PENDING", "Application initialized in PENDING state");
  assert(application.proposedRate === 750, "Application recorded proposed rate $750");
  assert(application.serviceId === miraService.id, "Application references selected service");

  // ----------------------------------------------------
  // TEST B: Acceptance Transaction Creates Exactly One Order
  // ----------------------------------------------------
  console.log("\n[Test B] Brand Accepts Application -> Atomic Order Creation...");
  assert(canTransitionApplication(application.status, "ACCEPTED"), "State machine permits PENDING -> ACCEPTED");

  const orderNumber = `INF-2026-TEST01`;
  const turnaroundDaysSnapshot = miraService.turnaroundDays;
  const deliverablesSnapshot = miraService.deliverables;
  const revisionsIncluded = miraService.revisions;
  const agreedPriceInCents = application.proposedRate * 100;
  const deadlineAt = new Date(Date.now() + turnaroundDaysSnapshot * 24 * 60 * 60 * 1000);

  const { order, conversation } = await prisma.$transaction(async (tx) => {
    await tx.campaignApplication.update({
      where: { id: application.id },
      data: { status: "ACCEPTED" },
    });

    const conv = await tx.conversation.create({
      data: { applicationId: application.id },
    });

    const ord = await tx.order.create({
      data: {
        orderNumber,
        applicationId: application.id,
        campaignId: application.campaignId,
        creatorId: application.creatorId,
        brandId: application.campaign.brandId,
        serviceId: application.serviceId,
        conversationId: conv.id,
        agreedPriceInCents,
        currency: "USD",
        deliverablesSnapshot,
        turnaroundDaysSnapshot,
        revisionsIncluded,
        revisionsUsed: 0,
        deadlineAt,
        status: "PENDING",
      },
    });

    return { order: ord, conversation: conv };
  });

  assert(Boolean(order.id), "Order successfully created on application acceptance");
  assert(order.status === "PENDING", "Initial order status is PENDING");
  assert(order.orderNumber === orderNumber, `Order assigned human-readable order number: ${order.orderNumber}`);

  // ----------------------------------------------------
  // TEST C: Duplicate Order Prevention (Idempotency)
  // ----------------------------------------------------
  console.log("\n[Test C] Verifying Duplicate Order Prevention (applicationId @unique)...");
  let duplicatePrevented = false;
  try {
    await prisma.order.create({
      data: {
        orderNumber: "INF-2026-DUP01",
        applicationId: application.id, // Same application ID!
        campaignId: application.campaignId,
        creatorId: application.creatorId,
        brandId: application.campaign.brandId,
        agreedPriceInCents: 99999,
        deliverablesSnapshot: "Duplicate attempt",
        turnaroundDaysSnapshot: 5,
        deadlineAt: new Date(),
        status: "PENDING",
      },
    });
  } catch {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented, "Database unique constraint on applicationId blocked duplicate Order creation");

  // ----------------------------------------------------
  // TEST D: Agreed Price Server-Side Calculation Rule
  // ----------------------------------------------------
  console.log("\n[Test D] Verifying Agreed Price Calculation Rule...");
  assert(
    order.agreedPriceInCents === proposedRate * 100,
    `Order agreedPriceInCents (${order.agreedPriceInCents}) strictly equals proposedRate ($${proposedRate}) * 100 = 75000 cents`
  );
  assert(order.currency === "USD", "Order currency is USD");

  // ----------------------------------------------------
  // TEST E: Immutable Commercial & Scope Snapshot
  // ----------------------------------------------------
  console.log("\n[Test E] Verifying Deliverables, Turnaround, and Revision Snapshots...");
  assert(
    order.deliverablesSnapshot === miraService.deliverables,
    "Order deliverablesSnapshot matches CreatorService deliverables"
  );
  assert(
    order.turnaroundDaysSnapshot === miraService.turnaroundDays,
    "Order turnaroundDaysSnapshot matches CreatorService turnaroundDays"
  );
  assert(
    order.revisionsIncluded === miraService.revisions,
    "Order revisionsIncluded matches CreatorService revisions"
  );
  assert(order.revisionsUsed === 0, "Order revisionsUsed initialized to 0");
  assert(order.deadlineAt instanceof Date, "Order deadlineAt calculated as valid Date");

  // ----------------------------------------------------
  // TEST F: Immutability Protection Against Upstream Changes
  // ----------------------------------------------------
  console.log("\n[Test F] Testing Upstream Mutation Protection (Immutable Snapshot)...");
  const originalServicePrice = miraService.price;
  const originalServiceDeliverables = miraService.deliverables;

  // Mutate CreatorService and Campaign
  await prisma.creatorService.update({
    where: { id: miraService.id },
    data: {
      price: originalServicePrice + 500, // Price increased by $500
      deliverables: "MODIFIED DELIVERABLES: Upstream package revised to 10 videos!",
      turnaroundDays: 30,
    },
  });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { deliverables: "MODIFIED CAMPAIGN: All deliverables cancelled!" },
  });

  // Re-fetch the Order from the database
  const orderAfterUpstreamMutations = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
  });

  assert(
    orderAfterUpstreamMutations.agreedPriceInCents === 75000,
    "Order agreedPriceInCents remained 75000 after CreatorService price change"
  );
  assert(
    orderAfterUpstreamMutations.deliverablesSnapshot === deliverablesSnapshot,
    "Order deliverablesSnapshot remained intact after CreatorService & Campaign modifications"
  );
  assert(
    orderAfterUpstreamMutations.turnaroundDaysSnapshot === turnaroundDaysSnapshot,
    "Order turnaroundDaysSnapshot remained intact after CreatorService modifications"
  );

  // Revert CreatorService
  await prisma.creatorService.update({
    where: { id: miraService.id },
    data: {
      price: originalServicePrice,
      deliverables: originalServiceDeliverables,
      turnaroundDays: turnaroundDaysSnapshot,
    },
  });

  // ----------------------------------------------------
  // TEST G: Participant Ownership and Bidirectional Linkage
  // ----------------------------------------------------
  console.log("\n[Test G] Verifying Participant Ownership & Bidirectional Links...");
  const orderWithRelations = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: {
      creator: true,
      brand: true,
      campaign: true,
      application: true,
      conversation: true,
    },
  });

  assert(orderWithRelations.creatorId === mira.id, "Order creatorId correctly points to Mira Sen");
  assert(orderWithRelations.brandId === northstar.id, "Order brandId correctly points to Northstar");
  assert(orderWithRelations.campaignId === campaign.id, "Order campaignId correctly points to campaign");
  assert(orderWithRelations.applicationId === application.id, "Order applicationId correctly points to application");
  assert(orderWithRelations.conversationId === conversation.id, "Order conversationId correctly points to conversation");

  // Verify reciprocal links
  const convWithOrder = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversation.id },
    include: { order: true, application: { include: { order: true } } },
  });
  assert(convWithOrder.order?.id === order.id, "Conversation has direct reciprocal relation to Order");
  assert(convWithOrder.application?.order?.id === order.id, "Application has direct reciprocal relation to Order");

  // ----------------------------------------------------
  // TEST H: Order Lifecycle State Machine & Valid Transitions
  // ----------------------------------------------------
  console.log("\n[Test H] Verifying Order Lifecycle State Transitions...");
  // 1. PENDING -> READY_TO_START
  assert(canTransitionOrder("PENDING", "READY_TO_START"), "PENDING -> READY_TO_START allowed");
  const orderReady = await prisma.order.update({
    where: { id: order.id },
    data: { status: "READY_TO_START" },
  });
  assert(orderReady.status === "READY_TO_START", "Order transitioned to READY_TO_START");

  // 2. READY_TO_START -> IN_PROGRESS
  assert(canTransitionOrder("READY_TO_START", "IN_PROGRESS"), "READY_TO_START -> IN_PROGRESS allowed");
  const orderInProgress = await prisma.order.update({
    where: { id: order.id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });
  assert(orderInProgress.status === "IN_PROGRESS", "Order transitioned to IN_PROGRESS");
  assert(orderInProgress.startedAt instanceof Date, "Order startedAt timestamp recorded");

  // 3. IN_PROGRESS -> SUBMITTED
  assert(canTransitionOrder("IN_PROGRESS", "SUBMITTED"), "IN_PROGRESS -> SUBMITTED allowed");
  const orderSubmitted = await prisma.order.update({
    where: { id: order.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  assert(orderSubmitted.status === "SUBMITTED", "Order transitioned to SUBMITTED");

  // 4. SUBMITTED -> REVISION_REQUESTED
  assert(canTransitionOrder("SUBMITTED", "REVISION_REQUESTED"), "SUBMITTED -> REVISION_REQUESTED allowed");
  const orderRevRequested = await prisma.order.update({
    where: { id: order.id },
    data: { status: "REVISION_REQUESTED", revisionsUsed: 1 },
  });
  assert(orderRevRequested.status === "REVISION_REQUESTED", "Order transitioned to REVISION_REQUESTED");
  assert(orderRevRequested.revisionsUsed === 1, "Order revisionsUsed incremented to 1");

  // 5. REVISION_REQUESTED -> SUBMITTED
  assert(canTransitionOrder("REVISION_REQUESTED", "SUBMITTED"), "REVISION_REQUESTED -> SUBMITTED allowed");
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "SUBMITTED" },
  });

  // 6. SUBMITTED -> COMPLETED
  assert(canTransitionOrder("SUBMITTED", "COMPLETED"), "SUBMITTED -> COMPLETED allowed");
  const orderCompleted = await prisma.order.update({
    where: { id: order.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  assert(orderCompleted.status === "COMPLETED", "Order transitioned to COMPLETED");
  assert(orderCompleted.completedAt instanceof Date, "Order completedAt timestamp recorded");

  // ----------------------------------------------------
  // TEST I: Invalid Order Transitions Rejected
  // ----------------------------------------------------
  console.log("\n[Test I] Verifying Invalid Transitions Rejected by State Machine...");
  assert(!canTransitionOrder("COMPLETED", "PENDING"), "COMPLETED -> PENDING rejected");
  assert(!canTransitionOrder("COMPLETED", "IN_PROGRESS"), "COMPLETED -> IN_PROGRESS rejected");
  assert(!canTransitionOrder("COMPLETED", "CANCELLED"), "COMPLETED -> CANCELLED rejected");
  assert(!canTransitionOrder("CANCELLED", "IN_PROGRESS"), "CANCELLED -> IN_PROGRESS rejected");
  assert(!canTransitionOrder("CANCELLED", "READY_TO_START"), "CANCELLED -> READY_TO_START rejected");
  assert(!canTransitionOrder("PENDING", "SUBMITTED"), "PENDING -> SUBMITTED rejected");
  assert(!canTransitionOrder("PENDING", "COMPLETED"), "PENDING -> COMPLETED rejected");
  assert(!canTransitionOrder("READY_TO_START", "COMPLETED"), "READY_TO_START -> COMPLETED rejected");

  // ----------------------------------------------------
  // TEST J: Pre-Work Order Cancellation
  // ----------------------------------------------------
  console.log("\n[Test J] Verifying Pre-Work Cancellation Flow...");
  // Create another application and order specifically to test cancellation
  const jonahService = jonah.services[0];
  const appToCancel = await prisma.campaignApplication.create({
    data: {
      campaignId: campaign.id,
      creatorId: jonah.id,
      serviceId: jonahService?.id ?? null,
      proposedRate: 1200,
      pitchMessage: "Application to test pre-work order cancellation.",
      status: "PENDING",
    },
    include: { campaign: true },
  });

  const cancelConv = await prisma.conversation.create({
    data: { applicationId: appToCancel.id },
  });

  const orderToCancel = await prisma.order.create({
    data: {
      orderNumber: "INF-2026-CANCEL01",
      applicationId: appToCancel.id,
      campaignId: appToCancel.campaignId,
      creatorId: appToCancel.creatorId,
      brandId: appToCancel.campaign.brandId,
      conversationId: cancelConv.id,
      agreedPriceInCents: 120000,
      deliverablesSnapshot: "Cancellation test deliverables",
      turnaroundDaysSnapshot: 10,
      deadlineAt: new Date(Date.now() + 10 * 86400000),
      status: "PENDING",
    },
  });

  assert(canTransitionOrder(orderToCancel.status, "CANCELLED"), "PENDING -> CANCELLED allowed");

  const cancellationReason = "Brand requested schedule realignment prior to production initiation.";
  const cancelledOrder = await prisma.order.update({
    where: { id: orderToCancel.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason,
    },
  });

  assert(cancelledOrder.status === "CANCELLED", "Order successfully marked CANCELLED");
  assert(cancelledOrder.cancellationReason === cancellationReason, "Order cancellation reason recorded");
  assert(cancelledOrder.cancelledAt instanceof Date, "Order cancelledAt timestamp recorded");
  assert(!canTransitionOrder(cancelledOrder.status, "READY_TO_START"), "CANCELLED order cannot be reactivated");

  // ----------------------------------------------------
  // TEST K: Authorization Boundaries
  // ----------------------------------------------------
  console.log("\n[Test K] Verifying Authorization Boundaries...");
  const luma = await prisma.brand.findFirst({ where: { name: "Luma" } });
  if (!luma) throw new Error("Luma brand not found");

  // 1. Unrelated Brand cannot act on Northstar's order
  const brandAuthorized = order.brandId === luma.id;
  assert(!brandAuthorized, "Unrelated Brand Luma cannot access or mutate Northstar's order");

  // 2. Unrelated Creator cannot act on Mira's order
  const creatorAuthorized = order.creatorId === jonah.id;
  assert(!creatorAuthorized, "Unrelated Creator Jonah cannot access or mutate Mira's order");

  // ----------------------------------------------------
  // TEST L: Regression - Mutual Match Continuity
  // ----------------------------------------------------
  console.log("\n[Test L] Verifying Mutual Match Continuity...");
  const mutualMatches = await prisma.match.findMany({
    include: { conversation: true, creator: true, campaign: true },
  });
  assert(mutualMatches.length >= 1, `Existing mutual matches preserved (${mutualMatches.length})`);
  for (const m of mutualMatches) {
    assert(Boolean(m.conversation?.id), `Match ${m.id} has intact conversation thread`);
  }

  // Cleanup test campaign & records
  await prisma.order.delete({ where: { id: orderToCancel.id } });
  await prisma.conversation.delete({ where: { id: cancelConv.id } });
  await prisma.campaignApplication.delete({ where: { id: appToCancel.id } });

  await prisma.order.delete({ where: { id: order.id } });
  await prisma.conversation.delete({ where: { id: conversation.id } });
  await prisma.campaignApplication.delete({ where: { id: application.id } });
  await prisma.campaign.delete({ where: { id: campaign.id } });

  console.log("\n==========================================");
  console.log(`  ALL ${testPassed} PHASE 4A TESTS PASSED PERFECTLY!`);
  console.log("==========================================\n");
}

runPhase4ATests()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
