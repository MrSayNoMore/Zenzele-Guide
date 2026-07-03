import type { LearnerProfile, BursaryDefinition, BursaryPredicates } from "../schemas";
import type { BursaryMatch, BursaryStatus, Reason } from "../types";
import type { Clock } from "../types";

/**
 * Evaluates a single predicate against learner profile.
 */
function evaluatePredicate(
  predicate: string,
  value: unknown,
  profile: LearnerProfile,
): { met: boolean; partial: boolean } {
  switch (predicate) {
    case "citizenship":
      if (value == null) return { met: true, partial: false };
      const eligibleCitizenships = value as string[];
      return {
        met: eligibleCitizenships.some(
          (c) => c === profile.citizenship || c === "any",
        ),
        partial: false,
      };

    case "province":
      if (value == null || profile.province == null) {
        return { met: true, partial: false };
      }
      const eligibleProvinces = value as string[];
      return {
        met: eligibleProvinces.some((p) => p === profile.province),
        partial: false,
      };

    case "disability":
      if (value === true) {
        return { met: profile.disability, partial: false };
      }
      return { met: true, partial: false };

    case "household_income_max":
      if (value == null || profile.household_income_band === "unsure") {
        return { met: true, partial: false };
      }
      const maxIncome = value as number;
      // Assume income bands: le_350k, le_600k, gt_600k, sassa
      const exceeds = profile.household_income_band === "gt_600k";
      return { met: !exceeds, partial: false };

    case "min_percentage_avg":
      // Would need to calculate average - for now, return met
      return { met: true, partial: false };

    case "fields":
      if (value == null || profile.intended_field === "undecided") {
        return { met: true, partial: true };
      }
      const eligibleFields = value as string[];
      return {
        met: eligibleFields.some((f) => f === profile.intended_field),
        partial: true,
      };

    default:
      return { met: true, partial: false };
  }
}

/**
 * Evaluates all predicates for a bursary against learner profile.
 */
function evaluateEligibility(
  bursary: BursaryDefinition,
  profile: LearnerProfile,
): {
  status: BursaryStatus;
  score: number;
  reasons: Reason[];
} {
  const predicates = bursary.eligibility;
  const reasons: Reason[] = [];
  let passCount = 0;
  let partialCount = 0;
  let hardFail = false;

  // Check citizenship (hard requirement)
  if (predicates.citizenship != null) {
    const result = evaluatePredicate("citizenship", predicates.citizenship, profile);
    if (!result.met) {
      hardFail = true;
      reasons.push({
        kind: "bursary_predicate_failed",
        predicate: `citizenship: must be ${predicates.citizenship.join(" or ")}`,
      });
    } else {
      passCount++;
      reasons.push({
        kind: "bursary_predicate_met",
        predicate: "citizenship requirement",
      });
    }
  }

  // Check income (hard requirement)
  if (predicates.household_income_max != null) {
    const result = evaluatePredicate("household_income_max", predicates.household_income_max, profile);
    if (!result.met) {
      hardFail = true;
      reasons.push({
        kind: "bursary_predicate_failed",
        predicate: `household income under R${predicates.household_income_max.toLocaleString()}`,
      });
    } else {
      passCount++;
      reasons.push({
        kind: "bursary_predicate_met",
        predicate: "household income requirement",
      });
    }
  }

  // Check fields of study (soft requirement)
  if (predicates.fields != null) {
    const result = evaluatePredicate("fields", predicates.fields, profile);
    if (!result.met) {
      if (result.partial) {
        partialCount++;
        reasons.push({
          kind: "bursary_predicate_failed",
          predicate: `field of study: ${predicates.fields.join(", ")}`,
        });
      } else {
        reasons.push({
          kind: "bursary_predicate_failed",
          predicate: `field of study: ${predicates.fields.join(", ")}`,
        });
      }
    } else {
      passCount++;
      reasons.push({
        kind: "bursary_predicate_met",
        predicate: "field of study match",
      });
    }
  }

  // Check province (soft requirement)
  if (predicates.provinces != null && profile.province != null) {
    const result = evaluatePredicate("province", predicates.provinces, profile);
    if (!result.met) {
      partialCount++;
      reasons.push({
        kind: "bursary_predicate_failed",
        predicate: `province: ${predicates.provinces.join(", ")}`,
      });
    } else {
      passCount++;
      reasons.push({
        kind: "bursary_predicate_met",
        predicate: "province match",
      });
    }
  }

  // Check disability requirement
  if (predicates.demographics?.includes("disability")) {
    const result = evaluatePredicate("disability", true, profile);
    if (!result.met) {
      partialCount++;
      reasons.push({
        kind: "bursary_predicate_failed",
        predicate: "disability status",
      });
    } else {
      passCount++;
      reasons.push({
        kind: "bursary_predicate_met",
        predicate: "disability status",
      });
    }
  }

  // Determine status
  if (hardFail) {
    return { status: "ineligible", score: 0, reasons };
  }

  if (partialCount > 0) {
    return { status: "partially_eligible", score: passCount, reasons };
  }

  return { status: "eligible", score: passCount, reasons };
}

/**
 * Calculates days to close for the current cycle.
 */
function calculateDaysToClose(
  bursary: BursaryDefinition,
  clock: Clock,
): { days_to_close?: number; days_to_open?: number; cycle_year?: number } {
  if (!bursary.cycles || bursary.cycles.length === 0) {
    return {};
  }

  const today = clock.today();

  // Find current or next cycle
  for (const cycle of bursary.cycles) {
    if (!cycle.close_date) continue;

    const closeDate = new Date(cycle.close_date);
    const openDate = cycle.open_date ? new Date(cycle.open_date) : null;

    if (openDate && today < openDate) {
      // Not yet open
      const daysToOpen = Math.ceil(
        (openDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { days_to_open: daysToOpen, cycle_year: cycle.year };
    }

    if (today <= closeDate) {
      // Currently open
      const daysToClose = Math.ceil(
        (closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { days_to_close: daysToClose, cycle_year: cycle.year };
    }
  }

  // Past the close date
  return { days_to_close: -1 };
}

/**
 * Matches bursaries against learner profile.
 */
export function matchBursaries(
  bursaries: BursaryDefinition[],
  profile: LearnerProfile,
  clock: Clock,
): BursaryMatch[] {
  const matches: BursaryMatch[] = [];

  for (const bursary of bursaries) {
    const eligibility = evaluateEligibility(bursary, profile);
    const timing = calculateDaysToClose(bursary, clock);

    // Skip if closed
    if (timing.days_to_close !== undefined && timing.days_to_close < 0) {
      matches.push({
        bursary_id: bursary.bursary_id,
        name: bursary.name,
        provider: bursary.provider,
        status: "closed",
        reasons: [{ kind: "bursary_predicate_failed", predicate: "Application deadline passed" }],
        website_url: bursary.website_url,
      });
      continue;
    }

    // Not yet open
    if (timing.days_to_open !== undefined && timing.days_to_open > 0) {
      matches.push({
        bursary_id: bursary.bursary_id,
        name: bursary.name,
        provider: bursary.provider,
        status: eligibility.status === "ineligible" ? "ineligible" : "not_yet_open",
        reasons: eligibility.reasons,
        days_to_open: timing.days_to_open,
        cycle_year: timing.cycle_year,
        website_url: bursary.website_url,
      });
      continue;
    }

    // Eligible or partially eligible
    matches.push({
      bursary_id: bursary.bursary_id,
      name: bursary.name,
      provider: bursary.provider,
      status: eligibility.status,
      reasons: eligibility.reasons,
      days_to_close: timing.days_to_close,
      cycle_year: timing.cycle_year,
      website_url: bursary.website_url,
    });
  }

  return matches;
}
