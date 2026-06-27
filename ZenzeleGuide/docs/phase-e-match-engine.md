# Zenzele Guide — Phase E: Match Engine Specification + Reference TypeScript

**Version:** 1.0 (MVP)
**Location in repo:** `src/engine/` (pure, zero Supabase imports, zero React imports)
**Test harness:** `src/engine/__tests__/` with JSON fixtures under `src/engine/__fixtures__/`
**Status:** Spec + reference implementation. Wiring into server functions happens in Phase F.

---

## 1. Design Principles (non-negotiable)

1. **Pure functions.** Every engine module takes plain data in, returns plain data out. No `fetch`, no DB client, no `window`, no `Date.now()` outside an injected clock.
2. **Versioned rules in, versioned results out.** Every output carries the `rule_version_id` it was computed against. This is what makes saved results reproducible forever (Phase D contract).
3. **Zod at the boundary.** Inputs are validated with Zod schemas exported from `src/engine/schemas.ts`. Internal functions trust their types.
4. **Deterministic.** Same inputs + same rule version = byte-identical output. No `Math.random`, no locale-sensitive sort, no `Object.keys` order dependence.
5. **Explainable.** Every match carries a machine-generated reason array. The UI renders reasons verbatim; no business logic in the view layer.
6. **Reusable.** The engine runs unchanged in: server function (SSR results), nightly batch recompute, future React Native app, future public read-only API.

---

## 2. Module Layout

```
src/engine/
├── index.ts                  # barrel export
├── schemas.ts                # Zod schemas for all engine inputs
├── types.ts                  # TypeScript types (derived from schemas where possible)
├── aps/
│   ├── compute.ts            # percentage → level → APS points per institution rule
│   ├── classify.ts           # 4-status classifier (Qualifies/Borderline/Below/Missing)
│   ├── sort.ts               # status bucket then APS-proximity sort
│   └── explain.ts            # reason-string builders
├── nsfas/
│   ├── evaluate.ts           # versioned NSFAS threshold engine
│   └── explain.ts
├── bursary/
│   ├── filter.ts             # predicate evaluation against learner profile
│   └── sort.ts               # deadline-proximity sort with cycle awareness
├── tvet/
│   └── match.ts              # NC(V) / Report 191 programme matcher
├── shared/
│   ├── nsc-level.ts          # NSC 7-point scale: percentage → level
│   ├── clock.ts              # injectable clock (for deterministic tests)
│   └── result-id.ts          # ulid-style id (no crypto.randomUUID at module scope)
└── __fixtures__/
    ├── uct-rule-v1.json
    ├── wits-rule-v1.json
    ├── nsfas-2027-v1.json
    ├── learner-lerato.json   # Grade 12 sample
    ├── learner-sipho.json    # NSFAS / TVET sample
    └── courses-seed.json
```

---

## 3. Canonical Inputs (Zod)

`src/engine/schemas.ts` (excerpt — full file in §10):

```ts
import { z } from "zod";

export const SubjectCode = z.enum([
  "english_hl", "english_fal",
  "afrikaans_hl", "afrikaans_fal",
  "isizulu_hl", "isizulu_fal", "sesotho_hl", "sesotho_fal",
  "mathematics", "mathematical_literacy", "technical_mathematics",
  "life_orientation",
  "physical_sciences", "life_sciences", "geography", "history",
  "accounting", "business_studies", "economics",
  "agricultural_sciences", "consumer_studies", "tourism",
  "information_technology", "computer_applications_technology",
  "engineering_graphics_design", "visual_arts", "dramatic_arts", "music",
  "other",
]);

export const SubjectMark = z.object({
  code: SubjectCode,
  /** Raw NSC mark, 0–100. UI collects this. */
  percentage: z.number().int().min(0).max(100),
  /** Optional free-text label when code === "other" */
  label: z.string().max(80).optional(),
});

export const LearnerProfile = z.object({
  citizenship: z.enum(["sa_citizen", "sa_permanent_resident", "other"]),
  household_income_band: z.enum(["le_350k", "le_600k", "gt_600k", "sassa", "unsure"]),
  disability: z.boolean().default(false),
  province: z.enum([
    "EC","FS","GP","KZN","LP","MP","NC","NW","WC",
  ]).optional(),
  subjects: z.array(SubjectMark).min(7).max(9),
  nbt: z.object({
    aql: z.number().int().min(0).max(100).optional(),
    mat: z.number().int().min(0).max(100).optional(),
    ql:  z.number().int().min(0).max(100).optional(),
  }).optional(),
  intended_field: z.enum([
    "health","engineering","commerce","humanities","law",
    "education","science","it","arts","agriculture","undecided",
  ]).default("undecided"),
});
export type LearnerProfile = z.infer<typeof LearnerProfile>;
```

---

## 4. APS Rule Set Shape (JSONB on `aps_rule_versions.rules`)

Each university's rule set is a versioned JSON document. The engine consumes it; the admin CMS edits it via a typed form (Phase F).

```ts
export const ApsRuleSet = z.object({
  rule_id: z.string().uuid(),
  university_id: z.string().uuid(),
  version: z.number().int().positive(),
  effective_from: z.string().date(),               // ISO yyyy-mm-dd
  source_url: z.string().url(),

  /** Percentage → APS points table. Indexed by [floor, ceiling]. */
  conversion: z.array(z.object({
    min_pct: z.number().int().min(0).max(100),
    max_pct: z.number().int().min(0).max(100),
    nsc_level: z.number().int().min(1).max(7),
    aps_points: z.number().int().min(0).max(10),
  })).min(7),

  /** How Life Orientation is treated. */
  life_orientation: z.object({
    treatment: z.enum(["excluded", "half_weight", "full_weight"]),
    /** When half_weight, points are floor(points/2). Cap optional. */
    cap_points: z.number().int().min(0).max(10).optional(),
  }),

  /** Top-N subjects counted (typically 6, excluding LO when excluded). */
  top_n: z.number().int().min(4).max(7),

  /** Optional bonus rules, e.g. UP engineering: Maths ≥ L6 adds +2. */
  bonuses: z.array(z.object({
    when_subject: SubjectCode,
    min_level: z.number().int().min(1).max(7),
    add_points: z.number().int().min(1).max(5),
    scope: z.enum(["all", "faculty", "course"]),
    scope_id: z.string().uuid().optional(),
  })).default([]),

  /** Borderline thresholds — institution may override defaults. */
  borderline: z.object({
    aps_within: z.number().int().min(1).max(5).default(2),
    subject_levels_short: z.number().int().min(0).max(2).default(1),
  }).default({ aps_within: 2, subject_levels_short: 1 }),
});
export type ApsRuleSet = z.infer<typeof ApsRuleSet>;
```

### Course requirements (per row in `courses` table)

```ts
export const CourseRequirements = z.object({
  course_id: z.string().uuid(),
  university_id: z.string().uuid(),
  min_aps: z.number().int().min(0).max(60),
  required_subjects: z.array(z.object({
    code: SubjectCode,
    min_level: z.number().int().min(1).max(7),
    /** When two are acceptable (e.g. English HL OR FAL at different levels). */
    alternative: z.object({
      code: SubjectCode,
      min_level: z.number().int().min(1).max(7),
    }).optional(),
  })),
  nbt: z.object({
    aql_min: z.number().int().min(0).max(100).optional(),
    mat_min: z.number().int().min(0).max(100).optional(),
    ql_min:  z.number().int().min(0).max(100).optional(),
  }).optional(),
});
```

---

## 5. APS Computation Algorithm

`src/engine/aps/compute.ts`:

```ts
export function computeAps(
  profile: LearnerProfile,
  rules: ApsRuleSet,
  courseId?: string,
): ApsComputation {
  // 1. Map each subject percentage → { level, points } via rules.conversion
  const scored = profile.subjects.map(s => ({
    code: s.code,
    percentage: s.percentage,
    ...lookupConversion(s.percentage, rules.conversion),
  }));

  // 2. Apply LO treatment
  const lo = scored.find(s => s.code === "life_orientation");
  const nonLo = scored.filter(s => s.code !== "life_orientation");
  let loContribution = 0;
  if (lo) {
    if (rules.life_orientation.treatment === "full_weight") loContribution = lo.aps_points;
    else if (rules.life_orientation.treatment === "half_weight") {
      loContribution = Math.floor(lo.aps_points / 2);
      if (rules.life_orientation.cap_points != null) {
        loContribution = Math.min(loContribution, rules.life_orientation.cap_points);
      }
    } // excluded → 0
  }

  // 3. Take top-N from non-LO (sorted desc by points), add LO contribution
  const ranked = [...nonLo].sort((a, b) => b.aps_points - a.aps_points);
  const counted = ranked.slice(0, rules.top_n);
  const baseAps = counted.reduce((sum, s) => sum + s.aps_points, 0) + loContribution;

  // 4. Apply scoped bonuses
  const bonusPoints = rules.bonuses
    .filter(b => b.scope === "all" || (b.scope === "course" && b.scope_id === courseId))
    .reduce((sum, b) => {
      const subj = scored.find(s => s.code === b.when_subject);
      return subj && subj.nsc_level >= b.min_level ? sum + b.add_points : sum;
    }, 0);

  return {
    rule_version_id: rules.rule_id,
    base_aps: baseAps,
    bonus_aps: bonusPoints,
    total_aps: baseAps + bonusPoints,
    subjects_scored: scored,
    counted_subject_codes: counted.map(c => c.code),
    life_orientation_contribution: loContribution,
  };
}
```

`lookupConversion` returns the row whose `[min_pct, max_pct]` contains the percentage. Tables are bands of 10 in most SA institutions; we store explicit bands so UCT's FPS-style ranges work too.

---

## 6. 4-Status Classifier

`src/engine/aps/classify.ts`:

```ts
export type MatchStatus = "qualifies" | "borderline" | "below" | "missing_info";

export function classifyCourse(
  aps: ApsComputation,
  course: CourseRequirements,
  profile: LearnerProfile,
  rules: ApsRuleSet,
): CourseMatch {
  const reasons: Reason[] = [];
  let status: MatchStatus = "qualifies";

  // (a) Missing info: any required NBT score absent?
  if (course.nbt) {
    const missingNbt = (["aql","mat","ql"] as const).filter(
      k => course.nbt![`${k}_min` as const] != null && profile.nbt?.[k] == null,
    );
    if (missingNbt.length) {
      return {
        course_id: course.course_id,
        status: "missing_info",
        total_aps: aps.total_aps,
        reasons: [{ kind: "missing_nbt", missing: missingNbt }],
        rule_version_id: rules.rule_id,
      };
    }
  }

  // (b) Subject minima
  let subjectShortfall = 0;
  for (const req of course.required_subjects) {
    const learner = aps.subjects_scored.find(s => s.code === req.code);
    const alt = req.alternative
      ? aps.subjects_scored.find(s => s.code === req.alternative!.code)
      : undefined;
    const meets =
      (learner && learner.nsc_level >= req.min_level) ||
      (alt && req.alternative && alt.nsc_level >= req.alternative.min_level);
    if (!meets) {
      const shortBy = req.min_level - (learner?.nsc_level ?? 0);
      subjectShortfall = Math.max(subjectShortfall, shortBy);
      reasons.push({
        kind: "subject_short",
        code: req.code,
        required_level: req.min_level,
        learner_level: learner?.nsc_level ?? 0,
      });
    } else {
      reasons.push({
        kind: "subject_met",
        code: req.code,
        required_level: req.min_level,
        learner_level: (learner ?? alt)!.nsc_level,
      });
    }
  }

  // (c) APS minimum
  const apsGap = course.min_aps - aps.total_aps; // positive = short
  if (apsGap > 0) {
    reasons.push({ kind: "aps_short", required: course.min_aps, learner: aps.total_aps });
  } else {
    reasons.push({ kind: "aps_met", required: course.min_aps, learner: aps.total_aps });
  }

  // (d) NBT minima (only reached when present)
  if (course.nbt && profile.nbt) {
    for (const k of ["aql","mat","ql"] as const) {
      const min = course.nbt[`${k}_min` as const];
      const score = profile.nbt[k];
      if (min != null && score != null && score < min) {
        reasons.push({ kind: "nbt_short", test: k, required: min, learner: score });
        subjectShortfall = Math.max(subjectShortfall, 99); // hard below
      }
    }
  }

  // (e) Bucket assignment
  const hardSubjectFail = subjectShortfall > rules.borderline.subject_levels_short;
  const apsBorderline = apsGap > 0 && apsGap <= rules.borderline.aps_within;
  const subjectBorderline =
    subjectShortfall > 0 && subjectShortfall <= rules.borderline.subject_levels_short;

  if (apsGap <= 0 && subjectShortfall === 0) status = "qualifies";
  else if (!hardSubjectFail && (apsBorderline || subjectBorderline)) status = "borderline";
  else status = "below";

  return {
    course_id: course.course_id,
    status,
    total_aps: aps.total_aps,
    aps_gap: apsGap,
    subject_shortfall: subjectShortfall,
    reasons,
    rule_version_id: rules.rule_id,
  };
}
```

---

## 7. Sort

`src/engine/aps/sort.ts`:

Default sort: status bucket order `qualifies → borderline → below → missing_info`, then APS proximity within bucket.

- **Qualifies:** highest headroom first (`total_aps - min_aps` desc) — surfaces strongest matches first.
- **Borderline / Below:** smallest gap first (`min_aps - total_aps` asc) — surfaces "almost there" first.
- **Missing info:** stable by course name.
- Ties broken by `course.name` ascending (stable, locale `en-ZA`).

```ts
const BUCKET_ORDER = { qualifies: 0, borderline: 1, below: 2, missing_info: 3 } as const;

export function sortMatches(matches: CourseMatchWithName[]): CourseMatchWithName[] {
  return [...matches].sort((a, b) => {
    const bucketDiff = BUCKET_ORDER[a.status] - BUCKET_ORDER[b.status];
    if (bucketDiff !== 0) return bucketDiff;
    if (a.status === "qualifies") {
      return (b.total_aps - b.min_aps) - (a.total_aps - a.min_aps);
    }
    if (a.status === "borderline" || a.status === "below") {
      return (a.min_aps - a.total_aps) - (b.min_aps - b.total_aps);
    }
    return a.name.localeCompare(b.name, "en-ZA");
  });
}
```

---

## 8. NSFAS Engine

`src/engine/nsfas/evaluate.ts`:

NSFAS rule set is versioned in the DB (`nsfas_rule_versions.rules` JSONB). Default 2026/2027 shape:

```ts
export const NsfasRuleSet = z.object({
  rule_id: z.string().uuid(),
  version: z.number().int().positive(),
  effective_from: z.string().date(),
  source_url: z.string().url(),

  citizenship_eligible: z.array(z.enum(["sa_citizen", "sa_permanent_resident"])),
  household_income: z.object({
    standard_max_zar: z.number().int().positive(),       // e.g. 350_000
    disability_max_zar: z.number().int().positive(),     // e.g. 600_000
  }),
  sassa_auto_qualifies: z.boolean().default(true),
});

export type NsfasOutcome =
  | { status: "funded";                       reasons: Reason[]; rule_version_id: string }
  | { status: "funded_disability_threshold";  reasons: Reason[]; rule_version_id: string }
  | { status: "auto_qualifies_sassa";         reasons: Reason[]; rule_version_id: string }
  | { status: "not_funded_income";            reasons: Reason[]; rule_version_id: string }
  | { status: "not_funded_citizenship";       reasons: Reason[]; rule_version_id: string }
  | { status: "needs_more_info";              reasons: Reason[]; rule_version_id: string };

export function evaluateNsfas(
  profile: LearnerProfile,
  rules: NsfasRuleSet,
): NsfasOutcome {
  if (!rules.citizenship_eligible.includes(profile.citizenship as never)) {
    return { status: "not_funded_citizenship", rule_version_id: rules.rule_id, reasons: [
      { kind: "citizenship_ineligible", learner: profile.citizenship },
    ]};
  }
  if (profile.household_income_band === "sassa" && rules.sassa_auto_qualifies) {
    return { status: "auto_qualifies_sassa", rule_version_id: rules.rule_id, reasons: [
      { kind: "sassa_recipient" },
    ]};
  }
  if (profile.household_income_band === "unsure") {
    return { status: "needs_more_info", rule_version_id: rules.rule_id, reasons: [
      { kind: "income_unknown" },
    ]};
  }
  if (profile.disability && profile.household_income_band !== "gt_600k") {
    return { status: "funded_disability_threshold", rule_version_id: rules.rule_id, reasons: [
      { kind: "disability_threshold", max: rules.household_income.disability_max_zar },
    ]};
  }
  if (profile.household_income_band === "le_350k") {
    return { status: "funded", rule_version_id: rules.rule_id, reasons: [
      { kind: "income_within_standard", max: rules.household_income.standard_max_zar },
    ]};
  }
  return { status: "not_funded_income", rule_version_id: rules.rule_id, reasons: [
    { kind: "income_above_threshold", max: rules.household_income.standard_max_zar },
  ]};
}
```

---

## 9. Bursary Engine

`src/engine/bursary/filter.ts`:

```ts
export const BursaryPredicates = z.object({
  citizenship: z.array(z.enum(["sa_citizen","sa_permanent_resident"])).optional(),
  provinces: z.array(z.string()).optional(),
  fields: z.array(z.string()).optional(),
  demographics: z.array(z.enum([
    "female","male","african","coloured","indian","white","disability","any",
  ])).optional(),
  min_percentage_avg: z.number().min(0).max(100).optional(),
  household_income_max: z.number().int().positive().optional(),
});

export const BursaryCycle = z.object({
  open_month: z.number().int().min(1).max(12),
  open_day: z.number().int().min(1).max(31),
  close_month: z.number().int().min(1).max(12),
  close_day: z.number().int().min(1).max(31),
  cycle_year: z.number().int().min(2026).max(2100),
});

export type BursaryMatch =
  | { status: "eligible";        bursary_id: string; reasons: Reason[]; days_to_close: number }
  | { status: "partially_eligible"; bursary_id: string; reasons: Reason[]; days_to_close: number }
  | { status: "ineligible";      bursary_id: string; reasons: Reason[]; days_to_close: number }
  | { status: "closed";          bursary_id: string; reasons: Reason[] };
```

Logic:
1. Compute current cycle status from `clock.today()` vs `open`/`close`. If past close → `closed`.
2. Score predicates: count met / partially met / not met.
3. `eligible` = all hard predicates met. `partially_eligible` = one demographic or field mismatch but citizenship+income met. `ineligible` = citizenship or income fails.

Sort (`src/engine/bursary/sort.ts`):
- Closing soonest first (`days_to_close` asc) for `eligible` and `partially_eligible`.
- Then opening soonest for not-yet-open.
- `closed` and `ineligible` last, alphabetical.

---

## 10. TVET Matcher

`src/engine/tvet/match.ts`:

TVET programmes (NC(V) L2–L4, Report 191 N1–N6) have simpler entry rules: a minimum NSC level for English + Mathematics or Mathematical Literacy, plus an age minimum. The matcher:
1. Checks each programme's `min_english_level`, `min_maths_level` (or `min_maths_lit_level` alternative), and `age_min`.
2. Returns same 4-status shape as APS classifier.
3. Sort: status bucket, then province proximity (learner province first), then college name.

---

## 11. Reason Vocabulary (closed enum — UI translates to copy)

```ts
export type Reason =
  | { kind: "aps_met"; required: number; learner: number }
  | { kind: "aps_short"; required: number; learner: number }
  | { kind: "subject_met"; code: string; required_level: number; learner_level: number }
  | { kind: "subject_short"; code: string; required_level: number; learner_level: number }
  | { kind: "missing_nbt"; missing: ("aql"|"mat"|"ql")[] }
  | { kind: "nbt_short"; test: "aql"|"mat"|"ql"; required: number; learner: number }
  | { kind: "citizenship_ineligible"; learner: string }
  | { kind: "sassa_recipient" }
  | { kind: "disability_threshold"; max: number }
  | { kind: "income_within_standard"; max: number }
  | { kind: "income_above_threshold"; max: number }
  | { kind: "income_unknown" }
  | { kind: "bursary_predicate_met"; predicate: string }
  | { kind: "bursary_predicate_failed"; predicate: string };
```

The UI maps each `kind` to a copy template; new reasons require a copy entry. This keeps localisation tractable (Phase 2).

---

## 12. Test Harness

`src/engine/__tests__/aps.test.ts` (vitest, no DB):

```ts
import { describe, it, expect } from "vitest";
import { computeAps } from "../aps/compute";
import { classifyCourse } from "../aps/classify";
import uctRule from "../__fixtures__/uct-rule-v1.json";
import lerato from "../__fixtures__/learner-lerato.json";
import courses from "../__fixtures__/courses-seed.json";

describe("APS engine — UCT v1 rule", () => {
  it("computes total APS deterministically", () => {
    const aps = computeAps(lerato, uctRule);
    expect(aps.total_aps).toBe(34);
    expect(aps.rule_version_id).toBe(uctRule.rule_id);
  });

  it("classifies BSc Engineering as qualifies", () => {
    const aps = computeAps(lerato, uctRule);
    const match = classifyCourse(aps, courses.uct_bsc_eng, lerato, uctRule);
    expect(match.status).toBe("qualifies");
  });

  it("classifies MBChB as missing_info when NBT absent", () => {
    const aps = computeAps(lerato, uctRule);
    const match = classifyCourse(aps, courses.uct_mbchb, lerato, uctRule);
    expect(match.status).toBe("missing_info");
  });

  it("borderline when 1 APS short", () => {
    const profile = { ...lerato, subjects: lerato.subjects.map(s =>
      s.code === "mathematics" ? { ...s, percentage: 59 } : s) };
    const aps = computeAps(profile, uctRule);
    const match = classifyCourse(aps, courses.uct_bcom, profile, uctRule);
    expect(match.status).toBe("borderline");
  });
});
```

Coverage targets: ≥90% branch on `aps/`, `nsfas/`, `bursary/`.

---

## 13. Determinism Contract

- No `new Date()` outside `shared/clock.ts`. Callers pass `clock.today()` for cycle math.
- No `Math.random`.
- No `Intl.Collator` without explicit `"en-ZA"` locale.
- `JSON.stringify` is allowed for hashing inputs; key order is enforced via a canonicaliser when results are persisted (Phase F handles persistence).
- Engine version bump (`src/engine/version.ts` constant) goes into every saved result alongside the rule version, so a future engine-logic change can be detected.

---

## 14. Integration Surface (preview of Phase F)

The engine exposes these public functions:

```ts
// src/engine/index.ts
export { computeAps, classifyCourse, sortMatches } from "./aps";
export { evaluateNsfas } from "./nsfas";
export { matchBursaries, sortBursaries } from "./bursary";
export { matchTvetProgrammes } from "./tvet";
export { LearnerProfile, ApsRuleSet, NsfasRuleSet, CourseRequirements } from "./schemas";
export const ENGINE_VERSION = "1.0.0";
```

Server functions in Phase F will:
1. Load rule rows from Supabase (active version, or pinned version for replays).
2. Validate learner input with `LearnerProfile.parse()`.
3. Call engine functions.
4. Persist `saved_results` row with `engine_version`, `aps_rule_version_id`, `nsfas_rule_version_id`, and the full output JSON.

---

## 15. Launch Gate (Phase E done when)

- [ ] All modules in §2 implemented.
- [ ] Zod schemas exported and used at every server-fn boundary.
- [ ] 6 university rule-set fixtures committed (UCT, Wits, UP, UJ, Stellenbosch, UKZN).
- [ ] NSFAS 2027 rule fixture committed.
- [ ] ≥40 unit tests, ≥90% branch coverage on `aps/`, `nsfas/`, `bursary/`.
- [ ] Snapshot test: Lerato fixture × UCT v1 × seed courses → frozen JSON output. Any algorithm change forces explicit snapshot update + engine version bump.
- [ ] No imports of `@supabase/*`, `react`, or `@tanstack/*` anywhere in `src/engine/`.
- [ ] `bun run typecheck` clean.

---

**Phase E shipped** — engine spec + reference TS frozen. Phase F wires it into TanStack server functions, the admin CMS rule editor, and the journey wizards.
