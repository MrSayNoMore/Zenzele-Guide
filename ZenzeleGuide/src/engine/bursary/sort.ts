import type { BursaryMatch, BursaryStatus } from "../types";

const STATUS_ORDER: Record<BursaryStatus, number> = {
  eligible: 0,
  partially_eligible: 1,
  not_yet_open: 2,
  ineligible: 3,
  closed: 4,
};

/**
 * Sorts bursary matches by deadline proximity.
 * - Eligible/partially_eligible: closing soonest first
 * - Not yet open: opening soonest first
 * - Closed/ineligible: alphabetical by name
 */
export function sortBursaryMatches(matches: BursaryMatch[]): BursaryMatch[] {
  return [...matches].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;

    if (a.status === "eligible" || a.status === "partially_eligible") {
      // Closing soonest first
      if (a.days_to_close != null && b.days_to_close != null) {
        if (a.days_to_close !== b.days_to_close) {
          return a.days_to_close - b.days_to_close;
        }
      }
    }

    if (a.status === "not_yet_open") {
      // Opening soonest first
      if (a.days_to_open != null && b.days_to_open != null) {
        if (a.days_to_open !== b.days_to_open) {
          return a.days_to_open - b.days_to_open;
        }
      }
    }

    // Alphabetical tiebreaker
    return a.name.localeCompare(b.name, "en-ZA");
  });
}

/**
 * Groups bursary matches by status.
 */
export function groupBursaryMatches(
  matches: BursaryMatch[],
): Record<BursaryStatus, BursaryMatch[]> {
  const grouped: Record<BursaryStatus, BursaryMatch[]> = {
    eligible: [],
    partially_eligible: [],
    not_yet_open: [],
    ineligible: [],
    closed: [],
  };

  for (const match of matches) {
    grouped[match.status].push(match);
  }

  return {
    eligible: sortBursaryMatches(grouped.eligible),
    partially_eligible: sortBursaryMatches(grouped.partially_eligible),
    not_yet_open: sortBursaryMatches(grouped.not_yet_open),
    ineligible: sortBursaryMatches(grouped.ineligible),
    closed: sortBursaryMatches(grouped.closed),
  };
}

/**
 * Counts bursary matches by status.
 */
export function countBursaryStatus(
  matches: BursaryMatch[],
): {
  eligible: number;
  partially_eligible: number;
  closing_soon_count: number;
} {
  const eligible = matches.filter((m) => m.status === "eligible").length;
  const partiallyEligible = matches.filter(
    (m) => m.status === "partially_eligible",
  ).length;
  const closingSoon = matches.filter(
    (m) => m.days_to_close != null && m.days_to_close <= 14 && m.days_to_close > 0,
  ).length;

  return {
    eligible,
    partially_eligible: partiallyEligible,
    closing_soon_count: closingSoon,
  };
}
