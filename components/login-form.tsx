"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type FormState } from "@/lib/actions";
import { FormError, inputClass, labelClass, primaryButton } from "@/components/form-styles";

export function LoginForm({
  isGoogleConfigured = false,
  isSupabaseConfigured = false,
}: {
  isGoogleConfigured?: boolean;
  isSupabaseConfigured?: boolean;
}) {
  const [state, action, pending] = useActionState(login, {} as FormState);
  const [isAuthenticatingGoogle, setIsAuthenticatingGoogle] = useState(false);
  const [googleNotice, setGoogleNotice] = useState("");

  async function handleGoogleLogin() {
    setIsAuthenticatingGoogle(true);
    setGoogleNotice("");

    if (isGoogleConfigured) {
      window.location.href = "/api/auth/google";
      return;
    }

    setIsAuthenticatingGoogle(false);
    setGoogleNotice(
      "Google OAuth is ready to connect. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment to enable single sign-on. In the meantime, you can log in below using your email and password."
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* 1. Google One-Click Login */}
      <div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isAuthenticatingGoogle}
          className="flex min-h-12 w-full items-center justify-center gap-3 border border-ink bg-card px-4 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
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
          {isAuthenticatingGoogle ? "Connecting Google..." : "Continue with Google"}
        </button>

        {googleNotice ? (
          <div className="mt-3 border border-line bg-card p-3 text-xs leading-5 text-muted">
            <span className="font-semibold text-ink">Identity Notice: </span>
            {googleNotice}
          </div>
        ) : null}
      </div>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-line" />
        <span className="absolute bg-paper px-3 text-xs tracking-[0.14em] text-muted uppercase">
          Or with email
        </span>
      </div>

      {/* 2. Email & Password Login */}
      <form action={action} className="space-y-4">
        <label className={labelClass}>
          Email Address
          <input className={inputClass} name="email" type="email" placeholder="name@example.com" required />
        </label>
        <label className={labelClass}>
          Password
          <input className={inputClass} name="password" type="password" placeholder="••••••••" required />
        </label>
        <FormError error={state.error} />
        <button className={`${primaryButton} w-full`} disabled={pending}>
          {pending ? "Signing in…" : "Log in to INFURIZZ"}
        </button>
      </form>

      <p className="border-t border-line pt-4 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link className="font-medium text-ink underline underline-offset-4 hover:text-oxblood" href="/join">
          Join INFURIZZ
        </Link>
      </p>
    </div>
  );
}
