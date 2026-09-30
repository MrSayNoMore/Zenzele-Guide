// Learnerships, apprenticeships, internships, graduate programmes and short
// courses: labels, open/closed status, who each one fits, and the public
// queries (published rows only; row-level security enforces this too).
import { supabase } from "@/integrations/supabase/client";
import { bursaryStatus, type BursaryStatus } from "@/lib/directory";
import { PROVINCES, labelFor } from "@/lib/admin-options";

export const OPPORTUNITY_KINDS = [
  { value: "learnership", label: "Learnership", plural: "Learnerships" },
  { value: "apprenticeship", label: "Apprenticeship", plural: "Apprenticeships" },
  { value: "internship", label: "Internship", plural: "Internships" },
  { value: "graduate_programme", label: "Graduate programme", plural: "Graduate programmes" },
  { value: "short_course", label: "Short course", plural: "Short courses" },
] as const;
export type OpportunityKind = (typeof OPPORTUNITY_KINDS)[number]["value"];

// Lowest to highest; the order is what "at least" comparisons use.
export const EDUCATION_LEVELS = [
  { value: "none", label: "No formal schooling needed" },
  { value: "grade_9", label: "Grade 9" },
  { value: "grade_10", label: "Grade 10" },
  { value: "grade_11", label: "Grade 11" },
  { value: "grade_12", label: "Grade 12 (matric)" },
  { value: "nqf_4", label: "NQF 4 / NC(V) Level 4 / N3" },
  { value: "certificate", label: "Higher certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "degree", label: "Degree" },
  { value: "postgraduate", label: "Postgraduate degree" },
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]["value"];

export function educationRank(level: string | null | undefined): number {
  return EDUCATION_LEVELS.findIndex((l) => l.value === level);
}

export const kindLabel = (k: string) => labelFor(OPPORTUNITY_KINDS, k);
export const educationLabel = (e: string | null | undefined) => labelFor(EDUCATION_LEVELS, e);

type Dated = { opens_at: string | null; closes_at: string | null };

/** Open / upcoming / closed, the same way bursaries are shown. */
export function opportunityStatus(o: Dated, today = new Date()): BursaryStatus {
  return bursaryStatus([{ year: 0, opens_at: o.opens_at, closes_at: o.closes_at, notes: null }], today);
}

const ORDER: Record<BursaryStatus["kind"], number> = {
  open: 0,
  open_no_deadline: 1,
  upcoming: 2,
  unknown: 3,
  closed: 4,
};

/** Open first (closing soonest at the top), then opening soon, then the rest. */
export function sortByStatus<T extends { title: string; status: BursaryStatus }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      ORDER[a.status.kind] - ORDER[b.status.kind] ||
      (a.status.kind === "open" && b.status.kind === "open"
        ? a.status.daysLeft - b.status.daysLeft
        : a.title.localeCompare(b.title)),
  );
}

export const isOpen = (s: BursaryStatus) => s.kind === "open" || s.kind === "open_no_deadline";

export type Learner = {
  education?: string; // an EducationLevel, or "" when not given
  province?: string; // a PROVINCES code, or ""
  age?: number | null;
  field?: string; // a FIELDS_OF_STUDY value, or ""
};

type Requirements = {
  min_education: string | null;
  provinces: string[] | null;
  max_age: number | null;
  field_of_study: string | null;
};

/**
 * Whether the learner meets what the provider asks for. Anything the learner
 * didn't tell us, or the provider didn't state, doesn't rule them out.
 */
export function fitsLearner(o: Requirements, learner: Learner): boolean {
  if (learner.education && o.min_education) {
    if (educationRank(learner.education) < educationRank(o.min_education)) return false;
  }
  const provinces = o.provinces ?? [];
  if (learner.province && provinces.length && !provinces.includes(learner.province)) return false;
  if (learner.age != null && o.max_age != null && learner.age > o.max_age) return false;
  if (learner.field && o.field_of_study && o.field_of_study !== learner.field) return false;
  return true;
}

/** Short facts for the detail page and cards, in plain words. */
export function requirementLines(o: Requirements): string[] {
  const lines: string[] = [];
  if (o.min_education) lines.push(`At least ${educationLabel(o.min_education)}.`);
  if (o.max_age != null) lines.push(`Aged ${o.max_age} or younger.`);
  const provinces = o.provinces ?? [];
  if (provinces.length) {
    const names = provinces.map((p) => labelFor(PROVINCES, p));
    lines.push(
      `For people living in ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`}.`,
    );
  }
  return lines;
}

export function durationLabel(months: number | null | undefined): string | null {
  if (!months) return null;
  if (months % 12 === 0) return months === 12 ? "1 year" : `${months / 12} years`;
  return months === 1 ? "1 month" : `${months} months`;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const LIST_COLUMNS =
  "id, slug, kind, title, organisation, field_of_study, provinces, min_education, max_age, stipend, duration_months, opens_at, closes_at";

export type OpportunityListItem = {
  id: string;
  slug: string;
  kind: OpportunityKind;
  title: string;
  organisation: string;
  field_of_study: string | null;
  provinces: string[];
  min_education: EducationLevel | null;
  max_age: number | null;
  stipend: string | null;
  duration_months: number | null;
  opens_at: string | null;
  closes_at: string | null;
};

export async function listOpportunities(kinds?: OpportunityKind[]) {
  let q = supabase.from("opportunities").select(LIST_COLUMNS).eq("is_published", true);
  if (kinds?.length) q = q.in("kind", kinds);
  const { data, error } = await q.order("title");
  if (error) throw error;
  return (data ?? []) as OpportunityListItem[];
}

export async function getOpportunity(slug: string) {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `${LIST_COLUMNS}, description, seta, how_to_apply, website_url, source_url, last_verified_at`,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
