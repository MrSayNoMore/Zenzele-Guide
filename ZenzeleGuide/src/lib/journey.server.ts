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
 * Fetches all currently effective APS rules
 */
export async function fetchAllApsRules(): Promise<Map<string, ApsRuleSet>> {
  const supabase = await getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("aps_rule_versions")
    .select("*")
    .lte("effective_from", now)
    .or(`effective_to.is.null,effective_to.gte.${now}`)
    .order("effective_from", { ascending: false });

  if (error || !data) return new Map();

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

  if (error || !courses) return [];

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
    throw new Error("Failed to save result");
  }

  return { id: data.id, share_slug: data.share_slug };
}

/**
 * Fetches a result by ID or share slug
 */
export async function fetchResult(idOrSlug: string) {
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

  if (error) return null;

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
