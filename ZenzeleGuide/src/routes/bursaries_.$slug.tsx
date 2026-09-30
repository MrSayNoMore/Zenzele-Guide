import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  ExternalButton,
  Pill,
  SourceNote,
} from "@/components/site/directory";
import { SaveToggle } from "@/components/site/save-toggle";
import {
  bursaryStatus,
  eligibilityLines,
  formatDate,
  getBursary,
  statusLabel,
  statusTone,
} from "@/lib/directory";
import { FIELDS_OF_STUDY, labelFor } from "@/lib/admin-options";

export const Route = createFileRoute("/bursaries_/$slug")({
  loader: async ({ params }) => {
    const bursary = await getBursary(params.slug);
    if (!bursary) throw notFound();
    return { bursary };
  },
  head: ({ loaderData }) => {
    const b = loaderData?.bursary;
    return {
      meta: b
        ? [
            { title: `${b.name} (${b.provider}) — Zenzele Guide` },
            {
              name: "description",
              content: `${b.name} by ${b.provider}: who can apply, what it covers and when applications close.`,
            },
          ]
        : [{ title: "Bursary not found — Zenzele Guide" }],
    };
  },
  notFoundComponent: () => (
    <DirectoryShell
      eyebrow="Bursaries"
      title="We couldn't find that bursary"
      back={{ to: "/bursaries", label: "All bursaries" }}
    >
      <EmptyNotice title="It may not be published yet, or it may have been removed." />
    </DirectoryShell>
  ),
  component: BursaryPage,
});

function BursaryPage() {
  const { bursary: b } = Route.useLoaderData();
  const cycles = [...(b.bursary_cycles ?? [])].sort((x, y) => y.year - x.year);
  const status = bursaryStatus(cycles);
  const rules = eligibilityLines(b.eligibility, (f) => labelFor(FIELDS_OF_STUDY, f));

  return (
    <DirectoryShell
      eyebrow={b.provider}
      title={b.name}
      back={{ to: "/bursaries", label: "All bursaries" }}
      description={
        <>
          <Pill tone={statusTone(status)}>{statusLabel(status)}</Pill>
          {b.value_description && <p className="mt-4 text-foreground">{b.value_description}</p>}
          <div className="mt-4">
            <SourceNote sourceUrl={b.source_url} verifiedAt={b.last_verified_at} />
          </div>
        </>
      }
      actions={
        <>
          {b.website_url && <ExternalButton href={b.website_url}>How to apply</ExternalButton>}
          <SaveToggle
            kind="bursary"
            refId={b.id}
            returnTo={`/bursaries/${b.slug}`}
            variant="button"
          />
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {b.description && (
            <section>
              <h2 className="font-sans text-lg font-semibold">About this bursary</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{b.description}</p>
            </section>
          )}
          <section>
            <h2 className="font-sans text-lg font-semibold">Who can apply</h2>
            {rules.length ? (
              <ul className="mt-3 space-y-2">
                {rules.map((r) => (
                  <li key={r} className="flex gap-2 text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted-foreground">
                The provider hasn't listed specific requirements here. Check the official page
                before you apply.
              </p>
            )}
            {(b.fields_of_study ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {b.fields_of_study.map((f) => (
                  <Pill key={f}>{labelFor(FIELDS_OF_STUDY, f)}</Pill>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" /> Application dates
            </h2>
            {cycles.length ? (
              <ul className="mt-3 divide-y divide-border text-sm">
                {cycles.map((c) => (
                  <li key={c.year} className="py-2.5">
                    <p className="font-medium">For {c.year} studies</p>
                    <p className="text-muted-foreground">
                      {c.opens_at ? `Opens ${formatDate(c.opens_at)}` : "Opening date not given"}
                      {" · "}
                      {c.closes_at ? `Closes ${formatDate(c.closes_at)}` : "No closing date given"}
                    </p>
                    {c.notes && <p className="mt-1 text-muted-foreground">{c.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                The provider hasn't announced dates yet.
              </p>
            )}
          </section>
          <section className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
            <p className="font-medium">Not sure if you qualify?</p>
            <p className="mt-1 text-muted-foreground">
              Answer a few questions and we'll show every bursary that fits you.
            </p>
            <Link
              to="/journey/bursary"
              className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              Find bursaries that fit me <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
          <p className="text-xs text-muted-foreground">
            Details can change. Always confirm with {b.provider} before you apply. Zenzele Guide
            never charges for applications.
          </p>
        </aside>
      </div>
    </DirectoryShell>
  );
}
