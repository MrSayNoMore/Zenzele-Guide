import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader,
  EditorSheet,
  EmptyState,
  Field,
  SearchBox,
  Section,
  StatusPill,
  TrustFields,
  friendlyDbError,
  inputClass,
  textareaClass,
} from "@/components/admin/editor";
import { FIELDS_OF_STUDY, isHttpUrl, labelFor, nullIfBlank, slugify } from "@/lib/admin-options";

export const Route = createFileRoute("/admin/courses")({
  head: () => ({ meta: [{ title: "Courses — Admin" }] }),
  component: CoursesAdmin,
});

const NEW_FACULTY = "__new__";

// NSC achievement levels, shown next to each requirement.
const LEVELS = [
  { value: 7, label: "Level 7 · 80–100%" },
  { value: 6, label: "Level 6 · 70–79%" },
  { value: 5, label: "Level 5 · 60–69%" },
  { value: 4, label: "Level 4 · 50–59%" },
  { value: 3, label: "Level 3 · 40–49%" },
  { value: 2, label: "Level 2 · 30–39%" },
  { value: 1, label: "Level 1 · 0–29%" },
];

const QUALIFICATIONS = [
  "Bachelor's degree",
  "Diploma",
  "Higher Certificate",
  "Advanced Diploma",
  "Extended degree",
];

type Requirement = { subject_id: string; min_level: number; notes: string };

type Form = {
  id?: string;
  university_id: string;
  faculty_id: string;
  new_faculty_name: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  qualification_type: string;
  duration_years: string;
  min_aps: string;
  field_of_study: string;
  requires_nbt: boolean;
  description: string;
  requirements: Requirement[];
  source_url: string;
  is_published: boolean;
  last_verified_at: string | null;
  verifyNow: boolean;
};

const emptyForm = (university_id = ""): Form => ({
  university_id,
  faculty_id: "",
  new_faculty_name: "",
  name: "",
  slug: "",
  slugTouched: false,
  qualification_type: "",
  duration_years: "",
  min_aps: "",
  field_of_study: "",
  requires_nbt: false,
  description: "",
  requirements: [],
  source_url: "",
  is_published: false,
  last_verified_at: null,
  verifyNow: false,
});

type CourseRow = {
  id: string;
  name: string;
  slug: string;
  qualification_type: string | null;
  duration_years: number | null;
  min_aps: number | null;
  field_of_study: string | null;
  requires_nbt: boolean;
  description: string | null;
  source_url: string | null;
  is_published: boolean;
  last_verified_at: string | null;
  faculty_id: string;
  faculties: {
    id: string;
    name: string;
    university_id: string;
    universities: { name: string } | null;
  } | null;
  course_requirements: { subject_id: string | null; min_level: number; notes: string | null }[];
};

function validate(f: Form): string | null {
  if (!f.university_id) return "Choose a university.";
  if (!f.faculty_id) return "Choose a faculty, or add a new one.";
  if (f.faculty_id === NEW_FACULTY && !f.new_faculty_name.trim())
    return "Enter the new faculty's name.";
  if (!f.name.trim()) return "Enter the course name.";
  if (!f.slug.trim()) return "Enter a slug.";
  if (f.min_aps && !/^\d{1,2}$/.test(f.min_aps.trim()))
    return "Minimum APS must be a whole number, e.g. 32.";
  if (f.duration_years && !/^\d(\.\d)?$/.test(f.duration_years.trim()))
    return "Duration must be in years, e.g. 3 or 3.5.";
  if (f.source_url.trim() && !isHttpUrl(f.source_url.trim()))
    return "Source must be a full link starting with https://";
  if (f.requirements.some((r) => !r.subject_id))
    return "Choose a subject for every requirement, or remove the empty row.";
  const ids = f.requirements.map((r) => r.subject_id);
  if (new Set(ids).size !== ids.length) return "Each subject can only be listed once.";
  if (f.is_published) {
    if (!f.min_aps.trim()) return "Add the minimum APS before publishing. The matcher needs it.";
    if (!f.source_url.trim()) return "Add the official source link before publishing.";
  }
  return null;
}

function CoursesAdmin() {
  const queryClient = useQueryClient();
  const [universityFilter, setUniversityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  // A validation message is stale once the form changes.
  useEffect(() => setError(null), [form]);

  const universities = useQuery({
    queryKey: ["admin", "universities-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("universities").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const faculties = useQuery({
    queryKey: ["admin", "faculties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculties")
        .select("id, name, university_id")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const subjects = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, code, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const courses = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, name, slug, qualification_type, duration_years, min_aps, field_of_study, requires_nbt, description, source_url, is_published, last_verified_at, faculty_id, faculties(id, name, university_id, universities(name)), course_requirements(subject_id, min_level, notes)",
        )
        .order("name");
      if (error) throw error;
      return data as unknown as CourseRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (courses.data ?? []).filter(
      (c) =>
        (!universityFilter || c.faculties?.university_id === universityFilter) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          (c.faculties?.name ?? "").toLowerCase().includes(q)),
    );
  }, [courses.data, universityFilter, search]);

  const facultiesForUni = (faculties.data ?? []).filter(
    (f) => f.university_id === form.university_id,
  );
  const subjectName = (id: string) => subjects.data?.find((s) => s.id === id)?.name ?? "";

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setReq = (i: number, patch: Partial<Requirement>) =>
    setForm((f) => ({
      ...f,
      requirements: f.requirements.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    }));

  const save = useMutation({
    mutationFn: async () => {
      const problem = validate(form);
      if (problem) throw new Error(problem);
      const { data: auth } = await supabase.auth.getUser();

      // 1. Faculty (create if new)
      let facultyId = form.faculty_id;
      if (facultyId === NEW_FACULTY) {
        const name = form.new_faculty_name.trim();
        const { data, error } = await supabase
          .from("faculties")
          .insert({ university_id: form.university_id, name, slug: slugify(name) })
          .select("id")
          .single();
        if (error) throw new Error(friendlyDbError(error.message).replace("slug", "faculty name"));
        facultyId = data.id;
      }

      // 2. Course
      const row = {
        faculty_id: facultyId,
        name: form.name.trim(),
        slug: slugify(form.slug),
        qualification_type: nullIfBlank(form.qualification_type),
        duration_years: form.duration_years.trim() ? Number(form.duration_years) : null,
        min_aps: form.min_aps.trim() ? Number(form.min_aps) : null,
        field_of_study: nullIfBlank(form.field_of_study),
        requires_nbt: form.requires_nbt,
        description: nullIfBlank(form.description),
        source_url: nullIfBlank(form.source_url),
        is_published: form.is_published,
        ...(form.verifyNow
          ? { last_verified_at: new Date().toISOString(), verified_by: auth.user?.id ?? null }
          : {}),
      };
      let courseId = form.id;
      if (courseId) {
        const { error } = await supabase.from("courses").update(row).eq("id", courseId);
        if (error) throw new Error(friendlyDbError(error.message));
      } else {
        const { data, error } = await supabase.from("courses").insert(row).select("id").single();
        if (error) throw new Error(friendlyDbError(error.message));
        courseId = data.id;
      }

      // 3. Requirements: replace the set
      const { error: delError } = await supabase
        .from("course_requirements")
        .delete()
        .eq("course_id", courseId);
      if (delError) throw new Error(friendlyDbError(delError.message));
      if (form.requirements.length) {
        const { error: reqError } = await supabase.from("course_requirements").insert(
          form.requirements.map((r) => ({
            course_id: courseId!,
            subject_id: r.subject_id,
            min_level: r.min_level,
            is_required: true,
            notes: nullIfBlank(r.notes),
          })),
        );
        if (reqError) throw new Error(friendlyDbError(reqError.message));
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Course updated" : "Course added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").delete().eq("id", form.id!);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Course deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (c?: CourseRow) => {
    setError(null);
    if (!c) {
      setForm(emptyForm(universityFilter));
    } else {
      setForm({
        id: c.id,
        university_id: c.faculties?.university_id ?? "",
        faculty_id: c.faculty_id,
        new_faculty_name: "",
        name: c.name,
        slug: c.slug,
        slugTouched: true,
        qualification_type: c.qualification_type ?? "",
        duration_years: c.duration_years?.toString() ?? "",
        min_aps: c.min_aps?.toString() ?? "",
        field_of_study: c.field_of_study ?? "",
        requires_nbt: c.requires_nbt,
        description: c.description ?? "",
        requirements: c.course_requirements
          .filter((r) => r.subject_id)
          .map((r) => ({
            subject_id: r.subject_id!,
            min_level: r.min_level,
            notes: r.notes ?? "",
          })),
        source_url: c.source_url ?? "",
        is_published: c.is_published,
        last_verified_at: c.last_verified_at,
        verifyNow: false,
      });
    }
    setOpen(true);
  };

  const noUniversities = universities.data && universities.data.length === 0;

  return (
    <div>
      <AdminPageHeader
        title="Courses"
        description="Programmes and their entry requirements. The Grade 12 matcher uses the minimum APS and subject levels."
        actionLabel={noUniversities ? undefined : "Add course"}
        onAction={() => openEditor()}
      />

      {noUniversities ? (
        <EmptyState>
          Add a university first, on the{" "}
          <a href="/admin/universities" className="font-medium text-primary hover:underline">
            Universities
          </a>{" "}
          page.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid max-w-2xl gap-3 sm:grid-cols-2">
            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All universities</option>
              {universities.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search courses or faculties"
            />
          </div>

          {courses.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : courses.error ? (
            <p className="text-sm text-destructive">
              {friendlyDbError((courses.error as Error).message)}
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState>
              {search || universityFilter
                ? "No courses match."
                : "No courses yet. Add the first one."}
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Min APS</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Requirements</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openEditor(c)}
                      className="cursor-pointer hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.faculties?.universities?.name} · {c.faculties?.name}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {c.min_aps ?? <span className="text-destructive">missing</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {c.course_requirements.length
                          ? c.course_requirements
                              .map((r) => `${subjectName(r.subject_id ?? "")} ${r.min_level}`)
                              .join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill published={c.is_published} verifiedAt={c.last_verified_at} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <EditorSheet
        open={open}
        onOpenChange={setOpen}
        title={form.id ? `Edit ${form.name || "course"}` : "Add course"}
        description="Copy requirements exactly as the current prospectus states them."
        onSave={() => {
          setError(null);
          save.mutate();
        }}
        saving={save.isPending || remove.isPending}
        error={error}
        onDelete={form.id ? () => remove.mutate() : undefined}
        deleteWarning="This deletes the course and its requirements. Learners' saved shortlists will show it as no longer listed."
      >
        <Section title="Where it's offered">
          <Field label="University" required>
            <select
              value={form.university_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, university_id: e.target.value, faculty_id: "" }))
              }
              className={inputClass}
            >
              <option value="">Choose…</option>
              {universities.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Faculty" required>
            <select
              value={form.faculty_id}
              onChange={(e) => set("faculty_id", e.target.value)}
              disabled={!form.university_id}
              className={inputClass}
            >
              <option value="">
                {form.university_id ? "Choose…" : "Choose a university first"}
              </option>
              {facultiesForUni.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
              {form.university_id && <option value={NEW_FACULTY}>+ Add a new faculty…</option>}
            </select>
          </Field>
          {form.faculty_id === NEW_FACULTY && (
            <Field label="New faculty name" required>
              <input
                value={form.new_faculty_name}
                onChange={(e) => set("new_faculty_name", e.target.value)}
                placeholder="e.g. Faculty of Engineering and the Built Environment"
                className={inputClass}
              />
            </Field>
          )}
        </Section>

        <Section title="Course">
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: f.slugTouched ? f.slug : slugify(e.target.value),
                }))
              }
              placeholder="e.g. BSc Computer Science"
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" required>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Qualification">
              <input
                list="qualification-types"
                value={form.qualification_type}
                onChange={(e) => set("qualification_type", e.target.value)}
                className={inputClass}
              />
              <datalist id="qualification-types">
                {QUALIFICATIONS.map((q) => (
                  <option key={q} value={q} />
                ))}
              </datalist>
            </Field>
            <Field
              label="Minimum APS"
              required={form.is_published}
              hint="As the university calculates it."
            >
              <input
                inputMode="numeric"
                value={form.min_aps}
                onChange={(e) => set("min_aps", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Duration (years)">
              <input
                inputMode="decimal"
                value={form.duration_years}
                onChange={(e) => set("duration_years", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Field of study" hint="Used to match bursaries.">
              <select
                value={form.field_of_study}
                onChange={(e) => set("field_of_study", e.target.value)}
                className={inputClass}
              >
                <option value="">Choose…</option>
                {FIELDS_OF_STUDY.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-3 pt-7 text-sm">
              <input
                type="checkbox"
                checked={form.requires_nbt}
                onChange={(e) => set("requires_nbt", e.target.checked)}
                className="h-4 w-4 accent-[#1D9E75]"
              />
              Requires the NBT
            </label>
          </div>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaClass}
            />
          </Field>
        </Section>

        <Section title="Subject requirements">
          <p className="text-sm text-muted-foreground">
            The minimum NSC level for each required subject.{" "}
            {form.field_of_study && `Field: ${labelFor(FIELDS_OF_STUDY, form.field_of_study)}.`}
          </p>
          {subjects.data && subjects.data.length === 0 && (
            <p className="rounded-md bg-accent/30 px-3 py-2 text-sm text-accent-foreground">
              The subject list is empty. Run the <code>seed_nsc_subjects</code> migration in
              Supabase first.
            </p>
          )}
          <div className="space-y-2">
            {form.requirements.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_10rem_auto] items-center gap-2">
                <select
                  value={r.subject_id}
                  onChange={(e) => setReq(i, { subject_id: e.target.value })}
                  className={inputClass}
                  aria-label="Subject"
                >
                  <option value="">Subject…</option>
                  {subjects.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={r.min_level}
                  onChange={(e) => setReq(i, { min_level: Number(e.target.value) })}
                  className={inputClass}
                  aria-label="Minimum level"
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      requirements: f.requirements.filter((_, j) => j !== i),
                    }))
                  }
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Remove requirement"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                requirements: [...f.requirements, { subject_id: "", min_level: 4, notes: "" }],
              }))
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add subject requirement
          </button>
        </Section>

        <TrustFields
          sourceUrl={form.source_url}
          onSourceUrl={(v) => set("source_url", v)}
          lastVerifiedAt={form.last_verified_at}
          verifyNow={form.verifyNow}
          onVerifyNow={(v) => set("verifyNow", v)}
          published={form.is_published}
          onPublished={(v) => set("is_published", v)}
        />
      </EditorSheet>
    </div>
  );
}
