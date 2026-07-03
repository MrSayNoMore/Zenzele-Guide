import type { SubjectCode, SubjectMark, LearnerProfile } from "../schemas";

/**
 * Finds a subject by its code in the learner's subjects.
 */
export function findSubject(
  subjects: SubjectMark[],
  code: SubjectCode,
): SubjectMark | undefined {
  return subjects.find((s) => s.code === code);
}

/**
 * Checks if the learner has a specific subject.
 */
export function hasSubject(subjects: SubjectMark[], code: SubjectCode): boolean {
  return subjects.some((s) => s.code === code);
}

/**
 * Gets the percentage for a specific subject, or 0 if not found.
 */
export function getSubjectPercentage(
  subjects: SubjectMark[],
  code: SubjectCode,
): number {
  const subject = findSubject(subjects, code);
  return subject?.percentage ?? 0;
}

/**
 * Math codes that satisfy "mathematics requirement"
 */
export const MATH_CODES: SubjectCode[] = [
  "mathematics",
  "mathematical_literacy",
  "technical_mathematics",
];

/**
 * Language codes (HL and FAL variants)
 */
export const LANGUAGE_CODES: SubjectCode[] = [
  "english_hl",
  "english_fal",
  "afrikaans_hl",
  "afrikaans_fal",
  "isizulu_hl",
  "isizulu_fal",
  "sesotho_hl",
  "sesotho_fal",
];

/**
 * Finds any language subject (prioritizes HL over FAL).
 */
export function findLanguageSubject(subjects: SubjectMark[]): SubjectMark | undefined {
  // First try to find HL
  const hl = subjects.find((s) => s.code.endsWith("_hl"));
  if (hl) return hl;
  // Then fall back to FAL
  return subjects.find((s) => s.code.endsWith("_fal"));
}

/**
 * Checks if learner has a valid combination of 7 subjects.
 * Must have:至少 one language, Life Orientation, and 5 other subjects.
 */
export function hasValidSubjectCombination(profile: LearnerProfile): boolean {
  const { subjects } = profile;

  // Must have at least 7 subjects
  if (subjects.length < 7) return false;

  // Must have at least one language
  const hasLanguage = subjects.some((s) =>
    LANGUAGE_CODES.some((code) => s.code === code),
  );
  if (!hasLanguage) return false;

  // Must have Life Orientation
  const hasLO = subjects.some((s) => s.code === "life_orientation");
  if (!hasLO) return false;

  return true;
}
