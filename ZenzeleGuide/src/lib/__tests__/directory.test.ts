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
