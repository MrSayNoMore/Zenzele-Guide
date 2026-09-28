import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader,
  EditorSheet,
  EmptyState,
  Field,
  SearchBox,
  Section,
  friendlyDbError,
  inputClass,
} from "@/components/admin/editor";

export const Route = createFileRoute("/admin/subjects")({
  head: () => ({ meta: [{ title: "NSC subjects — Admin" }] }),
  component: SubjectsAdmin,
});

type Subject = {
  id: string;
  code: string;
  name: string;
  is_language: boolean;
  is_life_orientation: boolean;
};

type Form = {
  id?: string;
  name: string;
  code: string;
  codeTouched: boolean;
  is_language: boolean;
  is_life_orientation: boolean;
};

const empty: Form = {
  name: "",
  code: "",
  codeTouched: false,
  is_language: false,
  is_life_orientation: false,
};

const CODE_PATTERN = /^[a-z][a-z0-9_]{1,59}$/;

/** "isiXhosa Home Language" -> "isixhosa_hl"; "Marine Sciences" -> "marine_sciences" */
function suggestCode(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bhome language\b/, "hl")
    .replace(/\bfirst additional language\b/, "fal")
    .replace(/\bsecond additional language\b/, "sal")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return /^[a-z]/.test(base) ? base : `s_${base}`.slice(0, 60);
}

function validate(f: Form, existing: Subject[]): string | null {
  if (!f.name.trim()) return "Enter the subject's name, as it appears on the NSC certificate.";
  if (!f.id) {
    if (!CODE_PATTERN.test(f.code))
      return "The code must start with a letter and use only lowercase letters, numbers and underscores.";
    if (existing.some((s) => s.code === f.code))
      return `The code "${f.code}" is already used by another subject.`;
  }
  if (
    existing.some(
      (s) => s.id !== f.id && s.name.trim().toLowerCase() === f.name.trim().toLowerCase(),
    )
  ) {
    return "A subject with this name already exists.";
  }
  if (f.is_life_orientation && existing.some((s) => s.id !== f.id && s.is_life_orientation)) {
    return "Only one subject can be Life Orientation.";
  }
  return null;
}

function SubjectsAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState<string | null>(null);

  // A validation message is stale once the form changes.
  useEffect(() => setError(null), [form]);

  const list = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, code, name, is_language, is_life_orientation")
        .order("name");
      if (error) throw error;
      return data as Subject[];
    },
  });

  const usage = useQuery({
    queryKey: ["admin", "subject-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_requirements").select("subject_id");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const r of data)
        if (r.subject_id) counts.set(r.subject_id, (counts.get(r.subject_id) ?? 0) + 1);
      return counts;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data ?? []).filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.code.includes(q),
    );
  }, [list.data, search]);

  const save = useMutation({
    mutationFn: async () => {
      const problem = validate(form, list.data ?? []);
      if (problem) throw new Error(problem);
      const row = {
        name: form.name.trim(),
        is_language: form.is_language,
        is_life_orientation: form.is_life_orientation,
      };
      const { error } = form.id
        ? await supabase.from("subjects").update(row).eq("id", form.id)
        : await supabase.from("subjects").insert({ ...row, code: form.code });
      if (error) {
        throw new Error(
          /duplicate key|unique/i.test(error.message)
            ? `The code "${form.code}" is already used by another subject.`
            : friendlyDbError(error.message),
        );
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Subject updated" : "Subject added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subjects").delete().eq("id", form.id!);
      if (error) {
        throw new Error(
          /foreign key/i.test(error.message)
            ? "Courses still list this subject as a requirement. Remove it from those courses first."
            : friendlyDbError(error.message),
        );
      }
    },
    onSuccess: () => {
      toast.success("Subject deleted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const openEditor = (s?: Subject) => {
    setForm(
      s
        ? {
            id: s.id,
            name: s.name,
            code: s.code,
            codeTouched: true,
            is_language: s.is_language,
            is_life_orientation: s.is_life_orientation,
          }
        : empty,
    );
    setError(null);
    setOpen(true);
  };

  const usedBy = form.id ? (usage.data?.get(form.id) ?? 0) : 0;

  return (
    <div>
      <AdminPageHeader
        title="NSC subjects"
        description="The subjects learners can pick in the Grade 12 form and that courses can require. New subjects appear for learners straight away."
        actionLabel="Add subject"
        onAction={() => openEditor()}
      />

      <div className="mb-4 max-w-sm">
        <SearchBox value={search} onChange={setSearch} placeholder="Search subjects or codes" />
      </div>

      {list.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : list.error ? (
        <p className="text-sm text-destructive">{friendlyDbError((list.error as Error).message)}</p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search
            ? "No subjects match your search."
            : "No subjects yet. Run the seed_nsc_subjects migration in Supabase to load the official list, or add subjects here."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Code</th>
                <th className="px-4 py-3 font-medium">Used by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openEditor(s)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.is_language && "Language", s.is_life_orientation && "Life Orientation"]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">
                    {s.code}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {usage.data?.get(s.id)
                      ? `${usage.data.get(s.id)} course requirement${usage.data.get(s.id) === 1 ? "" : "s"}`
                      : "—"}
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
        title={form.id ? `Edit ${form.name || "subject"}` : "Add NSC subject"}
        description="Use the subject's official name from the NSC certificate."
        onSave={() => {
          setError(null);
          save.mutate();
        }}
        saving={save.isPending || remove.isPending}
        error={error}
        onDelete={form.id && form.code !== "life_orientation" ? () => remove.mutate() : undefined}
        deleteWarning={
          usedBy > 0
            ? `${usedBy} course requirement${usedBy === 1 ? " uses" : "s use"} this subject, so it can't be deleted until you remove ${usedBy === 1 ? "it" : "them"}.`
            : "Learners will no longer be able to pick this subject. This can't be undone."
        }
      >
        <Section title="Subject">
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => {
                  const code = f.id || f.codeTouched ? f.code : suggestCode(name);
                  return {
                    ...f,
                    name,
                    code,
                    is_language: f.id ? f.is_language : /_(hl|fal|sal)$/.test(code),
                  };
                });
              }}
              placeholder="e.g. isiXhosa Home Language"
              className={inputClass}
            />
          </Field>

          {form.id ? (
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Code</span>
              <p className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" /> {form.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Codes can't change once created: course requirements and learners' saved results
                refer to them.
              </p>
            </div>
          ) : (
            <Field
              label="Code"
              required
              hint="Lowercase letters, numbers and underscores. Languages end in _hl (Home Language) or _fal (First Additional). Can't be changed later."
            >
              <input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                    codeTouched: true,
                  }))
                }
                className={`${inputClass} font-mono`}
              />
            </Field>
          )}

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_language}
              onChange={(e) => setForm((f) => ({ ...f, is_language: e.target.checked }))}
              className="h-4 w-4 accent-[#1D9E75]"
            />
            This is a language subject
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_life_orientation}
              disabled={!!form.id && form.code === "life_orientation"}
              onChange={(e) => setForm((f) => ({ ...f, is_life_orientation: e.target.checked }))}
              className="h-4 w-4 accent-[#1D9E75]"
            />
            This is Life Orientation (counted differently in APS)
          </label>
        </Section>
      </EditorSheet>
    </div>
  );
}
