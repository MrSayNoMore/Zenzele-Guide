import type { LearnerProfile, NsfasRuleSet } from "../schemas";
import type { NsfasOutcome, NsfasStatus, Reason } from "../types";

/**
 * Evaluates NSFAS eligibility based on learner profile and versioned rules.
 */
export function evaluateNsfas(
  profile: LearnerProfile,
  rules: NsfasRuleSet,
): NsfasOutcome {
  // Check citizenship eligibility
  const citizenshipEligible = rules.citizenship_eligible.includes(
    profile.citizenship as "sa_citizen" | "sa_permanent_resident",
  );

  if (!citizenshipEligible) {
    return {
      status: "not_funded_citizenship",
      reasons: [{ kind: "citizenship_ineligible", learner: profile.citizenship }],
      rule_version_id: rules.rule_id,
    };
  }

  // SASSA auto-qualify
  if (profile.household_income_band === "sassa" && rules.sassa_auto_qualifies) {
    return {
      status: "auto_qualifies_sassa",
      reasons: [{ kind: "sassa_recipient" }],
      rule_version_id: rules.rule_id,
    };
  }

  // Unknown income
  if (profile.household_income_band === "unsure") {
    return {
      status: "needs_more_info",
      reasons: [{ kind: "income_unknown" }],
      rule_version_id: rules.rule_id,
    };
  }

  // Disability threshold (higher income limit)
  if (profile.disability && profile.household_income_band !== "gt_600k") {
    return {
      status: "funded_disability_threshold",
      reasons: [
        { kind: "disability_threshold", max: rules.household_income.disability_max_zar },
      ],
      rule_version_id: rules.rule_id,
    };
  }

  // Standard income threshold
  if (profile.household_income_band === "le_350k") {
    return {
      status: "funded",
      reasons: [
        { kind: "income_within_standard", max: rules.household_income.standard_max_zar },
      ],
      rule_version_id: rules.rule_id,
    };
  }

  // Income above threshold
  return {
    status: "not_funded_income",
    reasons: [
      { kind: "income_above_threshold", max: rules.household_income.standard_max_zar },
    ],
    rule_version_id: rules.rule_id,
  };
}

/**
 * Human-readable NSFAS status label.
 */
export function nsfasStatusLabel(status: NsfasStatus): string {
  switch (status) {
    case "funded":
      return "Funded";
    case "funded_disability_threshold":
      return "Funded (Disability Threshold)";
    case "auto_qualifies_sassa":
      return "Auto-Qualifies (SASSA Recipient)";
    case "not_funded_income":
      return "Not Funded (Income Above Threshold)";
    case "not_funded_citizenship":
      return "Not Funded (Citizenship)";
    case "needs_more_info":
      return "More Information Needed";
    default:
      return "Unknown";
  }
}

/**
 * Detailed explanation for NSFAS outcome.
 */
export function nsfasDetailedExplanation(outcome: NsfasOutcome): string {
  const statusLine = nsfasStatusLabel(outcome.status);
  const reasons = outcome.reasons
    .map((r) => {
      switch (r.kind) {
        case "citizenship_ineligible":
          return `Citizenship status "${r.learner}" is not eligible for NSFAS funding.`;
        case "sassa_recipient":
          return "As a SASSA grant recipient, you automatically qualify for NSFAS funding.";
        case "disability_threshold":
          return `For applicants with disabilities, the household income threshold is R${r.max.toLocaleString()} per year. Your income appears to fall within this limit.`;
        case "income_within_standard":
          return `The standard household income threshold is R${r.max.toLocaleString()} per year. Your income falls within this limit.`;
        case "income_above_threshold":
          return `Your household income exceeds the limit of R${r.max.toLocaleString()} per year.`;
        case "income_unknown":
          return "Please provide your household income to determine eligibility.";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ");

  return `${statusLine}. ${reasons}`;
}
