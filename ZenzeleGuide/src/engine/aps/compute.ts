import type { LearnerProfile, ApsRuleSet, SubjectCode } from "../schemas";
import type { ApsComputation, ScoredSubject } from "../types";
import { lookupConversion } from "../shared/nsc-level";

/**
 * Computes APS for a learner against a university's rule set.
 * Pure function - no side effects.
 */
export function computeAps(
  profile: LearnerProfile,
  rules: ApsRuleSet,
  courseId?: string,
): ApsComputation {
  // 1. Map each subject percentage → { level, points } via rules.conversion
  const scored: ScoredSubject[] = profile.subjects.map((s) => {
    const conversion = lookupConversion(s.percentage, rules.conversion);
    return {
      code: s.code,
      percentage: s.percentage,
      nsc_level: conversion.nsc_level,
      aps_points: conversion.aps_points,
    };
  });

  // 2. Apply LO treatment
  const lo = scored.find((s) => s.code === "life_orientation");
  const nonLo = scored.filter((s) => s.code !== "life_orientation");
  let loContribution = 0;

  if (lo) {
    if (rules.life_orientation.treatment === "full_weight") {
      loContribution = lo.aps_points;
    } else if (rules.life_orientation.treatment === "half_weight") {
      loContribution = Math.floor(lo.aps_points / 2);
      if (rules.life_orientation.cap_points != null) {
        loContribution = Math.min(loContribution, rules.life_orientation.cap_points);
      }
    }
    // excluded → 0
  }

  // 3. Take top-N from non-LO (sorted desc by points), add LO contribution
  const ranked = [...nonLo].sort((a, b) => b.aps_points - a.aps_points);
  const counted = ranked.slice(0, rules.top_n);
  const baseAps =
    counted.reduce((sum, s) => sum + s.aps_points, 0) + loContribution;

  // 4. Apply scoped bonuses
  const bonusPoints = rules.bonuses
    .filter((b) => b.scope === "all" || (b.scope === "course" && b.scope_id === courseId))
    .reduce((sum, b) => {
      const subj = scored.find((s) => s.code === b.when_subject);
      return subj && subj.nsc_level >= b.min_level ? sum + b.add_points : sum;
    }, 0);

  return {
    rule_version_id: rules.rule_id,
    base_aps: baseAps,
    bonus_aps: bonusPoints,
    total_aps: baseAps + bonusPoints,
    subjects_scored: scored,
    counted_subject_codes: counted.map((c) => c.code),
    life_orientation_contribution: loContribution,
  };
}

/**
 * Computes APS for a single university (returns computation with university metadata).
 */
export interface ApsComputationWithMeta extends ApsComputation {
  university_id: string;
  rule_version_id: string;
}

export function computeApsForUniversity(
  profile: LearnerProfile,
  rules: ApsRuleSet,
): ApsComputationWithMeta {
  const computation = computeAps(profile, rules);
  return {
    ...computation,
    university_id: rules.university_id,
  };
}

/**
 * Computes APS for all universities in parallel.
 */
export function computeAllAps(
  profile: LearnerProfile,
  rulesByUniversity: Map<string, ApsRuleSet>,
): Map<string, ApsComputation> {
  const results = new Map<string, ApsComputation>();
  for (const [universityId, rules] of rulesByUniversity) {
    results.set(universityId, computeAps(profile, rules));
  }
  return results;
}
