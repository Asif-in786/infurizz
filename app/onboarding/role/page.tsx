import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageIntro, Shell } from "@/components/page-intro";
import { RoleSelector } from "@/components/role-selector";
import { getCurrentUser } from "@/lib/current";

export const metadata: Metadata = { title: "Choose Your Role" };

export default async function OnboardingRolePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Prevent users with an already assigned role from changing it
  if (user.role === "CREATOR" || user.role === "BRAND") {
    redirect("/account");
  }

  return (
    <Shell>
      <PageIntro
        eyebrow="Onboarding"
        title="Choose your role."
        lede="Select whether you are joining INFURIZZ to offer creator services or to hire creators for brand campaigns. Once selected, your account role is permanent."
      />
      <div className="mt-10">
        <RoleSelector userEmail={user.email} />
      </div>
    </Shell>
  );
}
