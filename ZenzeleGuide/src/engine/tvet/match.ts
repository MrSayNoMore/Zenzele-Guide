import type { LearnerProfile, TvetProgrammeDefinition } from "../schemas";
import type { TvetMatch, MatchStatus, Reason } from "../types";
import type { ScoredSubject } from "../types";
import { lookupConversion } from "../shared/nsc-level";

/**
 * Scores subjects for TVET matching.
 */
function scoreSubjects(profile: LearnerProfile): ScoredSubject[] {
  return profile.subjects.map((s) => {
    const level = s.percentage >= 80 ? 7 :
                  s.percentage >= 70 ? 6 :
                  s.percentage >= 60 ? 5 :
                  s.percentage >= 50 ? 4 :
                  s.percentage >= 40 ? 3 :
                  s.percentage >= 30 ? 2 : 1;
    return {
      code: s.code,
      percentage: s.percentage,
      nsc_level: level,
      aps_points: 0, // Not used for TVET
    };
  });
}

/**
 * Finds a subject's level by code.
 */
function findSubjectLevel(
  subjects: ScoredSubject[],
  code: string,
): number {
  const subject = subjects.find((s) => s.code === code);
  return subject?.nsc_level ?? 0;
}

/**
 * Checks if learner meets the minimum grade requirement.
 */
function checkMinGrade(
  programme: TvetProgrammeDefinition,
  profile: LearnerProfile,
): { met: boolean; reason?: Reason } {
  if (programme.min_grade == null) {
    return { met: true };
  }

  // Assume learner's grade is not stored directly, so we check if they have 7 subjects
  // which implies Grade 12 completion
  // For Grade 9/10 minimum, they would be younger students
  // This is a simplified check - in reality we'd need learner's current grade
  const impliedGrade = profile.subjects.length >= 7 ? 12 : 9;

  if (impliedGrade >= programme.min_grade) {
    return { met: true };
  }

  return {
    met: false,
    reason: {
      kind: "subject_short" as const,
      code: "min_grade" as never,
      required_level: programme.min_grade,
      learner_level: impliedGrade,
    },
  };
}

/**
 * Checks English requirement for TVET.
 */
function checkEnglishRequirement(
  programme: TvetProgrammeDefinition,
  subjects: ScoredSubject[],
): { met: boolean; shortfall: number; reasons: Reason[] } {
  const reasons: Reason[] = [];

  if (programme.min_english_level == null) {
    return { met: true, shortfall: 0, reasons };
  }

  // Check English HL first, then FAL
  const hlLevel = findSubjectLevel(subjects, "english_hl");
  const falLevel = findSubjectLevel(subjects, "english_fal");
  const bestLevel = Math.max(hlLevel, falLevel);

  if (bestLevel >= programme.min_english_level) {
    reasons.push({
      kind: "subject_met",
      code: hlLevel >= falLevel ? "english_hl" : "english_fal",
      required_level: programme.min_english_level,
      learner_level: bestLevel,
    });
    return { met: true, shortfall: 0, reasons };
  }

  const shortfall = programme.min_english_level - bestLevel;
  reasons.push({
    kind: "subject_short",
    code: "english_hl",
    required_level: programme.min_english_level,
    learner_level: bestLevel,
  });

  return { met: false, shortfall, reasons };
}

/**
 * Checks Mathematics requirement for TVET.
 */
function checkMathsRequirement(
  programme: TvetProgrammeDefinition,
  subjects: ScoredSubject[],
): { met: boolean; shortfall: number; reasons: Reason[] } {
  const reasons: Reason[] = [];

  if (programme.min_maths_level == null && programme.min_maths_lit_level == null) {
    return { met: true, shortfall: 0, reasons };
  }

  // Check Mathematics
  const mathsLevel = findSubjectLevel(subjects, "mathematics");
  const mathsLitLevel = findSubjectLevel(subjects, "mathematical_literacy");

  if (programme.min_maths_level != null) {
    if (mathsLevel >= programme.min_maths_level) {
      reasons.push({
        kind: "subject_met",
        code: "mathematics",
        required_level: programme.min_maths_level,
        learner_level: mathsLevel,
      });
      return { met: true, shortfall: 0, reasons };
    }

    // Check if Maths Lit is acceptable
    if (
      programme.min_maths_lit_level != null &&
      mathsLitLevel >= programme.min_maths_lit_level
    ) {
      reasons.push({
        kind: "subject_met",
        code: "mathematical_literacy",
        required_level: programme.min_maths_lit_level,
        learner_level: mathsLitLevel,
      });
      return { met: true, shortfall: 0, reasons };
    }

    const shortfall = programme.min_maths_level - mathsLevel;
    reasons.push({
      kind: "subject_short",
      code: "mathematics",
      required_level: programme.min_maths_level,
      learner_level: mathsLevel,
    });

    return { met: false, shortfall, reasons };
  }

  // Only Maths Lit required
  if (programme.min_maths_lit_level != null) {
    if (mathsLitLevel >= programme.min_maths_lit_level) {
      reasons.push({
        kind: "subject_met",
        code: "mathematical_literacy",
        required_level: programme.min_maths_lit_level,
        learner_level: mathsLitLevel,
      });
      return { met: true, shortfall: 0, reasons };
    }

    // Maths can substitute
    if (mathsLevel > 0 && mathsLevel >= programme.min_maths_lit_level) {
      reasons.push({
        kind: "subject_met",
        code: "mathematics",
        required_level: programme.min_maths_lit_level,
        learner_level: mathsLevel,
      });
      return { met: true, shortfall: 0, reasons };
    }

    const shortfall = programme.min_maths_lit_level - Math.max(mathsLitLevel, mathsLevel);
    reasons.push({
      kind: "subject_short",
      code: "mathematical_literacy",
      required_level: programme.min_maths_lit_level,
      learner_level: mathsLitLevel,
    });

    return { met: false, shortfall, reasons };
  }

  return { met: true, shortfall: 0, reasons };
}

/**
 * Matches TVET programmes against learner profile.
 */
export function matchTvetProgrammes(
  programmes: TvetProgrammeDefinition[],
  profile: LearnerProfile,
): TvetMatch[] {
  const matches: TvetMatch[] = [];
  const subjects = scoreSubjects(profile);
  const learnerProvince = profile.province;

  for (const programme of programmes) {
    const reasons: Reason[] = [];
    let status: MatchStatus = "qualifies";
    let totalShortfall = 0;

    // Check grade requirement
    const gradeCheck = checkMinGrade(programme, profile);
    if (!gradeCheck.met && gradeCheck.reason) {
      reasons.push(gradeCheck.reason);
      totalShortfall += 99; // Hard fail
    }

    // Check English requirement
    const englishCheck = checkEnglishRequirement(programme, subjects);
    reasons.push(...englishCheck.reasons);
    if (!englishCheck.met) {
      totalShortfall += englishCheck.shortfall;
    }

    // Check Mathematics requirement
    const mathsCheck = checkMathsRequirement(programme, subjects);
    reasons.push(...mathsCheck.reasons);
    if (!mathsCheck.met) {
      totalShortfall += mathsCheck.shortfall;
    }

    // Determine status
    if (totalShortfall === 0) {
      status = "qualifies";
    } else if (totalShortfall <= 2) {
      status = "borderline";
    } else {
      status = "below";
    }

    const sameProvince =
      learnerProvince != null &&
      programme.college_province === learnerProvince;

    matches.push({
      programme_id: programme.programme_id,
      programme_name: programme.name,
      college_id: programme.college_id,
      college_name: programme.college_name,
      college_province: programme.college_province,
      status,
      reasons,
      same_province: sameProvince,
    });
  }

  return sortTvetMatches(matches);
}

/**
 * Sorts TVET matches: status bucket, then province proximity.
 */
export function sortTvetMatches(matches: TvetMatch[]): TvetMatch[] {
  const statusOrder = { qualifies: 0, borderline: 1, below: 2, missing_info: 3 };

  return [...matches].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Same province first
    if (a.same_province !== b.same_province) {
      return a.same_province ? -1 : 1;
    }

    // Alphabetical by college name, then programme name
    const collegeComp = (a.college_name ?? "").localeCompare(
      b.college_name ?? "",
      "en-ZA",
    );
    if (collegeComp !== 0) return collegeComp;

    return a.programme_name.localeCompare(b.programme_name, "en-ZA");
  });
}

/**
 * Counts TVET matches by status.
 */
export function countTvetMatches(matches: TvetMatch[]): {
  qualifies: number;
  borderline: number;
  below: number;
  same_province_count: number;
} {
  return {
    qualifies: matches.filter((m) => m.status === "qualifies").length,
    borderline: matches.filter((m) => m.status === "borderline").length,
    below: matches.filter((m) => m.status === "below").length,
    same_province_count: matches.filter((m) => m.same_province).length,
  };
}
