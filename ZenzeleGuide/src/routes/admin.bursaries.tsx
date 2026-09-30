import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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
  CITIZENSHIP,
  STUDY_LEVELS,
  FIELDS_OF_STUDY,
  PROVINCES,
  isHttpUrl,
  nullIfBlank,
  slugify,
} from "@/lib/admin-options";

export const Route = createFileRoute("/admin/bursaries")({
  head: () => ({ meta: [{ title: "Bursaries — Admin" }] }),
  component: BursariesAdmin,
});

// Shape the bursary matcher reads (BursaryPredicates in src/engine/schemas.ts).
type Eligibility = {
  study_levels?: string[];
  citizenship?: string[];
  provinces?: string[];
  fields?: string[];
  demographics?: string[];
  min_percentage_avg?: number;
  household_income_max?: number;
  [key: string]: unknown;
};

type Cycle = { year: string; opens_at: string; closes_at: string; notes: string };

type BursaryRow = {
  id: string;
  name: string;
  slug: string;
  provider: string;
  fields_of_study: string[];
  value_description: string | null;
  description: string | null;
  website_url: string | null;
  eligibility: Json;
  is_published: boolean;
  source_url: string | null;
  last_verified_at: string | null;
  bursary_cycles: {
    year: number;
    opens_at: string | null;
    closes_at: string | null;
    notes: string | null;
  }[];
};

type Form = {
  id?: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  provider: string;
  website_url: string;
  value_description: string;
  description: string;
  fields: string[];
  studyLevels: string[];
  citizenship: string[];
  provinces: string[];
  disabilityOnly: boolean;
  min_percentage_avg: string;
  household_income_max: string;
  otherEligibility: Eligibility; // keys this editor doesn't manage, kept as-is
  cycles: Cycle[];
  source_url: string;
  is_published: boolean;
  last_verified_at: string | null;
  verifyNow: boolean;
};

const thisYear = new Date().getFullYear();

const emptyForm: Form = {
  name: "",
  slug: "",
  slugTouched: false,
  provider: "",
  website_url: "",
  value_description: "",
  description: "",
  fields: [],
  studyLevels: [],
  citizenship: [],
  provinces: [],
  disabilityOnly: false,
  min_percentage_avg: "",
  household_income_max: "",
  otherEligibility: {},
  cycles: [],
  source_url: "",
  is_published: false,
  last_verified_at: null,
  verifyNow: false,
};

function toForm(b: BursaryRow): Form {
  const e = (
    b.eligibility && typeof b.eligibility === "object" && !Array.isArray(b.eligibility)
      ? b.eligibility
      : {}
  ) as Eligibility;
  const {
    study_levels,
    citizenship,
    provinces,
    fields,
    demographics,
    min_percentage_avg,
    household_income_max,
    ...rest
  } = e;
  const otherDemographics = (demographics ?? []).filter((d) => d !== "disability");
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    slugTouched: true,
    provider: b.provider,
    website_url: b.website_url ?? "",
    value_description: b.value_description ?? "",
    description: b.description ?? "",
    fields: fields ?? b.fields_of_study ?? [],
    studyLevels: study_levels ?? [],
    citizenship: citizenship ?? [],
    provinces: provinces ?? [],
    disabilityOnly: (demographics ?? []).includes("disability"),
    min_percentage_avg: min_percentage_avg?.toString() ?? "",
    household_income_max: household_income_max?.toString() ?? "",
    otherEligibility: otherDemographics.length
      ? { ...rest, demographics: otherDemographics }
      : rest,
    cycles: [...b.bursary_cycles]
      .sort((a, z) => z.year - a.year)
      .map((c) => ({
        year: String(c.year),
        opens_at: c.opens_at ?? "",
        closes_at: c.closes_at ?? "",
        notes: c.notes ?? "",
      })),
    source_url: b.source_url ?? "",
    is_published: b.is_published,
    last_verified_at: b.last_verified_at,
    verifyNow: false,
  };
}

function buildEligibility(f: Form): Eligibility {
  const e: Eligibility = { ...f.otherEligibility };
  if (f.studyLevels.length) e.study_levels = f.studyLevels;
  if (f.citizenship.length) e.citizenship = f.citizenship;
  if (f.provinces.length) e.provinces = f.provinces;
  if (f.fields.length) e.fields = f.fields;
  const demographics = [...((f.otherEligibility.demographics as string[] | undefined) ?? [])];
  if (f.disabilityOnly) demographics.push("disability");
  if (demographics.length) e.demographics = demographics;
  else delete e.demographics;
  if (f.min_percentage_avg.trim()) e.min_percentage_avg = Number(f.min_percentage_avg);
  if (f.household_income_max.trim())
    e.household_income_max = Number(f.household_income_max.replace(/[\s,R]/g, ""));
  return e;
}

function validate(f: Form): string | null {
  if (!f.name.trim()) return "Enter the bursary name.";
  if (!f.provider.trim()) return "Enter who offers the bursary.";
  if (!f.slug.trim()) return "Enter a slug.";
  for (const [label, url] of [
    ["Website", f.website_url],
    ["Source", f.source_url],
  ] as const) {
    if (url.trim() && !isHttpUrl(url.trim()))
      return `${label} must be a full link starting with https://`;
  }
  if (f.min_percentage_avg.trim()) {
    const n = Number(f.min_percentage_avg);
    if (!Number.isFinite(n) || n < 0 || n > 100)
      return "Minimum average must be between 0 and 100.";
  }
  if (f.household_income_max.trim()) {
    const n = Number(f.household_income_max.replace(/[\s,R]/g, ""));
    if (!Number.isInteger(n) || n <= 0)
      return "Household income limit must be a whole Rand amount, e.g. 600000.";
  }
  const years = new Set<string>();
  for (const c of f.cycles) {
    if (!/^\d{4}$/.test(c.year) || Number(c.year) < 2026)
      return "Each application window needs a year from 2026 onwards.";
    if (years.has(c.year)) return `There are two application windows for ${c.year}.`;
    years.add(c.year);
    if (c.opens_at && c.closes_at && c.opens_at > c.closes_at)
      return `The ${c.year} window closes before it opens.`;
  }
  if (f.is_published) {
    if (!f.source_url.trim()) return "Add the official source link before publishing.";
    if (!f.website_url.trim())
      return "Add the application website before publishing, so learners can apply.";
  }
  return null;
}

function BursariesAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  // A validation message is stale once the form changes.
  useEffect(() => setError(null), [form]);

  const list = useQuery({
    queryKey: ["admin", "bursaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bursaries")
        .select(
          "id, name, slug, provider, fields_of_study, value_description, description, website_url, eligibility, is_published, source_url, last_verified_at, bursary_cycles(year, opens_at, closes_at, notes)",
        )
        .order("name");
      if (error) throw error;
      return data as BursaryRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data ?? []).filter(
      (b) => !q || b.name.toLowerCase().includes(q) || b.provider.toLowerCase().includes(q),
    );
  }, [list.data, search]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setCycle = (i: number, patch: Partial<Cycle>) =>
    setForm((f) => ({ ...f, cycles: f.cycles.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const save = useMutation({
    mutationFn: async () => {
      const problem = validate(form);
      if (problem) throw new Error(problem);
      const { data: auth } = await supabase.auth.getUser();
      const row = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        provider: form.provider.trim(),
        website_url: nullIfBlank(form.website_url),
        value_description: nullIfBlank(form.value_description),
        description: nullIfBlank(form.description),
        fields_of_study: form.fields,
        eligibility: buildEligibility(form) as Json,
        source_url: nullIfBlank(form.source_url),
        is_published: form.is_published,
        ...(form.verifyNow
          ? { last_verified_at: new Date().toISOString(), verified_by: auth.user?.id ?? null }
          : {}),
      };
      let bursaryId = form.id;
      if (bursaryId) {
        const { error } = await supabase.from("bursaries").update(row).eq("id", bursaryId);
        if (error) throw new Error(friendlyDbError(error.message));
      } else {
        const { data, error } = await supabase.from("bursaries").insert(row).select("id").single();
        if (error) throw new Error(friendlyDbError(error.message));
        bursaryId = data.id;
      }

      const { error: delError } = await supabase
        .from("bursary_cycles")
        .delete()
        .eq("bursary_id", bursaryId);
      if (delError) throw new Error(friendlyDbError(delError.message));
      if (form.cycles.length) {
        const { error: cycleError } = await supabase.from("bursary_cycles").insert(
          form.cycles.map((c) => ({
            bursary_id: bursaryId!,
            year: Number(c.year),
            opens_at: nullIfBlank(c.opens_at),
            closes_at: nullIfBlank(c.closes_at),
            notes: nullIfBlank(c.notes),
          })),
        );
        if (cycleError) throw new Error(friendlyDbError(cycleError.message));
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Bursary updated" : "Bursary added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bursaries").delete().eq("id", form.id!);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Bursary deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (b?: BursaryRow) => {
    setForm(b ? toForm(b) : emptyForm);
    setError(null);
    setOpen(true);
  };

  const nextClose = (b: BursaryRow) => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = b.bursary_cycles
      .map((c) => c.closes_at)
      .filter((d): d is string => !!d && d >= today)
      .sort()[0];
    return upcoming
      ? new Date(upcoming).toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;
  };

  return (
    <div>
      <AdminPageHeader
        title="Bursaries"
        description="Funding learners can apply for. Eligibility rules and closing dates power the bursary matcher."
        actionLabel="Add bursary"
        onAction={() => openEditor()}
      />

      <div className="mb-4 max-w-sm">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search bursaries or providers"
        />
      </div>

      {list.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : list.error ? (
        <p className="text-sm text-destructive">{friendlyDbError((list.error as Error).message)}</p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search ? "No bursaries match your search." : "No bursaries yet. Add the first one."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Bursary</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Next closing date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => openEditor(b)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.provider}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {nextClose(b) ?? "No upcoming window"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill published={b.is_published} verifiedAt={b.last_verified_at} />
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
        title={form.id ? `Edit ${form.name || "bursary"}` : "Add bursary"}
        description="Copy eligibility and dates exactly as the provider publishes them."
        onSave={() => {
          setError(null);
          save.mutate();
        }}
        saving={save.isPending || remove.isPending}
        error={error}
        onDelete={form.id ? () => remove.mutate() : undefined}
        deleteWarning="This deletes the bursary and its application windows. Learners' saved shortlists will show it as no longer listed."
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
              placeholder="e.g. Funza Lushaka Bursary"
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider" required>
              <input
                value={form.provider}
                onChange={(e) => set("provider", e.target.value)}
                placeholder="Company or organisation"
                className={inputClass}
              />
            </Field>
            <Field label="Slug" required>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field
            label="Where to apply"
            required={form.is_published}
            hint="The provider's application page. Learners get sent here."
          >
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => set("website_url", e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </Field>
          <Field label="What it covers" hint="e.g. Full tuition, accommodation and a laptop">
            <input
              value={form.value_description}
              onChange={(e) => set("value_description", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaClass}
            />
          </Field>
        </Section>

        <Section title="Who can apply">
          <p className="text-sm text-muted-foreground">
            Leave a group empty if the bursary has no restriction on it.
          </p>
          <Field group label="Fields of study">
            <CheckboxGroup
              options={FIELDS_OF_STUDY}
              value={form.fields}
              onChange={(v) => set("fields", v)}
            />
          </Field>
          <Field
            group
            label="Stage of study"
            hint="Leave empty if the provider doesn't say. Used by the university-student journey."
          >
            <CheckboxGroup
              options={STUDY_LEVELS}
              value={form.studyLevels}
              onChange={(v) => set("studyLevels", v)}
            />
          </Field>
          <Field group label="Citizenship">
            <CheckboxGroup
              options={CITIZENSHIP}
              value={form.citizenship}
              onChange={(v) => set("citizenship", v)}
            />
          </Field>
          <Field
            group
            label="Provinces"
            hint="Only if the bursary is limited to learners from certain provinces."
          >
            <CheckboxGroup
              options={PROVINCES}
              value={form.provinces}
              onChange={(v) => set("provinces", v)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum average (%)">
              <input
                inputMode="numeric"
                value={form.min_percentage_avg}
                onChange={(e) => set("min_percentage_avg", e.target.value)}
                placeholder="e.g. 65"
                className={inputClass}
              />
            </Field>
            <Field label="Household income limit (R per year)">
              <input
                inputMode="numeric"
                value={form.household_income_max}
                onChange={(e) => set("household_income_max", e.target.value)}
                placeholder="e.g. 600000"
                className={inputClass}
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.disabilityOnly}
              onChange={(e) => set("disabilityOnly", e.target.checked)}
              className="h-4 w-4 accent-[#1D9E75]"
            />
            Only for learners with a disability
          </label>
        </Section>

        <Section title="Application windows">
          <div className="space-y-3">
            {form.cycles.map((c, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <div className="grid grid-cols-[5.5rem_1fr_1fr_auto] items-end gap-2">
                  <Field label="Year">
                    <input
                      inputMode="numeric"
                      value={c.year}
                      onChange={(e) => setCycle(i, { year: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Opens">
                    <input
                      type="date"
                      value={c.opens_at}
                      onChange={(e) => setCycle(i, { opens_at: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Closes">
                    <input
                      type="date"
                      value={c.closes_at}
                      onChange={(e) => setCycle(i, { closes_at: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, cycles: f.cycles.filter((_, j) => j !== i) }))
                    }
                    className="mb-0.5 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Remove window"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  value={c.notes}
                  onChange={(e) => setCycle(i, { notes: e.target.value })}
                  placeholder="Notes (optional), e.g. for 2027 first-years"
                  className={`${inputClass} mt-2`}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                cycles: [
                  ...f.cycles,
                  {
                    year: String(Math.max(thisYear, 2026)),
                    opens_at: "",
                    closes_at: "",
                    notes: "",
                  },
                ],
              }))
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add application window
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
