import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  FilterSelect,
  LoadError,
  Pill,
} from "@/components/site/directory";
import {
  bursariesForStudent,
  bursaryStatus,
  listBursariesWithEligibility,
  statusLabel,
  statusTone,
} from "@/lib/directory";
import { FIELDS_OF_STUDY } from "@/lib/admin-options";

export const Route = createFileRoute("/journey/university")({
  head: () => ({
    meta: [
      { title: "Funding for university students — Zenzele Guide" },
      {
        name: "description",
        content:
          "Already at university? Find bursaries for continuing and postgraduate students in your field, open ones first.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { bursaries: await listBursariesWithEligibility(), failed: false };
    } catch (e) {
      console.error("Failed to load bursaries", e);
      return { bursaries: [], failed: true };
    }
  },
  component: UniversityStudentPage,
});

const LEVELS = [
  { value: "continuing", label: "Undergraduate (2nd year and up)" },
  { value: "postgraduate", label: "Postgraduate (Honours, Master's, PhD)" },
] as const;

function UniversityStudentPage() {
  const { bursaries, failed } = Route.useLoaderData();
  const [level, setLevel] = useState<string>("continuing");
  const [field, setField] = useState("");

  const { matched, unstated } = useMemo(() => {
    const withStatus = bursaries.map((b) => ({
      ...b,
      status: bursaryStatus(b.bursary_cycles ?? []),
    }));
    // Open first, then upcoming; closed ones last.
    const rank = (k: string) =>
      ({ open: 0, open_no_deadline: 1, upcoming: 2, unknown: 3, closed: 4 })[k] ?? 5;
    withStatus.sort((a, b) => rank(a.status.kind) - rank(b.status.kind));
    return bursariesForStudent(withStatus, level, field);
  }, [bursaries, level, field]);

  return (
    <DirectoryShell
      eyebrow="University students"
      title="Fund the rest of your studies"
      description="Already studying? Tell us your stage and field to see bursaries that fund students like you. Open ones are listed first."
    >
      {failed ? (
        <LoadError />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="block sm:w-80">
              <span className="sr-only">Your stage of study</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <FilterSelect
              label="Any field"
              value={field}
              onChange={setField}
              options={FIELDS_OF_STUDY}
            />
          </div>

          <section>
            <h2 className="font-sans text-lg font-semibold">
              Bursaries for {level === "postgraduate" ? "postgraduate" : "continuing"} students
            </h2>
            {matched.length ? (
              <BursaryList items={matched} />
            ) : (
              <EmptyNotice title="No bursaries listed for this stage yet.">
                We're adding bursaries as we verify them. Check the ones below with their providers.
              </EmptyNotice>
            )}
          </section>

          {unstated.length > 0 && (
            <section>
              <h2 className="font-sans text-lg font-semibold">May also fit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These don't say which year of study they fund. Check with the provider before you
                apply.
              </p>
              <BursaryList items={unstated} />
            </section>
          )}

          <section className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
            <p className="font-medium">Also useful</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link
                  to="/journey/nsfas"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  Check NSFAS (it also funds continuing students) <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  Plan from your degree to a career <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </section>
        </div>
      )}
    </DirectoryShell>
  );
}

function BursaryList({
  items,
}: {
  items: {
    id: string;
    slug: string;
    name: string;
    provider: string;
    value_description: string | null;
    status: ReturnType<typeof bursaryStatus>;
  }[];
}) {
  return (
    <ul className="mt-3 grid gap-3 md:grid-cols-2">
      {items.map((b) => (
        <li key={b.id}>
          <Link
            to="/bursaries/$slug"
            params={{ slug: b.slug }}
            className="flex h-full flex-col rounded-lg border border-border bg-card p-4 transition hover:shadow-[0_14px_30px_-18px_rgba(8,60,48,0.45)]"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2 font-medium">
                <Wallet className="h-4 w-4 text-primary" /> {b.name}
              </span>
              <Pill tone={statusTone(b.status)}>{statusLabel(b.status)}</Pill>
            </span>
            <span className="mt-1 text-sm text-muted-foreground">{b.provider}</span>
            {b.value_description && (
              <span className="mt-2 line-clamp-2 text-sm">{b.value_description}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
