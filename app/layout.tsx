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
  metadataBase: new URL("https://infurizzv1.vercel.app"),
  title: {
    default: "INFURIZZ — Creator Marketplace & Brand Collaboration Platform",
    template: "%s · INFURIZZ",
  },
  description:
    "Discover creators, launch campaigns, and build meaningful brand collaborations through one creator identity platform. Transparent briefs, verified storefronts, and multi-platform analytics.",
  keywords: [
    "creator marketplace",
    "creator discovery",
    "influencer marketing",
    "creator-brand collaboration",
    "creator profiles",
    "brand campaigns",
    "campaign matching",
    "creator analytics",
    "creator identity",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://infurizzv1.vercel.app",
    siteName: "INFURIZZ",
    title: "INFURIZZ — Creator Marketplace & Brand Collaboration Platform",
    description:
      "Discover creators, launch campaigns, and build meaningful brand collaborations through one creator identity platform.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "INFURIZZ — Creator Marketplace & Brand Collaboration Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "INFURIZZ — Creator Marketplace & Brand Collaboration Platform",
    description:
      "Discover creators, launch campaigns, and build meaningful brand collaborations through one creator identity platform.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
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
