"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user.role === "CREATOR") {
          router.push("/creator/dashboard");
        } else {
          router.push("/brand/discover");
        }
        router.refresh();
      } else {
        setError(data.error || "Invalid email or credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection failure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center justify-center py-2 group" aria-label="INFURIZZ Home">
            <Logo size="lg" priority />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Sign in to access your verified creator presence or brand workspace
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Standard Login Form */}
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sign In with Credentials</CardTitle>
            <CardDescription className="text-xs">Enter your registered email address and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">Password</label>
                  <span className="text-[11px] text-zinc-400">Account password</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#e90000] focus:ring-1 focus:ring-[#e90000] focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full text-xs gap-2">
                <span>{loading ? "Authenticating..." : "Sign In to INFURIZZ"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-500 border-t border-zinc-100 pt-4">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="text-[#e90000] hover:text-[#cc0000] font-medium hover:underline">
                Create Free Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
