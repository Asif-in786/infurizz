import { BrandProfile as PrismaBrandProfile } from "@prisma/client";

export type BrandIndustry =
  | "Consumer Tech"
  | "SaaS & Enterprise"
  | "Fashion & Apparel"
  | "Food & Beverage"
  | "Gaming"
  | "Finance & FinTech"
  | "Health & Wellness";

export interface BrandProfileDetail extends PrismaBrandProfile {
  activeCollaborationsCount?: number;
}
