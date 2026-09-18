"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, Building2, Globe, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/common/Logo";

function BrandOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryName = searchParams.get("name") || "";
  const queryEmail = searchParams.get("email") || "";

  const [companyName, setCompanyName] = useState(queryName);
  const [email, setEmail] = useState(queryEmail || (queryName ? `partnerships@${queryName.toLowerCase().replace(/[^a-z0-9]/g, "")}.io` : ""));
  const [industry, setIndustry] = useState("Consumer Tech");
  const [website, setWebsite] = useState(queryName ? `https://${queryName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "");
  const [budgetRange, setBudgetRange] = useState("$25,000 - $100,000 / quarter");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          email,
          companyName,
          industry,
          website,
          budgetRange,
          description,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/brand/dashboard");
        router.refresh();
      } else {
        setError(data.error?.fieldErrors ? JSON.stringify(data.error.fieldErrors) : (data.error || "Failed to save brand profile."));
      }
    } catch (err) {
      console.error(err);
      setError("Network error saving brand onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center pb-1">
          <Link href="/" className="inline-flex items-center group py-1" aria-label="INFURIZZ Home">
            <Logo size="md" priority />
          </Link>
        </div>
        <Badge variant="default" className="border-zinc-200 bg-zinc-100 text-zinc-700 text-[11px] font-medium">
          Brand Onboarding
        </Badge>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-sans">Set Up Your Brand Profile</h1>
        <p className="text-xs text-zinc-500 font-sans">
          Creators will see this information when reviewing your direct collaboration proposals
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900">Company & Partnership Details</CardTitle>
          <CardDescription className="text-xs text-zinc-500">Tell creators about your organization and sponsorship scope</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={finishOnboarding} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Partnership Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="Consumer Tech">Consumer Tech</option>
                <option value="SaaS & Enterprise">SaaS & Enterprise</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Gaming">Gaming</option>
                <option value="Finance & FinTech">Finance & FinTech</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Food & Beverage">Food & Beverage</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Company Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Quarterly Creator Budget Range</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                >
                  <option value="Under $10,000 / quarter">Under $10,000 / quarter</option>
                  <option value="$10,000 - $25,000 / quarter">$10,000 - $25,000 / quarter</option>
                  <option value="$25,000 - $100,000 / quarter">$25,000 - $100,000 / quarter</option>
                  <option value="$100,000+ / quarter">$100,000+ / quarter</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Company Description & Mission</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full text-xs font-medium gap-2 mt-4"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{loading ? "Persisting Brand..." : "Launch Brand Dashboard"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BrandOnboardingPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs font-mono text-zinc-500">Loading brand wizard...</div>}>
        <BrandOnboardingForm />
      </Suspense>
    </div>
  );
}
