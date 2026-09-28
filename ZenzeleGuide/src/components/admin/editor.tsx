import type { ReactNode } from "react";
import { BadgeCheck, Loader2, Plus, Search, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

// Shared building blocks for the admin editors (universities, courses, bursaries).

export const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
export const textareaClass =
  "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AdminPageHeader({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-sans text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-9`}
      />
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  className = "",
  group = false,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /** For a set of controls (e.g. CheckboxGroup): renders a fieldset, not a label. */
  group?: boolean;
}) {
  const title = (
    <>
      {label}
      {required && <span className="text-destructive"> *</span>}
    </>
  );
  const help = hint && <span className="block text-xs text-muted-foreground">{hint}</span>;
  if (group) {
    return (
      <fieldset className={`space-y-1.5 ${className}`}>
        <legend className="mb-1.5 text-sm font-medium text-foreground">{title}</legend>
        {children}
        {help}
      </fieldset>
    );
  }
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-foreground">{title}</span>
      {children}
      {help}
    </label>
  );
}

export function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              on
                ? "border-primary bg-primary/10 font-medium text-[var(--brand-umhlaba)]"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Source link, verification stamp and publish toggle, shared by every record. */
export function TrustFields({
  sourceUrl,
  onSourceUrl,
  lastVerifiedAt,
  verifyNow,
  onVerifyNow,
  published,
  onPublished,
}: {
  sourceUrl: string;
  onSourceUrl: (v: string) => void;
  lastVerifiedAt?: string | null;
  verifyNow: boolean;
  onVerifyNow: (v: boolean) => void;
  published: boolean;
  onPublished: (v: boolean) => void;
}) {
  return (
    <Section title="Trust & publishing">
      <Field
        label="Official source link"
        required={published}
        hint="The page you checked this against (prospectus, official site). Shown to learners."
      >
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => onSourceUrl(e.target.value)}
          placeholder="https://"
          className={inputClass}
        />
      </Field>
      <label className="flex items-start gap-3 rounded-md border border-border p-3">
        <input
          type="checkbox"
          checked={verifyNow}
          onChange={(e) => onVerifyNow(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#1D9E75]"
        />
        <span className="text-sm">
          <span className="font-medium">I've checked this against the source today</span>
          <span className="block text-xs text-muted-foreground">
            {lastVerifiedAt
              ? `Last verified ${new Date(lastVerifiedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`
              : "Never verified"}
          </span>
        </span>
      </label>
      <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
        <span className="text-sm">
          <span className="font-medium">Published</span>
          <span className="block text-xs text-muted-foreground">
            Only published records appear to learners.
          </span>
        </span>
        <Switch checked={published} onCheckedChange={onPublished} />
      </div>
    </Section>
  );
}

export function EditorSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  saving,
  error,
  onDelete,
  deleteWarning,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => void;
  saving: boolean;
  error?: string | null;
  onDelete?: () => void;
  deleteWarning?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle className="font-sans">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">{children}</div>
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            {error && (
              <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-md px-4 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {deleteWarning ?? "This can't be undone."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep it</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function StatusPill({
  published,
  verifiedAt,
}: {
  published: boolean;
  verifiedAt?: string | null;
}) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          published ? "bg-primary/10 text-[var(--brand-umhlaba)]" : "bg-muted text-muted-foreground"
        }`}
      >
        {published ? "Published" : "Draft"}
      </span>
      {verifiedAt && (
        <span title={`Verified ${new Date(verifiedAt).toLocaleDateString("en-ZA")}`}>
          <BadgeCheck className="h-4 w-4 text-primary" />
        </span>
      )}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** Supabase errors, in plain language where we can tell what went wrong. */
export function friendlyDbError(message: string): string {
  if (/duplicate key|unique/i.test(message))
    return "That slug is already used. Change the slug and try again.";
  if (/row-level security|permission denied/i.test(message))
    return "You don't have admin access to change this.";
  if (/violates foreign key/i.test(message))
    return "This record is still linked to others. Remove those first.";
  return message;
}
