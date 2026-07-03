import type { LearnerProfile, ApsRuleSet, CourseRequirements } from "../schemas";
import type { ApsComputation, CourseMatch, MatchStatus, Reason } from "../types";

/**
 * Classifies a course match based on APS computation and requirements.
 */
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
    const missingNbt: ("aql" | "mat" | "ql")[] = [];
    if (course.nbt.aql_min != null && profile.nbt?.aql == null) {
      missingNbt.push("aql");
    }
    if (course.nbt.mat_min != null && profile.nbt?.mat == null) {
      missingNbt.push("mat");
    }
    if (course.nbt.ql_min != null && profile.nbt?.ql == null) {
      missingNbt.push("ql");
    }

    if (missingNbt.length > 0) {
      return {
        course_id: course.course_id,
        course_name: course.course_name,
        faculty_name: course.faculty_name,
        university_name: course.university_name,
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
    const learner = aps.subjects_scored.find((s) => s.code === req.code);
    const alt = req.alternative
      ? aps.subjects_scored.find((s) => s.code === req.alternative!.code)
      : undefined;

    const meets =
      (learner != null && learner.nsc_level >= req.min_level) ||
      (alt != null && req.alternative != null && alt.nsc_level >= req.alternative.min_level);

    if (!meets) {
      const learnerLevel = learner?.nsc_level ?? 0;
      const shortBy = req.min_level - learnerLevel;
      subjectShortfall = Math.max(subjectShortfall, shortBy);
      reasons.push({
        kind: "subject_short",
        code: req.code,
        required_level: req.min_level,
        learner_level: learnerLevel,
      });
    } else {
      const matchingSubject = learner ?? alt;
      if (matchingSubject) {
        reasons.push({
          kind: "subject_met",
          code: req.code,
          required_level: req.min_level,
          learner_level: matchingSubject.nsc_level,
        });
      }
    }
  }

  // (c) APS minimum
  const apsGap = course.min_aps - aps.total_aps;
  if (apsGap > 0) {
    reasons.push({
      kind: "aps_short",
      required: course.min_aps,
      learner: aps.total_aps,
    });
  } else {
    reasons.push({
      kind: "aps_met",
      required: course.min_aps,
      learner: aps.total_aps,
    });
  }

  // (d) NBT minima (only reached when scores are present)
  if (course.nbt && profile.nbt) {
    if (course.nbt.aql_min != null && profile.nbt.aql != null) {
      if (profile.nbt.aql < course.nbt.aql_min) {
        reasons.push({
          kind: "nbt_short",
          test: "aql",
          required: course.nbt.aql_min,
          learner: profile.nbt.aql,
        });
        subjectShortfall = Math.max(subjectShortfall, 99);
      }
    }
    if (course.nbt.mat_min != null && profile.nbt.mat != null) {
      if (profile.nbt.mat < course.nbt.mat_min) {
        reasons.push({
          kind: "nbt_short",
          test: "mat",
          required: course.nbt.mat_min,
          learner: profile.nbt.mat,
        });
        subjectShortfall = Math.max(subjectShortfall, 99);
      }
    }
    if (course.nbt.ql_min != null && profile.nbt.ql != null) {
      if (profile.nbt.ql < course.nbt.ql_min) {
        reasons.push({
          kind: "nbt_short",
          test: "ql",
          required: course.nbt.ql_min,
          learner: profile.nbt.ql,
        });
        subjectShortfall = Math.max(subjectShortfall, 99);
      }
    }
  }

  // (e) Bucket assignment
  const hardSubjectFail =
    subjectShortfall > rules.borderline.subject_levels_short;
  const apsBorderline =
    apsGap > 0 && apsGap <= rules.borderline.aps_within;
  const subjectBorderline =
    subjectShortfall > 0 &&
    subjectShortfall <= rules.borderline.subject_levels_short;

  if (apsGap <= 0 && subjectShortfall === 0) {
    status = "qualifies";
  } else if (!hardSubjectFail && (apsBorderline || subjectBorderline)) {
    status = "borderline";
  } else {
    status = "below";
  }

  return {
    course_id: course.course_id,
    course_name: course.course_name,
    faculty_name: course.faculty_name,
    university_name: course.university_name,
    status,
    total_aps: aps.total_aps,
    min_aps: course.min_aps,
    aps_gap: apsGap,
    subject_shortfall: subjectShortfall,
    reasons,
    rule_version_id: rules.rule_id,
  };
}

/**
 * Classifies all courses for a university.
 */
export function classifyAllCourses(
  aps: ApsComputation,
  courses: CourseRequirements[],
  profile: LearnerProfile,
  rules: ApsRuleSet,
): CourseMatch[] {
  return courses.map((course) => classifyCourse(aps, course, profile, rules));
}
