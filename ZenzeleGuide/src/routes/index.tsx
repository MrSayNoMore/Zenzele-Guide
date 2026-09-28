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
  accent?: string;
  to?: string;
};

const journeys: Journey[] = [
  { slug: "grade-12", title: "I'm in Grade 12", blurb: "Match your marks to universities, TVETs, and bursaries.", Icon: GraduationCap, status: "live", to: "/journey/grade-12", accent: "#1D9E75" },
  { slug: "nsfas", title: "I need NSFAS", blurb: "Check if NSFAS will fund you — and what to prepare.", Icon: ShieldCheck, status: "live", to: "/journey/nsfas", accent: "#085041" },
  { slug: "bursary", title: "I'm looking for a bursary", blurb: "Find bursaries that fit your profile, before the deadline.", Icon: Wallet, status: "live", to: "/journey/bursary", accent: "#C8881E" },
  { slug: "tvet", title: "I want to study at a TVET", blurb: "Discover NC(V) and Report 191 programmes near you.", Icon: BookOpen, status: "live", to: "/journey/tvet", accent: "#0E7C7B" },
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
        <section className="relative overflow-hidden border-b border-border">
          {/* soft brand glow + dot grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 70% at 85% 20%, rgba(29,158,117,0.14) 0%, transparent 60%), radial-gradient(40% 50% at 70% 90%, rgba(250,199,117,0.18) 0%, transparent 60%)",
            }}
          />
          <div aria-hidden className="zg-dots pointer-events-none absolute inset-0 -z-10" />

          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_.95fr] md:py-24">
            <div className="max-w-xl">
              <p className="zg-in inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                <span className="h-px w-8 bg-primary" aria-hidden />
                Guidance after matric
              </p>

              <h1 className="zg-in mt-5 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.6rem]" style={{ animationDelay: "60ms" }}>
                Know your options{" "}
                <span className="relative whitespace-nowrap italic text-primary">
                  before you apply.
                  <span aria-hidden className="zg-underline absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-accent" />
                </span>
              </h1>

              <p className="zg-in mt-7 text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "120ms" }}>
                Zenzele Guide calculates your APS the way each university does, then shows the
                programmes, TVET colleges, and bursaries that fit your marks — with the reasons
                behind every match.
              </p>

              <div className="zg-in mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
                <a
                  href="#journeys"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_rgba(29,158,117,0.7)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/universities"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-background/80 px-6 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Browse universities
                </a>
              </div>

              <ul className="zg-in mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" style={{ animationDelay: "240ms" }}>
                {["Free to use", "No account required", "Works on any phone"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="zg-in relative mx-auto w-full max-w-md md:max-w-none" style={{ animationDelay: "150ms" }}>
              {/* tilted card behind for depth */}
              <div
                aria-hidden
                className="absolute inset-0 translate-x-3 translate-y-3 rotate-[3deg] rounded-xl bg-[var(--brand-umhlaba)]"
              >
                <div className="zg-ndebele absolute inset-x-0 bottom-0 h-4 rounded-b-xl opacity-80" />
              </div>
              <div className="relative">
                <ApsPreview />
              </div>

              {/* floating highlights */}
              <div className="zg-float absolute -top-7 right-28 hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">NSFAS</span>
                  <span className="text-muted-foreground">Likely eligible</span>
                </span>
              </div>
              <div
                className="zg-float absolute -bottom-12 right-8 hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg sm:flex"
                style={{ animationDelay: "1.5s" }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/40 text-accent-foreground">
                  <Wallet className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">3 bursaries</span>
                  <span className="text-muted-foreground">match this profile</span>
                </span>
              </div>
            </div>
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
        {/* ──────────────────── Closing CTA ──────────────────── */}
        <section className="relative overflow-hidden bg-[var(--brand-umhlaba)] text-white">
          <div aria-hidden className="zg-ndebele absolute inset-x-0 top-0 h-3 opacity-90" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(250,199,117,0.25), transparent 70%)" }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between md:py-20">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Your marks already tell a story.{" "}
                <span className="italic text-accent">Let's read it together.</span>
              </h2>
              <p className="mt-4 text-white/75">
                Enter your results once and see every door they open — in about two minutes.
              </p>
            </div>
            <a
              href="/journey/grade-12"
              className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-semibold text-accent-foreground transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-umhlaba)]"
            >
              Check my APS
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
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
                <span className="zg-fill block h-full rounded-full bg-primary" style={{ width: `${mark}%` }} />
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
  const { Icon, title, blurb, to, accent = "#1D9E75" } = journey;
  return (
    <a
      href={to}
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(8,60,48,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: accent }}
      />
      <Icon
        aria-hidden
        className="pointer-events-none absolute -bottom-4 -right-3 h-24 w-24 opacity-[0.05] transition-opacity group-hover:opacity-[0.09]"
        style={{ color: accent }}
      />
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
        style={{ background: `${accent}1A`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="relative flex-1">
        <h3 className="font-sans text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{blurb}</p>
      </div>
      <ArrowRight className="relative h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </a>
  );
}

function Feature({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="border-t border-border pt-5">
      <span className="font-display text-5xl font-semibold italic leading-none text-accent">{kicker}</span>
      <h3 className="mt-4 font-sans text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
