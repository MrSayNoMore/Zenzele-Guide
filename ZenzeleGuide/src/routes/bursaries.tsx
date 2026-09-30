import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  FilterSelect,
  LoadError,
  Pill,
  ResultCount,
  SearchInput,
} from "@/components/site/directory";
import {
  bursaryStatus,
  listBursaries,
  matchesSearch,
  statusLabel,
  statusTone,
  type BursaryStatus,
} from "@/lib/directory";
import { FIELDS_OF_STUDY, labelFor } from "@/lib/admin-options";

export const Route = createFileRoute("/bursaries")({
  head: () => ({
    meta: [
      { title: "Bursaries for South African students — Zenzele Guide" },
      {
        name: "description",
        content:
          "Browse verified bursaries for South African learners and students, with who can apply, what they cover and when applications close.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { bursaries: await listBursaries(), failed: false };
    } catch (e) {
      console.error("Failed to load bursaries", e);
      return { bursaries: [], failed: true };
    }
  },
  component: BursariesPage,
});

// Open (closing soonest first), then upcoming, then unknown dates, then closed.
const ORDER: Record<BursaryStatus["kind"], number> = {
  open: 0,
  open_no_deadline: 1,
  upcoming: 2,
  unknown: 3,
  closed: 4,
};

const STATUS_FILTERS = [
  { value: "open", label: "Open now" },
  { value: "upcoming", label: "Opening soon" },
] as const;

function BursariesPage() {
  const { bursaries, failed } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [field, setField] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(
    () =>
      bursaries
        .map((b) => ({ ...b, status: bursaryStatus(b.bursary_cycles ?? []) }))
        .sort(
          (a, b) =>
            ORDER[a.status.kind] - ORDER[b.status.kind] ||
            (a.status.kind === "open" && b.status.kind === "open"
              ? a.status.daysLeft - b.status.daysLeft
              : a.name.localeCompare(b.name)),
        ),
    [bursaries],
  );
  const shown = rows.filter(
    (b) =>
      matchesSearch(query, b.name, b.provider, b.value_description) &&
      (!field || (b.fields_of_study ?? []).includes(field)) &&
      (!status ||
        (status === "open"
          ? b.status.kind === "open" || b.status.kind === "open_no_deadline"
          : b.status.kind === status)),
  );

  return (
    <DirectoryShell
      eyebrow="Bursaries"
      title="Bursaries for South African students"
      description="Every bursary here is checked against the provider's official information. Open ones are listed first, closing soonest at the top. To see which ones fit you, answer a few questions."
      actions={
        <Link
          to="/journey/bursary"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Find bursaries that fit me <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {failed ? (
        <LoadError />
      ) : bursaries.length === 0 ? (
        <EmptyNotice title="We're adding verified bursaries.">
          Every bursary is checked against the provider's official information before it appears
          here. Please check back soon.
        </EmptyNotice>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search bursaries or providers"
            />
            <FilterSelect
              label="All fields"
              value={field}
              onChange={setField}
              options={FIELDS_OF_STUDY}
            />
            <FilterSelect
              label="Any status"
              value={status}
              onChange={setStatus}
              options={STATUS_FILTERS}
            />
          </div>
          <ResultCount shown={shown.length} total={rows.length} noun="bursaries" />
          {shown.length === 0 ? (
            <EmptyNotice title="No bursaries match your search." />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/bursaries/$slug"
                    params={{ slug: b.slug }}
                    className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(8,60,48,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/30 text-accent-foreground">
                        <Wallet className="h-5 w-5" />
                      </span>
                      <Pill tone={statusTone(b.status)}>{statusLabel(b.status)}</Pill>
                    </span>
                    <span className="mt-4 font-sans text-base font-semibold text-foreground">
                      {b.name}
                    </span>
                    <span className="text-sm text-muted-foreground">{b.provider}</span>
                    {b.value_description && (
                      <span className="mt-2 line-clamp-2 text-sm text-foreground">
                        {b.value_description}
                      </span>
                    )}
                    {(b.fields_of_study ?? []).length > 0 && (
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {b.fields_of_study.slice(0, 4).map((f) => (
                          <Pill key={f}>{labelFor(FIELDS_OF_STUDY, f)}</Pill>
                        ))}
                        {b.fields_of_study.length > 4 && (
                          <Pill>+{b.fields_of_study.length - 4}</Pill>
                        )}
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
