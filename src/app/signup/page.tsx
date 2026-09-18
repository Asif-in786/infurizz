"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Building2, ArrowRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/common/Logo";
import { clsx } from "clsx";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"CREATOR" | "BRAND">("CREATOR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          name,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (role === "CREATOR") {
          router.push(`/onboarding/creator?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
        } else {
          router.push(`/onboarding/brand?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
        }
      } else {
        setError(data.error || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error while creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center justify-center py-2 group" aria-label="INFURIZZ Home">
            <Logo size="lg" priority />
          </Link>
          <div className="flex justify-center">
            <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-700 text-xs">
              Free Pioneer Access
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">Create Your Account</h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Select your account type to access specialized tools and workflows
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole("CREATOR")}
            className={clsx(
              "p-5 rounded-xl border text-left transition-all cursor-pointer relative",
              role === "CREATOR"
                ? "border-[#e90000] bg-white ring-2 ring-[#e90000]/10 shadow-xs"
                : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600"
            )}
          >
            {role === "CREATOR" && (
              <div className="absolute top-3.5 right-3.5 h-5 w-5 rounded-full bg-[#e90000] flex items-center justify-center text-white">
                <Check className="h-3 w-3" />
              </div>
            )}
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 w-fit mb-3">
              <Users className="h-5 w-5" />
            </div>
            <div className="font-bold text-zinc-950 text-sm">I am a Creator</div>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Unify multi-platform reach and manage brand collaboration proposals
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRole("BRAND")}
            className={clsx(
              "p-5 rounded-xl border text-left transition-all cursor-pointer relative",
              role === "BRAND"
                ? "border-[#e90000] bg-white ring-2 ring-[#e90000]/10 shadow-xs"
                : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600"
            )}
          >
            {role === "BRAND" && (
              <div className="absolute top-3.5 right-3.5 h-5 w-5 rounded-full bg-[#e90000] flex items-center justify-center text-white">
                <Check className="h-3 w-3" />
              </div>
            )}
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 w-fit mb-3">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-bold text-zinc-950 text-sm">I am a Brand</div>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Discover verified creators and send direct collaboration proposals
            </p>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  {role === "CREATOR" ? "Full Name or Creator Handle" : "Your Name / Brand Contact"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "CREATOR" ? "e.g. Jordan Lee" : "e.g. Acme Corp"}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@domain.com"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Create Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full gap-2 mt-4 font-semibold">
                <span>{loading ? "Creating Account..." : `Continue to ${role === "CREATOR" ? "Creator" : "Brand"} Onboarding`}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#e90000] hover:text-[#cc0000] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
