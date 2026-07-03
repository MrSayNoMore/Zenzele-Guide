// Engine version
export { ENGINE_VERSION } from "./version";

// Schemas
export {
  SubjectCode,
  SubjectMark,
  Province,
  Citizenship,
  HouseholdIncomeBand,
  FieldOfStudy,
  NbtScores,
  LearnerProfile,
  ApsConversionBand,
  ApsLifeOrientationTreatment,
  ApsBonus,
  ApsBorderlineThresholds,
  ApsRuleSet,
  SubjectAlternativeRequirement,
  SubjectRequirement,
  CourseNbtRequirements,
  CourseRequirements,
  NsfasRuleSet,
  BursaryPredicates,
  BursaryCycle,
  BursaryDefinition,
  TvetProgramType,
  TvetProgrammeDefinition,
} from "./schemas";

// Types
export type {
  MatchStatus,
  Reason,
  ScoredSubject,
  ApsComputation,
  CourseMatch,
  NsfasStatus,
  NsfasOutcome,
  BursaryStatus,
  BursaryMatch,
  TvetMatch,
  Clock,
  Grade12Input,
  NsfasInput,
  BursaryInput,
  TvetInput,
  Grade12Result,
  NsfasResult,
  BursaryResult,
  TvetResult,
} from "./types";

// APS Engine
export {
  computeAps,
  computeApsForUniversity,
  computeAllAps,
  classifyCourse,
  classifyAllCourses,
  sortMatches,
  groupAndSortMatches,
  countByStatus,
  formatQualificationStatement,
  formatStatusExplanation,
} from "./aps";

// NSFAS Engine
export {
  evaluateNsfas,
  nsfasStatusLabel,
  nsfasDetailedExplanation,
} from "./nsfas";

// Bursary Engine
export {
  matchBursaries,
  sortBursaryMatches,
  groupBursaryMatches,
  countBursaryStatus,
} from "./bursary";

// TVET Engine
export {
  matchTvetProgrammes,
  sortTvetMatches,
  countTvetMatches,
} from "./tvet";

// Shared utilities
export { createClock, defaultClock } from "./shared/clock";
export {
  percentageToLevel,
  lookupConversion,
  STANDARD_NSC_CONVERSION,
} from "./shared/nsc-level";
export {
  findSubject,
  hasSubject,
  getSubjectPercentage,
  MATH_CODES,
  LANGUAGE_CODES,
  findLanguageSubject,
  hasValidSubjectCombination,
} from "./shared/subject-utils";
export {
  explainReason,
  explainStatus,
  explainMatch,
} from "./shared/explain";
