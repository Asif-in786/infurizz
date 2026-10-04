import assert from "node:assert";
import {
  toSafeBigInt,
  toSafeBigIntOrNull,
  calculatePercentageRate,
  STANDARD_DERIVED_METRIC_CONTRACTS,
  evaluateDerivedMetric,
  calculateCombinedPlatformFootprint,
  COMBINED_FOOTPRINT_DISCLOSURE,
} from "./lib/social/normalization";

async function runStep4Tests() {
  console.log("=== PHASE 4C: STEP 4 NORMALIZATION & PROVENANCE ENGINE TESTS ===");

  // 1. BigInt Conversion & Bounds Verification
  console.log("\n[Test 1] Testing toSafeBigInt & toSafeBigIntOrNull...");
  assert.strictEqual(toSafeBigInt(100), 100n, "Number 100 converts to 100n");
  assert.strictEqual(toSafeBigInt("1,250,000"), 1250000n, "Comma-separated string converts to BigInt");
  assert.strictEqual(toSafeBigInt("9007199254740993"), 9007199254740993n, "Large string > MAX_SAFE_INTEGER converts accurately");
  assert.strictEqual(toSafeBigInt(550.8), 550n, "Floating number truncated safely to 550n");
  assert.strictEqual(toSafeBigInt("99.99"), 99n, "Floating string truncated safely to 99n");
  assert.strictEqual(toSafeBigIntOrNull(null), null, "Null returns null");
  assert.strictEqual(toSafeBigIntOrNull(undefined), null, "Undefined returns null");
  assert.strictEqual(toSafeBigIntOrNull(""), null, "Empty string returns null");

  assert.throws(() => toSafeBigInt(-5), /negative/, "Negative number throws RangeError");
  assert.throws(() => toSafeBigInt("-50"), /negative/, "Negative string throws RangeError");
  assert.throws(() => toSafeBigInt("abc"), /Cannot safely convert/, "Invalid string throws TypeError");
  console.log("  ✔ All BigInt integer conversion and boundary checks passed.");

  // 2. Decimal-Safe Rate Calculation
  console.log("\n[Test 2] Testing calculatePercentageRate with Prisma.Decimal precision...");
  // 355 interactions out of 10,000 views = 3.5500%
  const rate1 = calculatePercentageRate(355n, 10000n, 4);
  assert.strictEqual(rate1, "3.5500", "Rate correctly formatted to 4 decimal places");

  // 1 interaction out of 3 views = 33.3333% (checks recurring decimals)
  const rate2 = calculatePercentageRate(1n, 3n, 4);
  assert.strictEqual(rate2, "33.3333", "Recurring decimal formatted without floating drift");

  // Zero denominator check
  const rateZero = calculatePercentageRate(100n, 0n);
  assert.strictEqual(rateZero, null, "Zero denominator safely returns null (no divide-by-zero or NaN)");
  console.log("  ✔ Decimal rate calculations are exact and prevent float drift.");

  // 3. DerivedMetricContract Evaluation
  console.log("\n[Test 3] Testing evaluateDerivedMetric with provenance tracking...");
  const contract = STANDARD_DERIVED_METRIC_CONTRACTS.ENGAGEMENT_RATE_BY_VIEWS_30D;
  const sourceValues = new Map<string, bigint>([
    ["views_30d", 50000n],
    ["likes_30d", 2500n],
    ["comments_30d", 450n],
    ["shares_30d", 50n],
  ]);

  const derivedMetric = evaluateDerivedMetric(contract, sourceValues);
  assert(derivedMetric !== null, "Derived metric evaluated successfully");
  assert.strictEqual(derivedMetric.canonicalMetricName, "engagement_rate_by_views_30d");
  assert.strictEqual(derivedMetric.sourceType, "DERIVED", "Provenance strictly marked DERIVED");
  assert.strictEqual(derivedMetric.calculationMethod, contract.formula);
  // (2500 + 450 + 50) / 50000 * 100 = 3000 / 50000 * 100 = 6.0000%
  assert.strictEqual(derivedMetric.valueDecimal, "6.0000", "Derived rate matches formula exactly");

  // Test missing input behavior: contract has missingInputBehavior = 'OMIT'
  const incompleteValues = new Map<string, bigint>([
    ["likes_30d", 2500n],
    // missing views_30d
  ]);
  const missingResult = evaluateDerivedMetric(contract, incompleteValues);
  assert.strictEqual(missingResult, null, "Missing required inputs returns null per contract OMIT rule");
  console.log("  ✔ Derived metric evaluated with exact contract parameters and DERIVED provenance.");

  // 4. Combined Platform Footprint
  console.log("\n[Test 4] Testing calculateCombinedPlatformFootprint & overlap disclosure...");
  const testAccounts = [
    { platform: "YouTube", isAccountAuthorized: true, followerCount: 150000n },
    { platform: "Instagram", isAccountAuthorized: true, followerCount: 85000n },
    { platform: "TikTok", isAccountAuthorized: false, followerCount: 500000n }, // Unauthenticated!
  ];

  const footprintResult = calculateCombinedPlatformFootprint(testAccounts);
  // Only authenticated accounts (150,000 + 85,000 = 235,000)
  assert.strictEqual(footprintResult.totalFootprint, 235000n, "Unauthenticated accounts excluded from combined footprint");
  assert.strictEqual(footprintResult.authenticatedAccountsCount, 2);
  assert.deepStrictEqual(footprintResult.platforms, ["YouTube", "Instagram"]);
  assert.strictEqual(footprintResult.disclosure, COMBINED_FOOTPRINT_DISCLOSURE);
  assert(footprintResult.disclosure.includes("Combined Platform Footprint"), "Mandatory disclosure included");
  assert(footprintResult.disclosure.includes("audience overlap"), "Overlap caveat explicitly stated");
  console.log("  ✔ Combined Platform Footprint calculated truthfully with zero unauthenticated inclusion.");

  console.log("\n==========================================");
  console.log("  ALL STEP 4 NORMALIZATION TESTS PASSED!");
  console.log("==========================================\n");
}

runStep4Tests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
