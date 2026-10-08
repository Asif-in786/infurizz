import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://infurizzv1.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/brands`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/campaigns`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/for-creators`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/for-brands`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/live-example`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    const [creators, brands, campaigns] = await Promise.all([
      prisma.creator.findMany({
        select: { id: true, updatedAt: true },
      }),
      prisma.brand.findMany({
        select: { id: true, updatedAt: true },
      }),
      prisma.campaign.findMany({
        where: {
          status: { in: ["Open", "PUBLISHED", "Published"] },
        },
        select: { id: true, updatedAt: true },
      }),
    ]);

    const creatorRoutes: MetadataRoute.Sitemap = creators.map((creator) => ({
      url: `${BASE_URL}/creators/${creator.id}`,
      lastModified: creator.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
      url: `${BASE_URL}/brands/${brand.id}`,
      lastModified: brand.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const campaignRoutes: MetadataRoute.Sitemap = campaigns.map((campaign) => ({
      url: `${BASE_URL}/campaigns/${campaign.id}`,
      lastModified: campaign.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [...staticRoutes, ...creatorRoutes, ...brandRoutes, ...campaignRoutes];
  } catch (error) {
    console.error("[Sitemap] Error fetching dynamic routes:", error);
    return staticRoutes;
  }
}
