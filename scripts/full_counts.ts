import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const [
      users,
      creators,
      brands,
      campaigns,
      applications,
      interests,
      matches,
      conversations,
      messages,
      posts,
      reactions,
      comments,
      socialAccounts,
      metricSnapshots,
      audienceSnapshots,
      contentItems,
      socialProfiles,
      services,
      portfolioItems,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.creator.count(),
      prisma.brand.count(),
      prisma.campaign.count(),
      prisma.campaignApplication.count(),
      prisma.interest.count(),
      prisma.match.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.post.count(),
      prisma.postReaction.count(),
      prisma.postComment.count(),
      prisma.socialAccount.count(),
      prisma.socialMetricSnapshot.count(),
      prisma.socialAudienceSnapshot.count(),
      prisma.socialContentItem.count(),
      prisma.socialProfile.count(),
      prisma.creatorService.count(),
      prisma.creatorPortfolioItem.count(),
    ]);

    console.log(JSON.stringify({
      users,
      creators,
      brands,
      campaigns,
      applications,
      interests,
      matches,
      conversations,
      messages,
      posts,
      reactions,
      comments,
      socialAccounts,
      metricSnapshots,
      audienceSnapshots,
      contentItems,
      socialProfiles,
      services,
      portfolioItems,
    }, null, 2));
  } catch (err) {
    console.error("Count error:", err instanceof Error ? err.message : String(err));
  } finally {
    await prisma.$disconnect();
  }
}

main();
