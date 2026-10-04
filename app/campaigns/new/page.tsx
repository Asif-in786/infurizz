import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CampaignForm } from "@/components/campaign-form";
import { PageIntro, Shell } from "@/components/page-intro";
import { getCurrentUser } from "@/lib/current";

export const metadata: Metadata = {
  title: "New Campaign",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewCampaignPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.brand) redirect("/account");

  return (
    <Shell>
      <PageIntro
        eyebrow={user.brand.name}
        title="New campaign"
        lede="These fields are what discovery and compatibility use. There is no separate scoring system."
      />
      <div className="mt-10 max-w-2xl">
        <CampaignForm mode="create" />
      </div>
    </Shell>
  );
}
