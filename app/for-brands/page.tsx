import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Shell } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "For Brands · Publish Briefs & Partner With Verified Creators",
  description:
    "Publish structured campaign requirements, review qualified creator proposals, verify multi-platform analytics, and manage collaborations with clarity.",
  alternates: {
    canonical: "/for-brands",
  },
  openGraph: {
    title: "For Brands · Publish Briefs & Partner With Verified Creators | INFURIZZ",
    description:
      "Publish structured campaign requirements, review qualified creator proposals, verify multi-platform analytics, and manage collaborations with clarity.",
    url: "https://infurizzv1.vercel.app/for-brands",
  },
};

const path = [
  ["Join INFURIZZ", "Choose Brand and open your account."],
  ["Publish a Campaign Brief", "Name, category, creator niche, platforms, audience range, location, budget range, and deliverables."],
  ["Discover Creators", "Review verified creator storefronts, multi-platform analytics, and deterministic fit scoring."],
  ["Express Interest / Invite", "Invite creators directly or review proposals submitted to your brief."],
  ["Mutual Match & Contract", "Mutual interest automatically unlocks a collaboration desk with messaging and order tracking."],
];

export default function ForBrandsPage() {
  return (
    <Shell>
      <PageIntro
        eyebrow="For Brands"
        title="A brief first. Then the people who fit it."
        lede="Find the right creator by stating what the campaign actually needs. Compatibility shows which of those requirements line up."
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
        <Link href="/join?role=brand" className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-5 text-sm text-paper sm:w-auto">
          Join as a brand
        </Link>
        <Link href="/discover" className="inline-flex min-h-12 w-full items-center justify-center border border-ink/20 px-5 text-sm text-ink hover:border-ink transition-colors sm:w-auto">
          Discover Creator Storefronts →
        </Link>
      </div>
    </Shell>
  );
}
