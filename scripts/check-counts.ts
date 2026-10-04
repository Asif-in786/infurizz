import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userList = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      creator: { select: { id: true, name: true, category: true, username: true } },
      brand: { select: { id: true, name: true, location: true } }
    }
  });

  console.log("Current Users Count:", userList.length);
  for (const u of userList) {
    if (u.role === "CREATOR") {
      console.log(`Creator: ${u.creator?.name} (@${u.creator?.username}) - ${u.email}`);
    } else if (u.role === "BRAND") {
      console.log(`Brand: ${u.brand?.name} (${u.brand?.location}) - ${u.email}`);
    } else {
      console.log(`Other: ${u.email} (${u.role})`);
    }
  }

  const campaigns = await prisma.campaign.findMany({
    select: { id: true, name: true, brand: { select: { name: true } }, status: true }
  });
  console.log("\nCampaigns:", campaigns.map(c => `${c.name} [${c.brand.name}] (${c.status})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
