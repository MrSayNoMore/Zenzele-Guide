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
import { NSC_LEVELS } from "@/lib/nsc";

export const Route = createFileRoute("/admin/careers")({
  head: () => ({ meta: [{ title: "Careers — Admin" }] }),
  component: CareersAdmin,
});

type CareerSubject = { subject_id: string; level: string; essential: boolean };

type CareerRow = {
  id: string;
  name: string;
  slug: string;
  field_of_study: string | null;
  description: string | null;
  outlook: string | null;
  typical_salary_range: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  is_published: boolean;
  career_subjects: {
    subject_id: string;
    recommended_min_level: number | null;
    is_essential: boolean;
  }[];
};

type Form = {
  id?: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  field_of_study: string;
  description: string;
  outlook: string;
  typical_salary_range: string;
  subjects: CareerSubject[];
  source_url: string;
  is_published: boolean;
  last_verified_at: string | null;
  verifyNow: boolean;
};

const empty: Form = {
  name: "",
  slug: "",
  slugTouched: false,
  field_of_study: "",
  description: "",
  outlook: "",
  typical_salary_range: "",
  subjects: [],
  source_url: "",
  is_published: false,
  last_verified_at: null,
  verifyNow: false,
};

function toForm(c: CareerRow): Form {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    slugTouched: true,
    field_of_study: c.field_of_study ?? "",
    description: c.description ?? "",
    outlook: c.outlook ?? "",
    typical_salary_range: c.typical_salary_range ?? "",
    subjects: c.career_subjects.map((s) => ({
      subject_id: s.subject_id,
      level: s.recommended_min_level?.toString() ?? "",
      essential: s.is_essential,
    })),
    source_url: c.source_url ?? "",
    is_published: c.is_published,
    last_verified_at: c.last_verified_at,
    verifyNow: false,
  };
}

function validateCareer(f: Form): string | null {
  if (!f.name.trim()) return "Enter the career's name.";
  if (!f.slug.trim()) return "Enter a slug (used in the web address).";
  if (!f.description.trim()) return "Describe what people in this career do.";
  if (f.subjects.some((s) => !s.subject_id)) return "Choose a subject for every subject row.";
  const ids = f.subjects.map((s) => s.subject_id);
  if (new Set(ids).size !== ids.length) return "Each subject can only be listed once.";
  if (f.source_url.trim() && !isHttpUrl(f.source_url.trim()))
    return "Source must be a full link starting with https://";
  if (f.typical_salary_range.trim() && !f.source_url.trim())
    return "Add the source for the salary range, so learners can check it.";
  if (f.is_published && !f.source_url.trim())
    return "Add the official source link before publishing.";
  return null;
}

function CareersAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [form]);

  const list = useQuery({
    queryKey: ["admin", "careers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("careers")
        .select(
          "id, name, slug, field_of_study, description, outlook, typical_salary_range, source_url, last_verified_at, is_published, career_subjects(subject_id, recommended_min_level, is_essential)",
        )
        .order("name");
      if (error) throw error;
      return data as CareerRow[];
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [list.data, search]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setSubject = (i: number, patch: Partial<CareerSubject>) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));

  const save = useMutation({
    mutationFn: async () => {
      const problem = validateCareer(form);
      if (problem) throw new Error(problem);
      const row = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        field_of_study: nullIfBlank(form.field_of_study),
        description: nullIfBlank(form.description),
        outlook: nullIfBlank(form.outlook),
        typical_salary_range: nullIfBlank(form.typical_salary_range),
        source_url: nullIfBlank(form.source_url),
        is_published: form.is_published,
        ...(form.verifyNow ? { last_verified_at: new Date().toISOString() } : {}),
      };
      let careerId = form.id;
      if (careerId) {
        const { error } = await supabase.from("careers").update(row).eq("id", careerId);
        if (error) throw new Error(friendlyDbError(error.message));
      } else {
        const { data, error } = await supabase.from("careers").insert(row).select("id").single();
        if (error) throw new Error(friendlyDbError(error.message));
        careerId = data.id;
      }
      // Subjects: replace the set.
      const { error: delError } = await supabase
        .from("career_subjects")
        .delete()
        .eq("career_id", careerId);
      if (delError) throw new Error(friendlyDbError(delError.message));
      if (form.subjects.length) {
        const { error: subError } = await supabase.from("career_subjects").insert(
          form.subjects.map((s) => ({
            career_id: careerId!,
            subject_id: s.subject_id,
            recommended_min_level: s.level ? Number(s.level) : null,
            is_essential: s.essential,
          })),
        );
        if (subError) throw new Error(friendlyDbError(subError.message));
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Career updated" : "Career added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("careers").delete().eq("id", form.id!);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Career deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (c?: CareerRow) => {
    setForm(c ? toForm(c) : empty);
    setError(null);
    setOpen(true);
  };

  return (
    <div>
      <AdminPageHeader
        title="Careers"
        description="Career guides: what the job involves, the school subjects that lead there, and the salary and outlook from a trusted source. Courses and bursaries in the same field are linked automatically."
        actionLabel="Add career"
        onAction={() => openEditor()}
      />
      <div className="mb-4 max-w-sm">
        <SearchBox value={search} onChange={setSearch} placeholder="Search careers" />
      </div>
      {list.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : list.error ? (
        <p className="text-sm text-destructive">{friendlyDbError((list.error as Error).message)}</p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search ? "No careers match your search." : "No careers yet. Add the first one."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Career</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Field</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Subjects</th>
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
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {labelFor(FIELDS_OF_STUDY, c.field_of_study) || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {c.career_subjects.length}
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

      <EditorSheet
        open={open}
        onOpenChange={setOpen}
        title={form.id ? `Edit ${form.name || "career"}` : "Add career"}
        description="Use trusted sources (e.g. a professional body, the Department of Higher Education, or a salary survey) and link them."
        onSave={() => {
          setError(null);
          save.mutate();
        }}
        saving={save.isPending || remove.isPending}
        error={error}
        onDelete={form.id ? () => remove.mutate() : undefined}
        deleteWarning="This can't be undone."
      >
        <Section title="Basics">
          <Field label="Career name" required>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: f.slugTouched ? f.slug : slugify(e.target.value),
                }))
              }
              placeholder="e.g. Civil engineer"
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" required hint="Used in web addresses.">
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))
                }
                className={inputClass}
              />
            </Field>
            <Field
              label="Field of study"
              hint="Links the career to courses and bursaries in this field."
            >
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
          </div>
          <Field label="What they do" required hint="Plain words a Grade 10 learner understands.">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaClass}
            />
          </Field>
          <Field
            label="Typical salary range"
            hint="e.g. R25 000 – R45 000 a month for a graduate. Needs a source."
          >
            <input
              value={form.typical_salary_range}
              onChange={(e) => set("typical_salary_range", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Outlook" hint="Is there demand? Is it on the scarce-skills list?">
            <textarea
              value={form.outlook}
              onChange={(e) => set("outlook", e.target.value)}
              className={textareaClass}
            />
          </Field>
        </Section>

        <Section title="School subjects">
          <p className="text-sm text-muted-foreground">
            The Grade 10–12 subjects that open this career. Mark the ones that are essential.
          </p>
          <div className="space-y-2">
            {form.subjects.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_9rem_auto_auto] items-center gap-2">
                <select
                  value={s.subject_id}
                  onChange={(e) => setSubject(i, { subject_id: e.target.value })}
                  className={inputClass}
                  aria-label="Subject"
                >
                  <option value="">Subject…</option>
                  {subjects.data?.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <select
                  value={s.level}
                  onChange={(e) => setSubject(i, { level: e.target.value })}
                  className={inputClass}
                  aria-label="Recommended level"
                >
                  <option value="">Any level</option>
                  {NSC_LEVELS.map((l) => (
                    <option key={l.level} value={l.level}>
                      Level {l.level}+
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={s.essential}
                    onChange={(e) => setSubject(i, { essential: e.target.checked })}
                    className="h-4 w-4 accent-[#1D9E75]"
                  />
                  Essential
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, subjects: f.subjects.filter((_, j) => j !== i) }))
                  }
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Remove subject"
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
                subjects: [...f.subjects, { subject_id: "", level: "", essential: false }],
              }))
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" /> Add subject
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
