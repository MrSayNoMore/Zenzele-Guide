import { describe, expect, it } from "vitest";
import {
  durationLabel,
  educationRank,
  fitsLearner,
  opportunityStatus,
  requirementLines,
  sortByStatus,
} from "../opportunities";

const today = new Date("2026-09-30T10:00:00Z");
const req = (over: Partial<Parameters<typeof fitsLearner>[0]> = {}) => ({
  min_education: null,
  provinces: [],
  max_age: null,
  field_of_study: null,
  ...over,
});

describe("educationRank", () => {
  it("orders levels from lowest to highest", () => {
    expect(educationRank("grade_11")).toBeLessThan(educationRank("grade_12"));
    expect(educationRank("grade_12")).toBeLessThan(educationRank("nqf_4"));
    expect(educationRank("diploma")).toBeLessThan(educationRank("degree"));
    expect(educationRank("nonsense")).toBe(-1);
  });
});

describe("fitsLearner", () => {
  it("lets anyone through when nothing is stated", () => {
    expect(fitsLearner(req(), { education: "grade_9", province: "LP", age: 30 })).toBe(true);
  });

  it("checks the minimum education", () => {
    const o = req({ min_education: "grade_12" });
    expect(fitsLearner(o, { education: "grade_11" })).toBe(false);
    expect(fitsLearner(o, { education: "grade_12" })).toBe(true);
    expect(fitsLearner(o, { education: "degree" })).toBe(true);
    expect(fitsLearner(o, { education: "" })).toBe(true);
  });

  it("checks province only when the opportunity limits it", () => {
    const o = req({ provinces: ["GP", "KZN"] });
    expect(fitsLearner(o, { province: "KZN" })).toBe(true);
    expect(fitsLearner(o, { province: "EC" })).toBe(false);
    expect(fitsLearner(o, { province: "" })).toBe(true);
  });

  it("checks the maximum age, inclusive", () => {
    const o = req({ max_age: 35 });
    expect(fitsLearner(o, { age: 35 })).toBe(true);
    expect(fitsLearner(o, { age: 36 })).toBe(false);
    expect(fitsLearner(o, { age: null })).toBe(true);
  });

  it("checks field only when both sides give one", () => {
    const o = req({ field_of_study: "engineering" });
    expect(fitsLearner(o, { field: "engineering" })).toBe(true);
    expect(fitsLearner(o, { field: "commerce" })).toBe(false);
    expect(fitsLearner(req(), { field: "commerce" })).toBe(true);
  });
});

describe("opportunityStatus", () => {
  it("uses the opening and closing dates", () => {
    expect(opportunityStatus({ opens_at: "2026-09-01", closes_at: "2026-10-10" }, today)).toEqual({
      kind: "open",
      closesAt: "2026-10-10",
      daysLeft: 10,
    });
    expect(opportunityStatus({ opens_at: "2026-11-01", closes_at: null }, today).kind).toBe(
      "upcoming",
    );
    expect(opportunityStatus({ opens_at: null, closes_at: "2026-09-01" }, today).kind).toBe(
      "closed",
    );
    expect(opportunityStatus({ opens_at: null, closes_at: null }, today).kind).toBe("unknown");
  });
});

describe("sortByStatus", () => {
  it("puts open first (soonest deadline on top), closed last", () => {
    const row = (title: string, opens_at: string | null, closes_at: string | null) => ({
      title,
      status: opportunityStatus({ opens_at, closes_at }, today),
    });
    const sorted = sortByStatus([
      row("Closed", null, "2026-01-01"),
      row("Later", null, "2026-12-01"),
      row("Upcoming", "2026-12-01", null),
      row("Sooner", null, "2026-10-05"),
    ]);
    expect(sorted.map((r) => r.title)).toEqual(["Sooner", "Later", "Upcoming", "Closed"]);
  });
});

describe("requirementLines and durationLabel", () => {
  it("describes requirements in plain words", () => {
    expect(
      requirementLines(req({ min_education: "grade_12", max_age: 35, provinces: ["GP", "WC"] })),
    ).toEqual([
      "At least Grade 12 (matric).",
      "Aged 35 or younger.",
      "For people living in Gauteng or Western Cape.",
    ]);
    expect(requirementLines(req())).toEqual([]);
  });

  it("formats durations", () => {
    expect(durationLabel(12)).toBe("1 year");
    expect(durationLabel(24)).toBe("2 years");
    expect(durationLabel(18)).toBe("18 months");
    expect(durationLabel(1)).toBe("1 month");
    expect(durationLabel(null)).toBeNull();
  });
});
