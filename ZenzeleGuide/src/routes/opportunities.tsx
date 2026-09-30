import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  FilterSelect,
  LoadError,
  ResultCount,
  SearchInput,
} from "@/components/site/directory";
import { OpportunityCard } from "@/components/site/opportunity-card";
import { matchesSearch } from "@/lib/directory";
import {
  OPPORTUNITY_KINDS,
  isOpen,
  listOpportunities,
  opportunityStatus,
  sortByStatus,
} from "@/lib/opportunities";
import { FIELDS_OF_STUDY, PROVINCES } from "@/lib/admin-options";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Learnerships, internships and graduate programmes — Zenzele Guide" },
      {
        name: "description",
        content:
          "Verified learnerships, apprenticeships, internships, graduate programmes and short courses in South Africa, with who can apply, the stipend and when applications close.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { opportunities: await listOpportunities(), failed: false };
    } catch (e) {
      console.error("Failed to load opportunities", e);
      return { opportunities: [], failed: true };
    }
  },
  component: OpportunitiesPage,
});

const KIND_FILTERS = OPPORTUNITY_KINDS.map((k) => ({ value: k.value, label: k.plural }));
const STATUS_FILTERS = [
  { value: "open", label: "Open now" },
  { value: "upcoming", label: "Opening soon" },
] as const;

function OpportunitiesPage() {
  const { opportunities, failed } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [field, setField] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(
    () => sortByStatus(opportunities.map((o) => ({ ...o, status: opportunityStatus(o) }))),
    [opportunities],
  );
  const shown = rows.filter(
    (o) =>
      matchesSearch(query, o.title, o.organisation) &&
      (!kind || o.kind === kind) &&
      (!field || !o.field_of_study || o.field_of_study === field) &&
      (!province || !o.provinces.length || o.provinces.includes(province)) &&
      (!status || (status === "open" ? isOpen(o.status) : o.status.kind === status)),
  );

  return (
    <DirectoryShell
      eyebrow="Opportunities"
      title="Learnerships, internships and graduate programmes"
      description="Earn while you learn. Every opportunity here is checked against the company's official advert. Open ones are listed first, closing soonest at the top."
      actions={
        <>
          <Link
            to="/journey/learnership"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Find learnerships for me <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/journey/graduate"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            I'm a graduate
          </Link>
        </>
      }
    >
      {failed ? (
        <LoadError />
      ) : opportunities.length === 0 ? (
        <EmptyNotice title="We're adding verified opportunities.">
          Every learnership and programme is checked against the company's official advert before
          it appears here. Please check back soon.
        </EmptyNotice>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by name or company" />
            <FilterSelect label="All types" value={kind} onChange={setKind} options={KIND_FILTERS} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <FilterSelect
              label="All fields"
              value={field}
              onChange={setField}
              options={FIELDS_OF_STUDY}
            />
            <FilterSelect
              label="All provinces"
              value={province}
              onChange={setProvince}
              options={PROVINCES}
            />
            <FilterSelect
              label="Any status"
              value={status}
              onChange={setStatus}
              options={STATUS_FILTERS}
            />
          </div>
          <ResultCount shown={shown.length} total={rows.length} noun="opportunities" />
          {shown.length === 0 ? (
            <EmptyNotice title="Nothing matches your search." />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((o) => (
                <li key={o.id}>
                  <OpportunityCard o={o} status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DirectoryShell>
  );
}
