// AI import: shared types and the deterministic checks that run on every
// AI-drafted value. Pure functions (no I/O) so they can be unit-tested and
// used on both server and client.

// ---------------------------------------------------------------------------
// Types the AI must return (see prompts in ai.server.ts)
// ---------------------------------------------------------------------------

export type Quoted<T> = { value: T | null; quote: string | null };

export type CourseRequirementDraft = {
  subject: string; // as written in the source, e.g. "Mathematics" or "Maths"
  min_level: number | null; // NSC level 1-7, when the source gives a level
  min_percentage: number | null; // when the source gives a percentage instead
  quote: string | null;
};

export type CourseDraft = {
  name: Quoted<string>;
  faculty: Quoted<string>;
  qualification_type: Quoted<string>;
  duration_years: Quoted<number>;
  min_aps: Quoted<number>;
  field_of_study: string | null;
  requires_nbt: Quoted<boolean>;
  requirements: CourseRequirementDraft[];
  uncertain: boolean;
  notes: string | null;
};

export type BursaryDraft = {
  name: Quoted<string>;
  provider: Quoted<string>;
  website_url: Quoted<string>;
  value_description: Quoted<string>;
  fields: string[];
  citizenship: string[];
  provinces: string[];
  min_percentage_avg: Quoted<number>;
  household_income_max: Quoted<number>;
  disability_only: Quoted<boolean>;
  opens_at: Quoted<string>; // YYYY-MM-DD
  closes_at: Quoted<string>; // YYYY-MM-DD
  cycle_year: Quoted<number>;
  uncertain: boolean;
  notes: string | null;
};

export type ContentType = "courses" | "bursaries";

export type Issue = { field: string; message: string; severity: "high" | "medium" };

export type VerifierVerdict = {
  verdict: "supported" | "not_supported" | "unsure";
  problems: string[];
};

export type DraftChecks = {
  status: "passed" | "attention";
  issues: Issue[];
  verifier?: VerifierVerdict;
  mapped_requirements?: {
    index: number;
    subject_code: string;
    subject_name: string;
    min_level: number;
    from: string;
  }[];
};

// ---------------------------------------------------------------------------
// Chunking: the same text always splits the same way, so the server can
// re-derive chunk N from the stored source text.
// ---------------------------------------------------------------------------

export const CHUNK_CHARS = 12_000; // ~3k tokens: fits free-tier limits per request
const CHUNK_OVERLAP = 600; // so a course split across a boundary still appears whole once

export function chunkText(text: string, size = CHUNK_CHARS): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      // Prefer to break at a paragraph or line boundary near the end.
      const window = text.slice(start + Math.floor(size * 0.7), end);
      const para = window.lastIndexOf("\n\n");
      const line = window.lastIndexOf("\n");
      const cut = para >= 0 ? para : line;
      if (cut >= 0) end = start + Math.floor(size * 0.7) + cut;
    }
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks;
}

// When the AI reads PDF pages directly, each section is a fixed run of pages,
// so section N always maps to the same pages.
export const PDF_PAGES_PER_CHUNK = 5;

export function parsePageRange(range: string | null | undefined): [number, number] | null {
  const m = /^(\d+)-(\d+)$/.exec(range ?? "");
  if (!m) return null;
  const from = Number(m[1]);
  const to = Number(m[2]);
  return from >= 1 && to >= from ? [from, to] : null;
}

export function pageChunks(from: number, to: number, perChunk = PDF_PAGES_PER_CHUNK) {
  const out: { from: number; to: number }[] = [];
  for (let p = from; p <= to; p += perChunk)
    out.push({ from: p, to: Math.min(to, p + perChunk - 1) });
  return out;
}

/** The text of pages `from`..`to`, from text built by extractPdfText ("--- Page N ---" markers). */
export function textOfPages(source: string, from: number, to: number): string {
  const parts = source.split(/(?=^--- Page \d+ ---$)/m);
  return parts
    .filter((part) => {
      const n = Number(/^--- Page (\d+) ---$/m.exec(part)?.[1]);
      return n >= from && n <= to;
    })
    .join("")
    .trim();
}

/** True when the pages have (almost) no text layer, i.e. they're scanned images. */
export function looksScanned(pageText: string): boolean {
  return pageText.replace(/--- Page \d+ ---/g, "").replace(/\s+/g, "").length < 80;
}

// ---------------------------------------------------------------------------
// Text normalisation for quote matching (PDF text is messy: hyphenation,
// curly quotes, odd spaces, line breaks).
// ---------------------------------------------------------------------------

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’‚‛`´]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/-\s*\n\s*/g, "") // words hyphenated across lines
    .replace(/\s+/g, " ")
    .trim();
}

/** True when `quote` appears in `source` (after normalising both). */
export function quoteInSource(quote: string | null | undefined, normalisedSource: string): boolean {
  if (!quote) return false;
  const q = normalise(quote);
  if (q.length < 3) return false;
  if (normalisedSource.includes(q)) return true;
  // Tolerate a trailing/leading character the model trimmed differently.
  const core = q.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  return core.length >= 3 && normalisedSource.includes(core);
}

/** Every number written in a piece of text, e.g. "R350 000" -> 350000, "60%" -> 60. */
export function numbersIn(text: string): number[] {
  const cleaned = text.replace(/(\d)[ \u00a0,](?=\d{3}\b)/g, "$1"); // "350 000" / "350,000"
  return (cleaned.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

// ---------------------------------------------------------------------------
// NSC levels and subject matching
// ---------------------------------------------------------------------------

/** NSC achievement level for a percentage (80-100 = 7 ... 0-29 = 1). */
export function levelForPercentage(pct: number): number {
  if (pct >= 80) return 7;
  if (pct >= 70) return 6;
  if (pct >= 60) return 5;
  if (pct >= 50) return 4;
  if (pct >= 40) return 3;
  if (pct >= 30) return 2;
  return 1;
}

export type SubjectRef = { code: string; name: string };

const SUBJECT_ALIASES: Record<string, string> = {
  maths: "mathematics",
  math: "mathematics",
  "pure mathematics": "mathematics",
  "core mathematics": "mathematics",
  "maths literacy": "mathematical_literacy",
  "math literacy": "mathematical_literacy",
  "mathematical lit": "mathematical_literacy",
  "physical science": "physical_sciences",
  physics: "physical_sciences",
  "physical science (physics and chemistry)": "physical_sciences",
  "life science": "life_sciences",
  biology: "life_sciences",
  lo: "life_orientation",
  "english hl": "english_hl",
  "english home language": "english_hl",
  "english fal": "english_fal",
  "english first additional language": "english_fal",
  "english 1st additional language": "english_fal",
  it: "information_technology",
  cat: "computer_applications_technology",
  egd: "engineering_graphics_design",
  "engineering graphics & design": "engineering_graphics_design",
  "engineering graphics and design": "engineering_graphics_design",
  "agricultural science": "agricultural_sciences",
  "business studies": "business_studies",
};

/**
 * Map a subject as written in a prospectus to a subject code. Returns null
 * when it isn't clear (e.g. plain "English" could be HL or FAL): a human
 * must decide rather than the system guessing.
 */
export function matchSubject(written: string, subjects: SubjectRef[]): SubjectRef | null {
  const n = normalise(written).replace(/[.:;]+$/, "");
  const byCode = new Map(subjects.map((s) => [s.code, s]));
  const alias = SUBJECT_ALIASES[n];
  if (alias && byCode.has(alias)) return byCode.get(alias)!;
  const exact = subjects.find((s) => normalise(s.name) === n || s.code === n.replace(/\s+/g, "_"));
  return exact ?? null;
}

// ---------------------------------------------------------------------------
// Deterministic checks
// ---------------------------------------------------------------------------

const FIELDS = [
  "health",
  "engineering",
  "commerce",
  "humanities",
  "law",
  "education",
  "science",
  "it",
  "arts",
  "agriculture",
];
const PROVINCES = ["EC", "FS", "GP", "KZN", "LP", "MP", "NC", "NW", "WC"];
const CITIZENSHIP = ["sa_citizen", "sa_permanent_resident"];

type CheckContext = {
  normalisedSource: string;
  issues: Issue[];
};

function checkQuoted(
  ctx: CheckContext,
  field: string,
  q: Quoted<unknown> | undefined,
  opts: { required?: boolean; numeric?: boolean } = {},
) {
  if (!q || q.value === null || q.value === undefined || q.value === "") {
    if (opts.required)
      ctx.issues.push({ field, message: "Not found in the document", severity: "high" });
    return;
  }
  if (!q.quote) {
    ctx.issues.push({
      field,
      message: "No quote from the document was given for this value",
      severity: "high",
    });
    return;
  }
  if (!quoteInSource(q.quote, ctx.normalisedSource)) {
    ctx.issues.push({
      field,
      message: "The quoted text isn't in the document (possible AI mistake)",
      severity: "high",
    });
    return;
  }
  if (opts.numeric && typeof q.value === "number" && !numbersIn(q.quote).includes(q.value)) {
    ctx.issues.push({
      field,
      message: `The number ${q.value} doesn't appear in its quote`,
      severity: "high",
    });
  }
}

function inRange(
  ctx: CheckContext,
  field: string,
  value: number | null | undefined,
  min: number,
  max: number,
  label: string,
) {
  if (value === null || value === undefined) return;
  if (!Number.isFinite(value) || value < min || value > max) {
    ctx.issues.push({
      field,
      message: `${label} ${value} is outside the expected range (${min}–${max})`,
      severity: "high",
    });
  }
}

function isIsoDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** A date's day and month (or month name) should appear in its quote. */
function dateMatchesQuote(iso: string, quote: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const q = normalise(quote);
  const nums = numbersIn(q);
  const hasDay = nums.includes(d);
  const hasMonth =
    nums.includes(m) || q.includes(months[m - 1]) || q.includes(months[m - 1].slice(0, 3));
  const hasYearOrNone = nums.includes(y) || !nums.some((n) => n >= 1900);
  return hasDay && hasMonth && hasYearOrNone;
}

export function checkCourseDraft(
  draft: CourseDraft,
  source: string,
  subjects: SubjectRef[],
  existingNames: string[],
): DraftChecks {
  const ctx: CheckContext = { normalisedSource: normalise(source), issues: [] };

  checkQuoted(ctx, "name", draft.name, { required: true });
  checkQuoted(ctx, "faculty", draft.faculty);
  checkQuoted(ctx, "qualification_type", draft.qualification_type);
  checkQuoted(ctx, "duration_years", draft.duration_years, { numeric: true });
  checkQuoted(ctx, "min_aps", draft.min_aps, { required: true, numeric: true });
  checkQuoted(ctx, "requires_nbt", draft.requires_nbt);
  inRange(ctx, "min_aps", draft.min_aps?.value, 10, 50, "Minimum APS");
  inRange(ctx, "duration_years", draft.duration_years?.value, 0.5, 8, "Duration");

  if (draft.field_of_study && !FIELDS.includes(draft.field_of_study)) {
    ctx.issues.push({
      field: "field_of_study",
      message: `Unknown field "${draft.field_of_study}"`,
      severity: "medium",
    });
  }

  const mapped: NonNullable<DraftChecks["mapped_requirements"]> = [];
  const seen = new Set<string>();
  draft.requirements.forEach((r, i) => {
    const field = `requirements[${i}]`;
    const subject = matchSubject(r.subject ?? "", subjects);
    if (!r.quote || !quoteInSource(r.quote, ctx.normalisedSource)) {
      ctx.issues.push({
        field,
        message: `"${r.subject}": quoted text isn't in the document`,
        severity: "high",
      });
    }
    let level = r.min_level;
    let from = r.min_level ? `level ${r.min_level}` : "";
    if (level === null && r.min_percentage !== null && r.min_percentage !== undefined) {
      inRange(ctx, field, r.min_percentage, 0, 100, `${r.subject} percentage`);
      level = levelForPercentage(r.min_percentage);
      from = `${r.min_percentage}% → level ${level}`;
      if (r.quote && !numbersIn(r.quote).includes(r.min_percentage)) {
        ctx.issues.push({
          field,
          message: `${r.min_percentage}% for ${r.subject} doesn't appear in its quote`,
          severity: "high",
        });
      }
    } else if (level !== null && r.quote && !numbersIn(r.quote).includes(level)) {
      ctx.issues.push({
        field,
        message: `Level ${level} for ${r.subject} doesn't appear in its quote`,
        severity: "high",
      });
    }
    if (level === null) {
      ctx.issues.push({
        field,
        message: `No minimum level or percentage for ${r.subject}`,
        severity: "high",
      });
      return;
    }
    inRange(ctx, field, level, 1, 7, `${r.subject} level`);
    if (!subject) {
      ctx.issues.push({
        field,
        message: `Can't tell which NSC subject "${r.subject}" is (e.g. English HL or FAL). Choose it when editing.`,
        severity: "high",
      });
      return;
    }
    if (seen.has(subject.code)) return; // same subject listed twice in the text
    seen.add(subject.code);
    mapped.push({
      index: i,
      subject_code: subject.code,
      subject_name: subject.name,
      min_level: level,
      from,
    });
  });

  const name = draft.name?.value?.trim().toLowerCase();
  if (name && existingNames.some((n) => n.trim().toLowerCase() === name)) {
    ctx.issues.push({
      field: "name",
      message: "A course with this name already exists at this university",
      severity: "medium",
    });
  }
  if (draft.uncertain) {
    ctx.issues.push({
      field: "notes",
      message: `The AI flagged this as uncertain${draft.notes ? `: ${draft.notes}` : ""}`,
      severity: "high",
    });
  }

  return {
    status: ctx.issues.length ? "attention" : "passed",
    issues: ctx.issues,
    mapped_requirements: mapped,
  };
}

export function checkBursaryDraft(
  draft: BursaryDraft,
  source: string,
  existingNames: string[],
  today = new Date(),
): DraftChecks {
  const ctx: CheckContext = { normalisedSource: normalise(source), issues: [] };

  checkQuoted(ctx, "name", draft.name, { required: true });
  checkQuoted(ctx, "provider", draft.provider, { required: true });
  checkQuoted(ctx, "value_description", draft.value_description);
  checkQuoted(ctx, "min_percentage_avg", draft.min_percentage_avg, { numeric: true });
  checkQuoted(ctx, "household_income_max", draft.household_income_max, { numeric: true });
  checkQuoted(ctx, "disability_only", draft.disability_only);
  checkQuoted(ctx, "cycle_year", draft.cycle_year, { numeric: true });
  inRange(ctx, "min_percentage_avg", draft.min_percentage_avg?.value, 0, 100, "Minimum average");
  inRange(
    ctx,
    "household_income_max",
    draft.household_income_max?.value,
    1,
    10_000_000,
    "Income limit",
  );

  if (draft.website_url?.value && !/^https?:\/\//i.test(draft.website_url.value)) {
    ctx.issues.push({
      field: "website_url",
      message: "Application link isn't a full web address",
      severity: "medium",
    });
  }

  for (const [field, q] of [
    ["opens_at", draft.opens_at],
    ["closes_at", draft.closes_at],
  ] as const) {
    if (!q?.value) continue;
    if (!isIsoDate(q.value)) {
      ctx.issues.push({ field, message: `"${q.value}" isn't a valid date`, severity: "high" });
      continue;
    }
    checkQuoted(ctx, field, q);
    if (q.quote && !dateMatchesQuote(q.value, q.quote)) {
      ctx.issues.push({
        field,
        message: `The date ${q.value} doesn't match its quote`,
        severity: "high",
      });
    }
  }
  if (!draft.closes_at?.value) {
    ctx.issues.push({ field: "closes_at", message: "No closing date found", severity: "medium" });
  } else if (
    isIsoDate(draft.closes_at.value) &&
    draft.closes_at.value < today.toISOString().slice(0, 10)
  ) {
    ctx.issues.push({
      field: "closes_at",
      message: "The closing date has already passed",
      severity: "medium",
    });
  }
  if (
    draft.opens_at?.value &&
    draft.closes_at?.value &&
    draft.opens_at.value > draft.closes_at.value
  ) {
    ctx.issues.push({ field: "closes_at", message: "Closes before it opens", severity: "high" });
  }
  const year =
    draft.cycle_year?.value ??
    (draft.closes_at?.value ? Number(draft.closes_at.value.slice(0, 4)) : null);
  if (year !== null && year < 2026) {
    ctx.issues.push({
      field: "cycle_year",
      message: `Year ${year} is before 2026`,
      severity: "high",
    });
  }

  const bad = (list: string[], allowed: string[]) => list.filter((v) => !allowed.includes(v));
  for (const [field, list, allowed] of [
    ["fields", draft.fields, FIELDS],
    ["provinces", draft.provinces, PROVINCES],
    ["citizenship", draft.citizenship, CITIZENSHIP],
  ] as const) {
    const unknown = bad(list ?? [], allowed as unknown as string[]);
    if (unknown.length)
      ctx.issues.push({
        field,
        message: `Unknown value(s): ${unknown.join(", ")}`,
        severity: "medium",
      });
  }

  const name = draft.name?.value?.trim().toLowerCase();
  if (name && existingNames.some((n) => n.trim().toLowerCase() === name)) {
    ctx.issues.push({
      field: "name",
      message: "A bursary with this name already exists",
      severity: "medium",
    });
  }
  if (draft.uncertain) {
    ctx.issues.push({
      field: "notes",
      message: `The AI flagged this as uncertain${draft.notes ? `: ${draft.notes}` : ""}`,
      severity: "high",
    });
  }

  return { status: ctx.issues.length ? "attention" : "passed", issues: ctx.issues };
}

/** Fold the second-opinion AI verdict into the checks. */
export function withVerifier(
  checks: DraftChecks,
  verdict: VerifierVerdict | undefined,
): DraftChecks {
  if (!verdict) {
    return {
      ...checks,
      status: "attention",
      issues: [
        ...checks.issues,
        { field: "verifier", message: "The double-check didn't run", severity: "medium" },
      ],
    };
  }
  const issues = [...checks.issues];
  if (verdict.verdict !== "supported") {
    issues.push({
      field: "verifier",
      message:
        verdict.verdict === "unsure"
          ? `Double-check unsure${verdict.problems.length ? `: ${verdict.problems.join("; ")}` : ""}`
          : `Double-check disagreed: ${verdict.problems.join("; ") || "values not supported by quotes"}`,
      severity: "high",
    });
  }
  return { ...checks, verifier: verdict, issues, status: issues.length ? "attention" : "passed" };
}

// ---------------------------------------------------------------------------
// Web pages
// ---------------------------------------------------------------------------

/** Hosts the server must never fetch (the page fetcher is admin-only, but still). */
export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h === "[::1]"
  );
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|table|ul|ol|header|footer)>/gi, "\n")
    .replace(/<(td|th)[^>]*>/gi, " | ")
    .replace(/<a\s[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t\f\v\u00a0]+/g, " ")
    .replace(/ *\n[ \n]*/g, "\n")
    .trim()
    .slice(0, 600_000);
}
