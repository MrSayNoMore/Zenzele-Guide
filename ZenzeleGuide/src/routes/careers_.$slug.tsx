import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Check, GraduationCap, Wallet, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { DirectoryShell, EmptyNotice, Pill, SourceNote } from "@/components/site/directory";
import { bursaryStatus, getCareer, statusLabel, statusTone } from "@/lib/directory";
import { FIELDS_OF_STUDY, labelFor } from "@/lib/admin-options";
import { levelRange } from "@/lib/nsc";

export const Route = createFileRoute("/careers_/$slug")({
  loader: async ({ params }) => {
    const data = await getCareer(params.slug);
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const c = loaderData?.career;
    return {
      meta: c
        ? [
            { title: `${c.name}: career guide — Zenzele Guide` },
            {
              name: "description",
              content: `${c.name}: what the work involves, the school subjects you need, and the courses and bursaries that lead there.`,
            },
          ]
        : [{ title: "Career not found — Zenzele Guide" }],
    };
  },
  notFoundComponent: () => (
    <DirectoryShell
      eyebrow="Careers"
      title="We couldn't find that career"
      back={{ to: "/careers", label: "All careers" }}
    >
      <EmptyNotice title="It may not be published yet." />
    </DirectoryShell>
  ),
  component: CareerPage,
});

function CareerPage() {
  const { career: c, courses, programmes, bursaries } = Route.useLoaderData();
  const subjects = [...(c.career_subjects ?? [])]
    .filter((s) => s.subjects)
    .sort((a, b) => Number(b.is_essential) - Number(a.is_essential));
  const fieldLabel = c.field_of_study ? labelFor(FIELDS_OF_STUDY, c.field_of_study) : null;

  return (
    <DirectoryShell
      eyebrow="Career guide"
      title={c.name}
      back={{ to: "/careers", label: "All careers" }}
      description={
        <>
          {fieldLabel && <Pill>{fieldLabel}</Pill>}
          {c.description && <p className="mt-4 whitespace-pre-line">{c.description}</p>}
          <div className="mt-4">
            <SourceNote sourceUrl={c.source_url} verifiedAt={c.last_verified_at} />
          </div>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="flex items-center gap-2 font-sans text-lg font-semibold">
              <BookOpen className="h-5 w-5 text-primary" /> School subjects to choose
            </h2>
            {subjects.length ? (
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
                {subjects.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {s.subjects!.name}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {s.recommended_min_level && (
                        <span>
                          Level {s.recommended_min_level}+ ({levelRange(s.recommended_min_level)})
                        </span>
                      )}
                      {s.is_essential ? <Pill tone="amber">Essential</Pill> : <Pill>Helpful</Pill>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted-foreground">
                We haven't listed subjects for this career yet.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Each university and college sets its own requirements. Check the specific course
              before you choose your subjects.
            </p>
          </section>

          {c.typical_salary_range && (
            <section>
              <h2 className="font-sans text-lg font-semibold">What you could earn</h2>
              <p className="mt-2 text-foreground">{c.typical_salary_range}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Salaries vary by employer, city and experience. See the source above.
              </p>
            </section>
          )}
          {c.outlook && (
            <section>
              <h2 className="font-sans text-lg font-semibold">Job outlook</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{c.outlook}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Related
            icon={<GraduationCap className="h-4 w-4 text-primary" />}
            title="University programmes"
            empty={fieldLabel ? `No ${fieldLabel.toLowerCase()} programmes listed yet.` : null}
            more={{ to: "/universities", label: "Browse universities" }}
          >
            {courses.map((co) => {
              const uni = co.faculties?.universities;
              return (
                <li key={co.id} className="py-2.5">
                  {uni ? (
                    <Link
                      to="/universities/$slug"
                      params={{ slug: uni.slug }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {co.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{co.name}</span>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {uni?.name}
                    {co.min_aps != null && ` · APS ${co.min_aps}`}
                  </p>
                </li>
              );
            })}
          </Related>
          <Related
            icon={<Wrench className="h-4 w-4 text-primary" />}
            title="TVET programmes"
            empty={null}
            more={{ to: "/tvet-colleges", label: "Browse TVET colleges" }}
          >
            {programmes.map((p) => (
              <li key={p.id} className="py-2.5">
                {p.tvet_colleges ? (
                  <Link
                    to="/tvet-colleges/$slug"
                    params={{ slug: p.tvet_colleges.slug }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {p.name}
                  </Link>
                ) : (
                  <span className="font-medium">{p.name}</span>
                )}
                <p className="text-sm text-muted-foreground">
                  {p.tvet_colleges?.name}
                  {p.nqf_level && ` · NQF ${p.nqf_level}`}
                </p>
              </li>
            ))}
          </Related>
          <Related
            icon={<Wallet className="h-4 w-4 text-primary" />}
            title="Bursaries in this field"
            empty={fieldLabel ? `No ${fieldLabel.toLowerCase()} bursaries listed yet.` : null}
            more={{ to: "/bursaries", label: "Browse bursaries" }}
          >
            {bursaries.map((b) => {
              const s = bursaryStatus(b.bursary_cycles ?? []);
              return (
                <li key={b.id} className="py-2.5">
                  <Link
                    to="/bursaries/$slug"
                    params={{ slug: b.slug }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {b.name}
                  </Link>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {b.provider} <Pill tone={statusTone(s)}>{statusLabel(s)}</Pill>
                  </p>
                </li>
              );
            })}
          </Related>
        </aside>
      </div>
    </DirectoryShell>
  );
}

function Related({
  icon,
  title,
  empty,
  more,
  children,
}: {
  icon: ReactNode;
  title: string;
  empty: string | null;
  more: { to: "/universities" | "/tvet-colleges" | "/bursaries"; label: string };
  children: ReactNode[];
}) {
  if (!children.length && !empty) return null;
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
        {icon} {title}
      </h2>
      {children.length ? (
        <ul className="mt-2 divide-y divide-border">{children}</ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
      <Link
        to={more.to}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        {more.label} <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
