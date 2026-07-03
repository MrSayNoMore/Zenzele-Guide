import type { CourseMatch, MatchStatus } from "../types";

const BUCKET_ORDER: Record<MatchStatus, number> = {
  qualifies: 0,
  borderline: 1,
  below: 2,
  missing_info: 3,
};

/**
 * Sorts course matches by status bucket then by APS proximity.
 * - Qualifies: highest headroom first (strongest matches)
 * - Borderline/Below: smallest gap first (closest to qualifying)
 * - Missing info: stable by course name
 */
export function sortMatches(matches: CourseMatch[]): CourseMatch[] {
  return [...matches].sort((a, b) => {
    const bucketDiff = BUCKET_ORDER[a.status] - BUCKET_ORDER[b.status];
    if (bucketDiff !== 0) return bucketDiff;

    if (a.status === "qualifies") {
      // Highest headroom first (APS over minimum)
      const aHeadroom = (a.total_aps - (a.min_aps ?? 0)) || 0;
      const bHeadroom = (b.total_aps - (b.min_aps ?? 0)) || 0;
      if (bHeadroom !== aHeadroom) return bHeadroom - aHeadroom;
    }

    if (a.status === "borderline" || a.status === "below") {
      // Smallest gap first (closest to qualifying)
      const aGap = Math.abs(a.aps_gap ?? 0);
      const bGap = Math.abs(b.aps_gap ?? 0);
      if (aGap !== bGap) return aGap - bGap;
    }

    // Tiebreaker: course name (stable, locale en-ZA)
    const aName = a.course_name ?? "";
    const bName = b.course_name ?? "";
    return aName.localeCompare(bName, "en-ZA");
  });
}

/**
 * Groups matches by status and sorts each group.
 */
export function groupAndSortMatches(
  matches: CourseMatch[],
): Record<MatchStatus, CourseMatch[]> {
  const grouped: Record<MatchStatus, CourseMatch[]> = {
    qualifies: [],
    borderline: [],
    below: [],
    missing_info: [],
  };

  for (const match of matches) {
    grouped[match.status].push(match);
  }

  return {
    qualifies: sortMatches(grouped.qualifies),
    borderline: sortMatches(grouped.borderline),
    below: sortMatches(grouped.below),
    missing_info: sortMatches(grouped.missing_info),
  };
}

/**
 * Counts matches by status.
 */
export function countByStatus(matches: CourseMatch[]): {
  qualifies: number;
  borderline: number;
  below: number;
  missing_info: number;
} {
  return {
    qualifies: matches.filter((m) => m.status === "qualifies").length,
    borderline: matches.filter((m) => m.status === "borderline").length,
    below: matches.filter((m) => m.status === "below").length,
    missing_info: matches.filter((m) => m.status === "missing_info").length,
  };
}
