// Data for the public directory pages (universities, TVET colleges,
// bursaries). Reads published rows only (row-level security enforces this
// too), so nothing unverified reaches learners.
import { supabase } from "@/integrations/supabase/client";

export type BursaryCycle = {
  year: number;
  opens_at: string | null;
  closes_at: string | null;
  notes: string | null;
};

export type BursaryStatus =
  | { kind: "open"; closesAt: string; daysLeft: number }
  | { kind: "open_no_deadline" }
  | { kind: "upcoming"; opensAt: string }
  | { kind: "closed"; closedAt: string }
  | { kind: "unknown" };

const DAY = 86_400_000;
const dayStart = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime();

/**
 * Where a bursary stands today, from its application cycles. An open cycle
 * wins; then the soonest upcoming one; then the most recently closed.
 */
export function bursaryStatus(cycles: BursaryCycle[], today = new Date()): BursaryStatus {
  const now = dayStart(today.toISOString());
  const open = cycles
    .filter(
      (c) =>
        (!c.opens_at || dayStart(c.opens_at) <= now) &&
        (!c.closes_at || dayStart(c.closes_at) >= now),
    )
    .filter((c) => c.opens_at || c.closes_at);
  const withDeadline = open
    .filter((c) => c.closes_at)
    .sort((a, b) => a.closes_at!.localeCompare(b.closes_at!));
  if (withDeadline.length) {
    const closesAt = withDeadline[0].closes_at!;
    return { kind: "open", closesAt, daysLeft: Math.round((dayStart(closesAt) - now) / DAY) };
  }
  if (open.length) return { kind: "open_no_deadline" };
  const upcoming = cycles
    .filter((c) => c.opens_at && dayStart(c.opens_at) > now)
    .sort((a, b) => a.opens_at!.localeCompare(b.opens_at!));
  if (upcoming.length) return { kind: "upcoming", opensAt: upcoming[0].opens_at! };
  const closed = cycles
    .filter((c) => c.closes_at && dayStart(c.closes_at) < now)
    .sort((a, b) => b.closes_at!.localeCompare(a.closes_at!));
  if (closed.length) return { kind: "closed", closedAt: closed[0].closes_at! };
  return { kind: "unknown" };
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * "5 October 2026". Formatted by hand (not toLocaleDateString) so the server
 * and the browser produce identical text and hydration doesn't mismatch.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "R600 000": South African style, identical on server and browser. */
export function formatRand(amount: number): string {
  return `R${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}`;
}

export function statusLabel(s: BursaryStatus): string {
  switch (s.kind) {
    case "open":
      return s.daysLeft === 0
        ? "Closes today"
        : s.daysLeft === 1
          ? "Closes tomorrow"
          : `Open · closes ${formatDate(s.closesAt)}`;
    case "open_no_deadline":
      return "Open now";
    case "upcoming":
      return `Opens ${formatDate(s.opensAt)}`;
    case "closed":
      return `Closed ${formatDate(s.closedAt)}`;
    default:
      return "Dates not announced yet";
  }
}

export function statusTone(s: BursaryStatus): "green" | "amber" | "red" | "muted" {
  if (s.kind === "open") return s.daysLeft <= 7 ? "amber" : "green";
  if (s.kind === "open_no_deadline") return "green";
  if (s.kind === "closed") return "red";
  return "muted";
}

/** Case- and accent-insensitive "does any field contain the query". */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const norm = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const q = norm(query.trim());
  if (!q) return true;
  return fields.some((f) => f && norm(f).includes(q));
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listUniversities() {
  const { data, error } = await supabase
    .from("universities")
    .select("id, name, short_name, slug, province, uni_type, website_url, faculties(courses(id))")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(({ faculties, ...u }) => ({
    ...u,
    courseCount: (faculties ?? []).reduce((n, f) => n + (f.courses?.length ?? 0), 0),
  }));
}

export async function getUniversity(slug: string) {
  const { data, error } = await supabase
    .from("universities")
    .select(
      "id, name, short_name, slug, province, uni_type, description, website_url, source_url, last_verified_at, faculties(id, name, courses(id, name, slug, qualification_type, duration_years, min_aps, requires_nbt, field_of_study, source_url, last_verified_at, course_requirements(min_level, is_required, subject_group, notes, subjects(name))))",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listTvetColleges() {
  const { data, error } = await supabase
    .from("tvet_colleges")
    .select("id, name, slug, province, website_url, tvet_programs(id)")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(({ tvet_programs, ...c }) => ({
    ...c,
    programCount: tvet_programs?.length ?? 0,
  }));
}

export async function getTvetCollege(slug: string) {
  const { data, error } = await supabase
    .from("tvet_colleges")
    .select(
      "id, name, slug, province, description, website_url, source_url, last_verified_at, tvet_programs(id, name, slug, program_type, nqf_level, duration_years, min_grade, field_of_study, description, source_url, last_verified_at)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listBursaries() {
  const { data, error } = await supabase
    .from("bursaries")
    .select(
      "id, name, slug, provider, value_description, fields_of_study, bursary_cycles(year, opens_at, closes_at, notes)",
    )
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getBursary(slug: string) {
  const { data, error } = await supabase
    .from("bursaries")
    .select(
      "id, name, slug, provider, value_description, description, fields_of_study, eligibility, website_url, source_url, last_verified_at, bursary_cycles(year, opens_at, closes_at, notes)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Bursary eligibility in plain words
// ---------------------------------------------------------------------------

const CITIZENSHIP_LABELS: Record<string, string> = {
  sa_citizen: "South African citizens",
  sa_permanent_resident: "South African permanent residents",
};
const PROVINCE_LABELS: Record<string, string> = {
  EC: "Eastern Cape",
  FS: "Free State",
  GP: "Gauteng",
  KZN: "KwaZulu-Natal",
  LP: "Limpopo",
  MP: "Mpumalanga",
  NC: "Northern Cape",
  NW: "North West",
  WC: "Western Cape",
};

const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;

/** The eligibility rules the admin entered, as short sentences. */
export function eligibilityLines(
  eligibility: unknown,
  fieldLabel: (v: string) => string,
): string[] {
  if (!eligibility || typeof eligibility !== "object" || Array.isArray(eligibility)) return [];
  const e = eligibility as Record<string, unknown>;
  const strings = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const lines: string[] = [];
  const citizenship = strings(e.citizenship);
  if (citizenship.length)
    lines.push(`Open to ${list(citizenship.map((c) => CITIZENSHIP_LABELS[c] ?? c))}.`);
  const provinces = strings(e.provinces);
  if (provinces.length)
    lines.push(`For learners from ${list(provinces.map((p) => PROVINCE_LABELS[p] ?? p))}.`);
  const fields = strings(e.fields);
  if (fields.length) lines.push(`For studies in ${list(fields.map(fieldLabel))}.`);
  if (typeof e.min_percentage_avg === "number")
    lines.push(`An average of at least ${e.min_percentage_avg}%.`);
  if (typeof e.household_income_max === "number")
    lines.push(
      `Household income of ${formatRand(e.household_income_max)} a year or less.`,
    );
  if (strings(e.demographics).includes("disability")) lines.push("For learners with a disability.");
  return lines;
}
