// Server-only helpers for journey computation.
// This file should NEVER be imported directly from client code.
// Import from journey.functions.ts instead.

import "server-only";
import type { Database, Tables, Json } from "@/integrations/supabase/types";
import type { ApsRuleSet, NsfasRuleSet, BursaryDefinition, TvetProgrammeDefinition } from "@/engine/schemas";

// Lazy-load supabaseAdmin to avoid top-level import issues
async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Generates a random share slug for results
 */
export function generateShareSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 12; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

/**
 * Fetches the current effective APS rule for a university
 */
export async function fetchApsRule(universityId: string): Promise<ApsRuleSet | null> {
  const supabase = await getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("aps_rule_versions")
    .select("*")
    .eq("university_id", universityId)
    .lte("effective_from", now)
    .or(`effective_to.is.null,effective_to.gte.${now}`)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const rules = data.rules as Record<string, unknown>;
  return {
    rule_id: data.id,
    rule_version: data.version_label,
    university_id: data.university_id,
    ...rules,
  } as unknown as ApsRuleSet;
}

/**
 * Get a default APS rule for demo/testing when database is empty
 */
function getDefaultApsRule(): ApsRuleSet {
  return {
    rule_id: "default-demo-rule",
    rule_version: "demo",
    university_id: "demo",
    version: 1,
    effective_from: "2026-01-01",
    conversion: [
      { min_pct: 80, max_pct: 100, nsc_level: 7, aps_points: 7 },
      { min_pct: 70, max_pct: 79, nsc_level: 6, aps_points: 6 },
      { min_pct: 60, max_pct: 69, nsc_level: 5, aps_points: 5 },
      { min_pct: 50, max_pct: 59, nsc_level: 4, aps_points: 4 },
      { min_pct: 40, max_pct: 49, nsc_level: 3, aps_points: 3 },
      { min_pct: 30, max_pct: 39, nsc_level: 2, aps_points: 2 },
      { min_pct: 0, max_pct: 29, nsc_level: 1, aps_points: 1 },
    ],
    life_orientation: { treatment: "half_weight", cap_points: 3 },
    top_n: 6,
    borderline: { aps_within: 3, subject_levels_short: 1 },
    bonuses: [],
    source_url: "https://example.com/demo-aps-rules",
  };
}


/**
 * Fetches all currently effective APS rules
 */
export async function fetchAllApsRules(): Promise<Map<string, ApsRuleSet>> {
  try {
    const supabase = await getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("aps_rule_versions")
      .select("*")
      .lte("effective_from", now)
      .or(`effective_to.is.null,effective_to.gte.${now}`)
      .order("effective_from", { ascending: false });

    if (error) {
      console.error("Error fetching APS rules:", error);
      // Fallback to default rule
      const rules = new Map<string, ApsRuleSet>();
      rules.set("default", getDefaultApsRule());
      return rules;
    }

    if (!data || data.length === 0) {
      console.log("No APS rules in database, using default");
      const rules = new Map<string, ApsRuleSet>();
      rules.set("default", getDefaultApsRule());
      return rules;
    }

    const rules = new Map<string, ApsRuleSet>();
    for (const row of data) {
      if (!rules.has(row.university_id)) {
        const rowRules = row.rules as Record<string, unknown>;
        rules.set(row.university_id, {
          rule_id: row.id,
          rule_version: row.version_label,
          university_id: row.university_id,
          ...rowRules,
        } as unknown as ApsRuleSet);
      }
    }

    return rules;
  } catch (err) {
    console.error("Exception fetching APS rules:", err);
    const rules = new Map<string, ApsRuleSet>();
    rules.set("default", getDefaultApsRule());
    return rules;
  }
}

/**
 * Fetches the current effective NSFAS rule
 */
export async function fetchNsfasRule(): Promise<NsfasRuleSet | null> {
  const supabase = await getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("nsfas_rule_versions")
    .select("*")
    .lte("effective_from", now)
    .or(`effective_to.is.null,effective_to.gte.${now}`)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const rules = data.rules as Record<string, unknown>;
  return {
    rule_id: data.id,
    rule_version: data.version_label,
    ...rules,
  } as unknown as NsfasRuleSet;
}

/**
 * Fetches all published courses with their requirements
 */
export async function fetchPublishedCourses() {
  try {
    const supabase = await getSupabaseAdmin();

    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        slug,
        min_aps,
        requires_nbt,
        faculty_id,
        faculties (
          id,
          name,
          university_id,
          universities (
            id,
            name,
            slug,
            province
          )
        )
      `)
      .eq("is_published", true);

    if (error) {
      console.error("Error fetching courses:", error);
      return [];
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    // Fetch requirements for each course
    const { data: requirements } = await supabase
      .from("course_requirements")
      .select("course_id, subject_id, min_level, is_required, subject_group, subjects(code, name)")
      .eq("is_required", true);

    const requirementsByCourse = new Map<string, typeof requirements>();
    if (requirements) {
      for (const req of requirements) {
        const courseId = req.course_id;
        if (!requirementsByCourse.has(courseId)) {
          requirementsByCourse.set(courseId, []);
        }
        requirementsByCourse.get(courseId)!.push(req);
      }
    }

    return courses.map((course) => ({
      course_id: course.id,
      course_name: course.name,
      slug: course.slug,
      min_aps: course.min_aps,
      requires_nbt: course.requires_nbt,
      university_id: course.faculties?.university_id,
      university_name: course.faculties?.universities?.name,
      faculty_name: course.faculties?.name,
      required_subjects: (requirementsByCourse.get(course.id) || [])
        .filter((r) => r.subjects)
        .map((r) => ({
          code: r.subjects!.code,
          min_level: r.min_level,
        })),
    }));
  } catch (err) {
    console.error("Exception fetching courses:", err);
    return [];
  }
}

/**
 * Fetches all published bursaries with their cycles
 */
export async function fetchPublishedBursaries(): Promise<BursaryDefinition[]> {
  const supabase = await getSupabaseAdmin();

  const { data: bursaries, error } = await supabase
    .from("bursaries")
    .select(`
      id,
      name,
      provider,
      slug,
      description,
      fields_of_study,
      eligibility,
      website_url,
      bursary_cycles (
        id,
        year,
        opens_at,
        closes_at
      )
    `)
    .eq("is_published", true);

  if (error || !bursaries) return [];

  return bursaries.map((b) => ({
    bursary_id: b.id,
    name: b.name,
    provider: b.provider,
    slug: b.slug,
    description: b.description,
    fields_of_study: b.fields_of_study || [],
    eligibility: b.eligibility || {},
    website_url: b.website_url,
    cycles: (b.bursary_cycles || []).map((c) => ({
      cycle_id: c.id,
      year: c.year,
      open_date: c.opens_at,
      close_date: c.closes_at,
    })),
  })) as BursaryDefinition[];
}

/**
 * Fetches all published TVET programmes
 */
export async function fetchPublishedTvetProgrammes(): Promise<TvetProgrammeDefinition[]> {
  const supabase = await getSupabaseAdmin();

  const { data: programmes, error } = await supabase
    .from("tvet_programs")
    .select(`
      id,
      name,
      slug,
      program_type,
      nqf_level,
      min_grade,
      duration_years,
      field_of_study,
      college_id,
      tvet_colleges (
        id,
        name,
        province,
        slug
      )
    `)
    .eq("is_published", true);

  if (error || !programmes) return [];

  return programmes.map((p) => ({
    programme_id: p.id,
    name: p.name,
    slug: p.slug,
    program_type: p.program_type,
    nqf_level: p.nqf_level,
    min_grade: p.min_grade,
    duration_years: p.duration_years,
    fields: p.field_of_study ? [p.field_of_study] : [],
    college_id: p.college_id,
    college_name: p.tvet_colleges?.name,
    college_province: p.tvet_colleges?.province,
  })) as TvetProgrammeDefinition[];
}

/**
 * Persists a computation result to the database
 */
export async function persistResult(
  journey: "grade_12" | "nsfas" | "bursary" | "tvet",
  inputs: unknown,
  output: unknown,
  engineVersion: string,
  apsRuleVersionIds: string[],
  nsfasRuleVersionId: string | null,
  userId: string | null,
  anonId: string | null
): Promise<{ id: string; share_slug: string }> {
  try {
    const supabase = await getSupabaseAdmin();
    const shareSlug = generateShareSlug();

    const { data, error } = await supabase
      .from("results")
      .insert({
        journey,
        inputs: inputs as Json,
        output: output as Json,
        engine_version: engineVersion,
        aps_rule_version_ids: apsRuleVersionIds,
        nsfas_rule_version_id: nsfasRuleVersionId,
        user_id: userId,
        anon_id: anonId,
        share_slug: shareSlug,
      })
      .select("id, share_slug")
      .single();

    if (error) {
      console.error("Failed to persist result:", error);
      // Return a mock result for demo purposes
      const mockId = crypto.randomUUID();
      console.log("Returning mock result ID:", mockId);
      return { id: mockId, share_slug: shareSlug };
    }

    return { id: data.id, share_slug: data.share_slug };
  } catch (err) {
    console.error("Exception persisting result:", err);
    // Return a mock result for demo purposes
    const mockId = crypto.randomUUID();
    const shareSlug = generateShareSlug();
    console.log("Returning mock result ID (exception):", mockId);
    return { id: mockId, share_slug: shareSlug };
  }
}

/**
 * In-memory store for demo results when database is unavailable
 */
const demoResults = new Map<string, any>();

/**
 * Store a demo result in memory
 */
export function storeDemoResult(id: string, result: any) {
  demoResults.set(id, result);
  demoResults.set(result.share_slug, result);
}

/**
 * Fetches a result by ID or share slug
 */
export async function fetchResult(idOrSlug: string) {
  try {
    // Check in-memory demo results first
    const demoResult = demoResults.get(idOrSlug);
    if (demoResult) {
      return demoResult;
    }

    const supabase = await getSupabaseAdmin();

    // Try by ID first (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(idOrSlug);

    let query = supabase.from("results").select("*");

    if (isUuid) {
      query = query.eq("id", idOrSlug);
    } else {
      query = query.eq("share_slug", idOrSlug);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error("Error fetching result:", error);
      return null;
    }

    return {
      id: data.id,
      journey: data.journey,
      inputs: data.inputs,
      output: data.output,
      engine_version: data.engine_version,
      aps_rule_version_ids: data.aps_rule_version_ids,
      nsfas_rule_version_id: data.nsfas_rule_version_id,
      created_at: data.created_at,
      share_slug: data.share_slug,
    };
  } catch (err) {
    console.error("Exception fetching result:", err);
    return null;
  }
}

/**
 * Migrates anonymous results to a user account
 */
export async function migrateAnonymousResults(
  anonId: string,
  userId: string
): Promise<number> {
  const supabase = await getSupabaseAdmin();

  const { data, error } = await supabase
    .from("results")
    .update({ user_id: userId, anon_id: null })
    .eq("anon_id", anonId)
    .is("user_id", null)
    .select("id");

  if (error) {
    console.error("Failed to migrate results:", error);
    return 0;
  }

  return data?.length || 0;
}

// ---------------------------------------------------------------------------
// Accounts: identity, ownership, saved items
// ---------------------------------------------------------------------------

/**
 * Returns the signed-in user's id from the request's bearer token, or null.
 * The browser attaches the token via `attachSupabaseAuth`; we verify it here
 * rather than trusting any user id sent in the request body.
 */
export async function resolveUserId(): Promise<string | null> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const header = getRequest()?.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    const token = header.slice("Bearer ".length).trim();
    if (!token) return null;

    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch (err) {
    console.error("Failed to resolve user:", err);
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  const userId = await resolveUserId();
  if (!userId) throw new Error("Please sign in to continue.");
  return userId;
}

/** Raw ownership columns for a result, used to decide what the viewer may do. */
export async function fetchResultOwnership(
  idOrSlug: string
): Promise<{ id: string; user_id: string | null; anon_id: string | null } | null> {
  const supabase = await getSupabaseAdmin();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { data, error } = await supabase
    .from("results")
    .select("id, user_id, anon_id")
    .eq(isUuid ? "id" : "share_slug", idOrSlug)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Attaches one anonymous result to a user. Only succeeds when the caller
 * proves they created it (same anon id) and nobody owns it yet.
 */
export async function claimResultForUser(
  resultId: string,
  anonId: string,
  userId: string
): Promise<boolean> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("results")
    .update({ user_id: userId, anon_id: null })
    .eq("id", resultId)
    .eq("anon_id", anonId)
    .is("user_id", null)
    .select("id");
  if (error) {
    console.error("Failed to claim result:", error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export async function listResultsForUser(userId: string) {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("results")
    .select("id, journey, share_slug, created_at, output")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("Failed to list results:", error);
    return [];
  }
  return data.map((r) => ({
    id: r.id,
    journey: r.journey,
    share_slug: r.share_slug,
    created_at: r.created_at,
    summary: summariseOutput(r.journey, r.output),
  }));
}

function summariseOutput(journey: string, output: Json): string {
  const o = (output ?? {}) as Record<string, any>;
  switch (journey) {
    case "grade_12": {
      const s = o.learner_summary ?? {};
      return `APS ${s.total_aps_avg ?? "—"} · ${s.qualifies_count ?? 0} courses you qualify for`;
    }
    case "nsfas": {
      const status = String(o.outcome?.status ?? "");
      if (status.startsWith("funded") || status === "auto_qualifies_sassa") return "Likely NSFAS funded";
      if (status === "needs_more_info") return "More information needed";
      return "Not NSFAS funded";
    }
    case "bursary":
      return `${o.eligible_count ?? 0} bursaries you're eligible for`;
    case "tvet":
      return `${o.qualifies_count ?? 0} TVET programmes you qualify for`;
    default:
      return "";
  }
}

export async function deleteResultForUser(resultId: string, userId: string): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from("results").delete().eq("id", resultId).eq("user_id", userId);
  if (error) throw new Error("Could not remove this result.");
}

export type SavedKind = "course" | "bursary" | "tvet_program";

export async function listSavedRefIds(userId: string): Promise<string[]> {
  const supabase = await getSupabaseAdmin();
  const { data } = await supabase.from("saved_items").select("ref_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.ref_id);
}

export async function toggleSavedItemForUser(
  userId: string,
  kind: SavedKind,
  refId: string
): Promise<boolean> {
  const supabase = await getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("ref_id", refId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("saved_items").delete().eq("id", existing.id);
    if (error) throw new Error("Could not remove this item.");
    return false;
  }
  const { error } = await supabase.from("saved_items").insert({ user_id: userId, kind, ref_id: refId });
  if (error) throw new Error("Could not save this item.");
  return true;
}

export async function listSavedItemsForUser(userId: string) {
  const supabase = await getSupabaseAdmin();
  const { data: items } = await supabase
    .from("saved_items")
    .select("id, kind, ref_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!items?.length) return [];

  const ids = (kind: string) => items.filter((i) => i.kind === kind).map((i) => i.ref_id);
  const [courses, bursaries, programmes] = await Promise.all([
    ids("course").length
      ? supabase
          .from("courses")
          .select("id, name, faculties(name, universities(name))")
          .in("id", ids("course"))
      : Promise.resolve({ data: [] as any[] }),
    ids("bursary").length
      ? supabase.from("bursaries").select("id, name, provider, website_url").in("id", ids("bursary"))
      : Promise.resolve({ data: [] as any[] }),
    ids("tvet_program").length
      ? supabase.from("tvet_programs").select("id, name, tvet_colleges(name)").in("id", ids("tvet_program"))
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const byId = new Map<string, { title: string; subtitle: string; url?: string | null }>();
  for (const c of (courses.data ?? []) as any[]) {
    byId.set(c.id, { title: c.name, subtitle: c.faculties?.universities?.name ?? c.faculties?.name ?? "" });
  }
  for (const b of (bursaries.data ?? []) as any[]) {
    byId.set(b.id, { title: b.name, subtitle: b.provider, url: b.website_url });
  }
  for (const p of (programmes.data ?? []) as any[]) {
    byId.set(p.id, { title: p.name, subtitle: p.tvet_colleges?.name ?? "" });
  }

  return items.map((i) => ({
    id: i.id,
    kind: i.kind as SavedKind,
    ref_id: i.ref_id,
    created_at: i.created_at,
    ...(byId.get(i.ref_id) ?? { title: "No longer listed", subtitle: "" }),
  }));
}
