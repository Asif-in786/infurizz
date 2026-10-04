import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { PageIntro, Shell } from "@/components/page-intro";
import { isGoogleOAuthConfigured } from "@/lib/auth/oauth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Log in · INFURIZZ",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  const googleConfigured = isGoogleOAuthConfigured();
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <Shell>
      <div className="mx-auto max-w-md">
        <PageIntro eyebrow="Account Access" title="Welcome back." lede="Log in with Google or your email credentials to access your creator or brand dashboard." />
        <div className="mt-8">
          <LoginForm isGoogleConfigured={googleConfigured} isSupabaseConfigured={supabaseConfigured} />
        </div>
      </div>
    </Shell>
  );
}
