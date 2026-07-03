import type { ApsConversionBand } from "../schemas";

/**
 * Converts a percentage score (0-100) to an NSC level (1-7).
 * Level 7 = 80-100%, Level 6 = 70-79%, etc.
 */
export function percentageToLevel(percentage: number): number {
  if (percentage >= 80) return 7;
  if (percentage >= 70) return 6;
  if (percentage >= 60) return 5;
  if (percentage >= 50) return 4;
  if (percentage >= 40) return 3;
  if (percentage >= 30) return 2;
  return 1;
}

/**
 * Gets the APS points for a percentage from a conversion table.
 */
export function lookupConversion(
  percentage: number,
  conversion: ApsConversionBand[],
): { nsc_level: number; aps_points: number } {
  for (const band of conversion) {
    if (percentage >= band.min_pct && percentage <= band.max_pct) {
      return { nsc_level: band.nsc_level, aps_points: band.aps_points };
    }
  }
  // Fallback to standard NSC table if not found
  const level = percentageToLevel(percentage);
  return { nsc_level: level, aps_points: level };
}

/**
 * Standard NSC 7-point scale conversion table.
 */
export const STANDARD_NSC_CONVERSION: ApsConversionBand[] = [
  { min_pct: 80, max_pct: 100, nsc_level: 7, aps_points: 7 },
  { min_pct: 70, max_pct: 79, nsc_level: 6, aps_points: 6 },
  { min_pct: 60, max_pct: 69, nsc_level: 5, aps_points: 5 },
  { min_pct: 50, max_pct: 59, nsc_level: 4, aps_points: 4 },
  { min_pct: 40, max_pct: 49, nsc_level: 3, aps_points: 3 },
  { min_pct: 30, max_pct: 39, nsc_level: 2, aps_points: 2 },
  { min_pct: 0, max_pct: 29, nsc_level: 1, aps_points: 1 },
];
