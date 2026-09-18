import { CreatorProfile as PrismaCreatorProfile, SocialAccount as PrismaSocialAccount } from "@prisma/client";
import { AggregatedAudienceMetrics } from "./metrics";

export type CreatorCategory =
  | "Tech & Software"
  | "Lifestyle & Travel"
  | "Fashion & Beauty"
  | "Gaming & Esports"
  | "Finance & Crypto"
  | "Health & Fitness"
  | "Entertainment"
  | "Education";

export interface CreatorProfileDetail extends PrismaCreatorProfile {
  socialAccounts: PrismaSocialAccount[];
  metrics?: AggregatedAudienceMetrics;
}

export interface CreatorFilterOptions {
  category?: string;
  minReach?: number;
  maxReach?: number;
  platforms?: string[];
  searchQuery?: string;
}
