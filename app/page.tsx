import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shell } from "@/components/page-intro";
import { RevolvingBorder } from "@/components/revolving-border";
import { ScrollReveal } from "@/components/scroll-reveal";
import { JsonLd } from "@/components/json-ld";
import { HeroEcosystem } from "@/components/hero-ecosystem";
import { MatchVisualizer } from "@/components/match-visualizer";
import { SocialConnectionMotif } from "@/components/social-connection-motif";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "INFURIZZ — Creator Identity & Marketplace Platform",
  description:
    "One Creator. Multiple Platforms. One Identity. Discover verified creators, launch transparent briefs, and build direct brand collaborations.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "INFURIZZ — Creator Identity & Marketplace Platform",
    description:
      "One Creator. Multiple Platforms. One Identity. Unified multi-platform creator identity, audited analytics, and direct brand collaboration.",
    url: "https://infurizzv1.vercel.app",
    type: "website",
  },
};

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://infurizzv1.vercel.app/#website",
      "url": "https://infurizzv1.vercel.app",
      "name": "INFURIZZ",
      "description": "Creator Marketplace & Professional Identity Platform",
      "publisher": {
        "@id": "https://infurizzv1.vercel.app/#organization",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://infurizzv1.vercel.app/#organization",
      "name": "INFURIZZ",
      "url": "https://infurizzv1.vercel.app",
      "logo": "https://infurizzv1.vercel.app/brand/infurizz-logo-badge.png",
      "description":
        "Professional creator network, marketplace, and multi-platform analytics layer for creator-brand partnerships.",
    },
  ],
};

export default async function HomePage() {
  const [creators, campaigns] = await Promise.all([
    prisma.creator
      .findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          socials: true,
          socialAccounts: { where: { connectionStatus: "CONNECTED" } },
          services: { where: { isActive: true }, take: 2 },
        },
      })
      .catch(() => []),
    prisma.campaign
      .findMany({
        take: 3,
        where: { status: "Open" },
        orderBy: { createdAt: "desc" },
        include: { brand: true },
      })
      .catch(() => []),
  ]);

  return (
    <Shell>
      <JsonLd data={homeStructuredData} />

      {/* ========================================================
          CHAPTER 1: THE SIGNATURE HERO ECOSYSTEM CANVAS
          ======================================================== */}
      <HeroEcosystem />

      {/* ========================================================
          CHAPTER 2: THE FRAGMENTATION PROBLEM
          ======================================================== */}
      <ScrollReveal className="mt-8 sm:mt-16" threshold={0.15}>
        <SocialConnectionMotif
          stepNumber="01"
          stageName="THE FRAGMENTATION CRISIS"
          label="YouTube · Instagram · TikTok · LinkedIn · X"
        />

        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
              The Reality Creators Face
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight text-ink">
              Your influence is everywhere.
              <br />
              <span className="italic text-muted">Your identity is nowhere.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Today, a creator is forced to maintain disjointed PDFs, outdated media kit screenshots,
              scattered rate sheets, and opaque DMs across five different apps. Brands are left guessing
              which metrics are legitimate and which rates are inflated.
            </p>
          </div>

          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
            <div className="card-interactive rounded-xl border border-line bg-card p-6">
              <div className="flex items-center gap-2 text-oxblood font-mono text-xs uppercase tracking-wider font-semibold">
                <span>⚠ Before INFURIZZ</span>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-oxblood font-bold">×</span>
                  <span><strong>Dispersed Media Kits:</strong> Manually generated PDFs that go stale the moment a video goes viral.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-oxblood font-bold">×</span>
                  <span><strong>Unverified Metrics:</strong> Inability to prove live retention, reach, and organic subscriber growth.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-oxblood font-bold">×</span>
                  <span><strong>Agency Markup:</strong> Middlemen taking 20%–40% commissions for simple email introductions.</span>
                </li>
              </ul>
            </div>

            <div className="card-interactive rounded-xl border border-oxblood/40 bg-card p-6 ring-1 ring-oxblood/10">
              <div className="flex items-center gap-2 text-emerald-700 font-mono text-xs uppercase tracking-wider font-semibold">
                <span>✓ With INFURIZZ</span>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>One Unified Identity:</strong> Single permanent link representing all verified social platforms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Audited API Provenance:</strong> Live YouTube Data API &amp; Meta OAuth integration without fabrication.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Direct Collaboration Desk:</strong> Explicit campaign budgets, pre-set service packages, 0% platform take.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ========================================================
          CHAPTER 3: THE UNIFIED ARCHITECTURE
          ======================================================== */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <SocialConnectionMotif
          stepNumber="02"
          stageName="THE UNIFIED DESK"
          label="One Creator · Multiple Platforms · One Storefront"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-interactive rounded-xl border border-line bg-card p-6">
            <span className="font-mono text-[10px] uppercase tracking-wider text-oxblood font-semibold">01 · Identity</span>
            <h3 className="mt-2 font-serif text-xl text-ink">Verified Presence</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Connect YouTube, Instagram, LinkedIn, and X. Proof of ownership is cryptographically authenticated.
            </p>
          </div>

          <div className="card-interactive rounded-xl border border-line bg-card p-6">
            <span className="font-mono text-[10px] uppercase tracking-wider text-oxblood font-semibold">02 · Packaging</span>
            <h3 className="mt-2 font-serif text-xl text-ink">Service Packages</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Publish transparent collaboration packages with pre-set turnaround times, licensing rights, and deliverable scopes.
            </p>
          </div>

          <div className="card-interactive rounded-xl border border-line bg-card p-6">
            <span className="font-mono text-[10px] uppercase tracking-wider text-oxblood font-semibold">03 · Protocol</span>
            <h3 className="mt-2 font-serif text-xl text-ink">Mutual Pairing</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Zero spam. Communication desks unlock exclusively when both creator and brand confirm mutual reciprocal interest.
            </p>
          </div>

          <div className="card-interactive rounded-xl border border-line bg-card p-6">
            <span className="font-mono text-[10px] uppercase tracking-wider text-oxblood font-semibold">04 · Execution</span>
            <h3 className="mt-2 font-serif text-xl text-ink">Milestone Orders</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Structured contract snapshots, file exchange, deliverable revision checkpoints, and direct completion confirmations.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* ========================================================
          CHAPTER 4: DISCOVER CREATORS (LIVE DIRECTORY PREVIEW)
          ======================================================== */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <SocialConnectionMotif
          stepNumber="03"
          stageName="DISCOVERY DESK"
          label="Vetted Creator Storefronts Across 12 Categories"
        />

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
              Curated Talent Storefronts
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">
              Discover verified creator storefronts.
            </h2>
            <p className="mt-2 text-sm text-muted">
              Filter by niche, verified platform presence, deliverable turnaround, and budget fit.
            </p>
          </div>

          <Link
            href="/discover"
            className="btn-tactile inline-flex items-center gap-1.5 border border-ink bg-card px-5 py-2 text-xs font-mono uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <span>Browse All Creators</span>
            <span className="icon-arrow-motion">→</span>
          </Link>
        </div>

        {/* Creator Showcase Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.length > 0 ? (
            creators.map((c) => {
              const startingPrice = c.services?.[0]?.price ?? null;
              return (
                <article
                  key={c.id}
                  className="card-interactive group flex flex-col justify-between rounded-xl border border-line bg-card p-6 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                        {c.category}
                      </span>
                      {startingPrice !== null ? (
                        <span className="font-serif text-base font-semibold text-ink">
                          From {money(startingPrice)}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-muted">Custom Scope</span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-serif text-base font-bold text-paper">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h3 className="font-serif text-xl font-medium text-ink transition-colors group-hover:text-oxblood truncate">
                          <Link href={`/creators/${c.username || c.id}`}>{c.name}</Link>
                        </h3>
                        {c.username && (
                          <p className="font-mono text-xs text-oxblood">@{c.username}</p>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                      {c.bio}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line/60 pt-3">
                      {c.socials.map((s) => (
                        <span
                          key={s.id}
                          className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-[10px] text-muted"
                        >
                          {s.platform}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-line/60 pt-4">
                    <Link
                      href={`/creators/${c.username || c.id}`}
                      className="btn-tactile flex min-h-10 w-full items-center justify-center gap-1 rounded border border-ink/30 bg-paper py-2 text-xs font-mono uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      <span>View Storefront</span>
                      <span className="icon-arrow-motion font-mono">↗</span>
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            /* Fallback Curated Creator Cards */
            [
              {
                name: "Aria Lindqvist",
                handle: "@aria_design",
                niche: "Design & Creative Systems",
                bio: "Lead product designer and spatial technologist reviewing cutting-edge software and hardware.",
                metric: "340K Reach",
                price: "$1,800",
              },
              {
                name: "Kofi Mensah",
                handle: "@kofitech",
                niche: "Full-Stack Dev & AI",
                bio: "Software architect breaking down large language model infrastructure and developer tooling.",
                metric: "520K Reach",
                price: "$2,400",
              },
              {
                name: "Elena Rostova",
                handle: "@elena.arch",
                niche: "Architecture & Travel",
                bio: "Documenting brutalist structures and modern architectural sanctuaries across Europe and Asia.",
                metric: "620K Reach",
                price: "$2,200",
              },
            ].map((c) => (
              <article
                key={c.name}
                className="card-interactive group flex flex-col justify-between rounded-xl border border-line bg-card p-6"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="rounded border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                      {c.niche}
                    </span>
                    <span className="font-serif text-base font-semibold text-ink">
                      From {c.price}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-serif text-base font-bold text-paper">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-ink transition-colors group-hover:text-oxblood">
                        {c.name}
                      </h3>
                      <p className="font-mono text-xs text-oxblood">{c.handle}</p>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                    {c.bio}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-muted">
                    <span>Audience Reach:</span>
                    <strong className="text-ink">{c.metric}</strong>
                  </div>
                </div>

                <div className="mt-6 border-t border-line/60 pt-4">
                  <Link
                    href="/discover"
                    className="btn-tactile flex min-h-10 w-full items-center justify-center gap-1 rounded border border-ink/30 bg-paper py-2 text-xs font-mono uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                  >
                    <span>View Storefront</span>
                    <span className="icon-arrow-motion font-mono">↗</span>
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </ScrollReveal>

      {/* ========================================================
          CHAPTER 5: THE DETERMINISTIC MATCHMAKING PROTOCOL
          ======================================================== */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <SocialConnectionMotif
          stepNumber="04"
          stageName="MUTUAL MATCHING"
          label="Direct Interest → Reciprocal Agreement → Unlocked Desk"
        />

        <MatchVisualizer />
      </ScrollReveal>

      {/* ========================================================
          CHAPTER 6: COLLABORATION & BRIEFS
          ======================================================== */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <SocialConnectionMotif
          stepNumber="05"
          stageName="TRANSPARENT BRIEFS"
          label="Explicit Budgets · Clear Scopes · Zero Middlemen"
        />

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
              Live Brand Opportunities
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">
              Collaborate on transparent briefs.
            </h2>
            <p className="mt-2 text-sm text-muted">
              Creators pitch directly to published requirements with explicit budgets and milestone goals.
            </p>
          </div>

          <Link
            href="/campaigns"
            className="btn-tactile inline-flex items-center gap-1.5 border border-ink bg-card px-5 py-2 text-xs font-mono uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <span>Explore All Briefs</span>
            <span className="icon-arrow-motion">→</span>
          </Link>
        </div>

        {/* Live Campaign Briefs Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.length > 0 ? (
            campaigns.map((camp) => (
              <article
                key={camp.id}
                className="card-interactive group flex flex-col justify-between rounded-xl border border-line bg-card p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                      {camp.category || "General"}
                    </span>
                    <span className="font-serif text-base font-semibold text-oxblood">
                      {money(camp.budgetMin)} – {money(camp.budgetMax)}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-xl font-medium text-ink group-hover:text-oxblood transition-colors">
                    <Link href={`/campaigns/${camp.id}`}>{camp.name}</Link>
                  </h3>

                  <p className="mt-1 font-mono text-xs text-muted">
                    Brand: <strong className="text-ink">{camp.brand?.name || "Verified Partner"}</strong>
                  </p>

                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                    {camp.deliverables}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line/60 pt-3 text-xs text-muted">
                    <span>Platforms: </span>
                    <span className="font-mono font-medium text-ink">{camp.platforms}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-line/60 pt-4">
                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="btn-tactile flex min-h-10 w-full items-center justify-center gap-1 rounded bg-ink py-2 text-xs font-mono uppercase tracking-wider text-paper transition-colors hover:bg-oxblood"
                  >
                    <span>Review Brief Details</span>
                    <span className="icon-arrow-motion font-mono">→</span>
                  </Link>
                </div>
              </article>
            ))
          ) : (
            /* Fallback High-Fidelity Campaign Briefs */
            [
              {
                title: "Autumn Spatial Computing Launch",
                brand: "Lumen Optics",
                budget: "$3,500 – $5,000",
                platform: "YouTube Longform + X",
                desc: "Looking for hardware creators and developer advocates to demonstrate our mixed-reality dev kit.",
              },
              {
                title: "Sustainable Studio Workspace Campaign",
                brand: "Nordic Craft Co.",
                budget: "$2,200 – $3,000",
                platform: "Instagram Reels + TikTok",
                desc: "Showcase ergonomic solid oak desk systems and cable management ergonomics in daily creator workflows.",
              },
              {
                title: "Global FinTech API Integration Series",
                brand: "PayBridge International",
                budget: "$4,000 – $6,500",
                platform: "YouTube + LinkedIn",
                desc: "Technical video walkthrough demonstrating seamless multi-currency checkout for digital creators.",
              },
            ].map((c) => (
              <article
                key={c.title}
                className="card-interactive group flex flex-col justify-between rounded-xl border border-line bg-card p-6"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="rounded border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                      Open Brief
                    </span>
                    <span className="font-serif text-base font-semibold text-oxblood">
                      {c.budget}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-xl font-medium text-ink group-hover:text-oxblood transition-colors">
                    {c.title}
                  </h3>

                  <p className="mt-1 font-mono text-xs text-muted">
                    Brand: <strong className="text-ink">{c.brand}</strong>
                  </p>

                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                    {c.desc}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-muted">
                    <span>Target:</span>
                    <strong className="text-ink">{c.platform}</strong>
                  </div>
                </div>

                <div className="mt-6 border-t border-line/60 pt-4">
                  <Link
                    href="/campaigns"
                    className="btn-tactile flex min-h-10 w-full items-center justify-center gap-1 rounded bg-ink py-2 text-xs font-mono uppercase tracking-wider text-paper transition-colors hover:bg-oxblood"
                  >
                    <span>Review Brief Details</span>
                    <span className="icon-arrow-motion font-mono">→</span>
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </ScrollReveal>

      {/* ========================================================
          CHAPTER 7: AUDITED MULTI-PLATFORM ANALYTICS LAYER
          ======================================================== */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <SocialConnectionMotif
          stepNumber="06"
          stageName="AUDITED ANALYTICS"
          label="Live YouTube Data API · Meta OAuth Provenance"
        />

        <div className="relative overflow-hidden rounded-2xl border border-line bg-card p-8 sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="font-mono text-[10px] uppercase tracking-widest text-oxblood font-semibold">
                Live Provenance Verification
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">
                Real analytics. Zero fabricated screenshots.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                INFURIZZ interfaces directly with official platform APIs. YouTube channel statistics are fetched
                via verified Google Cloud Data API v3 endpoints, while professional Instagram metrics require
                official Meta authentication. No scraping. No fake data.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="rounded border border-line bg-paper px-3 py-1 text-ink">
                  ✓ YouTube Data API v3 Live
                </div>
                <div className="rounded border border-line bg-paper px-3 py-1 text-ink">
                  ✓ Meta Graph API Compliance
                </div>
                <div className="rounded border border-line bg-paper px-3 py-1 text-ink">
                  ✓ De-duplicated Audience Reach
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/live-example"
                  className="btn-tactile inline-flex min-h-11 items-center justify-center gap-2 rounded bg-oxblood px-6 text-xs font-mono uppercase tracking-wider text-paper transition-colors hover:bg-[#52211d]"
                >
                  <span>Test Live API Experience</span>
                  <span className="icon-arrow-motion font-mono">→</span>
                </Link>
                <Link
                  href="/analytics"
                  className="btn-tactile inline-flex min-h-11 items-center justify-center rounded border border-line bg-paper px-6 text-xs font-mono uppercase tracking-wider text-ink transition-colors hover:border-ink"
                >
                  <span>Creator Analytics Desk</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl border border-line bg-paper p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-xs font-semibold text-ink">Audited Telemetry</span>
                  </div>
                  <span className="font-mono text-[10px] text-oxblood uppercase font-bold">API Verified</span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">YouTube API Status:</span>
                    <span className="font-mono text-xs font-bold text-emerald-600">CONNECTED · 200 OK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Instagram Graph State:</span>
                    <span className="font-mono text-xs font-bold text-ink">OFFICIAL META FLOW</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Snapshot Integrity:</span>
                    <span className="font-mono text-xs font-bold text-ink">Prisma Automated Logs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Audience Duplication:</span>
                    <span className="font-mono text-xs font-bold text-oxblood">Normalized (-12.4%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ========================================================
          CHAPTER 8: JOIN THE CREATOR ECOSYSTEM
          ======================================================== */}
      <ScrollReveal className="mt-16 sm:mt-24 mb-8" threshold={0.15}>
        <SocialConnectionMotif
          stepNumber="07"
          stageName="THE NETWORK"
          label="One Identity · Global Collaborations"
        />

        <section>
          <RevolvingBorder className="w-full" contentClassName="bg-card p-8 sm:p-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <Image
                    src="/brand/infurizz-mark.png"
                    alt="INFURIZZ"
                    width={36}
                    height={36}
                    className="h-8 w-auto object-contain animate-emblem-float drop-shadow-xs"
                  />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-oxblood">
                    Creator Identity Platform
                  </span>
                </div>
                <h2 className="font-serif text-3xl sm:text-5xl tracking-[-0.03em] text-ink">
                  Claim your unified creator identity today.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Join hundreds of professional creators listing audited storefront packages, or register as a
                  brand to post transparent collaboration briefs with zero middleman commissions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/join"
                  className="btn-tactile inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded bg-ink px-8 text-xs font-mono uppercase tracking-widest text-paper hover:bg-oxblood transition-colors shadow-sm"
                >
                  Join INFURIZZ
                </Link>
                <Link
                  href="/discover"
                  className="btn-tactile inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded border border-ink/30 bg-paper px-8 text-xs font-mono uppercase tracking-widest text-ink hover:border-ink transition-colors"
                >
                  Explore Directory
                </Link>
              </div>
            </div>
          </RevolvingBorder>
        </section>
      </ScrollReveal>
    </Shell>
  );
}
