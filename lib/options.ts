export const ROLES = ["CREATOR", "BRAND", "UNASSIGNED"] as const;
export type Role = (typeof ROLES)[number];

export const PLATFORMS = ["Instagram", "TikTok", "YouTube", "X", "Twitch", "LinkedIn"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CATEGORIES = [
  "Fashion",
  "Beauty",
  "Food",
  "Fitness",
  "Technology",
  "Travel",
  "Lifestyle",
  "Finance",
  "Gaming",
  "Education",
] as const;

export const AUDIENCE_RANGES = [
  "Under 10k",
  "10k–50k",
  "50k–250k",
  "250k–1m",
  "1m+",
] as const;

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "PAUSED",
  "CLOSED",
  "Draft",
  "Published",
  "Open",
  "Paused",
  "Closed",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const APPLICATION_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isCampaignPublished(status: string): boolean {
  return status === "PUBLISHED" || status === "Open" || status === "Published";
}

export function isCampaignAcceptingApplications(status: string): boolean {
  return isCampaignPublished(status);
}

export function canTransitionCampaign(fromStatus: string, toStatus: string): boolean {
  const from = fromStatus === "Open" ? "PUBLISHED" : fromStatus.toUpperCase();
  const to = toStatus === "Open" ? "PUBLISHED" : toStatus.toUpperCase();
  if (from === to) return true;

  switch (from) {
    case "DRAFT":
      return to === "PUBLISHED" || to === "CLOSED";
    case "PUBLISHED":
      return to === "PAUSED" || to === "CLOSED";
    case "PAUSED":
      return to === "PUBLISHED" || to === "CLOSED";
    case "CLOSED":
      return false; // Terminal state
    default:
      return true;
  }
}

export function canTransitionApplication(fromStatus: string, toStatus: string): boolean {
  // Only PENDING can transition to ACCEPTED, REJECTED, or WITHDRAWN
  if (fromStatus === "PENDING") {
    return toStatus === "ACCEPTED" || toStatus === "REJECTED" || toStatus === "WITHDRAWN";
  }
  return false;
}

export const ORDER_STATUSES = [
  "PENDING",
  "READY_TO_START",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function canTransitionOrder(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) return true;

  switch (fromStatus) {
    case "PENDING":
      return toStatus === "READY_TO_START" || toStatus === "CANCELLED";
    case "READY_TO_START":
      return toStatus === "IN_PROGRESS" || toStatus === "CANCELLED";
    case "IN_PROGRESS":
      return toStatus === "SUBMITTED" || toStatus === "CANCELLED" || toStatus === "DISPUTED";
    case "SUBMITTED":
      return toStatus === "REVISION_REQUESTED" || toStatus === "COMPLETED" || toStatus === "DISPUTED";
    case "REVISION_REQUESTED":
      return toStatus === "SUBMITTED" || toStatus === "DISPUTED";
    case "DISPUTED":
      return toStatus === "COMPLETED" || toStatus === "CANCELLED";
    case "COMPLETED":
    case "CANCELLED":
      return false; // Terminal states
    default:
      return false;
  }
}

export const DEMO_PASSWORD = "demopass";

export const DEMO_ACCOUNTS = [
  { role: "Creator", name: "Mira Sen", email: "mira@demo.infurizz.local" },
  { role: "Brand", name: "Northstar", email: "northstar@demo.infurizz.local" },
] as const;
