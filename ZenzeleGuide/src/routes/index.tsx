import { createFileRoute } from "@tanstack/react-router";
import {
  GraduationCap,
  Compass,
  BookOpen,
  Wallet,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  BadgeCheck,
  Lock,
  Check,
} from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenzele Guide — Find your next step after matric" },
      {
        name: "description",
        content:
          "Free, mobile-first guidance for South African learners. Work out your APS, find universities and TVET colleges that fit your marks, check NSFAS, and discover bursaries — no signup needed.",
      },
      { property: "og:title", content: "Zenzele Guide — Do it yourself, but not alone" },
      {
        property: "og:description",
        content:
          "South Africa's student guidance platform. APS matching, university & TVET finder, NSFAS check, bursary finder. Built for every matric.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

type Journey = {
  slug: string;
  title: string;
  blurb: string;
  Icon: typeof Compass;
  status: "live" | "soon";
  short?: string;
  to?: string;
};

const journeys: Journey[] = [
  { slug: "grade-12", title: "I'm in Grade 12", blurb: "Match your marks to universities, TVETs, and bursaries.", Icon: GraduationCap, status: "live", to: "/journey/grade-12" },
  { slug: "nsfas", title: "I need NSFAS", blurb: "Check if NSFAS will fund you — and what to prepare.", Icon: ShieldCheck, status: "live", to: "/journey/nsfas" },
  { slug: "bursary", title: "I'm looking for a bursary", blurb: "Find bursaries that fit your profile, before the deadline.", Icon: Wallet, status: "live", to: "/journey/bursary" },
  { slug: "tvet", title: "I want to study at a TVET", blurb: "Discover NC(V) and Report 191 programmes near you.", Icon: BookOpen, status: "live", to: "/journey/tvet" },
  { slug: "grade-11", short: "Grade 11", title: "I'm in Grade 11", blurb: "See where your marks put you, and how to lift your APS.", Icon: Compass, status: "soon" },
  { slug: "grade-10", short: "Grade 10", title: "I'm in Grade 10", blurb: "Pick subjects that open doors to the careers you want.", Icon: Compass, status: "soon" },
  { slug: "gap-year", short: "Gap year", title: "I'm taking a gap year", blurb: "Learnerships, short courses, and other paths forward.", Icon: Sparkles, status: "soon" },
  { slug: "learnership", short: "Learnerships", title: "I want a learnership", blurb: "SETA-accredited learnerships across South Africa.", Icon: Briefcase, status: "soon" },
  { slug: "graduate", short: "Graduates", title: "I just graduated", blurb: "Graduate programmes, internships, and first jobs.", Icon: Briefcase, status: "soon" },
  { slug: "university", short: "University students", title: "I'm at university", blurb: "Postgrad funding and career planning.", Icon: GraduationCap, status: "soon" },
];

function Landing() {
  const live = journeys.filter((j) => j.status === "live");
  const soon = journeys.filter((j) => j.status === "soon");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main>
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-24">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Guidance after matric
              </p>

              <h1 className="mt-4 text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                Know your options before you apply.
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Zenzele Guide calculates your APS the way each university does, then shows the
                programmes, TVET colleges, and bursaries that fit your marks — with the reasons
                behind every match.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#journeys"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/universities"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Browse universities
                </a>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Free to use", "No account required", "Works on any phone"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <ApsPreview />
          </div>
        </section>

        {/* ──────────────────────── Trust strip ──────────────────────── */}
        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            <Trust Icon={BadgeCheck} title="Always free" sub="No paywall, ever." />
            <Trust Icon={Lock} title="No login needed" sub="Start in seconds." />
            <Trust Icon={Smartphone} title="Mobile-first" sub="Light on data." />
            <Trust Icon={ShieldCheck} title="POPIA-compliant" sub="Your data stays yours." />
          </div>
        </section>

        {/* ──────────────────── Journey selector ──────────────────── */}
        <section id="journeys" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Start here
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Where are you in your journey?
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Choose the option closest to your situation and we'll take you to the right tools.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {live.map((j) => (
                <JourneyCard key={j.slug} journey={j} />
              ))}
            </div>

            <div className="mt-12 border-t border-border pt-8">
              <h3 className="font-sans text-sm font-semibold text-foreground">
                More paths <span className="font-normal text-muted-foreground">— coming soon</span>
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {soon.map((j) => (
                  <li key={j.slug}>
                    <a
                      href={`/journey/${j.slug}`}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <j.Icon className="h-4 w-4" />
                      {j.short ?? j.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ──────────────────── Why trust us ──────────────────── */}
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">
              Accurate answers, based on your marks.
            </h2>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              <Feature
                kicker="01"
                title="Your APS, not a guess"
                body="We compute your APS using each university's own rules — UCT's FPS, Wits' composite, UP, UJ, Stellenbosch, UKZN — so the number you see is the number they'll use."
              />
              <Feature
                kicker="02"
                title="Every match is explained"
                body="See which subject met which minimum, where you fall short, and what it would take to close the gap."
              />
              <Feature
                kicker="03"
                title="Verified by people"
                body="Every university, TVET, and bursary shows a source link and the date it was last checked by our team."
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ─────────────── Hero visual: an example of the product output ─────────────── */
function ApsPreview() {
  const subjects: [string, number][] = [
    ["English HL", 72],
    ["isiZulu FAL", 76],
    ["Mathematics", 68],
    ["Physical Sciences", 64],
    ["Life Sciences", 75],
    ["Geography", 70],
  ];
  const matches: [string, string, "Eligible" | "Borderline"][] = [
    ["BSc Life Sciences", "University of Pretoria", "Eligible"],
    ["BCom Accounting", "University of Johannesburg", "Eligible"],
    ["BSc Engineering", "Wits University", "Borderline"],
  ];

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-[0_20px_40px_-24px_rgba(8,60,48,0.25)]"
      aria-label="Example APS result"
      role="img"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Example result</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">APS summary</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold leading-none text-[var(--brand-umhlaba)]">34</p>
          <p className="mt-1 text-xs text-muted-foreground">APS points</p>
        </div>
      </div>

      <dl className="divide-y divide-border px-5">
        {subjects.map(([name, mark]) => (
          <div key={name} className="flex items-center gap-4 py-2.5 text-sm">
            <dt className="w-36 shrink-0 text-muted-foreground">{name}</dt>
            <dd className="flex flex-1 items-center gap-3">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${mark}%` }} />
              </span>
              <span className="w-9 text-right font-medium tabular-nums text-foreground">{mark}%</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-border bg-muted/40 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Programme matches</p>
        <ul className="mt-3 space-y-2.5">
          {matches.map(([prog, uni, status]) => (
            <li key={prog} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{prog}</p>
                <p className="truncate text-xs text-muted-foreground">{uni}</p>
              </div>
              <span
                className={
                  status === "Eligible"
                    ? "shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-[var(--brand-umhlaba)]"
                    : "shrink-0 rounded-md bg-accent/30 px-2 py-0.5 text-xs font-medium text-accent-foreground"
                }
              >
                {status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Trust({ Icon, title, sub }: { Icon: typeof BadgeCheck; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function JourneyCard({ journey }: { journey: Journey }) {
  const { Icon, title, blurb, to } = journey;
  return (
    <a
      href={to}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-[var(--brand-umhlaba)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <h3 className="font-sans text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{blurb}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </a>
  );
}

function Feature({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="border-t-2 border-primary/70 pt-5">
      <span className="text-sm font-semibold tabular-nums text-muted-foreground">{kicker}</span>
      <h3 className="mt-2 font-sans text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
