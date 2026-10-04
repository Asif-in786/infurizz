import { PrismaClient } from "@prisma/client";

async function peek() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.count();
    const creators = await prisma.creator.count();
    const snaps = await prisma.socialMetricSnapshot.count();
    const accounts = await prisma.socialAccount.count();
    console.log(`CURRENT DB COUNTS: Users=${users}, Creators=${creators}, SocialAccounts=${accounts}, MetricSnapshots=${snaps}`);
  } catch (e) {
    console.error("Peek error:", e instanceof Error ? e.message : String(e));
  } finally {
    await prisma.$disconnect();
  }
}

peek();
