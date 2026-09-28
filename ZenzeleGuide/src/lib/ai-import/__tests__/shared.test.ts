import { describe, expect, it } from "vitest";
import {
  checkBursaryDraft,
  checkCourseDraft,
  chunkText,
  levelForPercentage,
  matchSubject,
  numbersIn,
  normalise,
  quoteInSource,
  withVerifier,
  type BursaryDraft,
  type CourseDraft,
} from "../shared";

const SUBJECTS = [
  { code: "mathematics", name: "Mathematics" },
  { code: "physical_sciences", name: "Physical Sciences" },
  { code: "english_hl", name: "English Home Language" },
  { code: "english_fal", name: "English First Additional Language" },
  { code: "life_sciences", name: "Life Sciences" },
];

const PROSPECTUS = `
FACULTY OF ENGINEERING AND THE BUILT ENVIRONMENT
BSc (Engineering) in Civil Engineering
Duration: 4 years
Minimum APS: 42
Mathematics: 70% (level 6); Physical Sciences: 60%;
English Home Language or First Additional Language: level 4.
National Benchmark Test (NBT) required.
`;

const q = <T>(value: T | null, quote: string | null) => ({ value, quote });

function course(overrides: Partial<CourseDraft> = {}): CourseDraft {
  return {
    name: q("BSc (Engineering) in Civil Engineering", "BSc (Engineering) in Civil Engineering"),
    faculty: q(
      "Faculty of Engineering and the Built Environment",
      "FACULTY OF ENGINEERING AND THE BUILT ENVIRONMENT",
    ),
    qualification_type: q(null, null),
    duration_years: q(4, "Duration: 4 years"),
    min_aps: q(42, "Minimum APS: 42"),
    field_of_study: "engineering",
    requires_nbt: q(true, "National Benchmark Test (NBT) required."),
    requirements: [
      {
        subject: "Mathematics",
        min_level: 6,
        min_percentage: null,
        quote: "Mathematics: 70% (level 6)",
      },
      {
        subject: "Physical Sciences",
        min_level: null,
        min_percentage: 60,
        quote: "Physical Sciences: 60%",
      },
    ],
    uncertain: false,
    notes: null,
    ...overrides,
  };
}

describe("text helpers", () => {
  it("normalises curly quotes, dashes, hyphenated line breaks and whitespace", () => {
    expect(normalise("Mathe-\nmatics  “Level”  5–7")).toBe('mathematics "level" 5-7');
  });

  it("finds quotes despite PDF line breaks and case", () => {
    const src = normalise(PROSPECTUS);
    expect(quoteInSource("minimum aps: 42", src)).toBe(true);
    expect(quoteInSource("Mathematics: 70%\n(level 6)", src)).toBe(true);
    expect(quoteInSource("Minimum APS: 44", src)).toBe(false);
    expect(quoteInSource("", src)).toBe(false);
  });

  it("reads numbers including Rand amounts with spaces or commas", () => {
    expect(numbersIn("Household income below R350 000 per year")).toContain(350000);
    expect(numbersIn("R600,000")).toContain(600000);
    expect(numbersIn("at least 65% average")).toContain(65);
  });

  it("converts percentages to NSC levels", () => {
    expect([80, 79, 70, 60, 50, 40, 30, 29].map(levelForPercentage)).toEqual([
      7, 6, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it("maps common subject spellings but refuses to guess ambiguous ones", () => {
    expect(matchSubject("Maths", SUBJECTS)?.code).toBe("mathematics");
    expect(matchSubject("Physical Science", SUBJECTS)?.code).toBe("physical_sciences");
    expect(matchSubject("English Home Language", SUBJECTS)?.code).toBe("english_hl");
    expect(matchSubject("English", SUBJECTS)).toBeNull();
  });

  it("chunks deterministically with overlap and covers all text", () => {
    const text = Array.from({ length: 400 }, (_, i) => `Line ${i} ${"x".repeat(60)}`).join("\n");
    const a = chunkText(text, 5000);
    expect(a.length).toBeGreaterThan(1);
    expect(chunkText(text, 5000)).toEqual(a);
    expect(a[0].startsWith("Line 0")).toBe(true);
    expect(a[a.length - 1].endsWith(text.slice(-20))).toBe(true);
    expect(chunkText("short", 5000)).toEqual(["short"]);
  });
});

describe("checkCourseDraft", () => {
  it("passes a draft whose every value is quoted from the source", () => {
    const res = checkCourseDraft(course(), PROSPECTUS, SUBJECTS, []);
    expect(res.issues).toEqual([]);
    expect(res.status).toBe("passed");
    expect(res.mapped_requirements).toEqual([
      {
        index: 0,
        subject_code: "mathematics",
        subject_name: "Mathematics",
        min_level: 6,
        from: "level 6",
      },
      {
        index: 1,
        subject_code: "physical_sciences",
        subject_name: "Physical Sciences",
        min_level: 5,
        from: "60% → level 5",
      },
    ]);
  });

  it("flags an invented quote", () => {
    const res = checkCourseDraft(
      course({ min_aps: q(42, "Minimum APS for 2027: 42") }),
      PROSPECTUS,
      SUBJECTS,
      [],
    );
    expect(res.status).toBe("attention");
    expect(
      res.issues.some((i) => i.field === "min_aps" && /isn't in the document/.test(i.message)),
    ).toBe(true);
  });

  it("flags a number that doesn't match its (real) quote", () => {
    const res = checkCourseDraft(
      course({ min_aps: q(40, "Minimum APS: 42") }),
      PROSPECTUS,
      SUBJECTS,
      [],
    );
    expect(res.issues.some((i) => /40 doesn't appear/.test(i.message))).toBe(true);
  });

  it("requires a minimum APS and flags impossible values", () => {
    expect(
      checkCourseDraft(course({ min_aps: q(null, null) }), PROSPECTUS, SUBJECTS, []).issues.some(
        (i) => i.field === "min_aps",
      ),
    ).toBe(true);
    const src = PROSPECTUS + "\nMinimum APS: 60";
    expect(
      checkCourseDraft(
        course({ min_aps: q(60, "Minimum APS: 60") }),
        src,
        SUBJECTS,
        [],
      ).issues.some((i) => /outside the expected range/.test(i.message)),
    ).toBe(true);
  });

  it("asks a human when a subject is ambiguous", () => {
    const res = checkCourseDraft(
      course({
        requirements: [
          {
            subject: "English",
            min_level: 4,
            min_percentage: null,
            quote: "First Additional Language: level 4",
          },
        ],
      }),
      PROSPECTUS,
      SUBJECTS,
      [],
    );
    expect(res.issues.some((i) => /Can't tell which NSC subject "English"/.test(i.message))).toBe(
      true,
    );
  });

  it("flags duplicates and AI uncertainty", () => {
    const res = checkCourseDraft(
      course({ uncertain: true, notes: "two APS values listed" }),
      PROSPECTUS,
      SUBJECTS,
      ["bsc (engineering) in civil engineering"],
    );
    expect(res.issues.some((i) => /already exists/.test(i.message))).toBe(true);
    expect(res.issues.some((i) => /uncertain: two APS values listed/.test(i.message))).toBe(true);
  });
});

const BURSARY_PAGE = `
Future Engineers Bursary 2027 — offered by Acme Mining (Pty) Ltd.
Covers full tuition, accommodation and a laptop.
Open to South African citizens studying Engineering.
Applicants must have an average of at least 65% and a household income below R600 000 per year.
Applications open 1 August 2026 and close on 30 September 2026.
`;

function bursary(overrides: Partial<BursaryDraft> = {}): BursaryDraft {
  return {
    name: q("Future Engineers Bursary", "Future Engineers Bursary 2027"),
    provider: q("Acme Mining (Pty) Ltd", "offered by Acme Mining (Pty) Ltd."),
    website_url: q(null, null),
    value_description: q(
      "Full tuition, accommodation and a laptop",
      "Covers full tuition, accommodation and a laptop.",
    ),
    fields: ["engineering"],
    citizenship: ["sa_citizen"],
    provinces: [],
    min_percentage_avg: q(65, "an average of at least 65%"),
    household_income_max: q(600000, "a household income below R600 000 per year"),
    disability_only: q(null, null),
    opens_at: q("2026-08-01", "Applications open 1 August 2026"),
    closes_at: q("2026-09-30", "close on 30 September 2026"),
    cycle_year: q(2027, "Future Engineers Bursary 2027"),
    uncertain: false,
    notes: null,
    ...overrides,
  };
}

describe("checkBursaryDraft", () => {
  const today = new Date("2026-07-01T00:00:00Z");

  it("passes a fully quoted bursary", () => {
    const res = checkBursaryDraft(bursary(), BURSARY_PAGE, [], today);
    expect(res.issues).toEqual([]);
    expect(res.status).toBe("passed");
  });

  it("flags a date that doesn't match its quote", () => {
    const res = checkBursaryDraft(
      bursary({ closes_at: q("2026-09-03", "close on 30 September 2026") }),
      BURSARY_PAGE,
      [],
      today,
    );
    expect(res.issues.some((i) => i.field === "closes_at" && /doesn't match/.test(i.message))).toBe(
      true,
    );
  });

  it("flags closed bursaries, invalid dates and unknown values", () => {
    expect(
      checkBursaryDraft(bursary(), BURSARY_PAGE, [], new Date("2026-10-15")).issues.some((i) =>
        /already passed/.test(i.message),
      ),
    ).toBe(true);
    expect(
      checkBursaryDraft(
        bursary({ closes_at: q("2026-02-30", "close on 30 September 2026") }),
        BURSARY_PAGE,
        [],
        today,
      ).issues.some((i) => /isn't a valid date/.test(i.message)),
    ).toBe(true);
    expect(
      checkBursaryDraft(bursary({ provinces: ["Gauteng"] }), BURSARY_PAGE, [], today).issues.some(
        (i) => /Unknown value/.test(i.message),
      ),
    ).toBe(true);
  });

  it("flags an income limit that isn't in its quote", () => {
    const res = checkBursaryDraft(
      bursary({ household_income_max: q(350000, "a household income below R600 000 per year") }),
      BURSARY_PAGE,
      [],
      today,
    );
    expect(res.issues.some((i) => /350000 doesn't appear/.test(i.message))).toBe(true);
  });
});

describe("withVerifier", () => {
  const passed = { status: "passed" as const, issues: [] };
  it("keeps a pass only when the double-check agrees", () => {
    expect(withVerifier(passed, { verdict: "supported", problems: [] }).status).toBe("passed");
    expect(
      withVerifier(passed, { verdict: "unsure", problems: ["APS for which year?"] }).status,
    ).toBe("attention");
    expect(
      withVerifier(passed, { verdict: "not_supported", problems: ["APS is 40 not 42"] }).issues[0]
        .message,
    ).toMatch(/disagreed: APS is 40 not 42/);
    expect(withVerifier(passed, undefined).status).toBe("attention");
  });
});

describe("web pages", () => {
  it("turns HTML into readable text and keeps link targets", async () => {
    const { htmlToText } = await import("../shared");
    const html = `<html><head><style>.x{}</style><script>alert(1)</script></head><body>
      <h1>Future Engineers Bursary</h1><p>Closes on 30&nbsp;September&nbsp;2026 &amp; covers fees.</p>
      <table><tr><td>Min average</td><td>65%</td></tr></table>
      <a href="https://example.org/apply">Apply here</a><!-- hidden --></body></html>`;
    const text = htmlToText(html);
    expect(text).toContain("Future Engineers Bursary\nCloses on 30 September 2026 & covers fees.");
    expect(text).toContain("Min average | 65%");
    expect(text).toContain("Apply here (https://example.org/apply)");
    expect(text).not.toMatch(/alert|\.x\{\}|hidden/);
  });

  it("refuses internal addresses", async () => {
    const { isPrivateHost } = await import("../shared");
    for (const h of [
      "localhost",
      "127.0.0.1",
      "10.1.2.3",
      "192.168.0.10",
      "172.20.0.1",
      "169.254.169.254",
      "db.internal",
    ]) {
      expect(isPrivateHost(h)).toBe(true);
    }
    for (const h of ["www.nsfas.org.za", "zenzeleguide.co.za", "172.15.0.1"])
      expect(isPrivateHost(h)).toBe(false);
  });
});

describe("PDF page sections", () => {
  it("splits a page range into fixed runs and parses stored ranges", async () => {
    const { pageChunks, parsePageRange } = await import("../shared");
    expect(pageChunks(3, 14, 5)).toEqual([
      { from: 3, to: 7 },
      { from: 8, to: 12 },
      { from: 13, to: 14 },
    ]);
    expect(parsePageRange("12-40")).toEqual([12, 40]);
    expect(parsePageRange("40-12")).toBeNull();
    expect(parsePageRange(null)).toBeNull();
  });

  it("returns the text of just the requested pages and spots scanned pages", async () => {
    const { textOfPages, scannedPages, listPages } = await import("../shared");
    const src =
      "--- Page 1 ---\nIntro\n\n--- Page 2 ---\nBSc Civil\n\n--- Page 3 ---\n\n\n--- Page 4 ---\nBCom";
    expect(textOfPages(src, 2, 2)).toBe("--- Page 2 ---\nBSc Civil");
    expect(textOfPages(src, 2, 4)).toContain("BCom");
    expect(textOfPages(src, 2, 4)).not.toContain("Intro");
    const text = "Mathematics level 6 ".repeat(10);
    // One scanned page among text pages is still found.
    const section = `--- Page 1 ---\n${text}\n\n--- Page 2 ---\n\n\n--- Page 3 ---\n${text}\n\n--- Page 4 ---\n  \n`;
    expect(scannedPages(section)).toEqual([2, 4]);
    expect(scannedPages(textOfPages(src, 3, 3))).toEqual([3]);
    expect(scannedPages(`--- Page 9 ---\n${text}`)).toEqual([]);
    expect([listPages([6]), listPages([6, 7]), listPages([3, 6, 7])]).toEqual([
      "6",
      "6 and 7",
      "3, 6 and 7",
    ]);
  });
});
