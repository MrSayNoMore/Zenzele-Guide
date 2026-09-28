import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenzele Guide — Make an informed start" },
      {
        name: "description",
        content:
          "Practical, independent guidance for South African learners choosing what to do after matric.",
      },
      { property: "og:title", content: "Zenzele Guide — Make an informed start" },
      {
        property: "og:description",
        content: "Compare study, funding and career paths with confidence.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

type Journey = {
  title: string;
  blurb: string;
  Icon: typeof GraduationCap;
  to: string;
};

const journeys: Journey[] = [
  {
    title: "University applications",
    blurb: "Understand programme requirements, application steps and key dates.",
    Icon: GraduationCap,
    to: "/journey/grade-12",
  },
  {
    title: "NSFAS funding",
    blurb: "Get a clear view of eligibility, documents and the application process.",
    Icon: ShieldCheck,
    to: "/journey/nsfas",
  },
  {
    title: "Bursary opportunities",
    blurb: "Find funding options that fit your profile before deadlines pass.",
    Icon: WalletCards,
    to: "/journey/bursary",
  },
  {
    title: "TVET colleges",
    blurb: "Explore practical programmes and accredited colleges across South Africa.",
    Icon: BookOpen,
    to: "/journey/tvet",
  },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-secondary text-secondary-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.08fr_.92fr] md:py-24">
            <div className="max-w-2xl">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                A practical guide for South African learners
              </p>
              <h1 className="max-w-2xl text-5xl font-medium leading-[1.02] tracking-tight text-secondary-foreground sm:text-6xl lg:text-7xl">
                Your next step deserves a clear plan.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-secondary-foreground/75 sm:text-xl">
                Make informed decisions about study, funding and work after matric — without the noise or guesswork.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#journeys"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Explore your options <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center rounded-md border border-secondary-foreground/25 px-5 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-foreground/10"
                >
                  How Zenzele works
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-secondary-foreground/70">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" /> Clear and practical</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" /> Built for South Africa</span>
              </div>
            </div>

            <div className="rounded-lg border border-secondary-foreground/15 bg-secondary-foreground/8 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-secondary-foreground/15 pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Start here</p>
                  <h2 className="mt-3 text-2xl text-secondary-foreground">What are you planning next?</h2>
                </div>
                <BadgeCheck className="size-7 text-accent" aria-hidden="true" />
              </div>
              <div className="flex flex-col divide-y divide-secondary-foreground/15">
                {[
                  ["I am in Grade 12", "/journey/grade-12"],
                  ["I need funding", "/journey/nsfas"],
                  ["I am exploring careers", "/careers"],
                ].map(([label, to]) => (
                  <Link key={to} to={to} className="group flex items-center justify-between py-5 text-base font-medium transition hover:text-accent">
                    {label}
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-secondary-foreground/55">No account is needed to begin.</p>
            </div>
          </div>
        </section>

        <section id="journeys" className="border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Make a confident start</p>
              <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">Guidance for the decisions that matter.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">Start with the path that is closest to where you are today. We break complex choices into manageable next steps.</p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {journeys.map(({ title, blurb, Icon, to }) => (
                <Link key={title} to={to} className="group flex min-h-64 flex-col bg-card p-6 transition hover:bg-muted sm:p-7">
                  <Icon className="size-7 text-primary" aria-hidden="true" />
                  <h3 className="mt-12 text-xl">{title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{blurb}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">View guide <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[.9fr_1.1fr] md:items-center md:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Why Zenzele</p>
              <h2 className="mt-4 text-4xl leading-tight">Less confusion. Better decisions.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <TrustPoint Icon={Landmark} title="Relevant locally" text="Information shaped around South African institutions, funding and routes." />
              <TrustPoint Icon={BriefcaseBusiness} title="Made for action" text="Every guide ends with practical steps you can take today." />
              <TrustPoint Icon={BadgeCheck} title="Independent by design" text="Clear guidance without promising shortcuts or selling outcomes." />
              <TrustPoint Icon={CheckCircle2} title="Built for clarity" text="Straightforward language for real decisions and real constraints." />
            </div>
          </div>
        </section>

        <section className="bg-secondary text-secondary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-7 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between md:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Ready when you are</p>
              <h2 className="mt-3 text-3xl text-secondary-foreground sm:text-4xl">Start with one decision.</h2>
              <p className="mt-3 max-w-xl text-secondary-foreground/70">Use the guides to move from uncertainty to a next step you can stand behind.</p>
            </div>
            <a href="#journeys" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Explore the guides <ArrowRight className="size-4" aria-hidden="true" /></a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function TrustPoint({ Icon, title, text }: { Icon: typeof Landmark; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <Icon className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div><h3 className="text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>
    </div>
  );
}

export default Landing;
