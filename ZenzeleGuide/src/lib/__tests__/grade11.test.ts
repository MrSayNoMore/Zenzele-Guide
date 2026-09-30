import { describe, expect, it } from "vitest";
import { describeApsMethod, improvementSteps, quickWins } from "../grade11";

const conversion = [
  { min_pct: 80, max_pct: 100, nsc_level: 7, aps_points: 7 },
  { min_pct: 70, max_pct: 79, nsc_level: 6, aps_points: 6 },
  { min_pct: 60, max_pct: 69, nsc_level: 5, aps_points: 5 },
  { min_pct: 50, max_pct: 59, nsc_level: 4, aps_points: 4 },
  { min_pct: 40, max_pct: 49, nsc_level: 3, aps_points: 3 },
  { min_pct: 30, max_pct: 39, nsc_level: 2, aps_points: 2 },
  { min_pct: 0, max_pct: 29, nsc_level: 1, aps_points: 1 },
];
const s = (code: string, percentage: number, nsc_level: number) => ({
  code,
  percentage,
  nsc_level,
  aps_points: nsc_level,
});

describe("quickWins", () => {
  it("lists counted subjects close to the next level, closest first", () => {
    const scored = [
      s("mathematics", 68, 5),
      s("english_hl", 58, 4),
      s("life_orientation", 79, 6),
      s("history", 81, 7),
      s("geography", 62, 5),
      s("tourism", 69, 5),
    ];
    const wins = quickWins(
      scored,
      ["mathematics", "english_hl", "history", "geography"],
      conversion,
    );
    expect(wins.map((w) => [w.code, w.gap, w.targetPercentage, w.gain])).toEqual([
      ["mathematics", 2, 70, 1],
      ["english_hl", 2, 60, 1],
      ["geography", 8, 70, 1],
    ]);
    // LO, level-7 subjects and subjects that don't count are left out.
  });
});

describe("improvementSteps", () => {
  it("explains each shortfall", () => {
    const steps = improvementSteps(
      [
        { kind: "subject_short", code: "mathematics", required_level: 6, learner_level: 5 },
        { kind: "subject_short", code: "physical_sciences", required_level: 5, learner_level: 0 },
        { kind: "aps_short", required: 34, learner: 31 },
        { kind: "aps_met", required: 1, learner: 2 },
        { kind: "missing_nbt", missing: ["aql"] },
      ],
      (c) => c.toUpperCase(),
      conversion,
    );
    expect(steps).toEqual([
      "Raise MATHEMATICS from level 5 to level 6 (70%+).",
      "Take PHYSICAL_SCIENCES (level 5, 60%+ needed).",
      "Add 3 APS points (from 31 to 34).",
      "Write the NBT (National Benchmark Test).",
    ]);
  });
});

describe("describeApsMethod", () => {
  it("describes the rule that was applied", () => {
    expect(
      describeApsMethod({ topN: 6, lifeOrientation: { treatment: "half_weight", cap_points: 3 } }),
    ).toBe("Your best 6 subjects, plus half your Life Orientation points (at most 3).");
    expect(describeApsMethod({ topN: 6, lifeOrientation: { treatment: "excluded" } })).toBe(
      "Your best 6 subjects, Life Orientation not counted.",
    );
  });
});
