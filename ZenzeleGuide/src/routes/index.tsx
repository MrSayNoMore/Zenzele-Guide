import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Compass, BookOpen, Wallet, Briefcase, Sparkles, ArrowRight, ShieldCheck, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenzele Guide — Find your next step after matric" },
      { name: "description", content: "Free, mobile-first guidance for South African learners. Calculate your APS, find universities and TVET colleges that match your marks, check NSFAS eligibility, and discover bursaries — no signup needed." },
      { property: "og:title", content: "Zenzele Guide — Do it yourself, but not alone" },
      { property: "og:description", content: "South Africa's most trusted student guidance platform. APS calculator, university matcher, NSFAS check, bursary finder." },
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
  to?: string;
};

const journeys: Journey[] = [
  { slug: "grade-12", title: "I'm in Grade 12", blurb: "Match your marks to universities, TVETs, and bursaries.", Icon: GraduationCap, status: "live", to: "/journey/grade-12" },
  { slug: "nsfas", title: "I need NSFAS", blurb: "Check if NSFAS will fund you, and what to prepare.", Icon: ShieldCheck, status: "live", to: "/journey/nsfas" },
  { slug: "bursary", title: "I'm looking for a bursary", blurb: "Find bursaries that match your profile and deadlines.", Icon: Wallet, status: "live", to: "/journey/bursary" },
  { slug: "tvet", title: "I want to study at a TVET", blurb: "Discover NC(V) and Report 191 programmes near you.", Icon: BookOpen, status: "live", to: "/journey/tvet" },
  { slug: "grade-10", title: "I'm in Grade 10", blurb: "Pick subjects that open doors to the careers you want.", Icon: Compass, status: "soon" },
  { slug: "grade-11", title: "I'm in Grade 11", blurb: "See where your marks put you, and how to lift your APS.", Icon: Compass, status: "soon" },
  { slug: "gap-year", title: "I'm taking a gap year", blurb: "Learnerships, short courses, and alternative paths.", Icon: Sparkles, status: "soon" },
  { slug: "university", title: "I'm at university", blurb: "Postgrad funding and career planning.", Icon: GraduationCap, status: "soon" },
  { slug: "learnership", title: "I want a learnership", blurb: "SETA-accredited learnerships across SA.", Icon: Briefcase, status: "soon" },
  { slug: "graduate", title: "I just graduated", blurb: "Graduate programmes, internships, and first jobs.", Icon: Briefcase, status: "soon" },
];

function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-izolo)] via-background to-background">
        <div className="absolute inset-0 -z-10 opacity-30" aria-hidden>
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[var(--brand-mint)] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[var(--brand-gold)] blur-3xl opacity-50" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-izolo)] px-3 py-1 text-xs font-medium text-[var(--brand-umhlaba)] ring-1 ring-[var(--brand-mint)]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Free · No login required
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight">
              Do it yourself — <span className="text-primary">but not alone.</span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl">
              Zenzele Guide turns "what do I do after matric?" into a clear next step.
              Tell us where you are, and we'll show you the universities, colleges, and bursaries that actually fit your marks.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#journeys" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
                Where are you in your journey? <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-base font-medium text-foreground transition hover:bg-muted">
                Browse universities
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Built for South Africa</span>
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Works on any phone</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> POPIA-respecting</span>
            </div>
          </div>
        </div>
      </section>

      {/* Journey selector */}
      <section id="journeys" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold">Where are you in your journey?</h2>
          <p className="mt-3 text-muted-foreground">Pick the one closest to you. We'll walk you through the next step.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {journeys.map((j) => <JourneyCard key={j.slug} journey={j} />)}
        </div>
      </section>

      {/* What we do */}
      <section className="bg-[var(--brand-izolo)]/40 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 grid md:grid-cols-3 gap-8">
          <Feature title="Per-university APS" body="Not a generic number. We compute your APS using each university's own rules — UCT FPS, Wits composite, UJ, UP, Stellenbosch, UKZN." />
          <Feature title="Explainable matches" body="Every result tells you why — which subject met which minimum, where you fall short, and what to do next." />
          <Feature title="Verified, dated data" body="Every university, TVET, and bursary record shows a source link and the last date a human verified it." />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function JourneyCard({ journey }: { journey: Journey }) {
  const { Icon, title, blurb, status, to } = journey;
  const body = (
    <div className="group h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-[var(--brand-izolo)] p-2.5 text-[var(--brand-umhlaba)] ring-1 ring-[var(--brand-mint)] group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary transition">
          <Icon className="h-5 w-5" />
        </div>
        {status === "soon" ? (
          <span className="rounded-full bg-[var(--brand-gold)]/30 px-2.5 py-0.5 text-[11px] font-medium text-[var(--brand-umhlaba)]">Coming soon</span>
        ) : (
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
    </div>
  );
  if (status === "live" && to) {
    return <a href={to}>{body}</a>;
  }
  return <div className="opacity-90 cursor-not-allowed">{body}</div>;
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
