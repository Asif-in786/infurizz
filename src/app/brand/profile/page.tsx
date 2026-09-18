import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Globe,
  MapPin,
  DollarSign,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { EditBrandProfileModal } from "@/components/brand/EditBrandProfileModal";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BrandProfilePage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      brandProfile: {
        include: {
          campaigns: { orderBy: { createdAt: "desc" } },
          collaborations: {
            include: { creator: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role === Role.CREATOR) {
    redirect("/creator/dashboard");
  }

  if (!user.brandProfile) {
    redirect("/onboarding/brand");
  }

  const brand = user.brandProfile;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Brand Header Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-zinc-50 border border-zinc-200 p-1 shrink-0 overflow-hidden shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logoUrl || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400"}
                alt={brand.companyName}
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                  {brand.companyName}
                </h1>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700 gap-1 text-[11px] py-0.5">
                  <ShieldCheck className="h-3 w-3 text-[#E90000]" />
                  Verified Brand
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">{brand.industry}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {brand.location}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" />
                  <a href={brand.website || "#"} target="_blank" rel="noreferrer" className="hover:text-zinc-900 underline">
                    {brand.website}
                  </a>
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-zinc-700" />
                  {brand.budgetRange}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditBrandProfileModal
              brandId={brand.id}
              initialData={{
                companyName: brand.companyName,
                industry: brand.industry,
                location: brand.location,
                website: brand.website,
                budgetRange: brand.budgetRange,
                description: brand.description,
                logoUrl: brand.logoUrl,
              }}
            />
            <Link href="/brand/campaigns">
              <Button variant="primary" size="sm" className="gap-1.5 text-xs font-semibold">
                <Megaphone className="h-3.5 w-3.5" />
                Manage Campaigns
              </Button>
            </Link>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl border-t border-zinc-100 pt-4">
          {brand.description}
        </p>

        {/* Highlight Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-zinc-100 pt-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-xs text-zinc-500">Active Campaigns</span>
            <div className="text-2xl font-bold text-zinc-900 mt-1">
              {brand.campaigns.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-xs text-zinc-500">Partnered Creators</span>
            <div className="text-2xl font-bold text-zinc-900 mt-1">
              {brand.collaborations.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-xs text-zinc-500">Platform Tier</span>
            <div className="text-2xl font-bold text-[#E90000] mt-1">
              Free Pioneer
            </div>
          </div>
        </div>
      </div>

      {/* Active Brand Campaigns */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900">Active Marketing Campaigns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brand.campaigns.map((c) => (
            <Card key={c.id} className="p-5 bg-white border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 text-sm">{c.title}</h4>
                <Badge variant="outline" className="text-[10px] border-zinc-200 bg-zinc-50 text-zinc-700">
                  {c.status}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{c.description}</p>
              <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                <span>Budget: <strong className="text-zinc-900 font-mono">${c.budget?.toLocaleString()}</strong></span>
                <span>Category: <strong className="text-zinc-700">{c.targetCategory}</strong></span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
