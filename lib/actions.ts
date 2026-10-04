"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current";
import { text } from "@/lib/format";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { clearSession, writeSession } from "@/lib/session";
import {
  AUDIENCE_RANGES,
  CAMPAIGN_STATUSES,
  CATEGORIES,
  PLATFORMS,
  canTransitionApplication,
  canTransitionCampaign,
  canTransitionOrder,
  isCampaignAcceptingApplications,
  isCampaignPublished,
  type Role,
} from "@/lib/options";

export type FormState = { error?: string };
export type InterestState = {
  error?: string;
  pending?: boolean;
  matched?: boolean;
  matchId?: string;
  creatorName?: string;
  brandName?: string;
  campaignName?: string;
  creatorId?: string;
  campaignId?: string;
};

function allowed(value: string, options: readonly string[]) {
  return options.includes(value);
}

function readPlatforms(formData: FormData) {
  return PLATFORMS.filter((platform) => formData.getAll("platforms").includes(platform));
}

function readSocials(formData: FormData) {
  return PLATFORMS.flatMap((platform) => {
    const handle = text(formData.get(`handle:${platform}`));
    if (!handle) return [];
    return [
      {
        platform,
        handle,
        audienceNote: text(formData.get(`note:${platform}`)),
        isSample: formData.get(`sample:${platform}`) === "on",
      },
    ];
  });
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData.get("email")).toLowerCase();
  const password = text(formData.get("password"));
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "That email and password do not match an account." };
  }
  await writeSession(user.id);
  if (user.role === "UNASSIGNED") {
    redirect("/onboarding/role");
  }
  redirect("/discover");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function join(_prev: FormState, formData: FormData): Promise<FormState> {
  const role = text(formData.get("role"));
  const email = text(formData.get("email")).toLowerCase();
  const password = text(formData.get("password"));
  const confirmPassword = text(formData.get("confirmPassword"));
  const name = text(formData.get("name"));
  const bio = text(formData.get("bio"));
  const location = text(formData.get("location"));

  if (role !== "CREATOR" && role !== "BRAND") return { error: "Choose Creator or Brand." };
  if (!name || !email || !email.includes("@") || password.length < 8) {
    return { error: "Name, a valid email, and a password of at least 8 characters are required." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match. Please confirm your password." };
  }
  if (!bio || !location) return { error: "Add a short description and a location." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await hashPassword(password);

  if (role === "CREATOR") {
    const category = text(formData.get("category"));
    const niche = text(formData.get("niche"));
    const audienceRange = text(formData.get("audienceRange"));
    const collabPrefs = text(formData.get("collabPrefs"));
    const socials = readSocials(formData);
    if (!allowed(category, CATEGORIES) || !niche || !allowed(audienceRange, AUDIENCE_RANGES) || !collabPrefs) {
      return { error: "Category, niche, audience range, and collaboration preferences are required." };
    }
    if (socials.length === 0) return { error: "Add at least one platform handle." };

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        creator: {
          create: {
            name,
            bio,
            category,
            location,
            niche,
            audienceRange,
            collabPrefs,
            isDemo: false,
            socials: { create: socials },
          },
        },
      },
    });
    await writeSession(user.id);
    redirect("/campaigns");
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "BRAND",
      brand: { create: { name, about: bio, location, isDemo: false } },
    },
  });
  await writeSession(user.id);
  redirect("/campaigns/new");
}

export async function updateCreator(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.creator) return { error: "This account has no creator profile." };
  const category = text(formData.get("category"));
  const audienceRange = text(formData.get("audienceRange"));
  const socials = readSocials(formData);

  const usernameRaw = text(formData.get("username")).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const avatarUrl = text(formData.get("avatarUrl")) || null;
  const languagesRaw = text(formData.get("languages"));
  const contentTypesRaw = text(formData.get("contentTypes"));

  if (usernameRaw && usernameRaw !== user.creator.username) {
    const existing = await prisma.creator.findUnique({ where: { username: usernameRaw } });
    if (existing && existing.id !== user.creator.id) {
      return { error: "That username is already taken. Please choose another." };
    }
  }

  const languages = languagesRaw
    ? JSON.stringify(languagesRaw.split(",").map((s) => s.trim()).filter(Boolean))
    : user.creator.languages;
  const contentTypes = contentTypesRaw
    ? JSON.stringify(contentTypesRaw.split(",").map((s) => s.trim()).filter(Boolean))
    : user.creator.contentTypes;

  const data = {
    name: text(formData.get("name")),
    username: usernameRaw || null,
    avatarUrl,
    bio: text(formData.get("bio")),
    location: text(formData.get("location")),
    niche: text(formData.get("niche")),
    collabPrefs: text(formData.get("collabPrefs")),
    category,
    audienceRange,
    languages,
    contentTypes,
  };

  if (!data.name || !data.bio || !data.location || !data.niche || !data.collabPrefs || !allowed(category, CATEGORIES) || !allowed(audienceRange, AUDIENCE_RANGES)) {
    return { error: "Fill in all required profile fields." };
  }
  if (socials.length === 0) return { error: "Keep at least one platform handle." };

  await prisma.$transaction([
    prisma.creator.update({ where: { id: user.creator.id }, data }),
    prisma.socialProfile.deleteMany({ where: { creatorId: user.creator.id } }),
    prisma.socialProfile.createMany({
      data: socials.map((social) => ({ ...social, creatorId: user.creator!.id })),
    }),
  ]);
  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
  revalidatePath("/discover");
  return {};
}

export async function updateBrand(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.brand) return { error: "This account has no brand profile." };
  const name = text(formData.get("name"));
  const about = text(formData.get("about"));
  const location = text(formData.get("location"));
  if (!name || !about || !location) return { error: "Name, description, and location are required." };
  await prisma.brand.update({ where: { id: user.brand.id }, data: { name, about, location } });
  revalidatePath("/account");
  revalidatePath("/discover");
  return {};
}

function campaignInput(formData: FormData) {
  const platforms = readPlatforms(formData);
  const budgetMin = Number(text(formData.get("budgetMin")));
  const budgetMax = Number(text(formData.get("budgetMax")));
  const data = {
    name: text(formData.get("name")),
    category: text(formData.get("category")),
    creatorNiche: text(formData.get("creatorNiche")),
    audienceRange: text(formData.get("audienceRange")),
    location: text(formData.get("location")),
    deliverables: text(formData.get("deliverables")),
    status: text(formData.get("status")) || "Open",
    platforms,
    budgetMin,
    budgetMax,
  };
  if (
    !data.name ||
    !data.creatorNiche ||
    !data.location ||
    !data.deliverables ||
    !allowed(data.category, CATEGORIES) ||
    !allowed(data.audienceRange, AUDIENCE_RANGES) ||
    !allowed(data.status, CAMPAIGN_STATUSES) ||
    platforms.length === 0 ||
    !Number.isInteger(budgetMin) ||
    !Number.isInteger(budgetMax) ||
    budgetMin < 0 ||
    budgetMax < budgetMin
  ) {
    return { error: "Check the campaign fields. Budget maximum must be at least the minimum, and at least one platform is required." } as const;
  }
  return { data } as const;
}

export async function createCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.brand) return { error: "Only a brand account can create a campaign." };
  const parsed = campaignInput(formData);
  if ("error" in parsed) return { error: parsed.error };
  const campaign = await prisma.campaign.create({
    data: {
      ...parsed.data,
      platforms: JSON.stringify(parsed.data.platforms),
      brandId: user.brand.id,
      isDemo: false,
    },
  });
  revalidatePath("/discover");
  revalidatePath("/account");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = text(formData.get("campaignId"));
  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { brand: true } });
  if (!campaign || campaign.brand.userId !== user.id) return { error: "You can only edit your own campaign." };
  const parsed = campaignInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  if (!canTransitionCampaign(campaign.status, parsed.data.status)) {
    return { error: `Cannot transition campaign from ${campaign.status} to ${parsed.data.status}.` };
  }

  await prisma.campaign.update({
    where: { id },
    data: { ...parsed.data, platforms: JSON.stringify(parsed.data.platforms) },
  });
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  revalidatePath("/discover");
  revalidatePath("/account");
  return {};
}

export async function expressInterest(_prev: InterestState | null, formData: FormData): Promise<InterestState> {
  const user = await requireUser();
  const creatorId = text(formData.get("creatorId"));
  const campaignId = text(formData.get("campaignId"));
  const creator = await prisma.creator.findUnique({ where: { id: creatorId }, include: { user: true } });
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: true },
  });
  if (!creator || !campaign) return { error: "That creator or campaign is no longer available." };
  if (!isCampaignPublished(campaign.status)) return { error: "This campaign is not open." };

  let fromRole: Role | null = null;
  if (user.creator?.id === creator.id) fromRole = "CREATOR";
  if (user.brand?.id === campaign.brandId) fromRole = "BRAND";
  if (!fromRole) return { error: "You can only express interest in your own creator or campaign pairing." };
  if (creator.userId === campaign.brand.userId) return { error: "A profile cannot match with its own account." };

  const match = await prisma.$transaction(async (tx) => {
    await tx.interest.upsert({
      where: { creatorId_campaignId_fromRole: { creatorId, campaignId, fromRole } },
      update: {},
      create: { creatorId, campaignId, fromRole },
    });
    const interests = await tx.interest.findMany({ where: { creatorId, campaignId } });
    const roles = new Set(interests.map((item) => item.fromRole));
    if (!roles.has("CREATOR") || !roles.has("BRAND")) return null;
    return tx.match.upsert({
      where: { creatorId_campaignId: { creatorId, campaignId } },
      update: {},
      create: {
        creatorId,
        campaignId,
        conversation: { create: {} },
      },
    });
  });

  revalidatePath("/discover");
  revalidatePath("/account");
  revalidatePath("/matches");
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath(`/campaigns/${campaignId}`);

  if (!match) {
    return {
      pending: true,
      creatorName: creator.name,
      brandName: campaign.brand.name,
      campaignName: campaign.name,
      creatorId,
      campaignId,
    };
  }

  return {
    matched: true,
    matchId: match.id,
    creatorName: creator.name,
    brandName: campaign.brand.name,
    campaignName: campaign.name,
    creatorId,
    campaignId,
  };
}

export async function applyToCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.creator) return { error: "Only creator accounts can apply to campaigns." };

  const campaignId = text(formData.get("campaignId"));
  const serviceId = text(formData.get("serviceId")) || null;
  const proposedRate = parseInteger(formData.get("proposedRate"), -1);
  const pitchMessage = text(formData.get("pitchMessage"));

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: true },
  });

  if (!campaign) return { error: "Campaign not found." };

  if (!isCampaignAcceptingApplications(campaign.status)) {
    const upper = campaign.status.toUpperCase();
    if (upper === "PAUSED") {
      return { error: "This campaign is currently paused and not accepting applications." };
    }
    if (upper === "CLOSED") {
      return { error: "This campaign is closed and cannot accept new applications." };
    }
    return { error: "This campaign is not accepting applications." };
  }

  if (campaign.brand.userId === user.id) {
    return { error: "You cannot apply to your own campaign." };
  }

  if (proposedRate < 0) {
    return { error: "Proposed rate must be a valid whole dollar amount ($0 or more)." };
  }

  if (!pitchMessage) {
    return { error: "Please write a short pitch describing your creative approach." };
  }

  if (serviceId) {
    const service = await prisma.creatorService.findUnique({ where: { id: serviceId } });
    if (!service || service.creatorId !== user.creator.id || !service.isActive) {
      return { error: "The selected service package is invalid or inactive." };
    }
  }

  const existing = await prisma.campaignApplication.findUnique({
    where: {
      campaignId_creatorId: {
        campaignId,
        creatorId: user.creator.id,
      },
    },
  });
  if (existing) {
    return { error: "You have already applied to this campaign." };
  }

  await prisma.campaignApplication.create({
    data: {
      campaignId,
      creatorId: user.creator.id,
      serviceId,
      proposedRate,
      pitchMessage,
      status: "PENDING",
    },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/account");
  return {};
}

export async function withdrawApplication(formData: FormData) {
  const user = await requireUser();
  if (!user.creator) return;

  const applicationId = text(formData.get("applicationId"));
  const app = await prisma.campaignApplication.findUnique({
    where: { id: applicationId },
  });

  if (!app || app.creatorId !== user.creator.id) return;
  if (!canTransitionApplication(app.status, "WITHDRAWN")) return;

  await prisma.campaignApplication.update({
    where: { id: applicationId },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath(`/campaigns/${app.campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/account");
}

export async function reviewApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.brand) return { error: "Only brand accounts can review applications." };

  const applicationId = text(formData.get("applicationId"));
  const decision = text(formData.get("decision")).toUpperCase();

  const app = await prisma.campaignApplication.findUnique({
    where: { id: applicationId },
    include: {
      campaign: { include: { brand: true } },
      service: true,
      creator: true,
    },
  });

  if (!app) return { error: "Application not found." };
  if (app.campaign.brand.userId !== user.id) {
    return { error: "You are not authorized to review applications for this campaign." };
  }

  const targetStatus = decision === "ACCEPT" ? "ACCEPTED" : decision === "REJECT" ? "REJECTED" : null;
  if (!targetStatus) {
    return { error: "Invalid review decision. Must be ACCEPT or REJECT." };
  }

  if (!canTransitionApplication(app.status, targetStatus)) {
    return { error: `Cannot transition application from ${app.status} to ${targetStatus}.` };
  }

  if (targetStatus === "ACCEPTED") {
    await prisma.$transaction(async (tx) => {
      // 1. Update application status
      await tx.campaignApplication.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED" },
      });

      // 2. Retrieve or create Conversation
      let conv = await tx.conversation.findUnique({
        where: { applicationId },
      });
      if (!conv) {
        conv = await tx.conversation.create({
          data: { applicationId },
        });
      }

      // 3. Create Order if not already existing (deterministic idempotency)
      const existingOrder = await tx.order.findUnique({
        where: { applicationId },
      });

      if (!existingOrder) {
        const agreedPriceInCents = app.proposedRate * 100;
        const deliverablesSnapshot = app.service?.deliverables || app.campaign.deliverables;
        const turnaroundDaysSnapshot = app.service?.turnaroundDays || 7;
        const revisionsIncluded = app.service?.revisions ?? 1;
        const deadlineAt = new Date(Date.now() + turnaroundDaysSnapshot * 24 * 60 * 60 * 1000);

        const orderCount = await tx.order.count();
        const year = new Date().getFullYear();
        const orderNumber = `INF-${year}-${String(orderCount + 1).padStart(4, "0")}`;

        await tx.order.create({
          data: {
            orderNumber,
            applicationId: app.id,
            campaignId: app.campaignId,
            creatorId: app.creatorId,
            brandId: app.campaign.brandId,
            serviceId: app.serviceId,
            conversationId: conv.id,
            agreedPriceInCents,
            currency: "USD",
            deliverablesSnapshot,
            turnaroundDaysSnapshot,
            revisionsIncluded,
            revisionsUsed: 0,
            deadlineAt,
            status: "PENDING",
          },
        });
      }
    });
  } else {
    await prisma.campaignApplication.update({
      where: { id: applicationId },
      data: { status: "REJECTED" },
    });
  }

  revalidatePath(`/campaigns/${app.campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/account");
  return {};
}

export async function cancelOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = text(formData.get("orderId"));
  const reason = text(formData.get("reason")) || "Cancelled before work began.";

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { brand: true, creator: true },
  });

  if (!order) return;
  const isParticipant = order.brand.userId === user.id || order.creator.userId === user.id;
  if (!isParticipant) return;

  if (!canTransitionOrder(order.status, "CANCELLED")) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/account");
  if (order.conversationId) revalidatePath(`/conversations/${order.conversationId}`);
}

export async function transitionOrderStatus(formData: FormData) {
  const user = await requireUser();
  const orderId = text(formData.get("orderId"));
  const targetStatus = text(formData.get("targetStatus")).toUpperCase();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { brand: true, creator: true },
  });

  if (!order) return;
  const isBrand = order.brand.userId === user.id;
  const isCreator = order.creator.userId === user.id;
  if (!isBrand && !isCreator) return;

  if (!canTransitionOrder(order.status, targetStatus)) return;

  // Authorization rule: only Creator can acknowledge and start production
  if (targetStatus === "IN_PROGRESS" && !isCreator) return;

  const data: Record<string, unknown> = { status: targetStatus };
  if (targetStatus === "IN_PROGRESS" && !order.startedAt) {
    data.startedAt = new Date();
  } else if (targetStatus === "COMPLETED" && !order.completedAt) {
    data.completedAt = new Date();
  }

  await prisma.order.update({
    where: { id: orderId },
    data,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/account");
  if (order.conversationId) revalidatePath(`/conversations/${order.conversationId}`);
}

export async function skipTarget(formData: FormData) {
  const user = await requireUser();
  const targetType = text(formData.get("targetType"));
  const targetId = text(formData.get("targetId"));
  if ((targetType !== "campaign" && targetType !== "creator") || !targetId) return;
  await prisma.skip.upsert({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
    update: {},
    create: { userId: user.id, targetType, targetId },
  });
  revalidatePath("/discover");
}

export async function clearSkips() {
  const user = await requireUser();
  await prisma.skip.deleteMany({ where: { userId: user.id } });
  revalidatePath("/discover");
}

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const matchId = text(formData.get("matchId"));
  const conversationId = text(formData.get("conversationId"));
  const body = text(formData.get("body"));
  if (!body || body.length > 1000) return { error: "Write a message under 1,000 characters." };

  let conv = null;
  if (conversationId) {
    conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        match: { include: { creator: true, campaign: { include: { brand: true } } } },
        application: { include: { creator: true, campaign: { include: { brand: true } } } },
      },
    });
  } else if (matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: true,
        campaign: { include: { brand: true } },
        conversation: true,
      },
    });
    if (match?.conversation) {
      conv = await prisma.conversation.findUnique({
        where: { id: match.conversation.id },
        include: {
          match: { include: { creator: true, campaign: { include: { brand: true } } } },
          application: { include: { creator: true, campaign: { include: { brand: true } } } },
        },
      });
    }
  }

  if (!conv) return { error: "This conversation is not available." };

  const isMatchParticipant =
    conv.match &&
    (conv.match.creator.userId === user.id || conv.match.campaign.brand.userId === user.id);
  const isAppParticipant =
    conv.application &&
    (conv.application.creator.userId === user.id || conv.application.campaign.brand.userId === user.id);

  if (!isMatchParticipant && !isAppParticipant) {
    return { error: "You are not authorized to participate in this conversation." };
  }

  await prisma.message.create({
    data: { conversationId: conv.id, senderId: user.id, body },
  });

  revalidatePath(`/conversations/${conv.id}`);
  if (conv.matchId) revalidatePath(`/matches/${conv.matchId}`);
  return {};
}

export async function selectRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const selectedRole = text(formData.get("role")).toUpperCase();

  if (user.role !== "UNASSIGNED") {
    return { error: "Account role has already been assigned and cannot be changed." };
  }

  if (selectedRole !== "CREATOR" && selectedRole !== "BRAND") {
    return { error: "Please choose either Creator or Brand." };
  }

  const name = text(formData.get("name")) || user.email.split("@")[0] || "Member";
  const location = text(formData.get("location")) || "Anywhere";

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { role: selectedRole },
    });

    if (selectedRole === "CREATOR" && !user.creator) {
      await tx.creator.create({
        data: {
          userId: user.id,
          name,
          bio: "Creator profile. Edit to describe your work and platforms.",
          category: "Lifestyle",
          location,
          niche: "General",
          audienceRange: "10k–50k",
          collabPrefs: "Open to brand collaborations",
          isDemo: false,
        },
      });
    } else if (selectedRole === "BRAND" && !user.brand) {
      await tx.brand.create({
        data: {
          userId: user.id,
          name,
          about: "Brand profile. Edit to describe your company and missions.",
          location,
          isDemo: false,
        },
      });
    }
  });

  revalidatePath("/account");
  revalidatePath("/discover");
  redirect("/account");
}

function parseInteger(value: FormDataEntryValue | null, defaultValue = 0): number {
  const parsed = Number(text(value));
  return Number.isInteger(parsed) ? parsed : defaultValue;
}

export async function createService(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.creator) return { error: "Only a creator account can offer services." };

  const title = text(formData.get("title"));
  const description = text(formData.get("description"));
  const platform = text(formData.get("platform"));
  const deliverables = text(formData.get("deliverables"));
  const price = parseInteger(formData.get("price"), -1);
  const turnaroundDays = parseInteger(formData.get("turnaroundDays"), 7);
  const revisions = parseInteger(formData.get("revisions"), 1);

  if (!title || !description || !platform || !deliverables) {
    return { error: "Title, description, platform, and deliverables are required." };
  }
  if (price < 0) {
    return { error: "Price must be a valid positive whole dollar amount." };
  }
  if (turnaroundDays < 1) {
    return { error: "Turnaround time must be at least 1 day." };
  }
  if (revisions < 0) {
    return { error: "Revisions must be 0 or more." };
  }

  await prisma.creatorService.create({
    data: {
      creatorId: user.creator.id,
      title,
      description,
      platform,
      price,
      turnaroundDays,
      deliverables,
      revisions,
      isActive: true,
    },
  });

  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
  return {};
}

export async function updateService(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.creator) return { error: "Only a creator account can update services." };

  const serviceId = text(formData.get("serviceId"));
  const service = await prisma.creatorService.findUnique({ where: { id: serviceId } });
  if (!service || service.creatorId !== user.creator.id) {
    return { error: "You can only edit services you own." };
  }

  const title = text(formData.get("title"));
  const description = text(formData.get("description"));
  const platform = text(formData.get("platform"));
  const deliverables = text(formData.get("deliverables"));
  const price = parseInteger(formData.get("price"), -1);
  const turnaroundDays = parseInteger(formData.get("turnaroundDays"), 7);
  const revisions = parseInteger(formData.get("revisions"), 1);

  if (!title || !description || !platform || !deliverables) {
    return { error: "Title, description, platform, and deliverables are required." };
  }
  if (price < 0) {
    return { error: "Price must be a valid positive whole dollar amount." };
  }
  if (turnaroundDays < 1) {
    return { error: "Turnaround time must be at least 1 day." };
  }
  if (revisions < 0) {
    return { error: "Revisions must be 0 or more." };
  }

  await prisma.creatorService.update({
    where: { id: serviceId },
    data: {
      title,
      description,
      platform,
      price,
      turnaroundDays,
      deliverables,
      revisions,
    },
  });

  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
  return {};
}

export async function toggleServiceStatus(formData: FormData) {
  const user = await requireUser();
  if (!user.creator) return;

  const serviceId = text(formData.get("serviceId"));
  const service = await prisma.creatorService.findUnique({ where: { id: serviceId } });
  if (!service || service.creatorId !== user.creator.id) return;

  await prisma.creatorService.update({
    where: { id: serviceId },
    data: { isActive: !service.isActive },
  });

  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
}

export async function deleteService(formData: FormData) {
  const user = await requireUser();
  if (!user.creator) return;

  const serviceId = text(formData.get("serviceId"));
  const service = await prisma.creatorService.findUnique({ where: { id: serviceId } });
  if (!service || service.creatorId !== user.creator.id) return;

  await prisma.creatorService.delete({ where: { id: serviceId } });

  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
}

export async function createPortfolioItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.creator) return { error: "Only a creator account can add portfolio items." };

  const title = text(formData.get("title"));
  const platform = text(formData.get("platform"));
  const description = text(formData.get("description"));
  const mediaUrl = text(formData.get("mediaUrl")) || null;
  const externalUrl = text(formData.get("externalUrl")) || null;

  if (!title || !platform) {
    return { error: "Portfolio title and platform are required." };
  }

  await prisma.creatorPortfolioItem.create({
    data: {
      creatorId: user.creator.id,
      title,
      platform,
      description: description || null,
      mediaUrl,
      externalUrl,
    },
  });

  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
  return {};
}

export async function updatePortfolioItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.creator) return { error: "Only a creator account can update portfolio items." };

  const itemId = text(formData.get("itemId"));
  const item = await prisma.creatorPortfolioItem.findUnique({ where: { id: itemId } });
  if (!item || item.creatorId !== user.creator.id) {
    return { error: "You can only edit portfolio items you own." };
  }

  const title = text(formData.get("title"));
  const platform = text(formData.get("platform"));
  const description = text(formData.get("description"));
  const mediaUrl = text(formData.get("mediaUrl")) || null;
  const externalUrl = text(formData.get("externalUrl")) || null;

  if (!title || !platform) {
    return { error: "Portfolio title and platform are required." };
  }

  await prisma.creatorPortfolioItem.update({
    where: { id: itemId },
    data: {
      title,
      platform,
      description: description || null,
      mediaUrl,
      externalUrl,
    },
  });

  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
  return {};
}

export async function deletePortfolioItem(formData: FormData) {
  const user = await requireUser();
  if (!user.creator) return;

  const itemId = text(formData.get("itemId"));
  const item = await prisma.creatorPortfolioItem.findUnique({ where: { id: itemId } });
  if (!item || item.creatorId !== user.creator.id) return;

  await prisma.creatorPortfolioItem.delete({ where: { id: itemId } });

  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
  if (user.creator.username) revalidatePath(`/creators/${user.creator.username}`);
}

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const content = text(formData.get("content"));
  const mediaUrl = text(formData.get("mediaUrl")) || null;
  const postType = text(formData.get("postType")) || "UPDATE";
  const tagsRaw = text(formData.get("tags"));

  if (!content) {
    return { error: "Please enter some text for your post." };
  }

  const tags = tagsRaw
    ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`).filter(Boolean))
    : "[]";

  await prisma.post.create({
    data: {
      authorId: user.id,
      content,
      mediaUrl,
      postType,
      tags,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/account");
  return {};
}

export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const postId = text(formData.get("postId"));

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== user.id) return;

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/posts");
  revalidatePath("/account");
}

export async function updatePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const postId = text(formData.get("postId"));
  const content = text(formData.get("content"));
  const mediaUrl = text(formData.get("mediaUrl")) || null;
  const postType = text(formData.get("postType")) || "UPDATE";
  const tagsRaw = text(formData.get("tags"));

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== user.id) {
    return { error: "You can only edit your own posts." };
  }

  if (!content) {
    return { error: "Post content cannot be empty." };
  }

  const tags = tagsRaw
    ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`).filter(Boolean))
    : post.tags;

  await prisma.post.update({
    where: { id: postId },
    data: {
      content,
      mediaUrl,
      postType,
      tags,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/account");
  return {};
}

export async function togglePostReaction(formData: FormData) {
  const user = await requireUser();
  const postId = text(formData.get("postId"));
  const reaction = text(formData.get("reaction")) || "APPLAUD";

  const existing = await prisma.postReaction.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing) {
    await prisma.postReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.postReaction.create({
      data: {
        postId,
        userId: user.id,
        reaction,
      },
    });
  }

  revalidatePath("/posts");
}

export async function addPostComment(formData: FormData) {
  const user = await requireUser();
  const postId = text(formData.get("postId"));
  const content = text(formData.get("content"));

  if (!content) return;

  await prisma.postComment.create({
    data: {
      postId,
      userId: user.id,
      content,
    },
  });

  revalidatePath("/posts");
}

export async function deletePostComment(formData: FormData) {
  const user = await requireUser();
  const commentId = text(formData.get("commentId"));

  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== user.id) return;

  await prisma.postComment.delete({ where: { id: commentId } });
  revalidatePath("/posts");
}

export async function connectPlatform(formData: FormData) {
  const user = await requireUser();
  if (!user.creator) return;

  const platform = text(formData.get("platform"));
  const handle = text(formData.get("handle"));
  const profileUrl = text(formData.get("profileUrl")) || `https://${platform.toLowerCase()}.com/${handle.replace("@", "")}`;

  if (!platform || !handle) return;

  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;

  await prisma.$transaction(async (tx) => {
    // 1. Update or create SocialProfile
    const existingProfile = await tx.socialProfile.findFirst({
      where: { creatorId: user.creator!.id, platform },
    });
    if (existingProfile) {
      await tx.socialProfile.update({
        where: { id: existingProfile.id },
        data: { handle: cleanHandle, connectionStatus: "CONNECTED", verifiedAt: new Date() },
      });
    } else {
      await tx.socialProfile.create({
        data: {
          creatorId: user.creator!.id,
          platform,
          handle: cleanHandle,
          connectionStatus: "CONNECTED",
          verifiedAt: new Date(),
        },
      });
    }

    // 2. Upsert SocialAccount
    const existingAccount = await tx.socialAccount.findUnique({
      where: { creatorId_platform: { creatorId: user.creator!.id, platform } },
    });

    if (existingAccount) {
      await tx.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          handle: cleanHandle,
          profileUrl,
          connectionStatus: "CONNECTED",
          lastSyncedAt: new Date(),
        },
      });
    } else {
      await tx.socialAccount.create({
        data: {
          creatorId: user.creator!.id,
          platform,
          platformAccountId: `${platform.toLowerCase()}_${cleanHandle.replace("@", "")}`,
          handle: cleanHandle,
          displayName: user.creator!.name,
          profileUrl,
          encryptedAccessToken: "vault_local_connected",
          accessTokenIv: "iv_vault",
          accessTokenTag: "tag_vault",
          tokenScope: "read_analytics",
          connectionStatus: "CONNECTED",
          lastSyncedAt: new Date(),
        },
      });
    }
  });

  revalidatePath("/analytics");
  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
}

export async function disconnectPlatform(formData: FormData) {
  const user = await requireUser();
  if (!user.creator) return;

  const platform = text(formData.get("platform"));
  if (!platform) return;

  await prisma.$transaction([
    prisma.socialAccount.updateMany({
      where: { creatorId: user.creator.id, platform },
      data: { connectionStatus: "NOT_CONNECTED" },
    }),
    prisma.socialProfile.updateMany({
      where: { creatorId: user.creator.id, platform },
      data: { connectionStatus: "NOT_CONNECTED" },
    }),
  ]);

  revalidatePath("/analytics");
  revalidatePath("/account");
  revalidatePath(`/creators/${user.creator.id}`);
}


