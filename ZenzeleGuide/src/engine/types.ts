import type {
  LearnerProfile,
  ApsRuleSet,
  NsfasRuleSet,
  CourseRequirements,
  SubjectCode,
  Province,
  BursaryDefinition,
  TvetProgrammeDefinition,
  BursaryCycle,
} from "./schemas";

// Match status enum
export type MatchStatus = "qualifies" | "borderline" | "below" | "missing_info";

// Reason types (closed enum)
export type Reason =
  | { kind: "aps_met"; required: number; learner: number }
  | { kind: "aps_short"; required: number; learner: number }
  | {
      kind: "subject_met";
      code: SubjectCode;
      required_level: number;
      learner_level: number;
    }
  | {
      kind: "subject_short";
      code: SubjectCode;
      required_level: number;
      learner_level: number;
    }
  | { kind: "missing_nbt"; missing: ("aql" | "mat" | "ql")[] }
  | {
      kind: "nbt_short";
      test: "aql" | "mat" | "ql";
      required: number;
      learner: number;
    }
  | { kind: "citizenship_ineligible"; learner: string }
  | { kind: "sassa_recipient" }
  | { kind: "disability_threshold"; max: number }
  | { kind: "income_within_standard"; max: number }
  | { kind: "income_above_threshold"; max: number }
  | { kind: "income_unknown" }
  | { kind: "bursary_predicate_met"; predicate: string }
  | { kind: "bursary_predicate_failed"; predicate: string };

// APS Computation output
export interface ScoredSubject {
  code: SubjectCode;
  percentage: number;
  nsc_level: number;
  aps_points: number;
}

export interface ApsComputation {
  rule_version_id: string;
  base_aps: number;
  bonus_aps: number;
  total_aps: number;
  subjects_scored: ScoredSubject[];
  counted_subject_codes: SubjectCode[];
  life_orientation_contribution: number;
}

// Course match result
export interface CourseMatch {
  course_id: string;
  course_name?: string;
  faculty_name?: string;
  university_name?: string;
  status: MatchStatus;
  total_aps: number;
  min_aps?: number;
  aps_gap?: number;
  subject_shortfall?: number;
  reasons: Reason[];
  rule_version_id: string;
}

// NSFAS outcome
export type NsfasStatus =
  | "funded"
  | "funded_disability_threshold"
  | "auto_qualifies_sassa"
  | "not_funded_income"
  | "not_funded_citizenship"
  | "needs_more_info";

export interface NsfasOutcome {
  status: NsfasStatus;
  reasons: Reason[];
  rule_version_id: string;
}

// Bursary match
export type BursaryStatus =
  | "eligible"
  | "partially_eligible"
  | "ineligible"
  | "closed"
  | "not_yet_open";

export interface BursaryMatch {
  bursary_id: string;
  name: string;
  provider: string;
  status: BursaryStatus;
  reasons: Reason[];
  days_to_close?: number;
  days_to_open?: number;
  cycle_year?: number;
  website_url?: string;
}

// TVET match
export interface TvetMatch {
  programme_id: string;
  programme_name: string;
  college_id: string;
  college_name?: string;
  college_province?: string;
  status: MatchStatus;
  reasons: Reason[];
  same_province?: boolean;
}

// Full journey results
export interface Grade12Result {
  engine_version: string;
  aps_computations: Record<string, ApsComputation>;
  course_matches: CourseMatch[];
  aps_rule_version_ids: string[];
  learner_summary: {
    total_aps_avg: number;
    best_aps: number;
    qualifies_count: number;
    borderline_count: number;
    below_count: number;
    missing_info_count: number;
  };
}

export interface NsfasResult {
  engine_version: string;
  outcome: NsfasOutcome;
  rule_version_id: string;
}

export interface BursaryResult {
  engine_version: string;
  matches: BursaryMatch[];
  eligible_count: number;
  partially_eligible_count: number;
  closing_soon_count: number;
}

export interface TvetResult {
  engine_version: string;
  matches: TvetMatch[];
  same_province_count: number;
  qualifies_count: number;
  borderline_count: number;
  below_count: number;
}

// Clock interface for deterministic testing
export interface Clock {
  today: () => Date;
  now: () => Date;
}

// Input types for server functions
export interface Grade12Input {
  learner: LearnerProfile;
}

export interface NsfasInput {
  learner: LearnerProfile;
}

export interface BursaryInput {
  learner: LearnerProfile;
}

export interface TvetInput {
  learner: LearnerProfile;
}
