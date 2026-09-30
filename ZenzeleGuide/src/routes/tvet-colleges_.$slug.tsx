import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  ExternalButton,
  FilterSelect,
  Pill,
  SearchInput,
  SourceNote,
} from "@/components/site/directory";
import { SaveToggle } from "@/components/site/save-toggle";
import { getTvetCollege, matchesSearch } from "@/lib/directory";
import { FIELDS_OF_STUDY, labelFor, PROVINCES, TVET_PROGRAM_TYPES } from "@/lib/admin-options";

export const Route = createFileRoute("/tvet-colleges_/$slug")({
  loader: async ({ params }) => {
    const college = await getTvetCollege(params.slug);
    if (!college) throw notFound();
    return { college };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.college;
    return {
      meta: c
        ? [
            { title: `${c.name}: programmes and entry requirements — Zenzele Guide` },
            {
              name: "description",
              content: `Programmes at ${c.name}, with the minimum grade and NQF level for each, from official sources.`,
            },
          ]
        : [{ title: "College not found — Zenzele Guide" }],
    };
  },
  notFoundComponent: () => (
    <DirectoryShell
      eyebrow="TVET colleges"
      title="We couldn't find that college"
      back={{ to: "/tvet-colleges", label: "All TVET colleges" }}
    >
      <EmptyNotice title="It may not be published yet." />
    </DirectoryShell>
  ),
  component: TvetCollegePage,
});

function TvetCollegePage() {
  const { college: c } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const all = useMemo(() => c.tvet_programs ?? [], [c]);

  const programs = useMemo(
    () =>
      all
        .filter(
          (p) => matchesSearch(query, p.name, p.description) && (!type || p.program_type === type),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [all, query, type],
  );

  return (
    <DirectoryShell
      eyebrow="TVET college"
      title={c.name}
      back={{ to: "/tvet-colleges", label: "All TVET colleges" }}
      description={
        <>
          {c.province && (
            <Pill>
              <MapPin className="mr-1 h-3 w-3" />
              {labelFor(PROVINCES, c.province)}
            </Pill>
          )}
          {c.description && <p className="mt-4">{c.description}</p>}
          <div className="mt-4">
            <SourceNote sourceUrl={c.source_url} verifiedAt={c.last_verified_at} />
          </div>
        </>
      }
      actions={
        <>
          <Link
            to="/journey/tvet"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
          >
            Find programmes that fit me <ArrowRight className="h-4 w-4" />
          </Link>
          {c.website_url && <ExternalButton href={c.website_url}>College website</ExternalButton>}
        </>
      }
    >
      {all.length === 0 ? (
        <EmptyNotice title="We're still adding this college's programmes.">
          Each programme is checked against official information before it's listed.
        </EmptyNotice>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={query} onChange={setQuery} placeholder="Search programmes" />
            <FilterSelect
              label="All programme types"
              value={type}
              onChange={setType}
              options={TVET_PROGRAM_TYPES}
            />
          </div>
          {programs.length === 0 ? (
            <EmptyNotice title="No programmes match your search." />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {programs.map((p) => (
                <li key={p.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium text-foreground">{p.name}</h2>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{labelFor(TVET_PROGRAM_TYPES, p.program_type)}</span>
                        {p.nqf_level && <span>NQF level {p.nqf_level}</span>}
                        {p.duration_years && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {p.duration_years} year{p.duration_years === 1 ? "" : "s"}
                          </span>
                        )}
                        {p.field_of_study && (
                          <span>{labelFor(FIELDS_OF_STUDY, p.field_of_study)}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {p.min_grade && (
                        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-[var(--brand-umhlaba)]">
                          From Grade {p.min_grade}
                        </span>
                      )}
                      <SaveToggle
                        kind="tvet_program"
                        refId={p.id}
                        returnTo={`/tvet-colleges/${c.slug}`}
                      />
                    </div>
                  </div>
                  {p.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                  )}
                  {p.source_url && p.source_url !== c.source_url && (
                    <div className="mt-3">
                      <SourceNote sourceUrl={p.source_url} verifiedAt={p.last_verified_at} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Intakes, fees and requirements can change. Always confirm with the college before you
            apply.
          </p>
        </div>
      )}
    </DirectoryShell>
  );
}
