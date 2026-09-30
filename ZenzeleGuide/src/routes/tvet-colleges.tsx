import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, MapPin, Wrench } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  FilterSelect,
  LoadError,
  Pill,
  ResultCount,
  SearchInput,
} from "@/components/site/directory";
import { listTvetColleges, matchesSearch } from "@/lib/directory";
import { labelFor, PROVINCES } from "@/lib/admin-options";

export const Route = createFileRoute("/tvet-colleges")({
  head: () => ({
    meta: [
      { title: "TVET colleges in South Africa — Zenzele Guide" },
      {
        name: "description",
        content:
          "Browse public TVET colleges and their NC(V), NATED and occupational programmes, with entry requirements from official sources.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { colleges: await listTvetColleges(), failed: false };
    } catch (e) {
      console.error("Failed to load TVET colleges", e);
      return { colleges: [], failed: true };
    }
  },
  component: TvetCollegesPage,
});

function TvetCollegesPage() {
  const { colleges, failed } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");

  const shown = useMemo(
    () =>
      colleges.filter(
        (c) => matchesSearch(query, c.name) && (!province || c.province === province),
      ),
    [colleges, query, province],
  );

  return (
    <DirectoryShell
      eyebrow="TVET colleges"
      title="TVET colleges in South Africa"
      description="Practical, job-focused programmes at public TVET colleges: NC(V), NATED (N1–N6) and occupational qualifications. Many accept learners from Grade 9, and NSFAS can fund them."
      actions={
        <Link
          to="/journey/tvet"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Find programmes that fit me <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {failed ? (
        <LoadError />
      ) : colleges.length === 0 ? (
        <EmptyNotice title="We're adding verified TVET colleges.">
          Every college is checked against its official information before it appears here. Please
          check back soon.
        </EmptyNotice>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={query} onChange={setQuery} placeholder="Search TVET colleges" />
            <FilterSelect
              label="All provinces"
              value={province}
              onChange={setProvince}
              options={PROVINCES}
            />
          </div>
          <ResultCount shown={shown.length} total={colleges.length} noun="colleges" />
          {shown.length === 0 ? (
            <EmptyNotice title="No colleges match your search." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/tvet-colleges/$slug"
                    params={{ slug: c.slug }}
                    className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(8,60,48,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Wrench className="h-5 w-5" />
                    </span>
                    <span className="mt-4 font-sans text-base font-semibold text-foreground">
                      {c.name}
                    </span>
                    {c.province && (
                      <span className="mt-3">
                        <Pill>
                          <MapPin className="mr-1 h-3 w-3" />
                          {labelFor(PROVINCES, c.province)}
                        </Pill>
                      </span>
                    )}
                    <span className="mt-auto flex items-center justify-between pt-5 text-sm">
                      <span className="text-muted-foreground">
                        {c.programCount
                          ? `${c.programCount} programme${c.programCount === 1 ? "" : "s"} listed`
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
