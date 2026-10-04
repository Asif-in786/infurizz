import Link from "next/link";
import { Shell } from "@/components/page-intro";
import { RevolvingBorder } from "@/components/revolving-border";
import { ScrollReveal, StaggerGroup } from "@/components/scroll-reveal";

const steps = [
  ["Discover", "Creators review campaigns. Brands review creator profiles."],
  ["Interest", "Either side can say they want to work together."],
  ["Mutual match", "A match exists only when both sides have expressed interest."],
  ["Connect", "The match opens a basic conversation stored in this prototype."],
];

export default function HomePage() {
  return (
    <Shell>
      {/* Hero Section with Cinematic Staged Entrance */}
      <section className="grid items-end gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <p className="animate-fade-up text-[11px] tracking-[0.2em] text-oxblood uppercase">
            Creator and brand discovery
          </p>
          <h1 className="animate-editorial-reveal mt-4 font-serif text-[clamp(3.1rem,8.4vw,7.4rem)] leading-[0.86] tracking-[-0.045em] text-ink">
            One Creator.
            <br />
            Multiple Platforms.
            <br />
            One Identity.
          </h1>
        </div>
        <div className="animate-fade-up stagger-2 lg:col-span-4 lg:pb-2">
          <p className="font-serif text-2xl leading-snug italic sm:text-3xl text-ink">
            Find the right creator. Find the right brand.
          </p>
          <p className="mt-4 text-sm leading-6 text-muted">
            A structured desk for discovery. Interest is recorded. A match appears only when both sides want the same pairing.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <RevolvingBorder className="w-full sm:w-auto" contentClassName="bg-ink">
              <Link
                href="/join"
                className="btn-tactile group inline-flex min-h-12 w-full items-center justify-center gap-1.5 px-6 text-sm text-paper font-medium tracking-wide hover:text-white"
              >
                <span>Join INFURIZZ</span>
                <span className="icon-arrow-motion">→</span>
              </Link>
            </RevolvingBorder>
            <Link
              href="/discover"
              className="btn-tactile inline-flex min-h-12 items-center justify-center border border-ink/20 bg-paper px-5 text-sm hover:border-ink transition-colors"
            >
              Discover
            </Link>
          </div>
        </div>
      </section>

      {/* Steps Section with Staggered Scroll Entrance */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <ol className="border-t border-ink">
          {steps.map(([title, copy], index) => (
            <li
              key={title}
              className="grid gap-2 border-b border-line py-6 transition-colors duration-200 hover:bg-card/40 sm:grid-cols-[5rem_minmax(0,16rem)_1fr] sm:items-baseline sm:gap-6"
            >
              <span className="font-serif text-2xl text-muted">0{index + 1}</span>
              <h2 className="font-serif text-3xl tracking-[-0.03em] sm:text-4xl text-ink">{title}</h2>
              <p className="text-sm leading-6 text-muted sm:max-w-sm">{copy}</p>
            </li>
          ))}
        </ol>
      </ScrollReveal>

      {/* Portal Gateways Section */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <section className="grid border-t border-ink lg:grid-cols-2">
          <Link
            href="/for-creators"
            className="group card-interactive border-b border-line py-8 lg:border-r lg:border-b-0 lg:pr-10"
          >
            <p className="text-[11px] tracking-[0.18em] text-muted uppercase">For Creators</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] group-hover:text-oxblood transition-colors sm:text-5xl text-ink">
              One profile. The campaigns that fit it.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              Platforms you list yourself. No network is connected.
            </p>
          </Link>
          <Link
            href="/for-brands"
            className="group card-interactive py-8 lg:pl-10"
          >
            <p className="text-[11px] tracking-[0.18em] text-muted uppercase">For Brands</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] group-hover:text-oxblood transition-colors sm:text-5xl text-ink">
              A brief first. Then the people who fit it.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              Niche, platforms, audience, location, budget, deliverables.
            </p>
          </Link>
        </section>
      </ScrollReveal>

      {/* Feature Grids with Interactive Depth */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.12}>
        <section className="grid gap-10 border-t border-line pt-10 lg:grid-cols-2">
          <div className="card-interactive border border-line bg-card p-8">
            <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">The INFURIZZ Advantage</span>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-ink sm:text-4xl">Why Creators &amp; Brands Connect Here</h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-muted">
              <li className="flex items-start gap-3">
                <span className="font-serif font-bold text-ink">01</span>
                <span><strong className="text-ink">Transparent Requirements:</strong> Creators browse actual briefs with explicit budgets, required platforms, and concrete deliverables.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-serif font-bold text-ink">02</span>
                <span><strong className="text-ink">Direct Pitching &amp; Packages:</strong> Apply with your proposed rate or pre-set service packages without platform middleman friction.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-serif font-bold text-ink">03</span>
                <span><strong className="text-ink">Verified Storefronts:</strong> Showcase audited social metrics, curated portfolio work, and genuine collaboration preferences.</span>
              </li>
            </ul>
          </div>
          <div className="card-interactive border border-line bg-card p-8">
            <span className="text-[11px] font-semibold tracking-wider text-oxblood uppercase">Built For Scale</span>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-ink sm:text-4xl">Secure Collaboration Infrastructure</h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-muted">
              <li className="flex items-start gap-3">
                <span className="font-serif font-bold text-ink">01</span>
                <span><strong className="text-ink">Supabase &amp; Google Identity:</strong> Single sign-on authentication and encrypted credential management.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-serif font-bold text-ink">02</span>
                <span><strong className="text-ink">Structured Contract Orders:</strong> Mutual agreement snapshots, turnaround milestones, and built-in messaging.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-serif font-bold text-ink">03</span>
                <span><strong className="text-ink">Dynamic Brand Profiles:</strong> Explore full brand portfolios, active requirements, and historical collaboration scopes.</span>
              </li>
            </ul>
          </div>
        </section>
      </ScrollReveal>

      {/* Featured CTA Banner with Visible Revolving Perimeter Glow */}
      <ScrollReveal className="mt-16 sm:mt-24" threshold={0.15}>
        <section>
          <RevolvingBorder className="w-full" contentClassName="bg-card p-8 sm:p-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-oxblood">
                  Creator &amp; Brand Discovery
                </span>
                <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-ink sm:text-4xl">
                  Start discovering qualified collaborations today.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Explore transparent briefs with explicit budgets, or list your creator storefront packages with zero agency markup.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/join"
                  className="btn-tactile inline-flex min-h-12 items-center justify-center bg-ink px-6 text-xs uppercase tracking-widest text-paper hover:bg-oxblood transition-colors"
                >
                  Join INFURIZZ
                </Link>
                <Link
                  href="/discover"
                  className="btn-tactile inline-flex min-h-12 items-center justify-center border border-ink/20 px-6 text-xs uppercase tracking-widest text-ink hover:border-ink transition-colors"
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
