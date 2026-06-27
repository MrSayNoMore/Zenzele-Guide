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
  Heart,
  Sun,
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
  to?: string;
  accent: string; // hex
  tint: string; // soft bg hex
};

const journeys: Journey[] = [
  { slug: "grade-12", title: "I'm in Grade 12", blurb: "Match your marks to universities, TVETs, and bursaries.", Icon: GraduationCap, status: "live", to: "/journey/grade-12", accent: "#1D9E75", tint: "#E1F5EE" },
  { slug: "nsfas", title: "I need NSFAS", blurb: "Check if NSFAS will fund you — and what to prepare.", Icon: ShieldCheck, status: "live", to: "/journey/nsfas", accent: "#085041", tint: "#E1F5EE" },
  { slug: "bursary", title: "I'm looking for a bursary", blurb: "Find bursaries that fit your profile, before the deadline.", Icon: Wallet, status: "live", to: "/journey/bursary", accent: "#C8881E", tint: "#FDF1D8" },
  { slug: "tvet", title: "I want to study at a TVET", blurb: "Discover NC(V) and Report 191 programmes near you.", Icon: BookOpen, status: "live", to: "/journey/tvet", accent: "#0E7C7B", tint: "#DEF3F0" },
  { slug: "grade-11", title: "I'm in Grade 11", blurb: "See where your marks put you, and how to lift your APS.", Icon: Compass, status: "soon", accent: "#1D9E75", tint: "#E1F5EE" },
  { slug: "grade-10", title: "I'm in Grade 10", blurb: "Pick subjects that open doors to the careers you want.", Icon: Compass, status: "soon", accent: "#1D9E75", tint: "#E1F5EE" },
  { slug: "gap-year", title: "I'm taking a gap year", blurb: "Learnerships, short courses, and other paths forward.", Icon: Sparkles, status: "soon", accent: "#C8881E", tint: "#FDF1D8" },
  { slug: "learnership", title: "I want a learnership", blurb: "SETA-accredited learnerships across South Africa.", Icon: Briefcase, status: "soon", accent: "#085041", tint: "#E1F5EE" },
  { slug: "graduate", title: "I just graduated", blurb: "Graduate programmes, internships, and first jobs.", Icon: Briefcase, status: "soon", accent: "#0E7C7B", tint: "#DEF3F0" },
  { slug: "university", title: "I'm at university", blurb: "Postgrad funding and career planning.", Icon: GraduationCap, status: "soon", accent: "#1D9E75", tint: "#E1F5EE" },
];

function Landing() {
  const live = journeys.filter((j) => j.status === "live");
  const soon = journeys.filter((j) => j.status === "soon");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main>
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="relative overflow-hidden">
          {/* warm sunrise wash */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(120% 90% at 78% 18%, #FFF4DC 0%, #FFFBF2 38%, #FFFFFF 70%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #E1F5EE, transparent)" }}
          />

          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-10 sm:px-6 md:grid-cols-2 md:gap-6 md:pb-16 md:pt-16">
            {/* Copy */}
            <div className="max-w-xl">
              <span
                className="zg-rise inline-flex items-center gap-2 rounded-full bg-[var(--brand-izolo)] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#085041] ring-1 ring-[#9FE1CB]"
                style={{ animationDelay: "40ms" }}
              >
                <Sun className="h-3.5 w-3.5 text-[#C8881E]" /> Free · No login · Works on any phone
              </span>

              <h1
                className="zg-rise mt-5 text-[2.7rem] font-black leading-[1.03] tracking-tight text-[#063c30] sm:text-6xl lg:text-[4.2rem]"
                style={{ animationDelay: "100ms" }}
              >
                Do it yourself —{" "}
                <span className="relative inline-block text-[#1D9E75]">
                  <em className="not-italic">but not alone.</em>
                  <svg
                    aria-hidden
                    viewBox="0 0 300 18"
                    className="absolute -bottom-2 left-0 w-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M4 12 C 70 4, 150 4, 210 9 S 285 14, 296 7"
                      fill="none"
                      stroke="#FAC775"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p
                className="zg-rise mt-6 max-w-lg text-lg leading-relaxed text-[#3f5b51] sm:text-xl"
                style={{ animationDelay: "180ms" }}
              >
                Zenzele Guide turns <span className="font-semibold text-[#085041]">"what do I do after matric?"</span>{" "}
                into a clear next step. Tell us where you are, and we'll show you the
                universities, colleges, and bursaries that actually fit your marks.
              </p>

              <div
                className="zg-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                style={{ animationDelay: "260ms" }}
              >
                <a
                  href="#journeys"
                  className="group relative inline-flex min-h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#1D9E75] px-7 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(8,80,65,0.6)] transition active:scale-[0.98] sm:text-lg"
                >
                  <span className="zg-cta-sheen pointer-events-none absolute inset-0" aria-hidden />
                  Where are you in your journey?
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/universities"
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-[#cfe9df] bg-white px-6 text-base font-semibold text-[#085041] transition hover:border-[#1D9E75] hover:bg-[var(--brand-izolo)]"
                >
                  Browse universities
                </a>
              </div>

              <p
                className="zg-rise mt-6 flex items-center gap-2 text-sm text-[#5b746a]"
                style={{ animationDelay: "340ms" }}
              >
                <Heart className="h-4 w-4 fill-[#FAC775] text-[#C8881E]" />
                Built for South Africa — by people who get your world.
              </p>
            </div>

            {/* Sunrise scene */}
            <div className="zg-rise relative" style={{ animationDelay: "160ms" }}>
              <HeroScene />
            </div>
          </div>
        </section>

        {/* Ndebele divider into the trust band */}
        <NdebeleBand />

        {/* ──────────────────────── Trust strip ──────────────────────── */}
        <section className="bg-[#063c30] text-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-7 px-4 py-9 sm:px-6 md:grid-cols-4 md:py-10">
            <Trust Icon={Heart} title="Always free" sub="No paywall, ever." />
            <Trust Icon={BadgeCheck} title="No login needed" sub="Start in seconds." />
            <Trust Icon={Smartphone} title="Works on any phone" sub="Light on data." />
            <Trust Icon={ShieldCheck} title="POPIA-respecting" sub="Your data stays yours." />
          </div>
        </section>

        {/* ──────────────────── Journey selector ──────────────────── */}
        <section id="journeys" className="scroll-mt-20 bg-[var(--brand-izolo)]/35">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <div className="max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-widest text-[#C8881E]">
                Start here
              </span>
              <h2 className="mt-2 text-3xl font-black text-[#063c30] sm:text-4xl">
                Where are you in your journey?
              </h2>
              <p className="mt-3 text-lg text-[#3f5b51]">
                Tap the one closest to you. We'll open the right door and walk the next
                step with you — no wrong answers here.
              </p>
            </div>

            {/* Live doors */}
            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {live.map((j, i) => (
                <JourneyDoor key={j.slug} journey={j} delay={i * 70} />
              ))}
            </div>

            {/* Coming soon */}
            <div className="mt-12">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#5b746a]">
                  More paths
                </h3>
                <span className="rounded-full bg-[#FAC775]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#7a5a10]">
                  Coming soon
                </span>
                <div className="h-px flex-1 bg-[#cfe9df]" />
              </div>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {soon.map((j) => (
                  <li key={j.slug}>
                    <a
                      href={`/journey/${j.slug}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d7ece4] bg-white px-4 text-sm font-semibold text-[#3f5b51] transition hover:border-[#1D9E75] hover:bg-[var(--brand-izolo)] hover:text-[#085041] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FAC775]"
                    >
                      <j.Icon className="h-4 w-4 text-[#1D9E75]" />
                      {j.title.replace(/^I('m| want| just| need|'m taking) /, "")}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-[#5b746a]">
                Want one of these next?{" "}
                <a href="#journeys" className="font-semibold text-[#1D9E75] underline-offset-2 hover:underline">
                  Tell us where you are
                </a>{" "}
                and we'll build it.
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────────── Why trust us ──────────────────── */}
        <section className="border-t border-[#e7f1ec] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <h2 className="max-w-xl text-3xl font-black text-[#063c30] sm:text-4xl">
              Real answers, made for your marks.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <Feature
                kicker="01"
                title="Your APS, not a guess"
                body="We compute your APS using each university's own rules — UCT's FPS, Wits' composite, UP, UJ, Stellenbosch, UKZN — so the number you see is the number they'll use."
              />
              <Feature
                kicker="02"
                title="It tells you why"
                body="Every match explains itself: which subject met which minimum, where you fall short, and exactly what to do to get there."
              />
              <Feature
                kicker="03"
                title="Checked by real people"
                body="Every university, TVET, and bursary shows a source link and the date a human last verified it. No stale, no made-up numbers."
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ───────────────────────── Sunrise scene (pure SVG) ───────────────────────── */
function HeroScene() {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      viewBox="0 0 560 480"
      role="img"
      aria-label="Students on a hilltop looking up at a rising sun"
      className="mx-auto block h-auto w-full max-w-[520px] drop-shadow-[0_24px_40px_rgba(8,80,65,0.14)]"
    >
      <defs>
        <radialGradient id="zg-sun" cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="#FFF3D2" />
          <stop offset="55%" stopColor="#FBD27E" />
          <stop offset="100%" stopColor="#F2A93C" />
        </radialGradient>
        <linearGradient id="zg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF4DC" />
        </linearGradient>
        <linearGradient id="zg-hill-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E7C5F" />
          <stop offset="100%" stopColor="#085041" />
        </linearGradient>
        <linearGradient id="zg-hill-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#23B083" />
          <stop offset="100%" stopColor="#1D9E75" />
        </linearGradient>
        <linearGradient id="zg-hill-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6FD0AC" />
          <stop offset="100%" stopColor="#3CBB8E" />
        </linearGradient>
        <clipPath id="zg-frame">
          <rect x="0" y="0" width="560" height="480" rx="32" />
        </clipPath>
      </defs>

      <g clipPath="url(#zg-frame)">
        <rect x="0" y="0" width="560" height="480" fill="url(#zg-sky)" />

        {/* glow */}
        <circle className="zg-glow" cx="280" cy="362" r="172" fill="#FBD27E" opacity="0.5" />

        {/* rays */}
        <g className="zg-rays">
          {rays.map((a) => (
            <rect
              key={a}
              x="275"
              y="176"
              width="10"
              height="52"
              rx="5"
              fill="#FAC775"
              opacity="0.55"
              transform={`rotate(${a} 280 362)`}
            />
          ))}
        </g>

        {/* sun */}
        <circle cx="280" cy="362" r="98" fill="url(#zg-sun)" />

        {/* birds */}
        <g fill="none" stroke="#085041" strokeWidth="3.5" strokeLinecap="round" opacity="0.65">
          <path className="zg-float" style={{ animationDelay: "0ms" }} d="M96 120 q9 -9 18 0 q9 -9 18 0" />
          <path className="zg-float" style={{ animationDelay: "900ms" }} d="M150 92 q7 -7 14 0 q7 -7 14 0" />
          <path className="zg-float" style={{ animationDelay: "500ms" }} d="M430 138 q8 -8 16 0 q8 -8 16 0" />
        </g>

        {/* floating Ndebele sparks */}
        <g>
          <rect className="zg-float" style={{ animationDelay: "200ms" }} x="442" y="74" width="16" height="16" rx="3" fill="#FAC775" transform="rotate(45 450 82)" />
          <rect className="zg-float" style={{ animationDelay: "700ms" }} x="96" y="210" width="12" height="12" rx="2" fill="#9FE1CB" transform="rotate(45 102 216)" />
          <rect className="zg-float" style={{ animationDelay: "1100ms" }} x="486" y="232" width="11" height="11" rx="2" fill="#1D9E75" transform="rotate(45 491 237)" />
        </g>

        {/* hills */}
        <path d="M0 372 Q150 330 300 352 T560 340 L560 480 L0 480 Z" fill="url(#zg-hill-back)" />
        <path d="M0 398 Q170 356 330 382 T560 376 L560 480 L0 480 Z" fill="url(#zg-hill-mid)" />

        {/* figures (from behind, looking at the sun) */}
        <g>
          {/* shadows */}
          <ellipse cx="232" cy="372" rx="20" ry="5" fill="#063c30" opacity="0.16" />
          <ellipse cx="286" cy="368" rx="22" ry="5" fill="#063c30" opacity="0.16" />
          <ellipse cx="340" cy="374" rx="20" ry="5" fill="#063c30" opacity="0.16" />

          {/* A — celebrating, arms up */}
          <g>
            <rect x="226" y="346" width="6" height="28" rx="3" fill="#0c5b46" />
            <rect x="233" y="346" width="6" height="28" rx="3" fill="#0c5b46" />
            <path d="M223 350 q9 -34 20 0 Z" fill="#1D9E75" />
            <path d="M226 326 L214 300" stroke="#A86A3D" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <path d="M240 326 L252 300" stroke="#A86A3D" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <circle cx="233" cy="320" r="11" fill="#A86A3D" />
            <path d="M223 318 a11 11 0 0 1 20 0 q-10 -7 -20 0 Z" fill="#2b1a0e" />
          </g>

          {/* B — graduate, cap + tassel */}
          <g>
            <rect x="280" y="342" width="6" height="28" rx="3" fill="#102a22" />
            <rect x="287" y="342" width="6" height="28" rx="3" fill="#102a22" />
            <path d="M270 346 L302 346 L296 300 L276 300 Z" fill="#085041" />
            <circle cx="286" cy="294" r="11" fill="#7A4A2B" />
            <path d="M276 292 a10 10 0 0 1 20 0 q-10 -6 -20 0 Z" fill="#1b1208" />
            <polygon points="266,284 286,278 306,284 286,290" fill="#063c30" />
            <circle cx="286" cy="284" r="2.2" fill="#FAC775" />
            <path d="M306 284 L309 300" stroke="#FAC775" strokeWidth="2.5" fill="none" />
            <circle cx="309" cy="302" r="2.6" fill="#FAC775" />
          </g>

          {/* C — pointing to the sun, backpack */}
          <g>
            <rect x="334" y="348" width="6" height="26" rx="3" fill="#0c5b46" />
            <rect x="341" y="348" width="6" height="26" rx="3" fill="#0c5b46" />
            <rect x="345" y="326" width="14" height="22" rx="6" fill="#C8881E" />
            <path d="M330 352 q10 -32 20 0 Z" fill="#0E7C7B" />
            <path d="M338 330 L320 318" stroke="#C98A52" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <circle cx="340" cy="322" r="10.5" fill="#C98A52" />
            <path d="M330 320 a10.5 10.5 0 0 1 21 0 q-10 -6 -21 0 Z" fill="#241405" />
          </g>
        </g>

        {/* front hill + little growth */}
        <path d="M0 430 Q190 392 380 416 T560 412 L560 480 L0 480 Z" fill="url(#zg-hill-front)" />
        <g stroke="#0E7C5F" strokeWidth="3" strokeLinecap="round" opacity="0.6">
          <path d="M70 452 q4 -14 8 0" />
          <path d="M470 458 q4 -14 8 0" />
        </g>
        <circle cx="120" cy="456" r="3" fill="#FAC775" />
        <circle cx="430" cy="462" r="3" fill="#FAC775" />
      </g>
    </svg>
  );
}

/* ───────────────────────── Ndebele divider band ───────────────────────── */
function NdebeleBand() {
  return (
    <div aria-hidden className="bg-[var(--brand-izolo)]">
      <svg className="block h-5 w-full" viewBox="0 0 112 20" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="zg-ndebele" width="112" height="20" patternUnits="userSpaceOnUse">
            <g stroke="#063c30" strokeWidth="1.4">
              <polygon points="28,3 39,10 28,17 17,10" fill="#FAC775" />
              <polygon points="28,7.5 32,10 28,12.5 24,10" fill="#FFFFFF" stroke="none" />
              <polygon points="84,3 95,10 84,17 73,10" fill="#1D9E75" />
              <polygon points="84,7.5 88,10 84,12.5 80,10" fill="#FFFFFF" stroke="none" />
              <rect x="-4" y="6" width="8" height="8" fill="#085041" transform="rotate(45 0 10)" />
              <rect x="52" y="6" width="8" height="8" fill="#0E7C7B" transform="rotate(45 56 10)" />
              <rect x="108" y="6" width="8" height="8" fill="#085041" transform="rotate(45 112 10)" />
            </g>
          </pattern>
        </defs>
        <rect width="112" height="20" fill="url(#zg-ndebele)" />
      </svg>
    </div>
  );
}

function Trust({ Icon, title, sub }: { Icon: typeof Heart; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-[#FAC775]/40">
        <Icon className="h-5 w-5 text-[#FAC775]" />
      </span>
      <div>
        <p className="font-bold leading-tight text-white">{title}</p>
        <p className="text-sm text-[#bfe0d4]">{sub}</p>
      </div>
    </div>
  );
}

function JourneyDoor({ journey, delay }: { journey: Journey; delay: number }) {
  const { Icon, title, blurb, to, accent, tint } = journey;
  return (
    <a
      href={to}
      className="zg-rise group relative flex min-h-[112px] items-stretch gap-4 overflow-hidden rounded-3xl border border-[#e3efe9] bg-white p-5 shadow-[0_1px_0_rgba(8,80,65,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-18px_rgba(8,80,65,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FAC775] active:translate-y-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* accent "door" edge */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: accent }} />
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
        style={{ background: tint, color: accent }}
      >
        <Icon className="h-7 w-7" />
      </span>
      <div className="flex flex-1 flex-col justify-center">
        <h3 className="text-lg font-bold text-[#063c30]">{title}</h3>
        <p className="mt-0.5 text-sm leading-snug text-[#5b746a]">{blurb}</p>
      </div>
      <span
        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-[var(--brand-izolo)] text-[#1D9E75] transition-all duration-200 group-hover:bg-[#1D9E75] group-hover:text-white"
        aria-hidden
      >
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

function Feature({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="relative">
      <span className="font-display text-3xl font-black text-[#FAC775]">{kicker}</span>
      <h3 className="mt-2 text-xl font-bold text-[#063c30]">{title}</h3>
      <p className="mt-2 leading-relaxed text-[#3f5b51]">{body}</p>
    </div>
  );
}
