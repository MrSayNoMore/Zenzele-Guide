import { describe, it, expect } from "vitest";
import { computeAps } from "../aps/compute";
import { classifyCourse } from "../aps/classify";
import { sortMatches, countByStatus } from "../aps/sort";
import { evaluateNsfas } from "../nsfas/evaluate";
import { matchBursaries } from "../bursary/filter";
import { sortBursaryMatches } from "../bursary/sort";
import { matchTvetProgrammes, countTvetMatches } from "../tvet/match";
import type { LearnerProfile, ApsRuleSet, CourseRequirements, NsfasRuleSet } from "../schemas";
import { createClock } from "../shared/clock";

// Import fixtures
import sampleApsRule from "../__fixtures__/sample-aps-rule.json";
import sampleNsfasRule from "../__fixtures__/sample-nsfas-rule.json";
import learnerHigh from "../__fixtures__/sample-learner-high.json";
import learnerLow from "../__fixtures__/sample-learner-low.json";
import sampleCourses from "../__fixtures__/sample-courses.json";
import sampleBursaries from "../__fixtures__/sample-bursaries.json";
import sampleTvetProgrammes from "../__fixtures__/sample-tvet-programmes.json";

describe("APS Engine", () => {
  it("computes APS deterministically", () => {
    const aps = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );

    expect(aps.total_aps).toBeGreaterThan(0);
    expect(aps.rule_version_id).toBe(sampleApsRule.rule_id);
    expect(aps.subjects_scored).toHaveLength(7);
  });

  it("computes higher APS for high-achiever than low-achiever", () => {
    const highAps = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );
    const lowAps = computeAps(
      learnerLow as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );

    expect(highAps.total_aps).toBeGreaterThan(lowAps.total_aps);
  });

  it("handles Life Orientation with half weight", () => {
    const aps = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );

    // LO at 81% = level 7 = 8 points, half weight = 4 points
    // But capped at 3 per the rule
    expect(aps.life_orientation_contribution).toBe(3);
  });

  it("classifies sample courses correctly", () => {
    const aps = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );

    const courses = sampleCourses as CourseRequirements[];
    const matches = courses.map((course) =>
      classifyCourse(
        aps,
        course,
        learnerHigh as LearnerProfile,
        sampleApsRule as ApsRuleSet,
      ),
    );

    // Should have some qualifying matches for BA Humanities (lowest APS requirement)
    const baMatch = matches.find(
      (m) => m.course_id === "00000000-0000-0000-0000-000000001004",
    );
    expect(baMatch).toBeDefined();

    // Medicine should be missing_info due to NBT requirement
    const medMatch = matches.find(
      (m) => m.course_id === "00000000-0000-0000-0000-000000001002",
    );
    expect(medMatch?.status).toBe("missing_info");
  });

  it("sorts matches by status bucket", () => {
    const aps = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );

    const courses = sampleCourses as CourseRequirements[];
    const matches = courses.map((course) =>
      classifyCourse(
        aps,
        course,
        learnerHigh as LearnerProfile,
        sampleApsRule as ApsRuleSet,
      ),
    );

    const sorted = sortMatches(matches);

    // Qualifies should come before borderline, before below, before missing_info
    const statusOrder = sorted.map((m) => m.status);
    const hasQualifies = statusOrder.includes("qualifies");
    const hasMissing = statusOrder.includes("missing_info");

    if (hasQualifies && hasMissing) {
      const qualifiesIndex = statusOrder.indexOf("qualifies");
      const missingIndex = statusOrder.indexOf("missing_info");
      expect(qualifiesIndex).toBeLessThan(missingIndex);
    }
  });

  it("counts matches by status", () => {
    const aps = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );

    const courses = sampleCourses as CourseRequirements[];
    const matches = courses.map((course) =>
      classifyCourse(
        aps,
        course,
        learnerHigh as LearnerProfile,
        sampleApsRule as ApsRuleSet,
      ),
    );

    const counts = countByStatus(matches);
    expect(counts.qualifies + counts.borderline + counts.below + counts.missing_info).toBe(
      matches.length,
    );
  });
});

describe("NSFAS Engine", () => {
  it("funds low-income SA citizen", () => {
    const outcome = evaluateNsfas(
      learnerLow as LearnerProfile,
      sampleNsfasRule as NsfasRuleSet,
    );

    // SASSA recipient auto-qualifies
    expect(outcome.status).toBe("auto_qualifies_sassa");
  });

  it("funds regular low-income applicant", () => {
    const learner: LearnerProfile = {
      ...learnerLow,
      household_income_band: "le_350k",
    } as LearnerProfile;

    const outcome = evaluateNsfas(learner, sampleNsfasRule as NsfasRuleSet);
    expect(outcome.status).toBe("funded");
  });

  it("rejects high-income applicant", () => {
    const learner: LearnerProfile = {
      ...learnerHigh,
      household_income_band: "gt_600k",
    } as LearnerProfile;

    const outcome = evaluateNsfas(learner, sampleNsfasRule as NsfasRuleSet);
    expect(outcome.status).toBe("not_funded_income");
  });

  it("requests more info when income unknown", () => {
    const learner: LearnerProfile = {
      ...learnerHigh,
      household_income_band: "unsure",
    } as LearnerProfile;

    const outcome = evaluateNsfas(learner, sampleNsfasRule as NsfasRuleSet);
    expect(outcome.status).toBe("needs_more_info");
  });

  it("applies disability threshold", () => {
    const learner: LearnerProfile = {
      ...learnerHigh,
      household_income_band: "le_600k",
      disability: true,
    } as LearnerProfile;

    const outcome = evaluateNsfas(learner, sampleNsfasRule as NsfasRuleSet);
    expect(outcome.status).toBe("funded_disability_threshold");
  });
});

describe("Bursary Engine", () => {
  const clock = createClock("2026-06-01");

  it("matches bursaries based on learner profile", () => {
    const matches = matchBursaries(
      sampleBursaries as any[],
      learnerHigh as LearnerProfile,
      clock,
    );

    expect(matches.length).toBeGreaterThan(0);
  });

  it("sorts by deadline proximity", () => {
    const matches = matchBursaries(
      sampleBursaries as any[],
      learnerHigh as LearnerProfile,
      clock,
    );

    const sorted = sortBursaryMatches(matches);
    const eligible = sorted.filter((m) => m.status === "eligible");

    if (eligible.length > 1) {
      for (let i = 1; i < eligible.length; i++) {
        // Earlier close dates should come first (lower days_to_close)
        if (
          eligible[i - 1].days_to_close != null &&
          eligible[i].days_to_close != null
        ) {
          expect(eligible[i - 1].days_to_close).toBeLessThanOrEqual(
            eligible[i].days_to_close!,
          );
        }
      }
    }
  });
});

describe("TVET Engine", () => {
  it("matches TVET programmes based on learner profile", () => {
    const matches = matchTvetProgrammes(
      sampleTvetProgrammes as any[],
      learnerHigh as LearnerProfile,
    );

    expect(matches.length).toBeGreaterThan(0);
  });

  it("prioritizes same province programmes", () => {
    const matches = matchTvetProgrammes(
      sampleTvetProgrammes as any[],
      learnerHigh as LearnerProfile, // GP province
    );

    const gpMatches = matches.filter((m) => m.same_province);
    const lpMatches = matches.filter((m) => !m.same_province);

    // GP programmes should come before LP for GP learner
    if (gpMatches.length > 0 && lpMatches.length > 0) {
      // Find last GP index and first LP index
      let lastGpIndex = -1;
      let firstLpIndex = -1;
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].same_province) {
          lastGpIndex = i;
        } else if (firstLpIndex === -1) {
          firstLpIndex = i;
        }
      }

      if (lastGpIndex !== -1 && firstLpIndex !== -1) {
        // All GP should come before LP
        expect(lastGpIndex).toBeLessThan(firstLpIndex);
      }
    }
  });

  it("counts matches correctly", () => {
    const matches = matchTvetProgrammes(
      sampleTvetProgrammes as any[],
      learnerHigh as LearnerProfile,
    );

    const counts = countTvetMatches(matches);
    expect(
      counts.qualifies + counts.borderline + counts.below,
    ).toBe(matches.length);
  });
});

describe("Determinism", () => {
  it("produces identical output for identical input", () => {
    const aps1 = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );
    const aps2 = computeAps(
      learnerHigh as LearnerProfile,
      sampleApsRule as ApsRuleSet,
    );

    expect(aps1.total_aps).toBe(aps2.total_aps);
    expect(aps1.base_aps).toBe(aps2.base_aps);
    expect(aps1.bonus_aps).toBe(aps2.bonus_aps);
  });

  it("produces identical NSFAS outcomes for identical input", () => {
    const outcome1 = evaluateNsfas(learnerLow as LearnerProfile, sampleNsfasRule as NsfasRuleSet);
    const outcome2 = evaluateNsfas(learnerLow as LearnerProfile, sampleNsfasRule as NsfasRuleSet);

    expect(outcome1.status).toBe(outcome2.status);
    expect(outcome1.reasons).toEqual(outcome2.reasons);
  });
});
