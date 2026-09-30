// NSC achievement levels (7 = 80–100% … 1 = 0–29%).
export const NSC_LEVELS: { level: number; min: number; max: number }[] = [
  { level: 7, min: 80, max: 100 },
  { level: 6, min: 70, max: 79 },
  { level: 5, min: 60, max: 69 },
  { level: 4, min: 50, max: 59 },
  { level: 3, min: 40, max: 49 },
  { level: 2, min: 30, max: 39 },
  { level: 1, min: 0, max: 29 },
];

/** "60–69%" for level 5. */
export function levelRange(level: number): string {
  const l = NSC_LEVELS.find((x) => x.level === level);
  return l ? `${l.min}–${l.max}%` : "";
}

/** The NSC level for a percentage mark. */
export function levelFor(percentage: number): number {
  return NSC_LEVELS.find((l) => percentage >= l.min)?.level ?? 1;
}
