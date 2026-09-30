import { describe, expect, it } from "vitest";
import { bursaryStatus, matchesSearch, statusLabel } from "../directory";

const cycle = (opens_at: string | null, closes_at: string | null, year = 2027) => ({
  year,
  opens_at,
  closes_at,
  notes: null,
});
const today = new Date("2026-09-30T10:00:00Z");

describe("bursaryStatus", () => {
  it("is open with days left when today is inside a cycle", () => {
    const s = bursaryStatus([cycle("2026-08-01", "2026-10-31")], today);
    expect(s).toEqual({ kind: "open", closesAt: "2026-10-31", daysLeft: 31 });
    expect(statusLabel(s)).toBe("Open · closes 31 October 2026");
  });

  it("says closes today / tomorrow", () => {
    expect(statusLabel(bursaryStatus([cycle("2026-08-01", "2026-09-30")], today))).toBe(
      "Closes today",
    );
    expect(statusLabel(bursaryStatus([cycle(null, "2026-10-01")], today))).toBe("Closes tomorrow");
  });

  it("prefers an open cycle, then the soonest upcoming, then the latest closed", () => {
    expect(
      bursaryStatus([cycle("2025-01-01", "2025-03-01"), cycle("2027-02-01", "2027-04-01")], today),
    ).toEqual({ kind: "upcoming", opensAt: "2027-02-01" });
    expect(
      bursaryStatus([cycle("2025-01-01", "2025-03-01"), cycle("2026-01-01", "2026-03-31")], today),
    ).toEqual({ kind: "closed", closedAt: "2026-03-31" });
  });

  it("handles open-ended and missing dates", () => {
    expect(bursaryStatus([cycle("2026-09-01", null)], today)).toEqual({ kind: "open_no_deadline" });
    expect(bursaryStatus([], today)).toEqual({ kind: "unknown" });
    expect(bursaryStatus([cycle(null, null)], today)).toEqual({ kind: "unknown" });
  });
});

describe("matchesSearch", () => {
  it("ignores case and accents and checks every field", () => {
    expect(matchesSearch("wits", "University of the Witwatersrand", "Wits")).toBe(true);
    expect(matchesSearch("Université", "universite de test")).toBe(true);
    expect(matchesSearch("", "anything")).toBe(true);
    expect(matchesSearch("durban", "UJ", null)).toBe(false);
  });
});

describe("eligibilityLines", () => {
  it("turns the stored rules into sentences", async () => {
    const { eligibilityLines } = await import("../directory");
    expect(
      eligibilityLines(
        {
          study_levels: ["continuing", "postgraduate"],
          citizenship: ["sa_citizen", "sa_permanent_resident"],
          provinces: ["GP"],
          fields: ["engineering", "science"],
          min_percentage_avg: 65,
          household_income_max: 600000,
          demographics: ["disability"],
        },
        (f) => f.toUpperCase(),
      ),
    ).toEqual([
      "For continuing undergraduates or postgraduate students.",
      "Open to South African citizens or South African permanent residents.",
      "For learners from Gauteng.",
      "For studies in ENGINEERING or SCIENCE.",
      "An average of at least 65%.",
      "Household income of R600\u00a0000 a year or less.",
      "For learners with a disability.",
    ]);
    expect(eligibilityLines(null, String)).toEqual([]);
    expect(eligibilityLines([], String)).toEqual([]);
  });
});

describe("formatting", () => {
  it("formats dates and Rand amounts the same everywhere", async () => {
    const { formatDate, formatRand } = await import("../directory");
    expect(formatDate("2026-10-05")).toBe("5 October 2026");
    expect(formatDate("2027-02-01T00:00:00Z")).toBe("1 February 2027");
    expect(formatDate(null)).toBe("");
    expect(formatRand(600000)).toBe("R600\u00a0000");
    expect(formatRand(1250000)).toBe("R1\u00a0250\u00a0000");
    expect(formatRand(950)).toBe("R950");
  });
});

describe("journey helpers", () => {
  it("combines subjects across careers, essential first, highest level", async () => {
    const { combineCareerSubjects } = await import("../directory");
    const subj = (code: string, name: string) => ({ code, name });
    const out = combineCareerSubjects([
      {
        name: "Engineer",
        career_subjects: [
          {
            recommended_min_level: 6,
            is_essential: true,
            subjects: subj("mathematics", "Mathematics"),
          },
          {
            recommended_min_level: 5,
            is_essential: true,
            subjects: subj("physical_sciences", "Physical Sciences"),
          },
        ],
      },
      {
        name: "Developer",
        career_subjects: [
          {
            recommended_min_level: 5,
            is_essential: true,
            subjects: subj("mathematics", "Mathematics"),
          },
          {
            recommended_min_level: null,
            is_essential: false,
            subjects: subj("information_technology", "Information Technology"),
          },
          { recommended_min_level: 4, is_essential: false, subjects: null },
        ],
      },
    ]);
    expect(out.map((s) => [s.code, s.essential, s.level, s.careers])).toEqual([
      ["mathematics", true, 6, ["Engineer", "Developer"]],
      ["physical_sciences", true, 5, ["Engineer"]],
      ["information_technology", false, null, ["Developer"]],
    ]);
  });

  it("matches bursaries to a student's stage and field", async () => {
    const { bursariesForStudent } = await import("../directory");
    const b = (id: string, fields: string[], levels?: string[]) => ({
      id,
      fields_of_study: fields,
      eligibility: levels ? { study_levels: levels } : {},
    });
    const r = bursariesForStudent(
      [
        b("pg-eng", ["engineering"], ["postgraduate"]),
        b("pg-any-field", [], ["postgraduate", "continuing"]),
        b("ug-eng", ["engineering"], ["first_year"]),
        b("eng-unstated", ["engineering"]),
        b("pg-law", ["law"], ["postgraduate"]),
      ],
      "postgraduate",
      "engineering",
    );
    expect(r.matched.map((x) => x.id)).toEqual(["pg-eng", "pg-any-field"]);
    expect(r.unstated.map((x) => x.id)).toEqual(["eng-unstated"]);
  });
});
