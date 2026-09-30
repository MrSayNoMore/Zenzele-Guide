// Grade 11 planner: turn an APS computation into concrete, honest next steps.
// Pure functions (no I/O) so they can be tested and used on server or client.
import type { ApsConversionBand } from "@/engine/schemas";
import type { Reason, ScoredSubject } from "@/engine/types";

export type QuickWin = {
  code: string;
  percentage: number;
  nextLevel: number;
  targetPercentage: number;
  /** Percentage points needed to reach the next level. */
  gap: number;
  /** APS points gained if this subject reaches the next level. */
  gain: number;
};

const bandFor = (pct: number, conversion: ApsConversionBand[]) =>
  conversion.find((b) => pct >= b.min_pct && pct <= b.max_pct);

/**
 * Subjects that count towards the APS and are close to the next NSC level:
 * the cheapest points to win. Sorted by how close they are.
 */
export function quickWins(
  scored: ScoredSubject[],
  countedCodes: string[],
  conversion: ApsConversionBand[],
  maxGap = 10,
): QuickWin[] {
  const wins: QuickWin[] = [];
  for (const s of scored) {
    if (s.code === "life_orientation" || !countedCodes.includes(s.code)) continue;
    const current = bandFor(s.percentage, conversion);
    const next = conversion.find((b) => b.nsc_level === (current?.nsc_level ?? 0) + 1);
    if (!current || !next) continue;
    const gap = next.min_pct - s.percentage;
    const gain = next.aps_points - current.aps_points;
    if (gap > 0 && gap <= maxGap && gain > 0)
      wins.push({
        code: s.code,
        percentage: s.percentage,
        nextLevel: next.nsc_level,
        targetPercentage: next.min_pct,
        gap,
        gain,
      });
  }
  return wins.sort((a, b) => a.gap - b.gap || b.gain - a.gain);
}

/** What to improve to reach one programme, in plain words. */
export function improvementSteps(
  reasons: Reason[],
  subjectName: (code: string) => string,
  conversion: ApsConversionBand[],
): string[] {
  const steps: string[] = [];
  for (const r of reasons) {
    if (r.kind === "subject_short") {
      const band = conversion.find((b) => b.nsc_level === r.required_level);
      steps.push(
        r.learner_level === 0
          ? `Take ${subjectName(r.code)} (level ${r.required_level}${band ? `, ${band.min_pct}%+` : ""} needed).`
          : `Raise ${subjectName(r.code)} from level ${r.learner_level} to level ${r.required_level}${band ? ` (${band.min_pct}%+)` : ""}.`,
      );
    } else if (r.kind === "aps_short") {
      const n = r.required - r.learner;
      steps.push(`Add ${n} APS point${n === 1 ? "" : "s"} (from ${r.learner} to ${r.required}).`);
    } else if (r.kind === "nbt_short" || r.kind === "missing_nbt") {
      if (!steps.some((s) => s.includes("NBT")))
        steps.push("Write the NBT (National Benchmark Test).");
    }
  }
  return steps;
}

/** How the APS was worked out, in words (the rule differs per university). */
export function describeApsMethod(method: {
  topN: number;
  lifeOrientation: { treatment: "excluded" | "half_weight" | "full_weight"; cap_points?: number };
}): string {
  const lo = method.lifeOrientation;
  const loText =
    lo.treatment === "excluded"
      ? "Life Orientation not counted"
      : lo.treatment === "half_weight"
        ? `plus half your Life Orientation points${lo.cap_points != null ? ` (at most ${lo.cap_points})` : ""}`
        : "plus your Life Orientation points";
  return `Your best ${method.topN} subjects, ${loText}.`;
}
