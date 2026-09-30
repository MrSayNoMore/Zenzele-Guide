import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Check, ShieldAlert } from "lucide-react";
import {
  DirectoryShell,
  EmptyNotice,
  ExternalButton,
  Pill,
  SourceNote,
} from "@/components/site/directory";
import { SaveToggle } from "@/components/site/save-toggle";
import { formatDate, statusLabel, statusTone } from "@/lib/directory";
import {
  durationLabel,
  getOpportunity,
  kindLabel,
  opportunityStatus,
  requirementLines,
} from "@/lib/opportunities";
import { FIELDS_OF_STUDY, labelFor } from "@/lib/admin-options";

export const Route = createFileRoute("/opportunities_/$slug")({
  loader: async ({ params }) => {
    const opportunity = await getOpportunity(params.slug);
    if (!opportunity) throw notFound();
    return { opportunity };
  },
  head: ({ loaderData }) => {
    const o = loaderData?.opportunity;
    return {
      meta: o
        ? [
            { title: `${o.title} (${o.organisation}) — Zenzele Guide` },
            {
              name: "description",
              content: `${kindLabel(o.kind)} at ${o.organisation}: who can apply, the stipend and when applications close.`,
            },
          ]
        : [{ title: "Opportunity not found — Zenzele Guide" }],
    };
  },
  notFoundComponent: () => (
    <DirectoryShell
      eyebrow="Opportunities"
      title="We couldn't find that opportunity"
      back={{ to: "/opportunities", label: "All opportunities" }}
    >
      <EmptyNotice title="It may not be published yet, or it may have been removed." />
    </DirectoryShell>
  ),
  component: OpportunityPage,
});

function OpportunityPage() {
  const { opportunity: o } = Route.useLoaderData();
  const status = opportunityStatus(o);
  const rules = requirementLines(o);
  const facts = [
    { label: "Stipend", value: o.stipend },
    { label: "Duration", value: durationLabel(o.duration_months) },
    { label: "Field", value: o.field_of_study ? labelFor(FIELDS_OF_STUDY, o.field_of_study) : null },
    { label: "SETA", value: o.seta },
  ].filter((f) => f.value);

  return (
    <DirectoryShell
      eyebrow={`${kindLabel(o.kind)} · ${o.organisation}`}
      title={o.title}
      back={{ to: "/opportunities", label: "All opportunities" }}
      description={
        <>
          <Pill tone={statusTone(status)}>{statusLabel(status)}</Pill>
          <div className="mt-4">
            <SourceNote sourceUrl={o.source_url} verifiedAt={o.last_verified_at} />
          </div>
        </>
      }
      actions={
        <>
          {o.website_url && <ExternalButton href={o.website_url}>Apply on the official site</ExternalButton>}
          <SaveToggle
            kind="opportunity"
            refId={o.id}
            returnTo={`/opportunities/${o.slug}`}
            variant="button"
          />
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-8">
          {o.description && (
            <section>
              <h2 className="font-sans text-lg font-semibold">What it involves</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{o.description}</p>
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
                The advert doesn't list specific requirements. Check the official page before you
                apply.
              </p>
            )}
          </section>
          {o.how_to_apply && (
            <section>
              <h2 className="font-sans text-lg font-semibold">How to apply</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{o.how_to_apply}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" /> Key facts
            </h2>
            <dl className="mt-3 divide-y divide-border text-sm">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Applications open</dt>
                <dd className="text-right font-medium">
                  {o.opens_at ? formatDate(o.opens_at) : "Not given"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Applications close</dt>
                <dd className="text-right font-medium">
                  {o.closes_at ? formatDate(o.closes_at) : "Not given"}
                </dd>
              </div>
              {facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="text-right font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="flex gap-3 rounded-lg border border-border bg-muted/40 p-5 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-muted-foreground">
              Real learnerships never ask you to pay to apply or to secure a place. If anyone asks
              for money, don't pay. Apply only through the official link.
            </p>
          </section>
          <section className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
            <p className="font-medium">Looking for more?</p>
            <Link
              to="/journey/learnership"
              className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              Find opportunities that fit me <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
          <p className="text-xs text-muted-foreground">
            Details can change. Always confirm with {o.organisation} before you apply. Zenzele
            Guide never charges for applications.
          </p>
        </aside>
      </div>
    </DirectoryShell>
  );
}
