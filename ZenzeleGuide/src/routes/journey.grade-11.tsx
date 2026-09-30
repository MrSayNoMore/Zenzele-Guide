import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Loader2, Plus, Target, TrendingUp, X, Zap } from "lucide-react";
import { DirectoryShell, EmptyNotice, Pill } from "@/components/site/directory";
import { useSubjectOptions, type SubjectOption } from "@/hooks/use-subjects";
import { previewGrade11 } from "@/lib/journey.functions";
import { describeApsMethod, improvementSteps } from "@/lib/grade11";

export const Route = createFileRoute("/journey/grade-11")({
  head: () => ({
    meta: [
      { title: "Grade 11 APS planner — Zenzele Guide" },
      {
        name: "description",
        content:
          "Enter your Grade 11 marks to see your APS today, the programmes within reach, and exactly which marks to lift before matric.",
      },
    ],
  }),
  component: Grade11Page,
});

const FALLBACK: SubjectOption[] = [
  { code: "english_hl", label: "English Home Language" },
  { code: "english_fal", label: "English First Additional Language" },
  { code: "isizulu_hl", label: "isiZulu Home Language" },
  { code: "afrikaans_fal", label: "Afrikaans First Additional Language" },
  { code: "mathematics", label: "Mathematics" },
  { code: "mathematical_literacy", label: "Mathematical Literacy" },
  { code: "physical_sciences", label: "Physical Sciences" },
  { code: "life_sciences", label: "Life Sciences" },
  { code: "geography", label: "Geography" },
  { code: "history", label: "History" },
  { code: "accounting", label: "Accounting" },
  { code: "business_studies", label: "Business Studies" },
  { code: "life_orientation", label: "Life Orientation" },
];

type Row = { code: string; mark: string };
const START: Row[] = [
  { code: "", mark: "" },
  { code: "", mark: "" },
  { code: "mathematics", mark: "" },
  { code: "life_orientation", mark: "" },
  { code: "", mark: "" },
  { code: "", mark: "" },
  { code: "", mark: "" },
];

function Grade11Page() {
  const options = useSubjectOptions(FALLBACK);
  const nameOf = useMemo(() => {
    const m = new Map(options.map((o) => [o.code, o.label]));
    return (code: string) => m.get(code) ?? code.replace(/_/g, " ");
  }, [options]);
  const [rows, setRows] = useState<Row[]>(START);
  const [formError, setFormError] = useState<string | null>(null);

  const run = useMutation({
    mutationFn: async () => {
      const filled = rows.filter((r) => r.code || r.mark);
      if (filled.some((r) => !r.code)) throw new Error("Choose a subject for every mark.");
      if (filled.some((r) => r.mark === "" || Number(r.mark) > 100))
        throw new Error("Enter every mark as a percentage from 0 to 100.");
      const codes = filled.map((r) => r.code);
      if (new Set(codes).size !== codes.length)
        throw new Error("Each subject can only be added once.");
      if (filled.length < 7)
        throw new Error("Add at least 7 subjects, including Life Orientation.");
      const subjects = filled.map((r) => ({ code: r.code, percentage: Number(r.mark) }));
      return previewGrade11({ data: { subjects } });
    },
    onMutate: () => setFormError(null),
    onError: (e: Error) => setFormError(e.message),
  });
  const result = run.data;

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <DirectoryShell
      eyebrow="Grade 11"
      title="Your APS today, and how to lift it"
      description="Enter your latest Grade 11 marks. We'll show your APS now, the programmes already within reach, and exactly which marks to work on before matric. Nothing is saved."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <form
          className="min-w-0 space-y-4 self-start rounded-lg border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            run.mutate();
          }}
        >
          <h2 className="font-sans text-base font-semibold">Your marks</h2>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-center gap-2"
              >
                <select
                  value={r.code}
                  onChange={(e) => setRow(i, { code: e.target.value })}
                  aria-label={`Subject ${i + 1}`}
                  className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Choose subject…</option>
                  {options.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <label className="relative">
                  <span className="sr-only">Mark for subject {i + 1}</span>
                  <input
                    inputMode="numeric"
                    value={r.mark}
                    onChange={(e) =>
                      setRow(i, { mark: e.target.value.replace(/[^\d]/g, "").slice(0, 3) })
                    }
                    placeholder="%"
                    className="h-10 w-full rounded-md border border-input bg-background px-2 pr-6 text-sm"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </label>
                <button
                  type="button"
                  disabled={rows.length <= 7}
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:invisible"
                  aria-label="Remove subject"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {rows.length < 9 && (
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, { code: "", mark: "" }])}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Plus className="h-4 w-4" /> Add a subject
            </button>
          )}
          {formError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={run.isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {run.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            Show my plan
          </button>
        </form>

        <div className="space-y-6" aria-live="polite">
          {!result ? (
            <EmptyNotice title="Your plan will appear here.">
              Use your latest report card. You can come back each term to see your progress.
            </EmptyNotice>
          ) : (
            <>
              <section className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">Your APS today</p>
                <p className="mt-1 text-4xl font-semibold text-[var(--brand-umhlaba)]">
                  {result.totalAps}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {describeApsMethod(result.method)} Each university has its own formula; in Grade
                  12 the matcher applies them.
                </p>
              </section>

              <section>
                <h2 className="flex items-center gap-2 font-sans text-lg font-semibold">
                  <Zap className="h-5 w-5 text-primary" /> Quickest points to win
                </h2>
                {result.quickWins.length ? (
                  <ul className="mt-3 space-y-2">
                    {result.quickWins.slice(0, 5).map((w) => (
                      <li
                        key={w.code}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                      >
                        <span>
                          <span className="font-medium">{nameOf(w.code)}</span>: {w.percentage}% →{" "}
                          {w.targetPercentage}% reaches level {w.nextLevel}
                        </span>
                        <Pill tone="green">+{w.gain} APS</Pill>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    None of your counted subjects is within 10% of the next level. Pick the subject
                    you enjoy most and aim for the next level there.
                  </p>
                )}
              </section>

              {result.totalCourses === 0 ? (
                <EmptyNotice title="We're still adding verified university programmes.">
                  Your APS above is ready now. Programme matches will appear here as we add them.
                </EmptyNotice>
              ) : (
                <>
                  <section>
                    <h2 className="flex items-center gap-2 font-sans text-lg font-semibold">
                      <Target className="h-5 w-5 text-primary" /> Within reach
                    </h2>
                    {result.borderline.length ? (
                      <ul className="mt-3 space-y-3">
                        {result.borderline.map((m) => {
                          const steps = improvementSteps(m.reasons, nameOf, result.conversion);
                          return (
                            <li
                              key={m.course_id}
                              className="rounded-lg border border-border bg-card p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{m.course_name}</p>
                                  <CourseUniversity
                                    name={m.university_name}
                                    slug={m.university_slug}
                                  />
                                </div>
                                <Pill tone="amber">APS {m.min_aps}</Pill>
                              </div>
                              {steps.length > 0 && (
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                                  {steps.map((s) => (
                                    <li key={s}>{s}</li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No programmes are just out of reach right now.
                      </p>
                    )}
                  </section>

                  <section>
                    <h2 className="font-sans text-lg font-semibold">
                      Already on track ({result.counts.qualifies})
                    </h2>
                    {result.qualifies.length ? (
                      <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
                        {result.qualifies.map((m) => (
                          <li
                            key={m.course_id}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div>
                              <p className="font-medium">{m.course_name}</p>
                              <CourseUniversity name={m.university_name} slug={m.university_slug} />
                            </div>
                            <span className="flex items-center gap-2">
                              {m.requires_nbt && <Pill>NBT</Pill>}
                              <Pill tone="green">APS {m.min_aps}</Pill>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Not yet. Work on the steps above and check again next term.
                      </p>
                    )}
                  </section>
                </>
              )}

              <section className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
                <p className="font-medium">Plan ahead</p>
                <ul className="mt-2 space-y-1.5">
                  <NextLink to="/careers">Explore careers and the subjects they need</NextLink>
                  <NextLink to="/bursaries">Find bursaries to apply for in Grade 12</NextLink>
                  <NextLink to="/journey/nsfas">Check whether NSFAS could fund you</NextLink>
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </DirectoryShell>
  );
}

function CourseUniversity({ name, slug }: { name?: string; slug: string | null }) {
  if (!name) return null;
  return slug ? (
    <Link
      to="/universities/$slug"
      params={{ slug }}
      className="text-sm text-muted-foreground hover:text-primary"
    >
      {name}
    </Link>
  ) : (
    <p className="text-sm text-muted-foreground">{name}</p>
  );
}

function NextLink({
  to,
  children,
}: {
  to: "/careers" | "/bursaries" | "/journey/nsfas";
  children: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
      >
        {children} <ArrowRight className="h-4 w-4" />
      </Link>
    </li>
  );
}
