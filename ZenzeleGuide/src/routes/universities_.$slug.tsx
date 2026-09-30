import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  ExternalButton,
  Pill,
  SearchInput,
  SourceNote,
} from "@/components/site/directory";
import { SaveToggle } from "@/components/site/save-toggle";
import { getUniversity, matchesSearch } from "@/lib/directory";
import { FIELDS_OF_STUDY, labelFor, PROVINCES, UNI_TYPES } from "@/lib/admin-options";
import { levelRange } from "@/lib/nsc";

export const Route = createFileRoute("/universities_/$slug")({
  loader: async ({ params }) => {
    const university = await getUniversity(params.slug);
    if (!university) throw notFound();
    return { university };
  },
  head: ({ loaderData }) => {
    const u = loaderData?.university;
    return {
      meta: u
        ? [
            { title: `${u.name}: programmes and entry requirements — Zenzele Guide` },
            {
              name: "description",
              content: `Undergraduate programmes at ${u.name} with minimum APS and NSC subject requirements from the official prospectus.`,
            },
          ]
        : [{ title: "University not found — Zenzele Guide" }],
    };
  },
  notFoundComponent: () => (
    <DirectoryShell
      eyebrow="Universities"
      title="We couldn't find that university"
      back={{ to: "/universities", label: "All universities" }}
    >
      <EmptyNotice title="It may not be published yet." />
    </DirectoryShell>
  ),
  component: UniversityPage,
});

function UniversityPage() {
  const { university: u } = Route.useLoaderData();
  const [query, setQuery] = useState("");

  const faculties = useMemo(
    () =>
      [...(u.faculties ?? [])]
        .map((f) => ({
          ...f,
          courses: [...(f.courses ?? [])]
            .filter((c) => matchesSearch(query, c.name, f.name, c.qualification_type))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((f) => f.courses.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [u, query],
  );
  const total = (u.faculties ?? []).reduce((n, f) => n + (f.courses?.length ?? 0), 0);

  return (
    <DirectoryShell
      eyebrow="University"
      title={u.name}
      back={{ to: "/universities", label: "All universities" }}
      description={
        <>
          <span className="flex flex-wrap gap-2">
            {u.province && (
              <Pill>
                <MapPin className="mr-1 h-3 w-3" />
                {labelFor(PROVINCES, u.province)}
              </Pill>
            )}
            {u.uni_type && <Pill>{labelFor(UNI_TYPES, u.uni_type)}</Pill>}
          </span>
          {u.description && <p className="mt-4">{u.description}</p>}
          <div className="mt-4">
            <SourceNote sourceUrl={u.source_url} verifiedAt={u.last_verified_at} />
          </div>
        </>
      }
      actions={
        <>
          <Link
            to="/journey/grade-12"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
          >
            Check where I qualify <ArrowRight className="h-4 w-4" />
          </Link>
          {u.website_url && (
            <ExternalButton href={u.website_url}>University website</ExternalButton>
          )}
        </>
      }
    >
      {total === 0 ? (
        <EmptyNotice title="We're still adding this university's programmes.">
          Each programme is checked against the official prospectus before it's listed.
        </EmptyNotice>
      ) : (
        <div className="space-y-6">
          <div className="max-w-md">
            <SearchInput value={query} onChange={setQuery} placeholder="Search programmes" />
          </div>
          {faculties.length === 0 ? (
            <EmptyNotice title="No programmes match your search." />
          ) : (
            faculties.map((f) => (
              <section key={f.id}>
                <h2 className="mb-3 font-sans text-lg font-semibold">{f.name}</h2>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {f.courses.map((c) => {
                    const reqs = (c.course_requirements ?? []).filter(
                      (r) => r.is_required && r.subjects,
                    );
                    return (
                      <li key={c.id} className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-foreground">{c.name}</h3>
                            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              {c.qualification_type && <span>{c.qualification_type}</span>}
                              {c.duration_years && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {c.duration_years} year{c.duration_years === 1 ? "" : "s"}
                                </span>
                              )}
                              {c.field_of_study && (
                                <span>{labelFor(FIELDS_OF_STUDY, c.field_of_study)}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {c.min_aps != null && (
                              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-[var(--brand-umhlaba)]">
                                APS {c.min_aps}
                              </span>
                            )}
                            <SaveToggle
                              kind="course"
                              refId={c.id}
                              returnTo={`/universities/${u.slug}`}
                            />
                          </div>
                        </div>
                        {(reqs.length > 0 || c.requires_nbt) && (
                          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                            {reqs.map((r, i) => (
                              <li
                                key={i}
                                className="rounded-md border border-border px-2 py-1 text-foreground"
                                title={r.notes ?? undefined}
                              >
                                {r.subjects!.name}: level {r.min_level}
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({levelRange(r.min_level)})
                                </span>
                              </li>
                            ))}
                            {c.requires_nbt && (
                              <li className="rounded-md border border-border px-2 py-1">
                                NBT required
                              </li>
                            )}
                          </ul>
                        )}
                        {c.source_url && c.source_url !== u.source_url && (
                          <div className="mt-3">
                            <SourceNote sourceUrl={c.source_url} verifiedAt={c.last_verified_at} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
          <p className="text-xs text-muted-foreground">
            Meeting the minimum doesn't guarantee a place. Universities may also look at your
            ranking, other subjects and the National Benchmark Tests. Always confirm with the
            university before you apply.
          </p>
        </div>
      )}
    </DirectoryShell>
  );
}
