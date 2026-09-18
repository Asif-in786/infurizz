import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanProductionDatabase() {
  console.log("🧹 Starting production database cleanup in Supabase PostgreSQL...");

  // Delete all records in proper dependency order
  const notifs = await prisma.notification.deleteMany();
  console.log(`- Deleted ${notifs.count} notifications`);

  const msgs = await prisma.message.deleteMany();
  console.log(`- Deleted ${msgs.count} messages`);

  const convs = await prisma.conversation.deleteMany();
  console.log(`- Deleted ${convs.count} conversations`);

  const collabs = await prisma.collaboration.deleteMany();
  console.log(`- Deleted ${collabs.count} collaborations`);

  const camps = await prisma.campaign.deleteMany();
  console.log(`- Deleted ${camps.count} campaigns`);

  const metrics = await prisma.performanceMetric.deleteMany();
  console.log(`- Deleted ${metrics.count} performance metrics`);

  const snaps = await prisma.audienceSnapshot.deleteMany();
  console.log(`- Deleted ${snaps.count} audience snapshots`);

  const accounts = await prisma.socialAccount.deleteMany();
  console.log(`- Deleted ${accounts.count} social accounts`);

  const cProfiles = await prisma.creatorProfile.deleteMany();
  console.log(`- Deleted ${cProfiles.count} creator profiles`);

  const bProfiles = await prisma.brandProfile.deleteMany();
  console.log(`- Deleted ${bProfiles.count} brand profiles`);

  const users = await prisma.user.deleteMany();
  console.log(`- Deleted ${users.count} users`);

  console.log("\n📊 Verifying final record counts across all 11 tables:");
  const counts = {
    users: await prisma.user.count(),
    creatorProfiles: await prisma.creatorProfile.count(),
    brandProfiles: await prisma.brandProfile.count(),
    socialAccounts: await prisma.socialAccount.count(),
    audienceSnapshots: await prisma.audienceSnapshot.count(),
    performanceMetrics: await prisma.performanceMetric.count(),
    campaigns: await prisma.campaign.count(),
    collaborations: await prisma.collaboration.count(),
    conversations: await prisma.conversation.count(),
    messages: await prisma.message.count(),
    notifications: await prisma.notification.count(),
  };

  console.log(JSON.stringify(counts, null, 2));

  const totalRemaining = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalRemaining === 0) {
    console.log("✅ All demo/test data completely purged. Database is clean and ready for production.");
  } else {
    console.error(`⚠️ Warning: ${totalRemaining} records still remain.`);
    process.exit(1);
  }
}

cleanProductionDatabase()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
