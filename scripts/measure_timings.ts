import { prisma } from "../src/lib/db/client";

async function measure() {
  console.log("Measuring database query response times...");

  // 1. Measure raw database ping
  const t0 = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const t1 = Date.now();
  console.log(`Prisma $queryRaw (SELECT 1): ${t1 - t0}ms`);

  // 2. Measure user findUnique
  const t2 = Date.now();
  await prisma.user.findUnique({
    where: { email: "test@example.com" },
    include: { creatorProfile: true, brandProfile: true },
  });
  const t3 = Date.now();
  console.log(`Prisma user.findUnique: ${t3 - t2}ms`);

  // 3. Measure creatorProfile findFirst with nested includes
  const t4 = Date.now();
  await prisma.creatorProfile.findFirst({
    where: { handle: "nonexistent" },
    include: {
      socialAccounts: { where: { isConnected: true }, orderBy: { followersCount: "desc" } },
      audienceSnapshots: { orderBy: { recordedAt: "asc" } },
      collaborations: {
        include: { brand: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  const t5 = Date.now();
  console.log(`Prisma creatorProfile.findFirst (with all includes): ${t5 - t4}ms`);

  // 4. Measure brandProfile findUnique with nested includes
  const t6 = Date.now();
  await prisma.brandProfile.findFirst({
    where: { companyName: "nonexistent" },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      collaborations: {
        include: { creator: true, conversations: { take: 1 } },
        orderBy: { createdAt: "desc" },
      },
      conversations: {
        include: { creator: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  const t7 = Date.now();
  console.log(`Prisma brandProfile.findFirst (with all includes): ${t7 - t6}ms`);
}

measure()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
