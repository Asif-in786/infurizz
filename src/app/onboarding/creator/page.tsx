"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/common/Logo";
import { PlatformIcon } from "@/components/common/PlatformIcon";

function CreatorOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryName = searchParams.get("name") || "";
  const queryEmail = searchParams.get("email") || "";

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(queryName);
  const [handle, setHandle] = useState(queryName ? queryName.toLowerCase().replace(/[^a-z0-9]/g, "") : "");
  const [email, setEmail] = useState(queryEmail || (queryName ? `${queryName.toLowerCase().replace(/[^a-z0-9]/g, "")}@infurizz.creator` : ""));
  const [category, setCategory] = useState("Tech & Software");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [ratesSummary, setRatesSummary] = useState("");
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({
    Instagram: true,
    YouTube: false,
    X: false,
    Facebook: false,
    LinkedIn: false,
    WhatsAppChannel: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (name: string) => {
    setConnectedPlatforms((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const finishOnboarding = async () => {
    setLoading(true);
    setError(null);

    const chosenPlatforms = Object.keys(connectedPlatforms).filter((k) => connectedPlatforms[k]);

    try {
      const res = await fetch("/api/onboarding/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          email,
          handle,
          displayName,
          bio,
          category,
          location,
          ratesSummary,
          platforms: chosenPlatforms,
          selectedPlatforms: chosenPlatforms,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/creator/dashboard");
        router.refresh();
      } else {
        setError(data.error?.fieldErrors ? JSON.stringify(data.error.fieldErrors) : (data.error || "Failed to save profile."));
      }
    } catch (err) {
      console.error(err);
      setError("Network error saving creator onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center pb-1">
          <Link href="/" className="inline-flex items-center group py-1" aria-label="INFURIZZ Home">
            <Logo size="md" priority />
          </Link>
        </div>
        <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-700 text-xs">
          Creator Onboarding &bull; Step {step} of 2
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
          {step === 1 ? "Set Up Your Creator Identity" : "Connect Social Platform Channels"}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
          {step === 1
            ? "One Creator. Multiple Platforms. One Identity. Set up your verified media kit for brand deals."
            : "Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed."}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {step === 1 ? (
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Profile Essentials</CardTitle>
            <CardDescription className="text-xs">Customize your public handle and creator category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivers"
                className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Creator Handle (Unique URL)</label>
              <div className="flex items-center rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs">
                <span className="text-zinc-400">infurizz.com/</span>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="flex-1 bg-transparent text-zinc-900 focus:outline-none ml-0.5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Primary Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
              >
                <option value="Tech & Software">Tech & Software</option>
                <option value="Gaming & Esports">Gaming & Esports</option>
                <option value="Fashion & Beauty">Fashion & Beauty</option>
                <option value="Finance & Crypto">Finance & Crypto</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Lifestyle & Travel">Lifestyle & Travel</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Rates Summary</label>
              <input
                type="text"
                value={ratesSummary}
                onChange={(e) => setRatesSummary(e.target.value)}
                placeholder="$2,500 - $6,000 / integration"
                className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Short Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none leading-relaxed"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setStep(2)}
              className="w-full text-xs gap-2 mt-4"
            >
              <span>Continue to Connect Channels</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Link Social Platforms</CardTitle>
            <CardDescription className="text-xs">
              Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Instagram", platform: "INSTAGRAM", count: "600K Followers (Demo)" },
              { name: "YouTube", platform: "YOUTUBE", count: "30K Subscribers (Demo)" },
              { name: "X", platform: "X_TWITTER", count: "120K Followers (Demo)" },
              { name: "Facebook", platform: "FACEBOOK", count: "250K Followers (Demo)" },
              { name: "LinkedIn", platform: "LINKEDIN", count: "80K Followers (Demo)" },
              { name: "WhatsAppChannel", platform: "WHATSAPP_CHANNEL", count: "400K Followers (Demo)" },
            ].map((plat) => {
              const isConnected = connectedPlatforms[plat.name];
              return (
                <div
                  key={plat.name}
                  onClick={() => togglePlatform(plat.name)}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white border border-zinc-200 text-zinc-800 shadow-xs">
                      <PlatformIcon platform={plat.platform} className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">
                        {plat.name === "WhatsAppChannel" ? "WhatsApp Channel" : plat.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">{plat.count}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-xs text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#E90000]" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 border border-zinc-200 bg-white px-2 py-0.5 rounded-md hover:text-zinc-900">
                        + Link
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setStep(1)} className="text-xs">
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={loading}
                onClick={finishOnboarding}
                className="flex-1 text-xs gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{loading ? "Persisting Profile..." : "Complete Onboarding"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CreatorOnboardingPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-zinc-500">Loading onboarding wizard...</div>}>
        <CreatorOnboardingForm />
      </Suspense>
    </div>
  );
}
