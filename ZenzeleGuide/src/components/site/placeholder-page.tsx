import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { BrandMark } from "./logo";

export function PlaceholderPage({
  eyebrow = "We're building this",
  title,
  description,
  points,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  points?: string[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="relative flex flex-1 items-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(115% 80% at 80% 0%, #FFF4DC 0%, #FFFBF2 45%, #fff 78%)",
          }}
        />
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:py-24">
          <BrandMark className="mx-auto h-14 w-14" />
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-izolo)] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#085041] ring-1 ring-[#9FE1CB]">
            <Sparkles className="h-3.5 w-3.5 text-[#C8881E]" /> {eyebrow}
          </span>
          <h1 className="mt-5 text-3xl font-black text-[#063c30] sm:text-[2.6rem] sm:leading-[1.1]">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#3f5b51]">{description}</p>

          {points && points.length > 0 && (
            <ul className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 text-left">
              {points.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-2xl border border-[#e3efe9] bg-white/70 px-4 py-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-izolo)] text-[#1D9E75]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-[#3f5b51]">{p}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/#journeys"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1D9E75] px-6 font-bold text-white shadow-[0_10px_24px_-10px_rgba(8,80,65,0.6)] transition active:scale-[0.98]"
            >
              Pick your journey
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              to="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-[#cfe9df] bg-white px-6 font-semibold text-[#085041] transition hover:border-[#1D9E75]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
