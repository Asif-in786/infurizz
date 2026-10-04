import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getCurrentUser } from "@/lib/current";
import "./globals.css";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-family",
});

const serif = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-serif-family",
});

export const metadata: Metadata = {
  title: {
    default: "INFURIZZ",
    template: "%s · INFURIZZ",
  },
  description: "Find the right creator. Find the right brand.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#efeae2",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const name = user?.creator?.name ?? user?.brand?.name ?? null;
  const role = user?.role ?? null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <SiteHeader signedIn={Boolean(user)} name={name} role={role} />
        <main className="flex-1 page-enter">{children}</main>
        <SiteFooter role={role} />
      </body>
    </html>
  );
}
