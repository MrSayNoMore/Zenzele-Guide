import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, GraduationCap, MapPin } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  FilterSelect,
  LoadError,
  Pill,
  ResultCount,
  SearchInput,
} from "@/components/site/directory";
import { listUniversities, matchesSearch } from "@/lib/directory";
import { labelFor, PROVINCES, UNI_TYPES } from "@/lib/admin-options";

export const Route = createFileRoute("/universities")({
  head: () => ({
    meta: [
      { title: "South African universities — Zenzele Guide" },
      {
        name: "description",
        content:
          "Browse South African universities and their undergraduate programmes, with minimum APS and subject requirements taken from official prospectuses.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { universities: await listUniversities(), failed: false };
    } catch (e) {
      console.error("Failed to load universities", e);
      return { universities: [], failed: true };
    }
  },
  component: UniversitiesPage,
});

function UniversitiesPage() {
  const { universities, failed } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [type, setType] = useState("");

  const shown = useMemo(
    () =>
      universities.filter(
        (u) =>
          matchesSearch(query, u.name, u.short_name) &&
          (!province || u.province === province) &&
          (!type || u.uni_type === type),
      ),
    [universities, query, province, type],
  );

  return (
    <DirectoryShell
      eyebrow="Universities"
      title="Universities in South Africa"
      description="Programmes, minimum APS and subject requirements, taken from each university's official prospectus. Want to know where you qualify? Enter your marks and we'll check them against each university's own rules."
      actions={
        <Link
          to="/journey/grade-12"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Check where I qualify <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {failed ? (
        <LoadError />
      ) : universities.length === 0 ? (
        <EmptyNotice title="We're adding verified universities.">
          Every university is checked against its official prospectus before it appears here. Please
          check back soon.
        </EmptyNotice>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={query} onChange={setQuery} placeholder="Search universities" />
            <FilterSelect
              label="All provinces"
              value={province}
              onChange={setProvince}
              options={PROVINCES}
            />
            <FilterSelect label="All types" value={type} onChange={setType} options={UNI_TYPES} />
          </div>
          <ResultCount shown={shown.length} total={universities.length} noun="universities" />
          {shown.length === 0 ? (
            <EmptyNotice title="No universities match your search." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((u) => (
                <li key={u.id}>
                  <Link
                    to="/universities/$slug"
                    params={{ slug: u.slug }}
                    className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(8,60,48,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="mt-4 font-sans text-base font-semibold text-foreground">
                      {u.name}
                    </span>
                    {u.short_name && u.short_name !== u.name && (
                      <span className="text-sm text-muted-foreground">{u.short_name}</span>
                    )}
                    <span className="mt-3 flex flex-wrap gap-2">
                      {u.province && (
                        <Pill>
                          <MapPin className="mr-1 h-3 w-3" />
                          {labelFor(PROVINCES, u.province)}
                        </Pill>
                      )}
                      {u.uni_type && <Pill>{labelFor(UNI_TYPES, u.uni_type)}</Pill>}
                    </span>
                    <span className="mt-auto flex items-center justify-between pt-5 text-sm">
                      <span className="text-muted-foreground">
                        {u.courseCount
                          ? `${u.courseCount} programme${u.courseCount === 1 ? "" : "s"} listed`
                          : "Programmes coming soon"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DirectoryShell>
  );
}
