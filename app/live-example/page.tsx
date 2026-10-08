import type { Metadata } from "next";
import { PageIntro, Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";
import { LiveExampleExperience } from "@/components/live-example-experience";

export const metadata: Metadata = {
  title: "Live Example — INFURIZZ",
  description:
    "See how INFURIZZ turns creator profiles and platform performance into one unified creator identity and analytics experience.",
  alternates: {
    canonical: "https://infurizzv1.vercel.app/live-example",
  },
  openGraph: {
    title: "Live Example — INFURIZZ",
    description:
      "See how INFURIZZ turns creator profiles and platform performance into one unified creator identity and analytics experience.",
    url: "https://infurizzv1.vercel.app/live-example",
    siteName: "INFURIZZ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Example — INFURIZZ",
    description:
      "See how INFURIZZ turns creator profiles and platform performance into one unified creator identity and analytics experience.",
  },
};

export default async function LiveExamplePage() {
  const user = await getCurrentUser();

  const initialUser = user
    ? {
        id: user.id,
        email: user.email,
        role: user.role,
        creator: user.creator
          ? {
              id: user.creator.id,
              name: user.creator.name,
              bio: user.creator.bio,
              avatarUrl: user.creator.avatarUrl,
              category: user.creator.category,
              location: user.creator.location,
              niche: user.creator.niche,
              audienceRange: user.creator.audienceRange,
              collabPrefs: user.creator.collabPrefs,
              socials: user.creator.socials?.map((s) => ({
                platform: s.platform,
                handle: s.handle,
              })),
            }
          : null,
      }
    : null;

  return (
    <Shell>
      <PageIntro
        eyebrow="Interactive Demonstration · Multi-Platform Architecture"
        title="Live Unified Creator Analytics."
        lede="Experience how INFURIZZ reconciles multi-platform creator identities, official platform data feeds, and verified performance provenance into a single command layer."
      />

      <div className="mt-10">
        <LiveExampleExperience initialUser={initialUser} />
      </div>
    </Shell>
  );
}
