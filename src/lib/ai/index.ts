import { CreatorCategory } from "@/types/creator";
import { BrandIndustry } from "@/types/brand";

export interface MatchFactor {
  name: string;
  weight: number;
  score: number; // 0 to 100
  reason: string;
}

export interface CreatorBrandMatchResult {
  creatorId: string;
  brandId: string;
  overallScore: number; // 0 to 100
  matchTier: "EXCELLENT" | "STRONG" | "MODERATE" | "LOW";
  factors: MatchFactor[];
  recommendedCampaignTypes: string[];
}

export interface AudienceQualityReport {
  creatorId: string;
  overallQualityScore: number; // 0 to 100
  estimatedAuthenticAudiencePct: number;
  suspiciousActivityDetected: boolean;
  notes: string[];
}

/**
 * Interface contract for AI matching between Brands and Creators.
 * Ready for Gemini, Claude, or OpenAI integration.
 */
export interface AICreatorBrandMatcher {
  calculateMatch(
    creator: { id: string; category?: CreatorCategory; totalReach: number; bio?: string },
    brand: { id: string; industry?: BrandIndustry; description?: string }
  ): Promise<CreatorBrandMatchResult>;
}

/**
 * Interface contract for AI audience-quality analysis.
 */
export interface AIAudienceQualityAnalyzer {
  analyze(creatorId: string): Promise<AudienceQualityReport>;
}

/**
 * Development Stub for Creator-Brand Matching
 */
export class DevCreatorBrandMatcher implements AICreatorBrandMatcher {
  async calculateMatch(
    creator: { id: string; category?: CreatorCategory; totalReach: number; bio?: string },
    brand: { id: string; industry?: BrandIndustry; description?: string }
  ): Promise<CreatorBrandMatchResult> {
    return {
      creatorId: creator.id,
      brandId: brand.id,
      overallScore: 92,
      matchTier: "STRONG",
      factors: [
        {
          name: "Audience Alignment",
          weight: 0.4,
          score: 95,
          reason: "High topical overlap between brand industry and creator audience demographics.",
        },
        {
          name: "Engagement Consistency",
          weight: 0.3,
          score: 88,
          reason: "Stable engagement rates across multiple active platforms.",
        },
        {
          name: "Reach Tier",
          weight: 0.3,
          score: 92,
          reason: "Reach matches target tier of the brand.",
        },
      ],
      recommendedCampaignTypes: ["Dedicated Video", "Cross-Platform Product Launch", "Sponsored Series"],
    };
  }
}

export const devCreatorBrandMatcher = new DevCreatorBrandMatcher();
