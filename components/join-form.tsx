"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import { join, type FormState } from "@/lib/actions";
import { AUDIENCE_RANGES, CATEGORIES, PLATFORMS } from "@/lib/options";
import { FormError, inputClass, labelClass, primaryButton, quietButton } from "@/components/form-styles";

const initial: FormState = {};

export function JoinForm({
  initialRole,
  isGoogleConfigured = false,
  isSupabaseConfigured = false,
}: {
  initialRole?: string;
  isGoogleConfigured?: boolean;
  isSupabaseConfigured?: boolean;
}) {
  const [role, setRole] = useState(initialRole === "BRAND" ? "BRAND" : initialRole === "CREATOR" ? "CREATOR" : "");
  const [step, setStep] = useState(role ? 1 : 0);
  const [account, setAccount] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [isAuthenticatingGoogle, setIsAuthenticatingGoogle] = useState(false);
  const [googleNotice, setGoogleNotice] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState(join, initial);

  async function handleGoogleConnect() {
    setIsAuthenticatingGoogle(true);
    setGoogleNotice("");

    if (isGoogleConfigured) {
      window.location.href = "/api/auth/google";
      return;
    }

    setIsAuthenticatingGoogle(false);
    setGoogleNotice(
      "Google OAuth is ready to connect. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment for live one-click sign-in. You can also sign up immediately below with Email & Password."
    );
  }

  function handleContinueToProfile() {
    if (!account.name.trim()) {
      setPasswordError("Please enter your name.");
      return;
    }
    if (!account.email.trim() || !account.email.includes("@")) {
      setPasswordError("Please enter a valid email address.");
      return;
    }
    if (account.password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (account.password !== account.confirmPassword) {
      setPasswordError("Passwords do not match. Please verify your password confirmation.");
      return;
    }
    setPasswordError("");
    setStep(2);

    // Smooth scroll down to profile details
    setTimeout(() => {
      profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="space-y-10">
      {/* 1. Google Account Connection Card */}
      <div className="border border-line bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[11px] font-medium tracking-[0.18em] text-oxblood uppercase">Quick Sign Up</span>
            <h3 className="mt-1 font-serif text-2xl text-ink">Connect with Google Account</h3>
            <p className="mt-1 text-xs text-muted">
              Fast, secure authentication powered by Supabase &amp; Google Identity.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGoogleConnect}
            disabled={isAuthenticatingGoogle}
            className="inline-flex min-h-12 items-center justify-center gap-3 border border-ink bg-paper px-6 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {isAuthenticatingGoogle ? "Connecting Google..." : "Connect Google Account"}
          </button>
        </div>

        {googleNotice ? (
          <div className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
            <span className="font-semibold text-ink">Note: </span>
            {googleNotice}
          </div>
        ) : null}
      </div>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-line" />
        <span className="absolute bg-paper px-4 text-xs font-medium tracking-[0.18em] text-muted uppercase">
          Or Register with Email &amp; Password
        </span>
      </div>

      <form action={action} className="space-y-8">
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="name" value={account.name} />
        <input type="hidden" name="email" value={account.email} />
        <input type="hidden" name="password" value={account.password} />
        <input type="hidden" name="confirmPassword" value={account.confirmPassword} />

        {/* Step Navigation Indicator */}
        <ol className="flex gap-6 border-b border-line pb-3 text-xs tracking-[0.14em] text-muted uppercase">
          {[
            { id: 0, label: "01 Choose Role" },
            { id: 1, label: "02 Account Credentials" },
            { id: 2, label: "03 Profile Details" },
          ].map((item) => (
            <li
              key={item.id}
              className={`transition-colors ${
                step === item.id
                  ? "font-semibold text-oxblood border-b-2 border-oxblood pb-2 -mb-3"
                  : step > item.id
                  ? "text-ink"
                  : "text-muted"
              }`}
            >
              {item.label}
            </li>
          ))}
        </ol>

        {/* STEP 0: Select Role */}
        {step === 0 ? (
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-4 font-serif text-3xl">Who is joining?</legend>
            <button
              type="button"
              onClick={() => {
                setRole("CREATOR");
                setStep(1);
              }}
              className="group border border-line bg-card p-6 text-left transition-all hover:border-ink hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-[0.16em] text-oxblood uppercase">For Creators</span>
                <span className="text-xs text-muted group-hover:text-ink">Step 01 →</span>
              </div>
              <h4 className="mt-3 font-serif text-2xl text-ink">Creator Account</h4>
              <p className="mt-2 text-sm leading-6 text-muted">
                Build your profile, showcase social footprint &amp; portfolio, discover brand requirements, and submit pitches to earn.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("BRAND");
                setStep(1);
              }}
              className="group border border-line bg-card p-6 text-left transition-all hover:border-ink hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-[0.16em] text-oxblood uppercase">For Brands</span>
                <span className="text-xs text-muted group-hover:text-ink">Step 01 →</span>
              </div>
              <h4 className="mt-3 font-serif text-2xl text-ink">Brand Account</h4>
              <p className="mt-2 text-sm leading-6 text-muted">
                Publish campaign requirements, review creator applications &amp; rates, explore verified storefronts, and hire partners.
              </p>
            </button>
          </fieldset>
        ) : null}

        {/* STEP 1: Account Credentials & Double Password Confirmation */}
        {step === 1 ? (
          <div className="space-y-5 rounded border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-oxblood uppercase">
                  {role === "CREATOR" ? "Creator Account" : "Brand Account"}
                </span>
                <h3 className="mt-1 font-serif text-3xl text-ink">Create Your Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-xs text-muted underline underline-offset-4 hover:text-ink"
              >
                Change Role
              </button>
            </div>

            <label className={labelClass}>
              {role === "BRAND" ? "Brand / Company Name" : "Creator Display Name"}
              <input
                className={inputClass}
                value={account.name}
                placeholder={role === "BRAND" ? "e.g. Acme Studio" : "e.g. Alex Morgan"}
                onChange={(event) => setAccount({ ...account, name: event.target.value })}
                required
              />
            </label>

            <label className={labelClass}>
              Email Address
              <input
                className={inputClass}
                type="email"
                placeholder="name@example.com"
                value={account.email}
                onChange={(event) => setAccount({ ...account, email: event.target.value })}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Create Password
                <input
                  className={inputClass}
                  type="password"
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={account.password}
                  onChange={(event) => setAccount({ ...account, password: event.target.value })}
                  required
                />
              </label>

              <label className={labelClass}>
                Confirm Password
                <input
                  className={`${inputClass} ${
                    account.confirmPassword && account.password !== account.confirmPassword
                      ? "border-oxblood focus:border-oxblood"
                      : account.confirmPassword && account.password === account.confirmPassword
                      ? "border-emerald-600 focus:border-emerald-600"
                      : ""
                  }`}
                  type="password"
                  minLength={8}
                  placeholder="Re-enter password"
                  value={account.confirmPassword}
                  onChange={(event) => setAccount({ ...account, confirmPassword: event.target.value })}
                  required
                />
              </label>
            </div>

            {account.confirmPassword ? (
              <p
                className={`text-xs ${
                  account.password === account.confirmPassword ? "text-emerald-700" : "text-oxblood font-medium"
                }`}
              >
                {account.password === account.confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match yet"}
              </p>
            ) : (
              <p className="text-xs text-muted">
                Please type your password two times to ensure there are no typos.
              </p>
            )}

            {passwordError ? <p className="text-xs text-oxblood font-medium">{passwordError}</p> : null}

            <div className="flex gap-3 pt-2">
              <button type="button" className={quietButton} onClick={() => setStep(0)}>
                ← Back
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={handleContinueToProfile}
              >
                Scroll to Profile Details ↓
              </button>
            </div>
          </div>
        ) : null}

        {/* STEP 2: Profile Details & Final Submission */}
        {step === 2 ? (
          <div ref={profileRef} className="space-y-6 rounded border border-line bg-card p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-semibold tracking-wider text-oxblood uppercase">
                  {role === "CREATOR" ? "Creator Profile Details" : "Brand Profile Details"}
                </span>
                <h3 className="mt-1 font-serif text-3xl text-ink">
                  {role === "BRAND" ? "About Your Brand" : "Showcase Your Profile"}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {role === "CREATOR"
                    ? "Brands will review this information when you apply to their requirements."
                    : "Creators will review this information when viewing your requirements and applying."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-muted underline underline-offset-4 hover:text-ink"
              >
                Edit Account
              </button>
            </div>

            <label className={labelClass}>
              {role === "BRAND" ? "Company / Brand Story" : "Creator Bio"}
              <textarea
                className={inputClass}
                name="bio"
                rows={4}
                placeholder={
                  role === "BRAND"
                    ? "Tell creators what your brand stands for, your core mission, and what kind of partnerships you look for."
                    : "Describe what you create, your creative style, your audience vibe, and topics you cover."
                }
                required
              />
            </label>

            <label className={labelClass}>
              Location / Base
              <input
                className={inputClass}
                name="location"
                placeholder="e.g. New York, London, Mumbai, or Remote / Global"
                required
              />
            </label>

            {role === "CREATOR" ? <CreatorFields /> : null}

            <FormError error={state.error} />

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" className={quietButton} onClick={() => setStep(1)}>
                ← Back to Credentials
              </button>
              <button className={primaryButton} disabled={pending}>
                {pending
                  ? "Setting up account…"
                  : role === "CREATOR"
                  ? "Complete & Explore Brand Requirements →"
                  : "Complete & Post Requirements →"}
              </button>
            </div>
          </div>
        ) : null}
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-medium text-ink underline underline-offset-4 hover:text-oxblood" href="/login">
          Log in here
        </Link>
      </p>
    </div>
  );
}

function CreatorFields() {
  return (
    <div className="space-y-5 border-t border-line pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Primary Category
          <select className={inputClass} name="category" required defaultValue="">
            <option value="" disabled>
              Select Category
            </option>
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Specific Niche
          <input className={inputClass} name="niche" placeholder="e.g. Minimalist Tech, Weeknight Baking" required />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Audience Range
          <select className={inputClass} name="audienceRange" required defaultValue="">
            <option value="" disabled>
              Select Audience Size
            </option>
            {AUDIENCE_RANGES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Collaboration Preferences
          <input
            className={inputClass}
            name="collabPrefs"
            placeholder="e.g. Dedicated videos, reels, honest reviews"
            required
          />
        </label>
      </div>

      <fieldset className="space-y-4 border border-line bg-paper p-4">
        <legend className="px-2 text-xs font-semibold tracking-wider text-ink uppercase">
          Social Platforms &amp; Handles
        </legend>
        <p className="text-xs text-muted">
          Add at least one platform where brands can check out your content.
        </p>
        <div className="space-y-3">
          {PLATFORMS.map((platform) => (
            <div key={platform} className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
              <label className={labelClass}>
                {platform} Handle
                <input className={inputClass} name={`handle:${platform}`} placeholder="@username" />
              </label>
              <label className={labelClass}>
                {platform} Details / Note
                <input className={inputClass} name={`note:${platform}`} placeholder="e.g. 25k followers, 8% ER" />
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
