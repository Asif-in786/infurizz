import { Prisma } from "@prisma/client";
import type { CanonicalMetricDTO, DerivedMetricContract } from "./types";

export const COMBINED_FOOTPRINT_DISCLOSURE =
  "Combined Platform Footprint represents the arithmetic total of platform-reported subscribers/followers across authenticated accounts. Due to audience overlap across platforms, this figure does not represent unique individual reach.";

/**
 * Converts any API count value (string, number, bigint) to a non-negative BigInt.
 * Strictly prevents Javascript `number` representation in canonical domain storage.
 */
export function toSafeBigInt(val: unknown, fallback: bigint = BigInt(0)): bigint {
  if (val === null || val === undefined) {
    return fallback;
  }

  if (typeof val === "bigint") {
    if (val < BigInt(0)) throw new RangeError("Canonical count metrics cannot be negative");
    return val;
  }

  if (typeof val === "number") {
    if (!Number.isFinite(val) || Number.isNaN(val)) {
      throw new TypeError("Invalid numeric value for BigInt conversion");
    }
    if (val < 0) {
      throw new RangeError("Canonical count metrics cannot be negative");
    }
    // Truncate any fractional parts safely
    return BigInt(Math.trunc(val));
  }

  if (typeof val === "string") {
    const cleaned = val.trim().replace(/,/g, "");
    if (!cleaned) return fallback;

    if (cleaned.startsWith("-")) {
      throw new RangeError("Canonical count metrics cannot be negative");
    }

    // Check for valid integer string format
    if (!/^\d+$/.test(cleaned)) {
      // If float string like "123.45", take whole integer part
      if (/^\d+\.\d+$/.test(cleaned)) {
        const intPart = cleaned.split(".")[0];
        return BigInt(intPart);
      }
      throw new TypeError(`Cannot safely convert string "${val}" to BigInt`);
    }

    const parsed = BigInt(cleaned);
    if (parsed < BigInt(0)) throw new RangeError("Canonical count metrics cannot be negative");
    return parsed;
  }

  throw new TypeError(`Unsupported type for BigInt conversion: ${typeof val}`);
}

/**
 * Converts an optional API value to BigInt or null if absent.
 */
export function toSafeBigIntOrNull(val: unknown): bigint | null {
  if (val === null || val === undefined || val === "") return null;
  return toSafeBigInt(val);
}

/**
 * Computes a percentage rate using arbitrary-precision Prisma.Decimal.
 * Eliminates floating point imprecision (e.g. 0.1 + 0.2).
 *
 * @param numerator Count of engagements or interactions (BigInt)
 * @param denominator Total views or followers (BigInt)
 * @param decimalPlaces Precision (default 4 decimal places, e.g. 4.2500%)
 */
export function calculatePercentageRate(
  numerator: bigint,
  denominator: bigint,
  decimalPlaces: number = 4,
): string | null {
  if (denominator <= BigInt(0)) {
    return null;
  }

  const numDec = new Prisma.Decimal(numerator.toString());
  const denDec = new Prisma.Decimal(denominator.toString());

  // (numerator / denominator) * 100
  const rate = numDec.dividedBy(denDec).times(100);
  return rate.toFixed(decimalPlaces);
}

/**
 * Standard Derived Metric Contract definitions.
 * Follows strict architectural rule: Every derived metric must explicitly define its
 * inputs, window, denominator, and missing-input behavior.
 */
export const STANDARD_DERIVED_METRIC_CONTRACTS: Record<string, DerivedMetricContract> = {
  ENGAGEMENT_RATE_BY_VIEWS_30D: {
    name: "engagement_rate_by_views_30d",
    formula: "((likes_30d + comments_30d + shares_30d) / views_30d) * 100",
    window: "30_DAYS",
    denominator: "views_30d",
    missingInputBehavior: "OMIT",
    sourceMetricNames: ["likes_30d", "comments_30d", "shares_30d", "views_30d"],
  },
  ENGAGEMENT_RATE_BY_FOLLOWERS: {
    name: "engagement_rate_by_followers",
    formula: "((likes_recent + comments_recent) / (followers * recent_post_count)) * 100",
    window: "RECENT_SAMPLE",
    denominator: "followers * recent_post_count",
    missingInputBehavior: "OMIT",
    sourceMetricNames: ["likes_recent", "comments_recent", "followers", "recent_post_count"],
  },
};

/**
 * Evaluates a DerivedMetricContract deterministically from source metrics.
 */
export function evaluateDerivedMetric(
  contract: DerivedMetricContract,
  sourceMetricValues: Map<string, bigint>,
  capturedAt: Date = new Date(),
): CanonicalMetricDTO | null {
  const missingKeys = contract.sourceMetricNames.filter((key) => !sourceMetricValues.has(key));

  if (missingKeys.length > 0) {
    if (contract.missingInputBehavior === "OMIT") {
      return null;
    }
  }

  if (contract.name === "engagement_rate_by_views_30d") {
    const views = sourceMetricValues.get("views_30d") ?? BigInt(0);
    if (views <= BigInt(0)) return null;

    const likes = sourceMetricValues.get("likes_30d") ?? BigInt(0);
    const comments = sourceMetricValues.get("comments_30d") ?? BigInt(0);
    const shares = sourceMetricValues.get("shares_30d") ?? BigInt(0);
    const totalInteractions = likes + comments + shares;

    const rate = calculatePercentageRate(totalInteractions, views, 4);
    if (!rate) return null;

    return {
      canonicalMetricName: contract.name,
      metricValueType: "PERCENTAGE",
      valueInt: null,
      valueDecimal: rate,
      sourceType: "DERIVED",
      calculationMethod: contract.formula,
      capturedAt,
    };
  }

  return null;
}

/**
 * Aggregates authenticated accounts into a "Combined Platform Footprint".
 * STRICT RULE: Never labels this as "Total Followers" or "Unique Reach".
 * Must always include the audience-overlap disclosure.
 */
export function calculateCombinedPlatformFootprint(
  accounts: Array<{
    platform: string;
    isAccountAuthorized: boolean;
    followerCount?: bigint | null;
  }>,
): {
  totalFootprint: bigint;
  authenticatedAccountsCount: number;
  disclosure: string;
  platforms: string[];
} {
  let totalFootprint = BigInt(0);
  const contributingPlatforms: string[] = [];
  let authenticatedAccountsCount = 0;

  for (const account of accounts) {
    if (account.isAccountAuthorized) {
      authenticatedAccountsCount++;
      contributingPlatforms.push(account.platform);
      if (account.followerCount && account.followerCount > BigInt(0)) {
        totalFootprint += account.followerCount;
      }
    }
  }

  return {
    totalFootprint,
    authenticatedAccountsCount,
    disclosure: COMBINED_FOOTPRINT_DISCLOSURE,
    platforms: contributingPlatforms,
  };
}
