import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  FilterSelect,
  LoadError,
  Pill,
  ResultCount,
  SearchInput,
} from "@/components/site/directory";
import { listCareers, matchesSearch } from "@/lib/directory";
import { FIELDS_OF_STUDY, labelFor } from "@/lib/admin-options";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Career guides — Zenzele Guide" },
      {
        name: "description",
        content:
          "Pick a career and see what the job involves, the school subjects that lead there, and the courses and bursaries in that field.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { careers: await listCareers(), failed: false };
    } catch (e) {
      console.error("Failed to load careers", e);
      return { careers: [], failed: true };
    }
  },
  component: CareersPage,
});

function CareersPage() {
  const { careers, failed } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [field, setField] = useState("");

  const shown = useMemo(
    () =>
      careers.filter(
        (c) =>
          matchesSearch(query, c.name, c.description) && (!field || c.field_of_study === field),
      ),
    [careers, query, field],
  );

  return (
    <DirectoryShell
      eyebrow="Careers"
      title="Career guides"
      description="Start from the job you want and work backwards: the subjects to choose, the courses that lead there, and the bursaries that fund them."
    >
      {failed ? (
        <LoadError />
      ) : careers.length === 0 ? (
        <EmptyNotice title="We're writing our first career guides.">
          Each guide is checked against trusted sources before it appears here. Please check back
          soon.
        </EmptyNotice>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={query} onChange={setQuery} placeholder="Search careers" />
            <FilterSelect
              label="All fields"
              value={field}
              onChange={setField}
              options={FIELDS_OF_STUDY}
            />
          </div>
          <ResultCount shown={shown.length} total={careers.length} noun="careers" />
          {shown.length === 0 ? (
            <EmptyNotice title="No careers match your search." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/careers/$slug"
                    params={{ slug: c.slug }}
                    className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(8,60,48,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Compass className="h-5 w-5" />
                    </span>
                    <span className="mt-4 font-sans text-base font-semibold text-foreground">
                      {c.name}
                    </span>
                    {c.field_of_study && (
                      <span className="mt-2">
                        <Pill>{labelFor(FIELDS_OF_STUDY, c.field_of_study)}</Pill>
                      </span>
                    )}
                    {c.description && (
                      <span className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                        {c.description}
                      </span>
                    )}
                    <span className="mt-auto flex justify-end pt-4">
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
