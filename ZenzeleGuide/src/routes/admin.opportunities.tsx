import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader,
  CheckboxGroup,
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
  isHttpUrl,
  labelFor,
  nullIfBlank,
  slugify,
} from "@/lib/admin-options";
import {
  EDUCATION_LEVELS,
  OPPORTUNITY_KINDS,
  kindLabel,
  type EducationLevel,
  type OpportunityKind,
} from "@/lib/opportunities";
import { formatDate } from "@/lib/directory";

export const Route = createFileRoute("/admin/opportunities")({
  head: () => ({ meta: [{ title: "Learnerships & programmes — Admin" }] }),
  component: OpportunitiesAdmin,
});

type Row = {
  id: string;
  slug: string;
  kind: OpportunityKind;
  title: string;
  organisation: string;
  description: string | null;
  field_of_study: string | null;
  provinces: string[];
  min_education: EducationLevel | null;
  max_age: number | null;
  stipend: string | null;
  duration_months: number | null;
  seta: string | null;
  how_to_apply: string | null;
  website_url: string | null;
  opens_at: string | null;
  closes_at: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  is_published: boolean;
};

type Form = {
  id?: string;
  kind: OpportunityKind | "";
  title: string;
  slug: string;
  slugTouched: boolean;
  organisation: string;
  description: string;
  field_of_study: string;
  provinces: string[];
  min_education: string;
  max_age: string;
  stipend: string;
  duration_months: string;
  seta: string;
  how_to_apply: string;
  website_url: string;
  opens_at: string;
  closes_at: string;
  source_url: string;
  is_published: boolean;
  last_verified_at: string | null;
  verifyNow: boolean;
};

const empty: Form = {
  kind: "",
  title: "",
  slug: "",
  slugTouched: false,
  organisation: "",
  description: "",
  field_of_study: "",
  provinces: [],
  min_education: "",
  max_age: "",
  stipend: "",
  duration_months: "",
  seta: "",
  how_to_apply: "",
  website_url: "",
  opens_at: "",
  closes_at: "",
  source_url: "",
  is_published: false,
  last_verified_at: null,
  verifyNow: false,
};

function toForm(o: Row): Form {
  return {
    id: o.id,
    kind: o.kind,
    title: o.title,
    slug: o.slug,
    slugTouched: true,
    organisation: o.organisation,
    description: o.description ?? "",
    field_of_study: o.field_of_study ?? "",
    provinces: o.provinces ?? [],
    min_education: o.min_education ?? "",
    max_age: o.max_age?.toString() ?? "",
    stipend: o.stipend ?? "",
    duration_months: o.duration_months?.toString() ?? "",
    seta: o.seta ?? "",
    how_to_apply: o.how_to_apply ?? "",
    website_url: o.website_url ?? "",
    opens_at: o.opens_at ?? "",
    closes_at: o.closes_at ?? "",
    source_url: o.source_url ?? "",
    is_published: o.is_published,
    last_verified_at: o.last_verified_at,
    verifyNow: false,
  };
}

function validateOpportunity(f: Form): string | null {
  if (!f.kind) return "Choose what type of opportunity this is.";
  if (!f.title.trim()) return "Enter the programme's name.";
  if (!f.slug.trim()) return "Enter a slug (used in the web address).";
  if (!f.organisation.trim()) return "Enter the company or organisation that runs it.";
  if (!f.description.trim()) return "Describe what the programme involves.";
  if (f.max_age && (Number(f.max_age) < 14 || Number(f.max_age) > 70))
    return "Maximum age must be between 14 and 70.";
  if (f.duration_months && (Number(f.duration_months) < 1 || Number(f.duration_months) > 72))
    return "Duration must be between 1 and 72 months.";
  if (f.opens_at && f.closes_at && f.opens_at > f.closes_at)
    return "The closing date must be on or after the opening date.";
  if (f.website_url.trim() && !isHttpUrl(f.website_url.trim()))
    return "The application link must start with https://";
  if (f.source_url.trim() && !isHttpUrl(f.source_url.trim()))
    return "Source must be a full link starting with https://";
  if (f.is_published && !f.source_url.trim())
    return "Add the official source link before publishing.";
  return null;
}

function OpportunitiesAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [form]);

  const list = useQuery({
    queryKey: ["admin", "opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").order("title");
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data ?? []).filter(
      (o) =>
        (!kindFilter || o.kind === kindFilter) &&
        (!q || o.title.toLowerCase().includes(q) || o.organisation.toLowerCase().includes(q)),
    );
  }, [list.data, search, kindFilter]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const problem = validateOpportunity(form);
      if (problem) throw new Error(problem);
      const row = {
        kind: form.kind as OpportunityKind,
        title: form.title.trim(),
        slug: slugify(form.slug),
        organisation: form.organisation.trim(),
        description: nullIfBlank(form.description),
        field_of_study: nullIfBlank(form.field_of_study),
        provinces: form.provinces,
        min_education: (nullIfBlank(form.min_education) as EducationLevel | null) ?? null,
        max_age: form.max_age ? Number(form.max_age) : null,
        stipend: nullIfBlank(form.stipend),
        duration_months: form.duration_months ? Number(form.duration_months) : null,
        seta: nullIfBlank(form.seta),
        how_to_apply: nullIfBlank(form.how_to_apply),
        website_url: nullIfBlank(form.website_url),
        opens_at: nullIfBlank(form.opens_at),
        closes_at: nullIfBlank(form.closes_at),
        source_url: nullIfBlank(form.source_url),
        is_published: form.is_published,
        ...(form.verifyNow ? { last_verified_at: new Date().toISOString() } : {}),
      };
      const { error } = form.id
        ? await supabase.from("opportunities").update(row).eq("id", form.id)
        : await supabase.from("opportunities").insert(row);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success(form.id ? "Opportunity updated" : "Opportunity added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("opportunities").delete().eq("id", form.id!);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Opportunity deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (o?: Row) => {
    setForm(o ? toForm(o) : empty);
    setError(null);
    setOpen(true);
  };

  return (
    <div>
      <AdminPageHeader
        title="Learnerships & programmes"
        description="Learnerships, apprenticeships, internships, graduate programmes and short courses. They power the Opportunities page and the learnership, graduate and gap-year journeys. Only published ones with an official source are shown to learners."
        actionLabel="Add opportunity"
        onAction={() => openEditor()}
      />
      <div className="mb-4 flex max-w-xl flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBox value={search} onChange={setSearch} placeholder="Search by name or company" />
        </div>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className={`${inputClass} sm:w-52`}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {OPPORTUNITY_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.plural}
            </option>
          ))}
        </select>
      </div>
      {list.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : list.error ? (
        <p className="text-sm text-destructive">{friendlyDbError((list.error as Error).message)}</p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search || kindFilter
            ? "Nothing matches your search."
            : "No learnerships or programmes yet. Add the first one."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Type</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Closes</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => openEditor(o)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.organisation}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {kindLabel(o.kind)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {o.closes_at ? formatDate(o.closes_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill published={o.is_published} verifiedAt={o.last_verified_at} />
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
        title={form.id ? `Edit ${form.title || "opportunity"}` : "Add opportunity"}
        description="Copy details from the company's official advert or careers page, and link it as the source."
        onSave={() => {
          setError(null);
          save.mutate();
        }}
        saving={save.isPending || remove.isPending}
        error={error}
        onDelete={form.id ? () => remove.mutate() : undefined}
        deleteWarning="This removes it from learners' shortlists too. This can't be undone."
      >
        <Section title="Basics">
          <Field label="Type" required>
            <select
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as Form["kind"])}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {OPPORTUNITY_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Programme name" required>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: f.slugTouched ? f.slug : slugify(`${f.organisation} ${e.target.value}`),
                }))
              }
              placeholder="As it appears on the advert"
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company or organisation" required>
              <input
                value={form.organisation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    organisation: e.target.value,
                    slug: f.slugTouched ? f.slug : slugify(`${e.target.value} ${f.title}`),
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Slug" required hint="Used in web addresses.">
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="What it involves" required hint="Plain words: the work, training and qualification.">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Field" hint="Links it to careers and journeys in this field.">
              <select
                value={form.field_of_study}
                onChange={(e) => set("field_of_study", e.target.value)}
                className={inputClass}
              >
                <option value="">Any / not stated</option>
                {FIELDS_OF_STUDY.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="SETA" hint="The accrediting SETA, if the advert names one.">
              <input
                value={form.seta}
                onChange={(e) => set("seta", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="Who can apply">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum education">
              <select
                value={form.min_education}
                onChange={(e) => set("min_education", e.target.value)}
                className={inputClass}
              >
                <option value="">Not stated</option>
                {EDUCATION_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Maximum age" hint="Leave blank if the advert doesn't give one.">
              <input
                inputMode="numeric"
                value={form.max_age}
                onChange={(e) => set("max_age", e.target.value.replace(/\D/g, "").slice(0, 2))}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Provinces" hint="Leave all off if anyone in South Africa can apply.">
            <CheckboxGroup
              options={PROVINCES}
              value={form.provinces}
              onChange={(v) => set("provinces", v)}
            />
          </Field>
        </Section>

        <Section title="Stipend, length and dates">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stipend" hint="As the advert states it, e.g. R4 500 a month.">
              <input
                value={form.stipend}
                onChange={(e) => set("stipend", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Duration (months)">
              <input
                inputMode="numeric"
                value={form.duration_months}
                onChange={(e) =>
                  set("duration_months", e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Applications open">
              <input
                type="date"
                value={form.opens_at}
                onChange={(e) => set("opens_at", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Applications close">
              <input
                type="date"
                value={form.closes_at}
                onChange={(e) => set("closes_at", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="How to apply">
          <Field label="Application link" hint="The official page where people apply.">
            <input
              value={form.website_url}
              onChange={(e) => set("website_url", e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </Field>
          <Field label="Steps and documents" hint="e.g. certified ID copy, CV, matric certificate.">
            <textarea
              value={form.how_to_apply}
              onChange={(e) => set("how_to_apply", e.target.value)}
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
