import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Shell } from "@/components/page-intro";

export const metadata: Metadata = { title: "For Brands" };

const path = [
  ["Join INFURIZZ", "Choose Brand and describe the company."],
  ["Create a campaign", "Name, category, creator niche, platforms, audience range, location, budget, and deliverables."],
  ["Discover creators", "Review profiles against the campaign you select."],
  ["Express interest", "An invite is interest from the brand. It is not a booking."],
  ["Match", "The creator must have interest in that same campaign before a conversation opens."],
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
      <Link href="/join?role=brand" className="mt-8 inline-flex min-h-12 w-full items-center justify-center bg-ink px-5 text-sm text-paper sm:w-auto">
        Join as a brand
      </Link>
    </Shell>
  );
}
