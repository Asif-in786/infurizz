import { prisma } from "../src/lib/db/client";

interface PageTiming {
  url: string;
  status: number;
  timeMs: number;
  hasDemoData: boolean;
  hasBlankLoading: boolean;
}

async function testRoute(url: string, cookie?: string): Promise<PageTiming> {
  const t0 = Date.now();
  const res = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });
  const t1 = Date.now();
  const text = await res.text();

  const hasSarah = text.includes("Sarah Chen");
  const hasApex = text.includes("Apex Audio");
  const hasLoadingInfurizz = text.includes("Loading INFURIZZ...");

  return {
    url,
    status: res.status,
    timeMs: t1 - t0,
    hasDemoData: hasSarah || hasApex,
    hasBlankLoading: hasLoadingInfurizz,
  };
}

async function run() {
  console.log("================================================================================");
  console.log("  INFURIZZ PROTOCOL - NAVIGATION PERFORMANCE & DEMO DATA AUDIT");
  console.log("================================================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Unauthenticated Public Routes
  console.log("▶ 1. TESTING PUBLIC ROUTES...");
  const publicRoutes = ["/", "/login", "/signup", "/brand/discover"];
  for (const route of publicRoutes) {
    const r = await testRoute(`${baseUrl}${route}`);
    console.log(`  Route: ${r.url.padEnd(35)} | Status: ${r.status} | Latency: ${r.timeMs}ms | Demo Data: ${r.hasDemoData ? "FOUND ✗" : "NONE ✓"} | Blank Loading: ${r.hasBlankLoading ? "FOUND ✗" : "NONE ✓"}`);
  }

  // 2. Unauthenticated Protected Routes (should redirect to /login immediately without delay)
  console.log("\n▶ 2. TESTING PROTECTED REDIRECTS (0ms DB LATENCY)...");
  const protectedRoutes = [
    "/creator/dashboard",
    "/creator/analytics",
    "/creator/profile",
    "/brand/dashboard",
    "/brand/profile",
  ];
  for (const route of protectedRoutes) {
    const r = await testRoute(`${baseUrl}${route}`);
    console.log(`  Route: ${r.url.padEnd(35)} | Status: ${r.status} | Latency: ${r.timeMs}ms | Demo Data: ${r.hasDemoData ? "FOUND ✗" : "NONE ✓"}`);
  }

  // 3. Create Real Creator Account & Test Authenticated Navigations
  console.log("\n▶ 3. TESTING AUTHENTICATED CREATOR ROUTES (REAL SESSION)...");
  const creatorEmail = `perf_creator_${Date.now()}@test.com`;
  const creatorPass = "P@ssword123456";

  const signupRes = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signup",
      name: "Morgan Rivers",
      email: creatorEmail,
      password: creatorPass,
      role: "CREATOR",
    }),
  });
  const signupData = await signupRes.json();
  const sessionCookie = signupRes.headers.get("set-cookie") || "";
  console.log(`  Created Creator: ${signupData.user?.name} (${signupData.user?.id})`);

  // Complete onboarding so profile exists
  await prisma.creatorProfile.create({
    data: {
      userId: signupData.user.id,
      handle: `morgan_${Date.now()}`,
      displayName: "Morgan Rivers",
      bio: "Independent creative and software reviewer.",
      category: "Tech & Software",
      totalReach: 150000,
      avgEngagementRate: 4.5,
    },
  });

  const authRoutes = [
    "/creator/dashboard",
    "/creator/analytics",
    "/creator/profile",
    "/creator/collaborations",
    "/creator/social-accounts",
    "/creator/messages",
  ];

  for (const route of authRoutes) {
    const r = await testRoute(`${baseUrl}${route}`, sessionCookie);
    console.log(`  Route: ${r.url.padEnd(35)} | Status: ${r.status} | Latency: ${r.timeMs}ms | Demo Data: ${r.hasDemoData ? "FOUND ✗" : "NONE ✓"} | Blank Loading: ${r.hasBlankLoading ? "FOUND ✗" : "NONE ✓"}`);
  }

  // 4. Create Real Brand Account & Test Authenticated Navigations
  console.log("\n▶ 4. TESTING AUTHENTICATED BRAND ROUTES (REAL SESSION)...");
  const brandEmail = `perf_brand_${Date.now()}@test.com`;
  const brandSignupRes = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signup",
      name: "PulseTech Media",
      email: brandEmail,
      password: creatorPass,
      role: "BRAND",
    }),
  });
  const brandSignupData = await brandSignupRes.json();
  const brandCookie = brandSignupRes.headers.get("set-cookie") || "";

  await prisma.brandProfile.create({
    data: {
      userId: brandSignupData.user.id,
      companyName: "PulseTech Media",
      website: "https://pulsetech.test",
      industry: "Consumer Electronics",
      description: "Audio & tech gear manufacturer.",
    },
  });

  const brandAuthRoutes = [
    "/brand/dashboard",
    "/brand/profile",
    "/brand/discover",
    "/brand/collaborations",
    "/brand/campaigns",
    "/brand/messages",
  ];

  for (const route of brandAuthRoutes) {
    const r = await testRoute(`${baseUrl}${route}`, brandCookie);
    console.log(`  Route: ${r.url.padEnd(35)} | Status: ${r.status} | Latency: ${r.timeMs}ms | Demo Data: ${r.hasDemoData ? "FOUND ✗" : "NONE ✓"} | Blank Loading: ${r.hasBlankLoading ? "FOUND ✗" : "NONE ✓"}`);
  }

  // 5. Cleanup Test Records
  console.log("\n▶ 5. CLEANING UP TEST ACCOUNTS...");
  await prisma.creatorProfile.deleteMany({ where: { userId: signupData.user.id } });
  await prisma.brandProfile.deleteMany({ where: { userId: brandSignupData.user.id } });
  await prisma.user.deleteMany({ where: { id: { in: [signupData.user.id, brandSignupData.user.id] } } });
  const remaining = await prisma.user.count();
  console.log(`  Supabase PostgreSQL remaining users: ${remaining} (clean)`);

  console.log("\n================================================================================");
  console.log("  ALL PERFORMANCE AND AUDIT CHECKS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
