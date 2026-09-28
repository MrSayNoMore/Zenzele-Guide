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
  PROVINCES,
  UNI_TYPES,
  isHttpUrl,
  labelFor,
  nullIfBlank,
  slugify,
} from "@/lib/admin-options";

export const Route = createFileRoute("/admin/universities")({
  head: () => ({ meta: [{ title: "Universities — Admin" }] }),
  component: UniversitiesAdmin,
});

type University = Tables<"universities">;
type UniType = University["uni_type"];

type Form = {
  id?: string;
  name: string;
  short_name: string;
  slug: string;
  slugTouched: boolean;
  uni_type: UniType;
  province: string;
  website_url: string;
  logo_url: string;
  description: string;
  source_url: string;
  is_published: boolean;
  last_verified_at: string | null;
  verifyNow: boolean;
};

const empty: Form = {
  name: "",
  short_name: "",
  slug: "",
  slugTouched: false,
  uni_type: "traditional",
  province: "",
  website_url: "",
  logo_url: "",
  description: "",
  source_url: "",
  is_published: false,
  last_verified_at: null,
  verifyNow: false,
};

function toForm(u: University): Form {
  return {
    id: u.id,
    name: u.name,
    short_name: u.short_name ?? "",
    slug: u.slug,
    slugTouched: true,
    uni_type: u.uni_type,
    province: u.province ?? "",
    website_url: u.website_url ?? "",
    logo_url: u.logo_url ?? "",
    description: u.description ?? "",
    source_url: u.source_url ?? "",
    is_published: u.is_published,
    last_verified_at: u.last_verified_at,
    verifyNow: false,
  };
}

function validate(f: Form): string | null {
  if (!f.name.trim()) return "Enter the university's name.";
  if (!f.slug.trim()) return "Enter a slug (used in the web address).";
  for (const [label, url] of [
    ["Website", f.website_url],
    ["Logo", f.logo_url],
    ["Source", f.source_url],
  ] as const) {
    if (url.trim() && !isHttpUrl(url.trim()))
      return `${label} must be a full link starting with https://`;
  }
  if (f.is_published && !f.source_url.trim())
    return "Add the official source link before publishing.";
  return null;
}

function UniversitiesAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState<string | null>(null);

  // A validation message is stale once the form changes.
  useEffect(() => setError(null), [form]);

  const list = useQuery({
    queryKey: ["admin", "universities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("universities").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const courseCounts = useQuery({
    queryKey: ["admin", "university-course-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, faculties(university_id)");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const c of data as { faculties: { university_id: string } | null }[]) {
        const id = c.faculties?.university_id;
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return counts;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data ?? []).filter(
      (u) =>
        !q || u.name.toLowerCase().includes(q) || (u.short_name ?? "").toLowerCase().includes(q),
    );
  }, [list.data, search]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const problem = validate(form);
      if (problem) throw new Error(problem);
      const { data: auth } = await supabase.auth.getUser();
      const row = {
        name: form.name.trim(),
        short_name: nullIfBlank(form.short_name),
        slug: slugify(form.slug),
        uni_type: form.uni_type,
        province: nullIfBlank(form.province),
        website_url: nullIfBlank(form.website_url),
        logo_url: nullIfBlank(form.logo_url),
        description: nullIfBlank(form.description),
        source_url: nullIfBlank(form.source_url),
        is_published: form.is_published,
        ...(form.verifyNow
          ? { last_verified_at: new Date().toISOString(), verified_by: auth.user?.id ?? null }
          : {}),
      };
      const { error } = form.id
        ? await supabase.from("universities").update(row).eq("id", form.id)
        : await supabase.from("universities").insert(row);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success(form.id ? "University updated" : "University added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("universities").delete().eq("id", form.id!);
      if (error) throw new Error(friendlyDbError(error.message));
    },
    onSuccess: () => {
      toast.success("University deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (u?: University) => {
    setForm(u ? toForm(u) : empty);
    setError(null);
    setOpen(true);
  };

  const linkedCourses = form.id ? (courseCounts.data?.get(form.id) ?? 0) : 0;

  return (
    <div>
      <AdminPageHeader
        title="Universities"
        description="Public universities learners can apply to. Add faculties and courses on the Courses page."
        actionLabel="Add university"
        onAction={() => openEditor()}
      />

      <div className="mb-4 max-w-sm">
        <SearchBox value={search} onChange={setSearch} placeholder="Search universities" />
      </div>

      {list.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : list.error ? (
        <p className="text-sm text-destructive">{friendlyDbError((list.error as Error).message)}</p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search
            ? "No universities match your search."
            : "No universities yet. Add the first one."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">University</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Province</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Courses</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => openEditor(u)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {labelFor(UNI_TYPES, u.uni_type)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {labelFor(PROVINCES, u.province) || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {courseCounts.data?.get(u.id) ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill published={u.is_published} verifiedAt={u.last_verified_at} />
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
        title={form.id ? `Edit ${form.name || "university"}` : "Add university"}
        description="Check every detail against the university's official site or prospectus."
        onSave={() => {
          setError(null);
          save.mutate();
        }}
        saving={save.isPending || remove.isPending}
        error={error}
        onDelete={form.id ? () => remove.mutate() : undefined}
        deleteWarning={
          linkedCourses > 0
            ? `This also deletes its faculties and ${linkedCourses} course${linkedCourses === 1 ? "" : "s"}. This can't be undone.`
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
              placeholder="e.g. University of the Witwatersrand"
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Short name" hint="e.g. Wits">
              <input
                value={form.short_name}
                onChange={(e) => set("short_name", e.target.value)}
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
            <Field label="Type">
              <select
                value={form.uni_type}
                onChange={(e) => set("uni_type", e.target.value as UniType)}
                className={inputClass}
              >
                {UNI_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
          <Field
            label="Logo image link"
            hint="Optional. A direct link to the university's logo image."
          >
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => set("logo_url", e.target.value)}
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
