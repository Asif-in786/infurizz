import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Global Prisma Client singleton for INFURIZZ.
 * Prevents multiple instances from exhausting SQLite/PostgreSQL connection pools in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
