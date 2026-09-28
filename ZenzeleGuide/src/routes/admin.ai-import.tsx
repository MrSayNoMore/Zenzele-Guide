import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Quote,
  Sparkles,
  Type,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader,
  EmptyState,
  Field,
  inputClass,
  textareaClass,
} from "@/components/admin/editor";
import { isHttpUrl, labelFor, FIELDS_OF_STUDY } from "@/lib/admin-options";
import {
  chunkText,
  pageChunks,
  parsePageRange,
  PDF_PAGES_PER_CHUNK,
  type BursaryDraft,
  type CourseDraft,
  type DraftChecks,
  type Issue,
} from "@/lib/ai-import/shared";
import { aiExtractChunk, aiImportInfo, fetchPageText } from "@/lib/ai-import/functions";
import { promoteDraft, rejectDraft, type DraftRow } from "@/lib/ai-import/promote";

export const Route = createFileRoute("/admin/ai-import")({
  head: () => ({ meta: [{ title: "AI import — Admin" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    upload: typeof s.upload === "string" ? s.upload : undefined,
  }),
  component: AiImportPage,
});

type SourceKind = "pdf" | "url" | "text";
type ContentType = "courses" | "bursaries";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const stillLimited = (res: { rateLimitReason?: string }) =>
  `The AI is still limiting requests${res.rateLimitReason ? ` (${res.rateLimitReason})` : ""}. Wait a few minutes, then open this import and use Retry.`;

function AiImportPage() {
  const { upload } = Route.useSearch();
  return (
    <div>
      <AdminPageHeader
        title="AI import"
        description="The AI drafts courses or bursaries from an official source, quoting the text behind every value. Automatic checks and a second AI double-check flag anything doubtful. Nothing reaches learners until you approve it."
      />
      {upload ? <Review uploadId={upload} /> : <NewImport />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New import
// ---------------------------------------------------------------------------

function NewImport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contentType, setContentType] = useState<ContentType>("courses");
  const [sourceKind, setSourceKind] = useState<SourceKind>("pdf");
  const [universityId, setUniversityId] = useState("");
  const [intakeYear, setIntakeYear] = useState(String(new Date().getFullYear() + 1));
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState("");
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    label: string;
    done: number;
    total: number;
    waiting?: number;
  } | null>(null);

  const universities = useQuery({
    queryKey: ["admin", "universities-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("universities").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const ai = useQuery({
    queryKey: ["admin", "ai-info"],
    queryFn: () => aiImportInfo(),
    staleTime: Infinity,
  });
  const readsPdf = ai.data?.readsPdf ?? false;

  const imports = useQuery({
    queryKey: ["admin", "ai-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospectus_uploads")
        .select(
          "id, filename, content_type, status, created_at, chunks_done, chunks_total, universities(name), draft_extractions(state)",
        )
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as {
        id: string;
        filename: string;
        content_type: string;
        status: string;
        created_at: string;
        chunks_done: number;
        chunks_total: number | null;
        universities: { name: string } | null;
        draft_extractions: { state: string }[];
      }[];
    },
  });

  const onPickFile = async (f: File | null) => {
    setFile(f);
    setPageCount(null);
    if (!f) return;
    try {
      const { pdfPageCount } = await import("@/lib/ai-import/pdf");
      const n = await pdfPageCount(f);
      setPageCount(n);
      setFromPage("1");
      setToPage(String(Math.min(n, 20)));
    } catch {
      setError("Couldn't open that PDF. It may be damaged or password-protected.");
    }
  };

  const run = useMutation({
    mutationFn: async () => {
      setError(null);
      // 1. Validate and get the text
      if (contentType === "courses" && !universityId)
        throw new Error("Choose the university this prospectus belongs to.");
      let text = "";
      let filename = "";
      let officialUrl = sourceUrl.trim();
      let pageRange: string | null = null;
      let pdfRuns: { from: number; to: number }[] | null = null;

      if (sourceKind === "pdf") {
        if (!file) throw new Error("Choose a PDF file.");
        const from = Number(fromPage);
        const to = Number(toPage);
        if (
          !Number.isInteger(from) ||
          !Number.isInteger(to) ||
          from < 1 ||
          to < from ||
          (pageCount && to > pageCount)
        ) {
          throw new Error("Enter a valid page range.");
        }
        if (to - from > 79)
          throw new Error(
            "Import at most 80 pages at a time (the free AI plan has limits). Start with the pages that list requirements.",
          );
        const { extractPdfText } = await import("@/lib/ai-import/pdf");
        setProgress({ label: "Reading the PDF", done: 0, total: to - from + 1 });
        text = await extractPdfText(file, from, to, (d, t) =>
          setProgress({ label: "Reading the PDF", done: d, total: t }),
        );
        filename = file.name;
        pageRange = `${from}-${to}`;
        if (readsPdf) pdfRuns = pageChunks(from, to);
      } else if (sourceKind === "url") {
        if (!isHttpUrl(url.trim()))
          throw new Error("Enter a full web address starting with https://");
        setProgress({ label: "Fetching the page", done: 0, total: 1 });
        const page = await fetchPageText({ data: { url: url.trim() } });
        text = page.text;
        filename = new URL(page.finalUrl).hostname + new URL(page.finalUrl).pathname;
        officialUrl ||= page.finalUrl;
      } else {
        text = pasted.trim();
        if (text.length < 200)
          throw new Error("Paste more text: at least a few sentences from the official source.");
        filename = "Pasted text";
      }
      if (!officialUrl || !isHttpUrl(officialUrl)) {
        throw new Error(
          "Add the official source link (where this information is published), so learners can check it.",
        );
      }
      // An AI that reads the PDF itself can handle scanned pages.
      if (!pdfRuns && text.replace(/--- Page \d+ ---/g, "").trim().length < 200) {
        throw new Error(
          "Couldn't find enough text. If the PDF is scanned, copy the text and use Paste text.",
        );
      }
      if (text.length > 600_000)
        throw new Error("That's too much text for one import. Choose fewer pages.");

      // 2. Save the import
      const total = pdfRuns ? pdfRuns.length : chunkText(text).length;
      const { data: auth } = await supabase.auth.getUser();
      const { data: row, error } = await supabase
        .from("prospectus_uploads")
        .insert({
          filename: filename.slice(0, 200),
          content_type: contentType,
          source_kind: sourceKind,
          source_url: officialUrl,
          source_text: text,
          page_range: pageRange,
          university_id: contentType === "courses" ? universityId : null,
          intake_year: intakeYear ? Number(intakeYear) : null,
          uploaded_by: auth.user?.id ?? null,
          status: "extracting",
          chunks_total: total,
          chunk_pages: pdfRuns ? PDF_PAGES_PER_CHUNK : null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      // 3. Extract section by section, waiting out free-tier rate limits
      let created = 0;
      const splitter =
        pdfRuns && file ? await (await import("@/lib/ai-import/pdf")).openPdfSplitter(file) : null;
      for (let i = 0; i < total; i++) {
        setProgress({ label: "AI is reading and checking", done: i, total });
        const pdfBase64 =
          splitter && pdfRuns
            ? ((await splitter.pages(pdfRuns[i].from, pdfRuns[i].to)) ?? undefined)
            : undefined;
        for (let attempt = 0; attempt < 6; attempt++) {
          const res = await aiExtractChunk({
            data: { uploadId: row.id, chunkIndex: i, pdfBase64 },
          });
          if (!res.rateLimitedFor) {
            created += res.created;
            break;
          }
          if (attempt === 5) throw new Error(stillLimited(res));
          for (let s = res.rateLimitedFor; s > 0; s--) {
            setProgress({
              label: "AI is reading and checking",
              done: i,
              total,
              waiting: s,
            });
            await sleep(1000);
          }
        }
      }
      return { id: row.id, created };
    },
    onSuccess: ({ id, created }) => {
      setProgress(null);
      toast.success(
        created
          ? `${created} draft${created === 1 ? "" : "s"} ready for review`
          : "Done: nothing found to import",
      );
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/ai-import", search: { upload: id } });
    },
    onError: (e: Error) => {
      setProgress(null);
      setError(e.message);
      queryClient.invalidateQueries({ queryKey: ["admin", "ai-imports"] });
    },
  });

  const sourceTabs: { value: SourceKind; label: string; icon: typeof FileText }[] = [
    { value: "pdf", label: "Upload PDF", icon: FileText },
    { value: "url", label: "Web page", icon: Globe },
    { value: "text", label: "Paste text", icon: Type },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form
        className="space-y-5 rounded-lg border border-border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          run.mutate();
        }}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-medium">What are you importing?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["courses", "Courses from a prospectus", "Entry requirements, APS and subjects"],
                ["bursaries", "A bursary", "Eligibility, closing dates and how to apply"],
              ] as const
            ).map(([value, title, sub]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-md border p-3 text-sm ${contentType === value ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <input
                  type="radio"
                  name="ct"
                  className="sr-only"
                  checked={contentType === value}
                  onChange={() => setContentType(value)}
                />
                <span className="block font-medium">{title}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {contentType === "courses" && (
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="University" required>
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose…</option>
                {universities.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Intake year">
              <input
                inputMode="numeric"
                value={intakeYear}
                onChange={(e) => setIntakeYear(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        )}
        {contentType === "courses" && universities.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add the university first on the{" "}
            <Link to="/admin/universities" className="text-primary hover:underline">
              Universities
            </Link>{" "}
            page.
          </p>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Source</legend>
          <div className="flex flex-wrap gap-2">
            {sourceTabs.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setSourceKind(t.value)}
                aria-pressed={sourceKind === t.value}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${sourceKind === t.value ? "border-primary bg-primary/5 font-medium" : "border-border text-muted-foreground"}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        {sourceKind === "pdf" && (
          <div className="space-y-3">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
            />
            {pageCount && (
              <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
                <Field label={`From page (of ${pageCount})`}>
                  <input
                    inputMode="numeric"
                    value={fromPage}
                    onChange={(e) => setFromPage(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="To page">
                  <input
                    inputMode="numeric"
                    value={toPage}
                    onChange={(e) => setToPage(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {readsPdf
                ? "Choose just the pages with admission requirements (up to 80). The AI reads the pages themselves, including tables and scanned pages."
                : "Choose just the pages with admission requirements (up to 80). Scanned PDFs have no text; paste the text instead."}
            </p>
          </div>
        )}
        {sourceKind === "url" && (
          <Field
            label="Web page address"
            hint="The official page, e.g. the provider's bursary page."
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </Field>
        )}
        {sourceKind === "text" && (
          <Field label="Text from the official source">
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              className={`${textareaClass} min-h-48`}
            />
          </Field>
        )}

        <Field
          label="Official source link"
          required={sourceKind !== "url"}
          hint={
            sourceKind === "url"
              ? "Leave blank to use the page address."
              : "Where this PDF or text is published. Shown to learners."
          }
        >
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://"
            className={inputClass}
          />
        </Field>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {progress ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {progress.label} —{" "}
              {Math.min(progress.done + (progress.label.startsWith("AI") ? 1 : 0), progress.total)}{" "}
              of {progress.total}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
              />
            </div>
            {progress.waiting ? (
              <p className="text-xs text-muted-foreground">
                The AI asked us to slow down (free-tier limit): continuing in {progress.waiting}s…
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Keep this page open until it finishes.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {ai.data && (
              <p className="text-xs text-muted-foreground">
                {ai.data.configured ? (
                  <>
                    AI: {ai.data.provider === "gemini" ? "Google Gemini" : "Groq"} (
                    {ai.data.models.length > 1
                      ? `${ai.data.models.join(", ")}; switches when one hits its limit`
                      : ai.data.model}
                    ){ai.data.readsPdf ? " · reads PDF pages directly" : " · reads text only"}
                  </>
                ) : (
                  <span className="text-destructive">
                    The AI key isn't set up yet. Add{" "}
                    {ai.data.provider === "gemini" ? "GEMINI_API_KEY" : "GROQ_API_KEY"} as a secret
                    in Cloudflare.
                  </span>
                )}
              </p>
            )}
            <button
              type="submit"
              disabled={run.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" /> Start AI extraction
            </button>
          </div>
        )}
      </form>

      <div>
        <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent imports
        </h2>
        {imports.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : !imports.data?.length ? (
          <EmptyState>No imports yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {imports.data.map((u) => {
              const pending = u.draft_extractions.filter((d) => d.state === "pending").length;
              const done = u.draft_extractions.length - pending;
              return (
                <li key={u.id}>
                  <Link
                    to="/admin/ai-import"
                    search={{ upload: u.id }}
                    className="block p-4 hover:bg-muted/40"
                  >
                    <p className="truncate text-sm font-medium">{u.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.content_type === "courses"
                        ? `Courses · ${u.universities?.name ?? ""}`
                        : "Bursary"}{" "}
                      ·{" "}
                      {new Date(u.created_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="mt-1 text-xs">
                      {u.status === "failed" ? (
                        <span className="text-destructive">Stopped early — open to retry</span>
                      ) : u.status === "extracting" ? (
                        <span className="text-muted-foreground">
                          In progress ({u.chunks_done}/{u.chunks_total ?? "?"})
                        </span>
                      ) : (
                        <span>
                          <strong>{pending}</strong> to review · {done} done
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

function Review({ uploadId }: { uploadId: string }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "attention" | "passed" | "done">("pending");
  const [retrying, setRetrying] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const upload = useQuery({
    queryKey: ["admin", "ai-import", uploadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospectus_uploads")
        .select(
          "id, filename, content_type, status, error_message, source_url, source_kind, page_range, chunk_pages, ai_model, chunks_done, chunks_total, universities(name)",
        )
        .eq("id", uploadId)
        .single();
      if (error) throw error;
      return data as typeof data & { universities: { name: string } | null };
    },
  });

  const drafts = useQuery({
    queryKey: ["admin", "ai-drafts", uploadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("draft_extractions")
        .select("id, target_table, payload, checks, state, promoted_row_id")
        .eq("upload_id", uploadId)
        .order("created_at");
      if (error) throw error;
      return data as unknown as (DraftRow & { promoted_row_id: string | null })[];
    },
  });

  const counts = useMemo(() => {
    const all = drafts.data ?? [];
    const pending = all.filter((d) => d.state === "pending");
    return {
      pending: pending.length,
      attention: pending.filter((d) => d.checks.status !== "passed").length,
      passed: pending.filter((d) => d.checks.status === "passed").length,
      done: all.length - pending.length,
    };
  }, [drafts.data]);

  const shown = (drafts.data ?? []).filter((d) =>
    filter === "done"
      ? d.state !== "pending"
      : d.state === "pending" &&
        (filter === "pending" || (filter === "passed") === (d.checks.status === "passed")),
  );

  /** Reads the given sections again (default: the unfinished ones). */
  const resume = async (only?: number[]) => {
    if (!upload.data?.chunks_total) return;
    setRetrying(true);
    try {
      // With the same PDF chosen again, the AI reads the pages themselves;
      // otherwise it reads the text saved with the import.
      const range = parsePageRange(upload.data.page_range);
      const runs =
        upload.data.chunk_pages && range
          ? pageChunks(range[0], range[1], upload.data.chunk_pages)
          : null;
      let splitter: Awaited<
        ReturnType<typeof import("@/lib/ai-import/pdf").openPdfSplitter>
      > | null = null;
      if (resumeFile && runs && range) {
        const pdf = await import("@/lib/ai-import/pdf");
        if ((await pdf.pdfPageCount(resumeFile)) < range[1])
          throw new Error(
            `That PDF has fewer than ${range[1]} pages. Choose the same file you imported.`,
          );
        splitter = await pdf.openPdfSplitter(resumeFile);
      }
      const sections =
        only ??
        Array.from(
          { length: upload.data.chunks_total - upload.data.chunks_done },
          (_, k) => upload.data!.chunks_done + k,
        );
      for (const i of sections) {
        const pdfBase64 =
          splitter && runs?.[i]
            ? ((await splitter.pages(runs[i].from, runs[i].to)) ?? undefined)
            : undefined;
        for (let attempt = 0; attempt < 6; attempt++) {
          const res = await aiExtractChunk({ data: { uploadId, chunkIndex: i, pdfBase64 } });
          if (!res.rateLimitedFor) break;
          if (attempt === 5) throw new Error(stillLimited(res));
          await sleep(res.rateLimitedFor * 1000);
        }
        await queryClient.invalidateQueries({ queryKey: ["admin"] });
      }
      toast.success(
        only ? "Finished reading those pages" : "Finished reading the remaining sections",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  };

  if (upload.isLoading || drafts.isLoading)
    return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  if (upload.error || !upload.data) return <EmptyState>Import not found.</EmptyState>;
  const u = upload.data;
  const unfinished = (u.chunks_total ?? 0) > u.chunks_done;
  const messageLines = (u.error_message ?? "").split("\n").filter(Boolean);
  const notices = messageLines.filter((l) => l.startsWith("Not read ("));
  const noticeSections = notices
    .map((l) => Number(/^Not read \(section (\d+)\)/.exec(l)?.[1]) - 1)
    .filter((i) => i >= 0);
  const lastError = messageLines.filter((l) => !l.startsWith("Not read (")).pop();

  return (
    <div className="space-y-5">
      <Link
        to="/admin/ai-import"
        search={{ upload: undefined }}
        className="text-sm text-primary hover:underline"
      >
        ← All imports
      </Link>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="font-medium">{u.filename}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {u.content_type === "courses" ? `Courses · ${u.universities?.name ?? ""}` : "Bursary"}
          {u.page_range && ` · pages ${u.page_range}`} · read by {u.ai_model ?? "AI"} ·{" "}
          {u.source_url && (
            <a
              href={u.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              official source <ExternalLink className="inline h-3 w-3" />
            </a>
          )}
        </p>
        {unfinished && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-accent/20 px-3 py-2 text-sm">
            <span>
              Read {u.chunks_done} of {u.chunks_total} sections
              {lastError ? `: ${lastError}` : ""}.
            </span>
            {u.chunk_pages && (
              <label className="flex items-center gap-2 text-xs">
                <span>Optional: choose the same PDF so the AI can read the pages</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  className="text-xs"
                />
              </label>
            )}
            <button
              onClick={() => resume()}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {retrying && <Loader2 className="h-3 w-3 animate-spin" />} Retry remaining sections
            </button>
          </div>
        )}
        {notices.length > 0 && (
          <div className="mt-3 space-y-2 rounded-md bg-destructive/10 px-3 py-2 text-sm">
            <ul className="space-y-1 text-destructive">
              {notices.map((n) => (
                <li key={n} className="flex gap-1.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {n.replace(/^Not read \(section \d+\): /, "")}
                </li>
              ))}
            </ul>
            {u.chunk_pages && !unfinished && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <span>Choose the same PDF:</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    className="text-xs"
                  />
                </label>
                <button
                  onClick={() => resume(noticeSections)}
                  disabled={retrying || !resumeFile}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {retrying && <Loader2 className="h-3 w-3 animate-spin" />} Read these pages from
                  the PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", `To review (${counts.pending})`],
            ["attention", `Needs attention (${counts.attention})`],
            ["passed", `All checks passed (${counts.passed})`],
            ["done", `Done (${counts.done})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full border px-3 py-1 text-sm ${filter === value ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState>
          {filter === "done" ? "Nothing approved or rejected yet." : "Nothing here."}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {shown.map((d) => (
            <DraftCard key={d.id} draft={d} sourceUrl={u.source_url} />
          ))}
        </div>
      )}
    </div>
  );
}

function issuesFor(checks: DraftChecks, field: string): Issue[] {
  return checks.issues.filter((i) => i.field === field || i.field.startsWith(`${field}[`));
}

function FieldRow({
  label,
  value,
  quote,
  issues,
}: {
  label: string;
  value: string | null;
  quote?: string | null;
  issues: Issue[];
}) {
  return (
    <div
      className={`grid gap-1 border-b border-border py-2.5 last:border-0 sm:grid-cols-[10rem_1fr] ${issues.length ? "bg-destructive/5" : ""}`}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div>
        <p className={`text-sm ${value === null ? "italic text-muted-foreground" : "font-medium"}`}>
          {value ?? "Not stated in the source"}
        </p>
        {quote && (
          <p className="mt-0.5 flex gap-1.5 text-xs text-muted-foreground">
            <Quote className="mt-0.5 h-3 w-3 shrink-0" /> <span className="italic">“{quote}”</span>
          </p>
        )}
        {issues.map((i, k) => (
          <p key={k} className="mt-1 flex gap-1.5 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {i.message}
          </p>
        ))}
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  sourceUrl,
}: {
  draft: DraftRow & { promoted_row_id: string | null };
  sourceUrl: string | null;
}) {
  const queryClient = useQueryClient();
  const passed = draft.checks.status === "passed";
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const approve = useMutation({
    mutationFn: (publish: boolean) => promoteDraft(draft, { publish, sourceUrl }),
    onSuccess: (res) => {
      toast.success(
        res.published
          ? "Approved and published"
          : "Approved as a draft: check it and publish from the editor",
      );
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: () => rejectDraft(draft.id),
    onSuccess: () => {
      toast.success("Rejected");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isCourse = draft.target_table === "courses";
  const c = draft.payload.draft as CourseDraft;
  const b = draft.payload.draft as BursaryDraft;
  const generalIssues = draft.checks.issues.filter(
    (i) => i.field === "notes" || i.field === "verifier",
  );
  const fmt = (v: unknown) =>
    v === null || v === undefined ? null : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="font-sans text-base font-semibold">
          {(isCourse ? c.name.value : b.name.value) ?? "Untitled"}
        </h3>
        {draft.state !== "pending" ? (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
            {draft.state}
          </span>
        ) : passed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-[var(--brand-umhlaba)]">
            <CheckCircle2 className="h-3.5 w-3.5" /> All checks passed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Needs a human: {draft.checks.issues.length}{" "}
            issue{draft.checks.issues.length === 1 ? "" : "s"}
          </span>
        )}
      </header>

      <div className="px-4">
        {isCourse ? (
          <>
            <FieldRow
              label="Course"
              value={c.name.value}
              quote={c.name.quote}
              issues={issuesFor(draft.checks, "name")}
            />
            <FieldRow
              label="Faculty"
              value={c.faculty.value}
              quote={c.faculty.quote}
              issues={issuesFor(draft.checks, "faculty")}
            />
            <FieldRow
              label="Minimum APS"
              value={fmt(c.min_aps.value)}
              quote={c.min_aps.quote}
              issues={issuesFor(draft.checks, "min_aps")}
            />
            <FieldRow
              label="Qualification"
              value={c.qualification_type.value}
              quote={c.qualification_type.quote}
              issues={issuesFor(draft.checks, "qualification_type")}
            />
            <FieldRow
              label="Duration (years)"
              value={fmt(c.duration_years.value)}
              quote={c.duration_years.quote}
              issues={issuesFor(draft.checks, "duration_years")}
            />
            <FieldRow
              label="NBT required"
              value={fmt(c.requires_nbt.value)}
              quote={c.requires_nbt.quote}
              issues={issuesFor(draft.checks, "requires_nbt")}
            />
            <FieldRow
              label="Field"
              value={c.field_of_study ? labelFor(FIELDS_OF_STUDY, c.field_of_study) : null}
              issues={issuesFor(draft.checks, "field_of_study")}
            />
            <div className="grid gap-1 py-2.5 sm:grid-cols-[10rem_1fr]">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Subjects
              </span>
              <ul className="space-y-1.5">
                {c.requirements.length === 0 && (
                  <li className="text-sm italic text-muted-foreground">None found</li>
                )}
                {c.requirements.map((r, i) => {
                  const mapped = draft.checks.mapped_requirements?.find((m) => m.index === i);
                  const issues = draft.checks.issues.filter(
                    (x) => x.field === `requirements[${i}]`,
                  );
                  return (
                    <li key={i} className={issues.length ? "rounded bg-destructive/5 p-1.5" : ""}>
                      <p className="text-sm font-medium">
                        {r.subject}:{" "}
                        {r.min_level
                          ? `level ${r.min_level}`
                          : r.min_percentage !== null
                            ? `${r.min_percentage}%`
                            : "?"}
                        {!issues.length && mapped && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            → {mapped.subject_name}, level {mapped.min_level}
                          </span>
                        )}
                      </p>
                      {r.quote && (
                        <p className="text-xs italic text-muted-foreground">“{r.quote}”</p>
                      )}
                      {issues.map((x, k) => (
                        <p key={k} className="text-xs text-destructive">
                          {x.message}
                        </p>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <>
            <FieldRow
              label="Bursary"
              value={b.name.value}
              quote={b.name.quote}
              issues={issuesFor(draft.checks, "name")}
            />
            <FieldRow
              label="Provider"
              value={b.provider.value}
              quote={b.provider.quote}
              issues={issuesFor(draft.checks, "provider")}
            />
            <FieldRow
              label="Covers"
              value={b.value_description.value}
              quote={b.value_description.quote}
              issues={issuesFor(draft.checks, "value_description")}
            />
            <FieldRow
              label="Apply at"
              value={b.website_url.value}
              quote={b.website_url.quote}
              issues={issuesFor(draft.checks, "website_url")}
            />
            <FieldRow
              label="Fields"
              value={
                b.fields.length
                  ? b.fields.map((f) => labelFor(FIELDS_OF_STUDY, f)).join(", ")
                  : null
              }
              issues={issuesFor(draft.checks, "fields")}
            />
            <FieldRow
              label="Citizenship"
              value={b.citizenship.length ? b.citizenship.join(", ") : null}
              issues={issuesFor(draft.checks, "citizenship")}
            />
            <FieldRow
              label="Provinces"
              value={b.provinces.length ? b.provinces.join(", ") : null}
              issues={issuesFor(draft.checks, "provinces")}
            />
            <FieldRow
              label="Min. average"
              value={b.min_percentage_avg.value !== null ? `${b.min_percentage_avg.value}%` : null}
              quote={b.min_percentage_avg.quote}
              issues={issuesFor(draft.checks, "min_percentage_avg")}
            />
            <FieldRow
              label="Income limit"
              value={
                b.household_income_max.value !== null
                  ? `R${b.household_income_max.value.toLocaleString("en-ZA")}`
                  : null
              }
              quote={b.household_income_max.quote}
              issues={issuesFor(draft.checks, "household_income_max")}
            />
            <FieldRow
              label="Opens"
              value={b.opens_at.value}
              quote={b.opens_at.quote}
              issues={issuesFor(draft.checks, "opens_at")}
            />
            <FieldRow
              label="Closes"
              value={b.closes_at.value}
              quote={b.closes_at.quote}
              issues={issuesFor(draft.checks, "closes_at")}
            />
            <FieldRow
              label="For study year"
              value={fmt(b.cycle_year.value)}
              quote={b.cycle_year.quote}
              issues={issuesFor(draft.checks, "cycle_year")}
            />
          </>
        )}
      </div>

      {(generalIssues.length > 0 || draft.checks.verifier) && (
        <div className="space-y-1 border-t border-border bg-muted/30 px-4 py-3 text-sm">
          {draft.checks.verifier?.verdict === "supported" && (
            <p className="flex items-center gap-1.5 text-[var(--brand-umhlaba)]">
              <CheckCircle2 className="h-4 w-4" /> Double-check: every value matches its quote
            </p>
          )}
          {generalIssues.map((i, k) => (
            <p key={k} className="flex gap-1.5 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {i.message}
            </p>
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        {draft.state === "pending" ? (
          <>
            <button
              onClick={() => approve.mutate(true)}
              disabled={!passed || approve.isPending}
              title={
                passed ? undefined : "Only drafts that pass every check can be published directly"
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve & publish
            </button>
            <button
              onClick={() => approve.mutate(false)}
              disabled={approve.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Approve as draft (unpublished)
            </button>
            <button
              onClick={() => reject.mutate()}
              disabled={reject.isPending}
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
            {approve.isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </>
        ) : draft.state === "approved" ? (
          <Link
            to={isCourse ? "/admin/courses" : "/admin/bursaries"}
            className="text-sm font-medium text-primary hover:underline"
          >
            Open in the {isCourse ? "Courses" : "Bursaries"} editor →
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">Rejected</span>
        )}
      </footer>
    </article>
  );
}
