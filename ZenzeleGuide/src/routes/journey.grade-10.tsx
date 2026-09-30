import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Check } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  LoadError,
  Pill,
  SearchInput,
} from "@/components/site/directory";
import {
  combineCareerSubjects,
  listCareersWithSubjects,
  mathematicsStats,
  matchesSearch,
} from "@/lib/directory";
import { FIELDS_OF_STUDY, labelFor } from "@/lib/admin-options";
import { levelRange } from "@/lib/nsc";

export const Route = createFileRoute("/journey/grade-10")({
  head: () => ({
    meta: [
      { title: "Grade 10 subject choice — Zenzele Guide" },
      {
        name: "description",
        content:
          "Choosing your Grade 10 subjects? Pick the careers you're curious about and see which subjects keep those doors open.",
      },
    ],
  }),
  loader: async () => {
    try {
      const [careers, maths] = await Promise.all([listCareersWithSubjects(), mathematicsStats()]);
      return { careers, maths, failed: false };
    } catch (e) {
      console.error("Failed to load careers", e);
      return { careers: [], maths: { totalCourses: 0, needMaths: 0 }, failed: true };
    }
  },
  component: Grade10Page,
});

const MAX_PICKS = 3;

function Grade10Page() {
  const { careers, maths, failed } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const chosen = careers.filter((c) => picked.includes(c.id));
  const advice = useMemo(() => combineCareerSubjects(chosen), [chosen]);
  const shown = careers.filter((c) => matchesSearch(query, c.name));
  const toggle = (id: string) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX_PICKS ? [...p, id] : p,
    );
  const mathsNeeded = advice.some((a) => a.code === "mathematics");

  return (
    <DirectoryShell
      eyebrow="Grade 10"
      title="Choose subjects that keep your doors open"
      description="Pick up to three careers you're curious about. We'll show the subjects those careers need, so the choice you make now doesn't close a door later."
    >
      {failed ? (
        <LoadError />
      ) : careers.length === 0 ? (
        <EmptyNotice title="We're writing our first career guides.">
          Once they're published, you'll be able to pick careers here and see the subjects they
          need. Until then, talk to your Life Orientation teacher, and remember: pure Mathematics
          keeps the most university doors open.
        </EmptyNotice>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <section className="space-y-4">
            <h2 className="font-sans text-base font-semibold">
              1. Pick careers ({picked.length}/{MAX_PICKS})
            </h2>
            <SearchInput value={query} onChange={setQuery} placeholder="Search careers" />
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {shown.map((c) => {
                const on = picked.includes(c.id);
                const full = !on && picked.length >= MAX_PICKS;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      disabled={full}
                      aria-pressed={on}
                      className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition disabled:opacity-50 ${on ? "border-primary bg-primary/5 font-medium" : "border-border bg-card hover:bg-muted"}`}
                    >
                      <span>
                        {c.name}
                        {c.field_of_study && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {labelFor(FIELDS_OF_STUDY, c.field_of_study)}
                          </span>
                        )}
                      </span>
                      {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-4" aria-live="polite">
            <h2 className="font-sans text-base font-semibold">2. Subjects to choose</h2>
            {chosen.length === 0 ? (
              <EmptyNotice title="Pick a career to see its subjects." />
            ) : advice.length === 0 ? (
              <EmptyNotice title="We haven't listed subjects for these careers yet." />
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {advice.map((a) => (
                  <li key={a.code} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-medium">
                        <BookOpen className="h-4 w-4 text-primary" /> {a.name}
                      </span>
                      {a.essential ? <Pill tone="amber">Essential</Pill> : <Pill>Helpful</Pill>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.level != null && `Aim for level ${a.level}+ (${levelRange(a.level)}). `}
                      For: {a.careers.join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {chosen.length > 0 && mathsNeeded && (
              <p className="flex gap-2 rounded-lg border border-accent bg-accent/20 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Choose <strong>Mathematics</strong>, not Mathematical Literacy. Maths Literacy
                  can't be swapped in later for careers that need Mathematics.
                </span>
              </p>
            )}
            {maths.totalCourses > 0 && (
              <p className="text-sm text-muted-foreground">
                Of the {maths.totalCourses} university programmes we list, {maths.needMaths} need
                Mathematics.
              </p>
            )}

            {chosen.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
                <p className="font-medium">Read the full guides</p>
                <ul className="mt-2 space-y-1.5">
                  {chosen.map((c) => (
                    <li key={c.id}>
                      <Link
                        to="/careers/$slug"
                        params={{ slug: c.slug }}
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        {c.name} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Subject rules differ between schools and universities. Check with your school and the
              course you're aiming for.
            </p>
          </section>
        </div>
      )}
    </DirectoryShell>
  );
}
