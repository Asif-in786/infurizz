import { prisma } from "@/lib/prisma";
import { readSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  const userId = await readSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      creator: { include: { socials: true, services: true, portfolio: true } },
      brand: { include: { campaigns: { orderBy: { name: "asc" } } } },
    },
  });
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
