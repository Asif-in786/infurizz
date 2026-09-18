import { SocialAccount } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { AggregatedAudienceMetrics } from "@/types/metrics";

/**
 * Service for calculating unified creator audience and engagement statistics
 * across all connected social channels.
 */
export class AudienceAggregator {
  /**
   * Pure aggregation function from an array of social accounts.
   */
  public static calculate(accounts: SocialAccount[]): AggregatedAudienceMetrics {
    const activeAccounts = accounts.filter((a) => a.isConnected);

    const totalReach = activeAccounts.reduce((sum, a) => sum + a.followersCount, 0);

    // Weighted average engagement rate based on follower size
    let weightedEngagementSum = 0;
    activeAccounts.forEach((acc) => {
      weightedEngagementSum += acc.followersCount * acc.engagementRate;
    });

    const avgEngagementRate =
      totalReach > 0
        ? Number((weightedEngagementSum / totalReach).toFixed(2))
        : 0;

    const platformBreakdown = activeAccounts.map((acc) => ({
      platform: acc.platform,
      followersCount: acc.followersCount,
      percentageOfTotal:
        totalReach > 0 ? Number(((acc.followersCount / totalReach) * 100).toFixed(1)) : 0,
      engagementRate: acc.engagementRate,
    }));

    // Sort platform breakdown descending by followers
    platformBreakdown.sort((a, b) => b.followersCount - a.followersCount);

    return {
      totalReach,
      totalPlatforms: activeAccounts.length,
      avgEngagementRate,
      platformBreakdown,
      lastUpdated: new Date(),
    };
  }

  /**
   * Recalculates and updates the creator's aggregated profile metrics in the database.
   */
  public static async refreshCreatorMetrics(creatorId: string): Promise<AggregatedAudienceMetrics> {
    const accounts = await prisma.socialAccount.findMany({
      where: { creatorId, isConnected: true },
    });

    const metrics = this.calculate(accounts);

    // Update CreatorProfile with aggregated values
    await prisma.creatorProfile.update({
      where: { id: creatorId },
      data: {
        totalReach: metrics.totalReach,
        avgEngagementRate: metrics.avgEngagementRate,
      },
    });

    // Record snapshot for audience growth history
    await prisma.audienceSnapshot.create({
      data: {
        creatorId,
        platform: null, // Unified total
        followersCount: metrics.totalReach,
      },
    });

    return metrics;
  }
}
