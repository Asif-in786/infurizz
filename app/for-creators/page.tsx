import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Shell } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "For Creators · One Profile for All Your Brand Partnerships",
  description:
    "Build your creator storefront, showcase multi-platform analytics, discover transparent brand briefs, and partner directly without agency markups.",
  alternates: {
    canonical: "/for-creators",
  },
  openGraph: {
    title: "For Creators · One Profile for All Your Brand Partnerships | INFURIZZ",
    description:
      "Build your creator storefront, showcase multi-platform analytics, discover transparent brand briefs, and partner directly without agency markups.",
    url: "https://infurizzv1.vercel.app/for-creators",
  },
};

const path = [
  ["Join INFURIZZ", "Choose Creator and open an account."],
  ["Create a Storefront", "Add category, location, niche, audience range, social channels, and fixed-scope service packages."],
  ["Discover Briefs", "Review open brand briefs filtered by platform and budget."],
  ["Express Interest / Pitch", "Record mutual interest or submit a custom proposal with deliverables and rate."],
  ["Mutual Match & Connect", "When both sides confirm reciprocal interest, a dedicated collaboration desk unlocks with direct messaging."],
];

export default function ForCreatorsPage() {
  return (
    <Shell>
      <PageIntro
        eyebrow="For Creators"
        title="One profile. The campaigns that fit it."
        lede="Present your multi-platform presence, showcase deliverable packages, and connect with brand campaigns that match your audience."
      />
      <ol className="mt-12 max-w-2xl divide-y divide-line border-y border-line">
        {path.map(([title, copy], index) => (
          <li key={title} className="grid gap-2 py-5 sm:grid-cols-[4rem_1fr]">
            <span className="text-sm text-muted">0{index + 1}</span>
            <div>
              <h2 className="font-serif text-2xl">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{copy}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/join?role=creator" className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-5 text-sm text-paper sm:w-auto">
          Join as a creator
        </Link>
        <Link href="/campaigns" className="inline-flex min-h-12 w-full items-center justify-center border border-ink/20 px-5 text-sm text-ink hover:border-ink transition-colors sm:w-auto">
          Explore Open Campaigns →
        </Link>
      </div>
    </Shell>
  );
}
