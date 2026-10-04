import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { writeSession } from "@/lib/session";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;

  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

export async function syncSupabaseUserToPrisma(supabaseUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): Promise<{ userId: string; role: string }> {
  if (!supabaseUser.email) {
    throw new Error("Supabase account does not have an email address.");
  }

  const email = supabaseUser.email.toLowerCase();
  const providerAccountId = supabaseUser.id;
  const meta = supabaseUser.user_metadata || {};
  const fullName = (meta.full_name || meta.name || email.split("@")[0]) as string;

  return await prisma.$transaction(async (tx) => {
    // 1. Check existing account by provider and id
    const existingAccount = await tx.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "supabase",
          providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      return { userId: existingAccount.userId, role: existingAccount.user.role };
    }

    // 2. Also check if user with this email already exists
    let user = await tx.user.findUnique({ where: { email } });
    if (!user) {
      user = await tx.user.create({
        data: {
          email,
          role: "UNASSIGNED",
        },
      });
    }

    // 3. Link account
    await tx.account.create({
      data: {
        userId: user.id,
        provider: "supabase",
        providerAccountId,
      },
    });

    return { userId: user.id, role: user.role };
  });
}
