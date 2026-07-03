import type { Reason, MatchStatus } from "../types";

/**
 * Human-readable explanations for each reason kind.
 * These are mapped to copy templates that the UI renders.
 */
export function explainReason(reason: Reason): string {
  switch (reason.kind) {
    case "aps_met":
      return `APS ${reason.learner} meets minimum ${reason.required}.`;

    case "aps_short":
      return `APS ${reason.learner} is short by ${reason.required - reason.learner} point${reason.required - reason.learner !== 1 ? "s" : ""} (minimum ${reason.required}).`;

    case "subject_met":
      return `Subject ${reason.code}: level ${reason.learner_level} meets minimum level ${reason.required_level}.`;

    case "subject_short":
      return `Subject ${reason.code}: level ${reason.learner_level} is short by ${reason.required_level - reason.learner_level} level${reason.required_level - reason.learner_level !== 1 ? "s" : ""} (minimum ${reason.required_level}).`;

    case "missing_nbt":
      return `Missing NBT scores: ${reason.missing.join(", ").toUpperCase()}. Add your NBT results to see your status.`;

    case "nbt_short":
      return `NBT ${reason.test.toUpperCase()}: score ${reason.learner} is below minimum ${reason.required}.`;

    case "citizenship_ineligible":
      return `Citizenship status "${reason.learner}" does not meet funding requirements.`;

    case "sassa_recipient":
      return "SASSA grant recipients automatically qualify for funding.";

    case "disability_threshold":
      return `Household income within disability threshold (max R${reason.max.toLocaleString()}).`;

    case "income_within_standard":
      return `Household income within standard threshold (max R${reason.max.toLocaleString()}).`;

    case "income_above_threshold":
      return `Household income exceeds threshold (max R${reason.max.toLocaleString()}).`;

    case "income_unknown":
      return "Household income not specified. Provide income details for accurate assessment.";

    case "bursary_predicate_met":
      return `Meets requirement: ${reason.predicate}.`;

    case "bursary_predicate_failed":
      return `Does not meet requirement: ${reason.predicate}.`;

    default:
      return "Unknown reason.";
  }
}

/**
 * Generates a summary explanation for a match status.
 */
export function explainStatus(status: MatchStatus): string {
  switch (status) {
    case "qualifies":
      return "You meet all the requirements for this option.";
    case "borderline":
      return "You are close to meeting the requirements. Small improvements could make the difference.";
    case "below":
      return "You do not currently meet the requirements for this option.";
    case "missing_info":
      return "We need more information to determine your eligibility.";
    default:
      return "";
  }
}

/**
 * Combines all reasons into a human-readable explanation.
 */
export function explainMatch(reasons: Reason[]): string {
  return reasons.map(explainReason).join(" ");
}
