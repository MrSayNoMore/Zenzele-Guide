import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Briefcase, CalendarCheck, ExternalLink, Wallet } from "lucide-react";
import { DirectoryShell, EmptyNotice, LoadError, Pill } from "@/components/site/directory";
import { OpportunityCard } from "@/components/site/opportunity-card";
import { bursaryStatus, listBursaries, statusLabel, statusTone } from "@/lib/directory";
import {
  fitsLearner,
  listOpportunities,
  opportunityStatus,
  sortByStatus,
} from "@/lib/opportunities";
import { PROVINCES } from "@/lib/admin-options";

export const Route = createFileRoute("/journey/gap-year")({
  head: () => ({
    meta: [
      { title: "Make the most of your gap year — Zenzele Guide" },
      {
        name: "description",
        content:
          "Taking a gap year? Find learnerships and short courses open now, bursaries to apply for next year, and how to improve your matric marks.",
      },
    ],
  }),
  loader: async () => {
    try {
      const [opportunities, bursaries] = await Promise.all([
        listOpportunities(["learnership", "apprenticeship", "short_course"]),
        listBursaries(),
      ]);
      return { opportunities, bursaries, failed: false };
    } catch (e) {
      console.error("Failed to load gap-year options", e);
      return { opportunities: [], bursaries: [], failed: true };
    }
  },
  component: GapYearPage,
});

const RANK: Record<string, number> = { open: 0, open_no_deadline: 1, upcoming: 2 };

const selectClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function GapYearPage() {
  const { opportunities, bursaries, failed } = Route.useLoaderData();
  const [province, setProvince] = useState("");
  const [passedMatric, setPassedMatric] = useState("yes");

  const earn = useMemo(() => {
    const learner = { province, education: passedMatric === "yes" ? "grade_12" : "grade_11" };
    return sortByStatus(
      opportunities
        .filter((o) => fitsLearner(o, learner))
        .map((o) => ({ ...o, status: opportunityStatus(o) }))
        .filter((o) => o.status.kind !== "closed"),
    );
  }, [opportunities, province, passedMatric]);

  // Bursaries open now or opening soon: the ones to apply for this year.
  const funding = useMemo(
    () =>
      bursaries
        .map((b) => ({ ...b, status: bursaryStatus(b.bursary_cycles ?? []) }))
        .filter((b) => ["open", "open_no_deadline", "upcoming"].includes(b.status.kind))
        .sort(
          (a, b) =>
            RANK[a.status.kind] - RANK[b.status.kind] ||
            (a.status.kind === "open" && b.status.kind === "open"
              ? a.status.daysLeft - b.status.daysLeft
              : a.name.localeCompare(b.name)),
        ),
    [bursaries],
  );

  return (
    <DirectoryShell
      eyebrow="Gap year"
      title="Make this year count"
      description="A gap year can move you forward: earn and learn, improve your marks, and get your applications in early for next year. Here's what you can do now."
    >
      {failed ? (
        <LoadError />
      ) : (
        <div className="space-y-10">
          <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Did you pass matric?</span>
              <select
                value={passedMatric}
                onChange={(e) => setPassedMatric(e.target.value)}
                className={selectClass}
              >
                <option value="yes">Yes, I have my matric certificate</option>
                <option value="no">Not yet</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Where you live</span>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={selectClass}
              >
                <option value="">Any province</option>
                {PROVINCES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Step n={1} Icon={Briefcase} title="Earn and learn this year">
            <p className="text-sm text-muted-foreground">
              Learnerships, apprenticeships and short courses you can apply for now or soon.
            </p>
            {earn.length ? (
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {earn.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    <OpportunityCard o={o} status={o.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyNotice
                  title={
                    opportunities.length
                      ? "Nothing open fits these answers right now."
                      : "We're adding verified learnerships and short courses."
                  }
                >
                  Check back soon, or look at TVET programmes below.
                </EmptyNotice>
              </div>
            )}
            <MoreLink to="/journey/learnership">Find learnerships that fit me</MoreLink>
          </Step>

          <Step n={2} Icon={BookOpen} title={passedMatric === "yes" ? "Improve your marks" : "Finish your matric"}>
            <p className="text-sm text-muted-foreground">
              {passedMatric === "yes"
                ? "Rewriting a subject can raise your APS and open courses that were out of reach. "
                : "You can still get your matric certificate. "}
              The Department of Basic Education's Second Chance Matric Programme supports learners
              who want to rewrite or complete their matric subjects.
            </p>
            <a
              href="https://www.education.gov.za/Programmes/SecondChanceProgramme.aspx"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Second Chance Matric Programme (official site) <ExternalLink className="h-4 w-4" />
            </a>
            <MoreLink to="/journey/grade-12">See what your marks qualify you for</MoreLink>
          </Step>

          <Step n={3} Icon={Wallet} title="Apply early for next year">
            <p className="text-sm text-muted-foreground">
              University, TVET and bursary applications for next year open during this year. These
              bursaries are open now or opening soon.
            </p>
            {funding.length ? (
              <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
                {funding.slice(0, 6).map((b) => (
                  <li key={b.id}>
                    <Link
                      to="/bursaries/$slug"
                      params={{ slug: b.slug }}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">{b.name}</span>
                        <span className="block text-sm text-muted-foreground">{b.provider}</span>
                      </span>
                      <Pill tone={statusTone(b.status)}>{statusLabel(b.status)}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyNotice title="No bursaries are open right now.">
                  New cycles open through the year. Check the bursary list again soon.
                </EmptyNotice>
              </div>
            )}
            <ul className="mt-3 space-y-1.5">
              <MoreLink to="/journey/nsfas" item>
                Check whether NSFAS could fund you
              </MoreLink>
              <MoreLink to="/journey/tvet" item>
                Find a TVET programme to apply for
              </MoreLink>
              <MoreLink to="/bursaries" item>
                See all bursaries
              </MoreLink>
            </ul>
          </Step>
        </div>
      )}
    </DirectoryShell>
  );
}

function Step({
  n,
  Icon,
  title,
  children,
}: {
  n: number;
  Icon: typeof CalendarCheck;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Step {n}</p>
        <h2 className="mt-1 font-sans text-xl font-semibold">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </section>
  );
}

function MoreLink({
  to,
  children,
  item,
}: {
  to: "/journey/learnership" | "/journey/grade-12" | "/journey/nsfas" | "/journey/tvet" | "/bursaries";
  children: string;
  item?: boolean;
}) {
  const link = (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
    >
      {children} <ArrowRight className="h-4 w-4" />
    </Link>
  );
  return item ? <li>{link}</li> : <div className="mt-3">{link}</div>;
}
