import type { Metadata } from "next";
import Image from "next/image";
import { JoinForm } from "@/components/join-form";
import { PageIntro, Shell } from "@/components/page-intro";
import { isGoogleOAuthConfigured } from "@/lib/auth/oauth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Join INFURIZZ · Creator & Brand Network",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = params.role?.toLowerCase();
  const googleConfigured = isGoogleOAuthConfigured();
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <Shell>
      <div className="mb-4">
        <Image
          src="/brand/infurizz-mark.png"
          alt="INFURIZZ"
          width={44}
          height={44}
          className="h-10 w-auto object-contain transition-transform duration-300 hover:rotate-6 hover:scale-105"
          priority
        />
      </div>
      <PageIntro
        eyebrow="Join INFURIZZ"
        title="Connect &amp; Start Collaborating"
        lede="Sign up as a creator to discover brand requirements and pitch your services, or register as a brand to publish campaign briefs and partner with talent."
      />
      <div className="mt-10 max-w-2xl">
        <JoinForm
          initialRole={role === "brand" ? "BRAND" : role === "creator" ? "CREATOR" : undefined}
          isGoogleConfigured={googleConfigured}
          isSupabaseConfigured={supabaseConfigured}
        />
      </div>
    </Shell>
  );
}
