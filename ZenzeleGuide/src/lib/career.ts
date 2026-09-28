/** Career stages captured at sign-up. Keep in sync with profiles_career_stage_check. */
export const CAREER_STAGES = [
  { value: "high_school", label: "High school learner" },
  { value: "tvet_college", label: "TVET / college student" },
  { value: "university", label: "University student" },
  { value: "graduate", label: "Graduate / job seeker" },
  { value: "intern", label: "Intern / learnership" },
  { value: "junior", label: "Junior (0–2 years working)" },
  { value: "intermediate", label: "Intermediate (2–5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
  { value: "other", label: "Something else" },
] as const;

export type CareerStage = (typeof CAREER_STAGES)[number]["value"];

export function careerStageLabel(value: string | null | undefined): string | null {
  return CAREER_STAGES.find((s) => s.value === value)?.label ?? null;
}
