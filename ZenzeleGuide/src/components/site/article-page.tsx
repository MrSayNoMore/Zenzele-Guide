import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function ArticlePage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-[#e7f1ec] bg-[var(--brand-izolo)]/40">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
            <h1 className="text-3xl font-black text-[#063c30] sm:text-4xl">{title}</h1>
            {intro && <p className="mt-3 text-lg text-[#3f5b51]">{intro}</p>}
            {updated && (
              <p className="mt-3 text-sm text-[#5b746a]">Last updated {updated}</p>
            )}
          </div>
        </div>
        <article className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-[#33433d] leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#063c30] [&_a]:font-semibold [&_a]:text-[#1D9E75] [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
