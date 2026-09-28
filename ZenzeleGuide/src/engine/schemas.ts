import { z } from "zod";

// NSC Subject codes
// NSC subject code, e.g. "mathematics" or "english_hl". Subjects live in the
// `subjects` table and admins can add new ones, so any well-formed code is
// accepted. Codes the engine treats specially: life_orientation, and those in
// MATH_CODES / LANGUAGE_CODES (shared/subject-utils.ts).
export const SubjectCode = z.string().regex(/^[a-z][a-z0-9_]{1,59}$/, "Invalid subject code");
export type SubjectCode = z.infer<typeof SubjectCode>;

// Single subject mark
export const SubjectMark = z.object({
  code: SubjectCode,
  percentage: z.number().int().min(0).max(100),
  label: z.string().max(80).optional(),
});
export type SubjectMark = z.infer<typeof SubjectMark>;

// South African provinces
export const Province = z.enum(["EC", "FS", "GP", "KZN", "LP", "MP", "NC", "NW", "WC"]);
export type Province = z.infer<typeof Province>;

// Citizenship status
export const Citizenship = z.enum(["sa_citizen", "sa_permanent_resident", "other"]);
export type Citizenship = z.infer<typeof Citizenship>;

// Household income band
export const HouseholdIncomeBand = z.enum([
  "le_350k",
  "le_600k",
  "gt_600k",
  "sassa",
  "unsure",
]);
export type HouseholdIncomeBand = z.infer<typeof HouseholdIncomeBand>;

// Intended field of study
export const FieldOfStudy = z.enum([
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
  "undecided",
]);
export type FieldOfStudy = z.infer<typeof FieldOfStudy>;

// NBT scores
export const NbtScores = z.object({
  aql: z.number().int().min(0).max(100).optional(),
  mat: z.number().int().min(0).max(100).optional(),
  ql: z.number().int().min(0).max(100).optional(),
});
export type NbtScores = z.infer<typeof NbtScores>;

// Learner profile (main input)
export const LearnerProfile = z.object({
  citizenship: Citizenship,
  household_income_band: HouseholdIncomeBand,
  disability: z.boolean().default(false),
  province: Province.optional(),
  subjects: z.array(SubjectMark).min(7).max(9),
  nbt: NbtScores.optional(),
  intended_field: FieldOfStudy.default("undecided"),
});
export type LearnerProfile = z.infer<typeof LearnerProfile>;

// APS Rule Set (versioned per university)
export const ApsConversionBand = z.object({
  min_pct: z.number().int().min(0).max(100),
  max_pct: z.number().int().min(0).max(100),
  nsc_level: z.number().int().min(1).max(7),
  aps_points: z.number().int().min(0).max(10),
});
export type ApsConversionBand = z.infer<typeof ApsConversionBand>;

export const ApsLifeOrientationTreatment = z.enum([
  "excluded",
  "half_weight",
  "full_weight",
]);
export type ApsLifeOrientationTreatment = z.infer<typeof ApsLifeOrientationTreatment>;

export const ApsBonus = z.object({
  when_subject: SubjectCode,
  min_level: z.number().int().min(1).max(7),
  add_points: z.number().int().min(1).max(5),
  scope: z.enum(["all", "faculty", "course"]),
  scope_id: z.string().uuid().optional(),
});
export type ApsBonus = z.infer<typeof ApsBonus>;

export const ApsBorderlineThresholds = z
  .object({
    aps_within: z.number().int().min(1).max(5).default(2),
    subject_levels_short: z.number().int().min(0).max(2).default(1),
  })
  .default({ aps_within: 2, subject_levels_short: 1 });
export type ApsBorderlineThresholds = z.infer<typeof ApsBorderlineThresholds>;

export const ApsRuleSet = z.object({
  rule_id: z.string().uuid(),
  university_id: z.string().uuid(),
  version: z.number().int().positive(),
  effective_from: z.string(),
  source_url: z.string().url().optional(),
  conversion: z.array(ApsConversionBand).min(7),
  life_orientation: z.object({
    treatment: ApsLifeOrientationTreatment,
    cap_points: z.number().int().min(0).max(10).optional(),
  }),
  top_n: z.number().int().min(4).max(7),
  bonuses: z.array(ApsBonus).default([]),
  borderline: ApsBorderlineThresholds,
});
export type ApsRuleSet = z.infer<typeof ApsRuleSet>;

// Course requirements
export const SubjectAlternativeRequirement = z.object({
  code: SubjectCode,
  min_level: z.number().int().min(1).max(7),
});
export type SubjectAlternativeRequirement = z.infer<
  typeof SubjectAlternativeRequirement
>;

export const SubjectRequirement = z.object({
  code: SubjectCode,
  min_level: z.number().int().min(1).max(7),
  alternative: SubjectAlternativeRequirement.optional(),
});
export type SubjectRequirement = z.infer<typeof SubjectRequirement>;

export const CourseNbtRequirements = z.object({
  aql_min: z.number().int().min(0).max(100).optional(),
  mat_min: z.number().int().min(0).max(100).optional(),
  ql_min: z.number().int().min(0).max(100).optional(),
});
export type CourseNbtRequirements = z.infer<typeof CourseNbtRequirements>;

export const CourseRequirements = z.object({
  course_id: z.string().uuid(),
  university_id: z.string().uuid(),
  course_name: z.string().optional(),
  faculty_name: z.string().optional(),
  university_name: z.string().optional(),
  min_aps: z.number().int().min(0).max(60),
  required_subjects: z.array(SubjectRequirement),
  nbt: CourseNbtRequirements.optional(),
});
export type CourseRequirements = z.infer<typeof CourseRequirements>;

// NSFAS Rule Set
export const NsfasRuleSet = z.object({
  rule_id: z.string().uuid(),
  version: z.number().int().positive(),
  effective_from: z.string(),
  source_url: z.string().url().optional(),
  citizenship_eligible: z.array(z.enum(["sa_citizen", "sa_permanent_resident"])),
  household_income: z.object({
    standard_max_zar: z.number().int().positive(),
    disability_max_zar: z.number().int().positive(),
  }),
  sassa_auto_qualifies: z.boolean().default(true),
});
export type NsfasRuleSet = z.infer<typeof NsfasRuleSet>;

// Bursary predicates
export const BursaryPredicates = z.object({
  citizenship: z.array(z.enum(["sa_citizen", "sa_permanent_resident"])).optional(),
  provinces: z.array(z.string()).optional(),
  fields: z.array(z.string()).optional(),
  demographics: z
    .array(
      z.enum([
        "female",
        "male",
        "african",
        "coloured",
        "indian",
        "white",
        "disability",
        "any",
      ]),
    )
    .optional(),
  min_percentage_avg: z.number().min(0).max(100).optional(),
  household_income_max: z.number().int().positive().optional(),
});
export type BursaryPredicates = z.infer<typeof BursaryPredicates>;

export const BursaryCycle = z.object({
  cycle_id: z.string().uuid(),
  year: z.number().int().min(2026).max(2100),
  open_date: z.string().optional(),
  close_date: z.string().optional(),
});
export type BursaryCycle = z.infer<typeof BursaryCycle>;

export const BursaryDefinition = z.object({
  bursary_id: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  fields_of_study: z.array(z.string()),
  eligibility: BursaryPredicates,
  cycles: z.array(BursaryCycle).optional(),
  website_url: z.string().url().optional(),
});
export type BursaryDefinition = z.infer<typeof BursaryDefinition>;

// TVET Programme
export const TvetProgramType = z.enum(["ncv", "report_191", "occupational"]);
export type TvetProgramType = z.infer<typeof TvetProgramType>;

export const TvetProgrammeDefinition = z.object({
  programme_id: z.string().uuid(),
  college_id: z.string().uuid(),
  college_name: z.string().optional(),
  college_province: z.string().optional(),
  name: z.string(),
  program_type: TvetProgramType,
  nqf_level: z.number().int().optional(),
  min_grade: z.number().int().min(9).max(12).optional(),
  duration_years: z.number().optional(),
  fields: z.array(z.string()).optional(),
  min_english_level: z.number().int().min(1).max(7).optional(),
  min_maths_level: z.number().int().min(1).max(7).optional(),
  min_maths_lit_level: z.number().int().min(1).max(7).optional(),
});
export type TvetProgrammeDefinition = z.infer<typeof TvetProgrammeDefinition>;
