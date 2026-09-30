import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
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
import {
  FIELDS_OF_STUDY,
  PROVINCES,
  TVET_PROGRAM_TYPES,
  isHttpUrl,
  labelFor,
  nullIfBlank,
  slugify,
} from "@/lib/admin-options";

export const Route = createFileRoute("/admin/tvet")({
  head: () => ({ meta: [{ title: "TVET colleges — Admin" }] }),
  component: TvetAdmin,
});

type College = Tables<"tvet_colleges">;
type Program = Tables<"tvet_programs">;
type ProgramType = Program["program_type"];

type Tab = "colleges" | "programmes";

function TvetAdmin() {
  const [tab, setTab] = useState<Tab>("colleges");
  const colleges = useQuery({
    queryKey: ["admin", "tvet-colleges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tvet_colleges").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="mb-6 flex gap-2" role="tablist">
        {(
          [
            ["colleges", "Colleges"],
            ["programmes", "Programmes"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === value ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "colleges" ? (
        <CollegesTab colleges={colleges} />
      ) : (
        <ProgrammesTab colleges={colleges.data ?? []} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Colleges
// ---------------------------------------------------------------------------

type CollegeForm = {
  id?: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  province: string;
  website_url: string;
  description: string;
  source_url: string;
  is_published: boolean;
  last_verified_at: string | null;
  verifyNow: boolean;
};

const emptyCollege: CollegeForm = {
  name: "",
  slug: "",
  slugTouched: false,
  province: "",
  website_url: "",
  description: "",
  source_url: "",
  is_published: false,
  last_verified_at: null,
  verifyNow: false,
};

function validateCollege(f: CollegeForm): string | null {
  if (!f.name.trim()) return "Enter the college's name.";
  if (!f.slug.trim()) return "Enter a slug (used in the web address).";
  for (const [label, url] of [
    ["Website", f.website_url],
    ["Source", f.source_url],
  ] as const) {
    if (url.trim() && !isHttpUrl(url.trim()))
      return `${label} must be a full link starting with https://`;
  }
  if (f.is_published && !f.source_url.trim())
    return "Add the official source link before publishing.";
  return null;
}

function CollegesTab({ colleges }: { colleges: ReturnType<typeof useQuery<College[]>> }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CollegeForm>(emptyCollege);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [form]);

  const programCounts = useQuery({
    queryKey: ["admin", "tvet-program-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tvet_programs").select("college_id");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const p of data) counts.set(p.college_id, (counts.get(p.college_id) ?? 0) + 1);
      return counts;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (colleges.data ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [colleges.data, search]);

  const set = <K extends keyof CollegeForm>(key: K, value: CollegeForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const problem = validateCollege(form);
      if (problem) throw new Error(problem);
      const row = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        province: nullIfBlank(form.province),
        website_url: nullIfBlank(form.website_url),
        description: nullIfBlank(form.description),
        source_url: nullIfBlank(form.source_url),
        is_published: form.is_published,
        ...(form.verifyNow ? { last_verified_at: new Date().toISOString() } : {}),
      };
      const { error } = form.id
        ? await supabase.from("tvet_colleges").update(row).eq("id", form.id)
        : await supabase.from("tvet_colleges").insert(row);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success(form.id ? "College updated" : "College added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tvet_colleges").delete().eq("id", form.id!);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success("College deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (c?: College) => {
    setForm(
      c
        ? {
            id: c.id,
            name: c.name,
            slug: c.slug,
            slugTouched: true,
            province: c.province ?? "",
            website_url: c.website_url ?? "",
            description: c.description ?? "",
            source_url: c.source_url ?? "",
            is_published: c.is_published,
            last_verified_at: c.last_verified_at,
            verifyNow: false,
          }
        : emptyCollege,
    );
    setError(null);
    setOpen(true);
  };
  const linked = form.id ? (programCounts.data?.get(form.id) ?? 0) : 0;

  return (
    <div>
      <AdminPageHeader
        title="TVET colleges"
        description="Public TVET colleges. Add their programmes on the Programmes tab."
        actionLabel="Add college"
        onAction={() => openEditor()}
      />
      <div className="mb-4 max-w-sm">
        <SearchBox value={search} onChange={setSearch} placeholder="Search colleges" />
      </div>
      {colleges.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : colleges.error ? (
        <p className="text-sm text-destructive">
          {friendlyDbError((colleges.error as Error).message)}
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search ? "No colleges match your search." : "No colleges yet. Add the first one."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">College</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Province</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Programmes</th>
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
                    {labelFor(PROVINCES, c.province) || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {programCounts.data?.get(c.id) ?? 0}
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
        title={form.id ? `Edit ${form.name || "college"}` : "Add TVET college"}
        description="Check every detail against the college's official website."
        onSave={() => {
          setError(null);
          save.mutate();
        }}
        saving={save.isPending || remove.isPending}
        error={error}
        onDelete={form.id ? () => remove.mutate() : undefined}
        deleteWarning={
          linked > 0
            ? `This also deletes its ${linked} programme${linked === 1 ? "" : "s"}. This can't be undone.`
            : "This can't be undone."
        }
      >
        <Section title="Basics">
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
              placeholder="e.g. Ekurhuleni East TVET College"
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
            <Field label="Province">
              <select
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
                className={inputClass}
              >
                <option value="">Choose…</option>
                {PROVINCES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Website">
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => set("website_url", e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </Field>
          <Field label="Description" hint="A short, factual overview for learners.">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaClass}
            />
          </Field>
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

// ---------------------------------------------------------------------------
// Programmes
// ---------------------------------------------------------------------------

type ProgramForm = {
  id?: string;
  college_id: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  program_type: ProgramType;
  nqf_level: string;
  duration_years: string;
  min_grade: string;
  field_of_study: string;
  description: string;
  source_url: string;
  is_published: boolean;
  last_verified_at: string | null;
  verifyNow: boolean;
};

const emptyProgram: ProgramForm = {
  college_id: "",
  name: "",
  slug: "",
  slugTouched: false,
  program_type: "ncv",
  nqf_level: "",
  duration_years: "",
  min_grade: "",
  field_of_study: "",
  description: "",
  source_url: "",
  is_published: false,
  last_verified_at: null,
  verifyNow: false,
};

function validateProgram(f: ProgramForm): string | null {
  if (!f.college_id) return "Choose the college.";
  if (!f.name.trim()) return "Enter the programme name.";
  if (!f.slug.trim()) return "Enter a slug.";
  if (f.nqf_level && !/^(10|[1-9])$/.test(f.nqf_level)) return "NQF level must be 1 to 10.";
  if (f.min_grade && !/^(9|10|11|12)$/.test(f.min_grade))
    return "Minimum grade must be 9, 10, 11 or 12.";
  if (f.duration_years) {
    const d = Number(f.duration_years);
    if (!Number.isFinite(d) || d <= 0 || d > 10)
      return "Duration must be between 0.5 and 10 years.";
  }
  if (f.source_url.trim() && !isHttpUrl(f.source_url.trim()))
    return "Source must be a full link starting with https://";
  if (f.is_published && !f.source_url.trim())
    return "Add the official source link before publishing.";
  return null;
}

function ProgrammesTab({ colleges }: { colleges: College[] }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProgramForm>(emptyProgram);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [form]);

  const programs = useQuery({
    queryKey: ["admin", "tvet-programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tvet_programs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const collegeName = useMemo(() => new Map(colleges.map((c) => [c.id, c.name])), [colleges]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (programs.data ?? []).filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!collegeFilter || p.college_id === collegeFilter),
    );
  }, [programs.data, search, collegeFilter]);

  const set = <K extends keyof ProgramForm>(key: K, value: ProgramForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const problem = validateProgram(form);
      if (problem) throw new Error(problem);
      const row = {
        college_id: form.college_id,
        name: form.name.trim(),
        slug: slugify(form.slug),
        program_type: form.program_type,
        nqf_level: form.nqf_level ? Number(form.nqf_level) : null,
        duration_years: form.duration_years ? Number(form.duration_years) : null,
        min_grade: form.min_grade ? Number(form.min_grade) : null,
        field_of_study: nullIfBlank(form.field_of_study),
        description: nullIfBlank(form.description),
        source_url: nullIfBlank(form.source_url),
        is_published: form.is_published,
        draft_state: "approved" as const,
        ...(form.verifyNow ? { last_verified_at: new Date().toISOString() } : {}),
      };
      const { error } = form.id
        ? await supabase.from("tvet_programs").update(row).eq("id", form.id)
        : await supabase.from("tvet_programs").insert(row);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success(form.id ? "Programme updated" : "Programme added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tvet_programs").delete().eq("id", form.id!);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Programme deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (p?: Program) => {
    setForm(
      p
        ? {
            id: p.id,
            college_id: p.college_id,
            name: p.name,
            slug: p.slug,
            slugTouched: true,
            program_type: p.program_type,
            nqf_level: p.nqf_level?.toString() ?? "",
            duration_years: p.duration_years?.toString() ?? "",
            min_grade: p.min_grade?.toString() ?? "",
            field_of_study: p.field_of_study ?? "",
            description: p.description ?? "",
            source_url: p.source_url ?? "",
            is_published: p.is_published,
            last_verified_at: p.last_verified_at,
            verifyNow: false,
          }
        : { ...emptyProgram, college_id: collegeFilter },
    );
    setError(null);
    setOpen(true);
  };

  return (
    <div>
      <AdminPageHeader
        title="TVET programmes"
        description="NC(V), NATED (Report 191) and occupational programmes offered by each college."
        actionLabel="Add programme"
        onAction={() => (colleges.length ? openEditor() : toast.error("Add a college first."))}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="max-w-sm flex-1">
          <SearchBox value={search} onChange={setSearch} placeholder="Search programmes" />
        </div>
        <select
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
          className={`${inputClass} sm:w-72`}
          aria-label="Filter by college"
        >
          <option value="">All colleges</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {programs.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : programs.error ? (
        <p className="text-sm text-destructive">
          {friendlyDbError((programs.error as Error).message)}
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search || collegeFilter
            ? "No programmes match."
            : "No programmes yet. Add the first one."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => openEditor(p)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {collegeName.get(p.college_id) ?? ""}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {labelFor(TVET_PROGRAM_TYPES, p.program_type)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill published={p.is_published} verifiedAt={p.last_verified_at} />
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
        title={form.id ? `Edit ${form.name || "programme"}` : "Add TVET programme"}
        description="Copy the details exactly as the college publishes them."
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
          <Field label="College" required>
            <select
              value={form.college_id}
              onChange={(e) => set("college_id", e.target.value)}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Programme name" required>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: f.slugTouched ? f.slug : slugify(e.target.value),
                }))
              }
              placeholder="e.g. NC(V) Electrical Infrastructure Construction"
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
            <Field label="Type" required>
              <select
                value={form.program_type}
                onChange={(e) => set("program_type", e.target.value as ProgramType)}
                className={inputClass}
              >
                {TVET_PROGRAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Minimum grade" hint="The grade learners need to have passed.">
              <select
                value={form.min_grade}
                onChange={(e) => set("min_grade", e.target.value)}
                className={inputClass}
              >
                <option value="">Not stated</option>
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="NQF level">
              <input
                inputMode="numeric"
                value={form.nqf_level}
                onChange={(e) => set("nqf_level", e.target.value)}
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
            <Field label="Field of study">
              <select
                value={form.field_of_study}
                onChange={(e) => set("field_of_study", e.target.value)}
                className={inputClass}
              >
                <option value="">Not set</option>
                {FIELDS_OF_STUDY.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description" hint="What learners study and where it can lead.">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaClass}
            />
          </Field>
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
