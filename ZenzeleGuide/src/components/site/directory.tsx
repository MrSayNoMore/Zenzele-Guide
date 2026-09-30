// Building blocks shared by the public directory pages (universities, TVET
// colleges, bursaries, careers).
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { formatDate } from "@/lib/directory";

export function DirectoryShell({
  eyebrow,
  title,
  description,
  back,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            {back && (
              <Link
                to={back.to}
                className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" /> {back.label}
              </Link>
            )}
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
            {description && (
              <div className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {description}
              </div>
            )}
            {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="block sm:w-56">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EmptyNotice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function LoadError() {
  return (
    <EmptyNotice title="We couldn't load this right now.">
      Please refresh the page in a moment.
    </EmptyNotice>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "green" | "amber" | "red";
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    green: "bg-primary/10 text-[var(--brand-umhlaba)]",
    amber: "bg-accent/30 text-accent-foreground",
    red: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Where the information comes from and when it was last checked. */
export function SourceNote({
  sourceUrl,
  verifiedAt,
}: {
  sourceUrl?: string | null;
  verifiedAt?: string | null;
}) {
  if (!sourceUrl && !verifiedAt) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Official source <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {verifiedAt && <span>Last checked {formatDate(verifiedAt)}</span>}
    </p>
  );
}

export function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
    >
      {children} <ExternalLink className="h-4 w-4" />
    </a>
  );
}

export function ResultCount({
  shown,
  total,
  noun,
}: {
  shown: number;
  total: number;
  noun: string;
}) {
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      {shown === total ? `${total} ${noun}` : `Showing ${shown} of ${total} ${noun}`}
    </p>
  );
}
