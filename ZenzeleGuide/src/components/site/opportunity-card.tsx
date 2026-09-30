import { Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase } from "lucide-react";
import { Pill } from "@/components/site/directory";
import { statusLabel, statusTone, type BursaryStatus } from "@/lib/directory";
import {
  durationLabel,
  educationLabel,
  kindLabel,
  type OpportunityListItem,
} from "@/lib/opportunities";

/** One learnership / programme in a list, linking to its detail page. */
export function OpportunityCard({
  o,
  status,
}: {
  o: OpportunityListItem;
  status: BursaryStatus;
}) {
  const facts = [
    o.stipend,
    durationLabel(o.duration_months),
    o.min_education ? `Needs ${educationLabel(o.min_education)}` : null,
  ].filter(Boolean);
  return (
    <Link
      to="/opportunities/$slug"
      params={{ slug: o.slug }}
      className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(8,60,48,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Briefcase className="h-5 w-5" />
        </span>
        <Pill tone={statusTone(status)}>{statusLabel(status)}</Pill>
      </span>
      <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
        {kindLabel(o.kind)}
      </span>
      <span className="mt-1 font-sans text-base font-semibold text-foreground">{o.title}</span>
      <span className="text-sm text-muted-foreground">{o.organisation}</span>
      {facts.length > 0 && (
        <span className="mt-3 flex flex-wrap gap-1.5">
          {facts.map((f) => (
            <Pill key={f}>{f}</Pill>
          ))}
        </span>
      )}
      <span className="mt-auto flex justify-end pt-4">
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
