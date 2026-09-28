// Turning an approved AI draft into a real course or bursary. Runs in the
// browser with the admin's session, so the same RLS rules as the editors apply.
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { slugify } from "@/lib/admin-options";
import type { BursaryDraft, CourseDraft, DraftChecks } from "./shared";

export type DraftRow = {
  id: string;
  target_table: string;
  payload: { draft: CourseDraft | BursaryDraft; university_id: string | null };
  checks: DraftChecks;
  state: "pending" | "approved" | "rejected";
};

async function uniqueSlug(
  table: "courses" | "bursaries",
  base: string,
  facultyId?: string,
): Promise<string> {
  const root = slugify(base) || "item";
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const { data } =
      table === "courses"
        ? await supabase
            .from("courses")
            .select("id")
            .eq("slug", slug)
            .eq("faculty_id", facultyId ?? "")
            .limit(1)
        : await supabase.from("bursaries").select("id").eq("slug", slug).limit(1);
    if (!data?.length) return slug;
  }
  throw new Error("Couldn't find a free slug for this record.");
}

async function facultyFor(universityId: string, name: string | null): Promise<string> {
  const facultyName = (name ?? "").trim() || "General";
  const { data: existing } = await supabase
    .from("faculties")
    .select("id, name")
    .eq("university_id", universityId);
  const match = existing?.find((f) => f.name.trim().toLowerCase() === facultyName.toLowerCase());
  if (match) return match.id;
  const { data, error } = await supabase
    .from("faculties")
    .insert({
      university_id: universityId,
      name: facultyName,
      slug: slugify(facultyName) || "general",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't create the faculty: ${error.message}`);
  return data.id;
}

/**
 * Create the real record from a draft. `publish` is only honoured when every
 * check passed; anything flagged is saved unpublished for a human to fix.
 */
export async function promoteDraft(
  draft: DraftRow,
  opts: { publish: boolean; sourceUrl: string | null },
) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const publish = opts.publish && draft.checks.status === "passed" && !!opts.sourceUrl;
  const verification = publish
    ? { last_verified_at: new Date().toISOString(), verified_by: userId }
    : {};
  let promotedId: string;

  if (draft.target_table === "courses") {
    const d = draft.payload.draft as CourseDraft;
    const universityId = draft.payload.university_id;
    if (!universityId) throw new Error("This import isn't linked to a university.");
    const name = d.name.value?.trim();
    if (!name) throw new Error("The draft has no course name.");
    const facultyId = await facultyFor(universityId, d.faculty.value);
    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        faculty_id: facultyId,
        name,
        slug: await uniqueSlug("courses", name, facultyId),
        qualification_type: d.qualification_type.value,
        duration_years: d.duration_years.value,
        min_aps: d.min_aps.value,
        field_of_study: d.field_of_study,
        requires_nbt: d.requires_nbt.value ?? false,
        source_url: opts.sourceUrl,
        is_published: publish,
        ...verification,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    promotedId = course.id;

    const mapped = draft.checks.mapped_requirements ?? [];
    if (mapped.length) {
      const { data: subjects } = await supabase
        .from("subjects")
        .select("id, code")
        .in(
          "code",
          mapped.map((m) => m.subject_code),
        );
      const idFor = new Map((subjects ?? []).map((s) => [s.code, s.id]));
      const rows = mapped
        .filter((m) => idFor.has(m.subject_code))
        .map((m) => ({
          course_id: promotedId,
          subject_id: idFor.get(m.subject_code)!,
          min_level: m.min_level,
          is_required: true,
          notes: m.from,
        }));
      if (rows.length) {
        const { error: reqError } = await supabase.from("course_requirements").insert(rows);
        if (reqError) throw new Error(reqError.message);
      }
    }
  } else {
    const d = draft.payload.draft as BursaryDraft;
    const name = d.name.value?.trim();
    if (!name) throw new Error("The draft has no bursary name.");
    const eligibility: Record<string, unknown> = {};
    if (d.fields.length) eligibility.fields = d.fields;
    if (d.citizenship.length) eligibility.citizenship = d.citizenship;
    if (d.provinces.length) eligibility.provinces = d.provinces;
    if (d.disability_only.value) eligibility.demographics = ["disability"];
    if (d.min_percentage_avg.value !== null)
      eligibility.min_percentage_avg = d.min_percentage_avg.value;
    if (d.household_income_max.value !== null)
      eligibility.household_income_max = Math.round(d.household_income_max.value);

    const { data: bursary, error } = await supabase
      .from("bursaries")
      .insert({
        name,
        slug: await uniqueSlug("bursaries", name),
        provider: d.provider.value?.trim() || "Unknown provider",
        website_url:
          d.website_url.value && /^https?:\/\//.test(d.website_url.value)
            ? d.website_url.value
            : null,
        value_description: d.value_description.value,
        fields_of_study: d.fields,
        eligibility: eligibility as Json,
        source_url: opts.sourceUrl,
        is_published: publish && !!d.website_url.value,
        ...verification,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    promotedId = bursary.id;

    const year =
      d.cycle_year.value ?? (d.closes_at.value ? Number(d.closes_at.value.slice(0, 4)) : null);
    if (year && year >= 2026 && (d.opens_at.value || d.closes_at.value)) {
      const { error: cycleError } = await supabase.from("bursary_cycles").insert({
        bursary_id: promotedId,
        year,
        opens_at: d.opens_at.value,
        closes_at: d.closes_at.value,
      });
      if (cycleError) throw new Error(cycleError.message);
    }
  }

  const { error: markError } = await supabase
    .from("draft_extractions")
    .update({
      state: "approved",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      promoted_row_id: promotedId,
    })
    .eq("id", draft.id);
  if (markError) throw new Error(markError.message);
  return { id: promotedId, published: publish };
}

export async function rejectDraft(draftId: string, note?: string) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("draft_extractions")
    .update({
      state: "rejected",
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      notes: note ?? null,
    })
    .eq("id", draftId);
  if (error) throw new Error(error.message);
}
