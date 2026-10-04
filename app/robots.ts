import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/analytics",
          "/messages",
          "/conversations",
          "/conversations/",
          "/proposals",
          "/matches",
          "/matches/",
          "/orders",
          "/orders/",
          "/onboarding",
          "/onboarding/",
          "/campaigns/new",
          "/api/",
        ],
      },
    ],
    sitemap: "https://infurizzv1.vercel.app/sitemap.xml",
    host: "https://infurizzv1.vercel.app",
  };
}
