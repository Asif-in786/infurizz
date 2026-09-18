import { PrismaClient, Role, SocialPlatform, CollaborationStatus, CampaignStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    console.log("🛑 Demo seeding is DISABLED to protect production Supabase database.");
    console.log("   INFURIZZ operates on real user data. Seeding aborted.");
    return;
  }

  console.log("🌱 Starting INFURIZZ database seeding...");

  // Clean existing tables in proper order
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.collaboration.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.performanceMetric.deleteMany();
  await prisma.audienceSnapshot.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned database.");

  // ---------------------------------------------------------------------------
  // 1. CANONICAL DEMO CREATOR: Sarah Chen (~1.48M Reach)
  // ---------------------------------------------------------------------------
  const sarahUser = await prisma.user.create({
    data: {
      id: "usr_creator_sarah",
      email: "sarah.chen@infurizz.internal",
      name: "Sarah Chen",
      role: Role.CREATOR,
    },
  });

  const sarahProfile = await prisma.creatorProfile.create({
    data: {
      id: "cprof_sarah_chen",
      userId: sarahUser.id,
      handle: "sarahchen",
      displayName: "Sarah Chen",
      bio: "Tech reviewer, design strategist, and modern lifestyle creator. Exploring future interfaces, productivity gear, and startup stories.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      category: "Tech & Software",
      location: "San Francisco, CA",
      website: "https://sarahchen.me",
      contactEmail: "collaborations@sarahchen.me",
      ratesSummary: "$2,500 - $8,000 per multi-platform package",
      isVerified: true,
      totalReach: 1480000,
      avgEngagementRate: 4.85,
    },
  });

  // The prompt's canonical breakdown:
  // Instagram: 600K, YouTube: 30K, X: 120K, Facebook: 250K, LinkedIn: 80K, WhatsApp Channel: 400K
  const sarahAccounts = [
    {
      platform: SocialPlatform.INSTAGRAM,
      platformAccountId: "ig_sarah_01",
      username: "sarah_creates",
      profileUrl: "https://instagram.com/sarah_creates",
      followersCount: 600000,
      followingCount: 850,
      postsCount: 420,
      engagementRate: 3.85,
      metricsJson: JSON.stringify({
        avgLikes: 23100,
        avgComments: 890,
        storyViews: 85000,
        reelsAvgReach: 140000,
      }),
    },
    {
      platform: SocialPlatform.YOUTUBE,
      platformAccountId: "yt_sarah_02",
      username: "sarahchenvlogs",
      profileUrl: "https://youtube.com/@sarahchenvlogs",
      followersCount: 30000,
      followingCount: 0,
      postsCount: 94,
      engagementRate: 7.2,
      metricsJson: JSON.stringify({
        avgVideoViews: 18500,
        subscribers30Days: "+1,200",
        avgWatchTimeMinutes: 8.4,
      }),
    },
    {
      platform: SocialPlatform.X_TWITTER,
      platformAccountId: "x_sarah_03",
      username: "sarahchen",
      profileUrl: "https://x.com/sarahchen",
      followersCount: 120000,
      followingCount: 420,
      postsCount: 3200,
      engagementRate: 2.45,
      metricsJson: JSON.stringify({
        impressions30Days: 1400000,
        retweetsAvg: 110,
        profileVisits30Days: 42000,
      }),
    },
    {
      platform: SocialPlatform.FACEBOOK,
      platformAccountId: "fb_sarah_04",
      username: "SarahChenOfficial",
      profileUrl: "https://facebook.com/SarahChenOfficial",
      followersCount: 250000,
      followingCount: 15,
      postsCount: 680,
      engagementRate: 1.95,
      metricsJson: JSON.stringify({
        pageReach30Days: 850000,
        pageEngagement30Days: 45000,
      }),
    },
    {
      platform: SocialPlatform.LINKEDIN,
      platformAccountId: "li_sarah_05",
      username: "sarah-chen-creator",
      profileUrl: "https://linkedin.com/in/sarah-chen-creator",
      followersCount: 80000,
      followingCount: 500,
      postsCount: 210,
      engagementRate: 4.15,
      metricsJson: JSON.stringify({
        topIndustry: "Software & Technology",
        avgArticleViews: 12000,
        newsletterSubscribers: 15000,
      }),
    },
    {
      platform: SocialPlatform.WHATSAPP_CHANNEL,
      platformAccountId: "wa_sarah_06",
      username: "Sarah Insiders Channel",
      profileUrl: "https://whatsapp.com/channel/sarah_insiders",
      followersCount: 400000,
      followingCount: 0,
      postsCount: 150,
      engagementRate: 18.5,
      metricsJson: JSON.stringify({
        activeSubscribersPct: 78,
        reactionRatePct: 18.5,
        broadcastFrequency: "3x weekly",
      }),
    },
  ];

  for (const acc of sarahAccounts) {
    await prisma.socialAccount.create({
      data: {
        creatorId: sarahProfile.id,
        ...acc,
        isConnected: true,
        lastSyncedAt: new Date(),
      },
    });
  }

  // 12 Months of Audience Snapshots showing growth towards 1.48M
  const monthlySnapshots = [
    { monthsAgo: 11, count: 980000 },
    { monthsAgo: 10, count: 1020000 },
    { monthsAgo: 9, count: 1070000 },
    { monthsAgo: 8, count: 1120000 },
    { monthsAgo: 7, count: 1180000 },
    { monthsAgo: 6, count: 1230000 },
    { monthsAgo: 5, count: 1290000 },
    { monthsAgo: 4, count: 1340000 },
    { monthsAgo: 3, count: 1390000 },
    { monthsAgo: 2, count: 1430000 },
    { monthsAgo: 1, count: 1465000 },
    { monthsAgo: 0, count: 1480000 },
  ];

  for (const snap of monthlySnapshots) {
    const d = new Date();
    d.setMonth(d.getMonth() - snap.monthsAgo);
    await prisma.audienceSnapshot.create({
      data: {
        creatorId: sarahProfile.id,
        platform: null, // Unified total
        followersCount: snap.count,
        recordedAt: d,
      },
    });
  }

  // Performance metrics for Sarah Chen
  const performanceData = [
    { platform: SocialPlatform.INSTAGRAM, metricType: "impressions", value: 2400000, period: "last_30_days" },
    { platform: SocialPlatform.YOUTUBE, metricType: "views", value: 380000, period: "last_30_days" },
    { platform: SocialPlatform.X_TWITTER, metricType: "impressions", value: 1400000, period: "last_30_days" },
    { platform: SocialPlatform.WHATSAPP_CHANNEL, metricType: "reactions", value: 245000, period: "last_30_days" },
  ];

  for (const p of performanceData) {
    await prisma.performanceMetric.create({
      data: {
        creatorId: sarahProfile.id,
        ...p,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 2. ADDITIONAL DIVERSE CREATORS (For Brand Discovery & Search Filters)
  // ---------------------------------------------------------------------------
  const otherCreators = [
    {
      name: "Marcus Brody",
      email: "marcus.brody@infurizz.internal",
      handle: "marcusbrody",
      bio: "Hardware benchmark engineer & gaming specialist. Testing edge cases, GPUs, mechanical keyboards, and ultra-high-refresh displays.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      category: "Gaming & Esports",
      location: "Austin, TX",
      totalReach: 740000,
      engagement: 5.4,
      rates: "$2,000 - $6,000",
      accounts: [
        { platform: SocialPlatform.YOUTUBE, followersCount: 520000, username: "marcusbrodygaming", engagementRate: 6.8 },
        { platform: SocialPlatform.X_TWITTER, followersCount: 140000, username: "marcus_b", engagementRate: 3.2 },
        { platform: SocialPlatform.INSTAGRAM, followersCount: 80000, username: "marcusbrody", engagementRate: 4.1 },
      ],
    },
    {
      name: "Elena Rostova",
      email: "elena.rostova@infurizz.internal",
      handle: "elenarostova",
      bio: "Sustainable luxury fashion curator, editorial photographer, and Milan Fashion Week correspondent. High-aesthetic lookbooks and ethical textiles.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
      category: "Fashion & Beauty",
      location: "New York, NY",
      totalReach: 2100000,
      engagement: 4.2,
      rates: "$4,000 - $12,000",
      accounts: [
        { platform: SocialPlatform.INSTAGRAM, followersCount: 1400000, username: "elena_rostova", engagementRate: 4.6 },
        { platform: SocialPlatform.YOUTUBE, followersCount: 400000, username: "elenarostovastyle", engagementRate: 5.1 },
        { platform: SocialPlatform.LINKEDIN, followersCount: 300000, username: "elena-rostova-style", engagementRate: 2.9 },
      ],
    },
    {
      name: "David Okafor",
      email: "david.okafor@infurizz.internal",
      handle: "davidokafor",
      bio: "Angel investor, fintech analyst, and personal wealth strategist. Breaking down market cycles, modern banking tech, and financial independence.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      category: "Finance & Crypto",
      location: "London, UK",
      totalReach: 490000,
      engagement: 4.9,
      rates: "$1,500 - $5,000",
      accounts: [
        { platform: SocialPlatform.X_TWITTER, followersCount: 280000, username: "david_wealth", engagementRate: 4.8 },
        { platform: SocialPlatform.YOUTUBE, followersCount: 110000, username: "davidokaforfinance", engagementRate: 6.2 },
        { platform: SocialPlatform.LINKEDIN, followersCount: 100000, username: "david-okafor-fintech", engagementRate: 3.8 },
      ],
    },
    {
      name: "Maya Lin",
      email: "maya.lin@infurizz.internal",
      handle: "mayalinfit",
      bio: "Holistic mobility coach, Olympic weightlifter, and nutritionist. Designing accessible daily routines, clean meal prep, and longevity protocols.",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      category: "Health & Fitness",
      location: "Seattle, WA",
      totalReach: 820000,
      engagement: 6.1,
      rates: "$2,200 - $7,000",
      accounts: [
        { platform: SocialPlatform.INSTAGRAM, followersCount: 500000, username: "mayalinfitness", engagementRate: 6.8 },
        { platform: SocialPlatform.YOUTUBE, followersCount: 180000, username: "mayalincoaching", engagementRate: 7.4 },
        { platform: SocialPlatform.WHATSAPP_CHANNEL, followersCount: 140000, username: "Maya Daily Reset", engagementRate: 16.2 },
      ],
    },
  ];

  const createdCreators: Record<string, string> = { sarahchen: sarahProfile.id };

  for (const c of otherCreators) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        name: c.name,
        role: Role.CREATOR,
      },
    });

    const cp = await prisma.creatorProfile.create({
      data: {
        userId: u.id,
        handle: c.handle,
        displayName: c.name,
        bio: c.bio,
        avatarUrl: c.avatarUrl,
        category: c.category,
        location: c.location,
        isVerified: true,
        totalReach: c.totalReach,
        avgEngagementRate: c.engagement,
        ratesSummary: c.rates,
      },
    });

    createdCreators[c.handle] = cp.id;

    for (const acc of c.accounts) {
      await prisma.socialAccount.create({
        data: {
          creatorId: cp.id,
          platform: acc.platform,
          username: acc.username,
          followersCount: acc.followersCount,
          engagementRate: acc.engagementRate,
          isConnected: true,
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. DEMO BRANDS (Apex Audio, Lumina Labs, Nova Wear)
  // ---------------------------------------------------------------------------
  const apexUser = await prisma.user.create({
    data: {
      id: "usr_brand_apex",
      email: "partnerships@apexaudio.io",
      name: "Apex Audio Partnerships",
      role: Role.BRAND,
    },
  });

  const apexBrand = await prisma.brandProfile.create({
    data: {
      id: "bprof_apex_audio",
      userId: apexUser.id,
      companyName: "Apex Audio Technologies",
      logoUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80",
      website: "https://apexaudio.io",
      industry: "Consumer Tech",
      description: "Engineering next-generation planar magnetic headphones, wireless audiophile gear, and precision sound hardware.",
      location: "Berlin / Austin",
      budgetRange: "$25,000 - $100,000 / quarter",
      isVerified: true,
    },
  });

  const luminaUser = await prisma.user.create({
    data: {
      id: "usr_brand_lumina",
      email: "growth@luminalabs.ai",
      name: "Lumina Labs Growth",
      role: Role.BRAND,
    },
  });

  const luminaBrand = await prisma.brandProfile.create({
    data: {
      id: "bprof_lumina_labs",
      userId: luminaUser.id,
      companyName: "Lumina Labs",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
      website: "https://luminalabs.ai",
      industry: "SaaS & Enterprise",
      description: "AI-native workspace orchestration platform designed for high-velocity engineering and design teams.",
      location: "San Francisco, CA",
      budgetRange: "$50,000 - $150,000 / quarter",
      isVerified: true,
    },
  });

  const novaUser = await prisma.user.create({
    data: {
      id: "usr_brand_nova",
      email: "creators@novawear.co",
      name: "Nova Activewear",
      role: Role.BRAND,
    },
  });

  const novaBrand = await prisma.brandProfile.create({
    data: {
      id: "bprof_nova_wear",
      userId: novaUser.id,
      companyName: "Nova Activewear",
      logoUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=80",
      website: "https://novawear.co",
      industry: "Fashion & Apparel",
      description: "Performance athletic wear engineered from ocean-recycled nylon and temperature-regulating smart merino weave.",
      location: "Los Angeles, CA",
      budgetRange: "$20,000 - $60,000 / quarter",
      isVerified: true,
    },
  });

  // ---------------------------------------------------------------------------
  // 4. BRAND CAMPAIGNS
  // ---------------------------------------------------------------------------
  const apexCampaign = await prisma.campaign.create({
    data: {
      id: "cmp_apex_wireless_launch",
      brandId: apexBrand.id,
      title: "Apex Horizon Pro Wireless ANC Earbuds Launch",
      description: "Multi-platform hardware review campaign highlighting soundstage fidelity, active noise cancellation in real-world environments, and seamless multipoint switching.",
      budget: 18000,
      currency: "USD",
      targetCategory: "Tech & Software",
      targetPlatforms: "YOUTUBE,INSTAGRAM,X_TWITTER",
      status: CampaignStatus.ACTIVE,
    },
  });

  const luminaCampaign = await prisma.campaign.create({
    data: {
      id: "cmp_lumina_ai_showcase",
      brandId: luminaBrand.id,
      title: "Next-Gen AI Workspace Productivity Sprint",
      description: "In-depth demonstrations showing how creative directors and software developers streamline multi-tool workflows with Lumina AI.",
      budget: 35000,
      currency: "USD",
      targetCategory: "Tech & Software",
      targetPlatforms: "YOUTUBE,LINKEDIN,X_TWITTER",
      status: CampaignStatus.ACTIVE,
    },
  });

  await prisma.campaign.create({
    data: {
      id: "cmp_nova_fall_drop",
      brandId: novaBrand.id,
      title: "Nova Horizon Recycled Merino Fall Capsule",
      description: "High-aesthetic street-to-gym visual storytelling highlighting zero-waste circular manufacturing and all-weather resilience.",
      budget: 15000,
      currency: "USD",
      targetCategory: "Fashion & Beauty",
      targetPlatforms: "INSTAGRAM,YOUTUBE",
      status: CampaignStatus.ACTIVE,
    },
  });

  // ---------------------------------------------------------------------------
  // 5. COLLABORATION REQUESTS & PROJECTS (In-Platform)
  // ---------------------------------------------------------------------------
  const collabApexSarah = await prisma.collaboration.create({
    data: {
      id: "collab_apex_sarah",
      brandId: apexBrand.id,
      creatorId: sarahProfile.id,
      campaignId: apexCampaign.id,
      title: "Apex Horizon Pro Full Review & Setup Integration",
      description: "Dedicated 8-minute YouTube segment analyzing frequency response curve and ANC performance, accompanied by 1 Instagram Reel and 1 X thread breakdown.",
      deliverables: "1x YouTube Dedicated Video (min 8 mins), 1x 4K Instagram Reel, 1x X Thread with high-res product photos.",
      budgetAmount: 6500,
      currency: "USD",
      status: CollaborationStatus.IN_PROGRESS,
    },
  });

  const collabLuminaSarah = await prisma.collaboration.create({
    data: {
      id: "collab_lumina_sarah",
      brandId: luminaBrand.id,
      creatorId: sarahProfile.id,
      campaignId: luminaCampaign.id,
      title: "Lumina AI Workflow Deep-Dive & LinkedIn Case Study",
      description: "Sponsored demonstration video showcasing Lumina AI integrated into weekly creative production, plus a high-engagement LinkedIn article on AI automation for creators.",
      deliverables: "1x YouTube Integration (60-90s mid-roll), 1x LinkedIn Thought Leadership Case Study, 1x WhatsApp Channel exclusive early access code.",
      budgetAmount: 8000,
      currency: "USD",
      status: CollaborationStatus.PENDING,
    },
  });

  await prisma.collaboration.create({
    data: {
      id: "collab_nova_elena",
      brandId: novaBrand.id,
      creatorId: createdCreators["elenarostova"],
      title: "Fall Activewear Carousel & Lookbook Reel",
      description: "Curated styling guide and editorial reel featuring the new recycled merino collection during Milan design week.",
      deliverables: "2x Instagram High-Resolution Carousels, 1x Stylized Video Reel.",
      budgetAmount: 5000,
      currency: "USD",
      status: CollaborationStatus.ACCEPTED,
    },
  });

  // ---------------------------------------------------------------------------
  // 6. IN-PLATFORM CONVERSATIONS & MESSAGES (Brand-to-Creator inside Infurizz)
  // ---------------------------------------------------------------------------
  const convApexSarah = await prisma.conversation.create({
    data: {
      id: "conv_apex_sarah",
      creatorId: sarahProfile.id,
      brandId: apexBrand.id,
      collaborationId: collabApexSarah.id,
      lastMessageAt: new Date(),
    },
  });

  const messagesApex = [
    {
      senderId: apexUser.id,
      receiverId: sarahUser.id,
      content: "Hi Sarah! We love your audio and studio tour content. We've officially dispatched the Apex Horizon Pro engineering review units to your studio address in SF.",
      minutesAgo: 180,
    },
    {
      senderId: sarahUser.id,
      receiverId: apexUser.id,
      content: "Thanks team! Tracking received. I'm setting up our binaural test rig this Thursday to measure the frequency isolation response.",
      minutesAgo: 120,
    },
    {
      senderId: apexUser.id,
      receiverId: sarahUser.id,
      content: "Phenomenal! Let us know if you'd like our audio engineering lead on a 15-minute sync to explain the custom balanced armature driver setup.",
      minutesAgo: 45,
    },
    {
      senderId: sarahUser.id,
      receiverId: apexUser.id,
      content: "That would be super valuable. Let's schedule that for Friday afternoon. Excited to test these out!",
      minutesAgo: 10,
    },
  ];

  for (const m of messagesApex) {
    const t = new Date(Date.now() - m.minutesAgo * 60 * 1000);
    await prisma.message.create({
      data: {
        conversationId: convApexSarah.id,
        collaborationId: collabApexSarah.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: true,
        createdAt: t,
      },
    });
  }

  const convLuminaSarah = await prisma.conversation.create({
    data: {
      id: "conv_lumina_sarah",
      creatorId: sarahProfile.id,
      brandId: luminaBrand.id,
      collaborationId: collabLuminaSarah.id,
      lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convLuminaSarah.id,
      collaborationId: collabLuminaSarah.id,
      senderId: luminaUser.id,
      receiverId: sarahUser.id,
      content: "Hello Sarah! We submitted a collaboration proposal for our Next-Gen AI Workspace campaign ($8,000 budget). Would love to partner on an in-depth workflow video and LinkedIn discussion.",
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  // ---------------------------------------------------------------------------
  // 7. NOTIFICATIONS
  // ---------------------------------------------------------------------------
  await prisma.notification.create({
    data: {
      userId: sarahUser.id,
      title: "New Collaboration Proposal",
      message: "Lumina Labs has sent you an $8,000 collaboration proposal for their AI Workspace campaign.",
      link: "/creator/collaborations",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: sarahUser.id,
      title: "Collaboration Progress",
      message: "Apex Audio confirmed sample shipment for Horizon Pro review.",
      link: "/creator/messages",
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: apexUser.id,
      title: "Creator Updated Milestone",
      message: "Sarah Chen confirmed studio acoustic testing for Friday.",
      link: "/brand/collaborations",
      isRead: false,
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`- Canonical Creator: Sarah Chen (${sarahProfile.handle}) - ${sarahProfile.totalReach.toLocaleString()} audience reach`);
  console.log("- Other Creators: Marcus Brody, Elena Rostova, David Okafor, Maya Lin");
  console.log("- Brands: Apex Audio, Lumina Labs, Nova Activewear");
  console.log("- Active Campaigns & Collaborations created");
  console.log("- In-Platform Conversations & Messages populated");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
