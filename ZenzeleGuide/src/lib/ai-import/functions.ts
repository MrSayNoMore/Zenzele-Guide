// Server functions for the admin AI import. Admin-only: every call checks the
// signed-in user's role on the server before doing anything.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function requireAdmin(): Promise<string> {
  const { requireUserId } = await import("@/lib/journey.server");
  const userId = await requireUserId();
  const db = await admin();
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => r.role === "super_admin" || r.role === "content_admin")) {
    throw new Error("Only admins can use AI import.");
  }
  return userId;
}

// ---------------------------------------------------------------------------
// Which AI is configured (so the page can say so, and send PDFs if it reads them)
// ---------------------------------------------------------------------------

export const aiImportInfo = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { aiInfo } = await import("./ai.server");
  return aiInfo();
});

// ---------------------------------------------------------------------------
// Web page -> text
// ---------------------------------------------------------------------------

const MAX_PAGE_BYTES = 3_000_000;
const FILE_MIMES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

export const fetchPageText = createServerFn({ method: "POST" })
  .validator(z.object({ url: z.string().url().max(2000) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { htmlToText, isPrivateHost } = await import("./shared");
    const url = new URL(data.url);
    if (!["http:", "https:"].includes(url.protocol) || isPrivateHost(url.hostname)) {
      throw new Error("Use a public http(s) web address.");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "ZenzeleGuideBot/1.0 (+https://zenzeleguide.co.za)",
          Accept: "text/html,*/*",
        },
      });
    } catch {
      throw new Error(
        "Couldn't reach that page. Check the link, or copy the text and use Paste text instead.",
      );
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`The page returned an error (${res.status}).`);
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("pdf")) {
      throw new Error("That link is a PDF. Download it and use Upload PDF instead.");
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_PAGE_BYTES)
      throw new Error("That page is too large. Copy the relevant section and use Paste text.");
    const text = htmlToText(new TextDecoder().decode(buf));
    if (text.length < 200)
      throw new Error("Couldn't find readable text on that page. Try Paste text instead.");
    return { text, finalUrl: res.url || data.url };
  });

// ---------------------------------------------------------------------------
// Image -> text (word-for-word), so drafts from photos can be quote-checked
// ---------------------------------------------------------------------------

export const aiTranscribeImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      imageBase64: z
        .string()
        .min(100)
        .max(9_000_000)
        .regex(/^[A-Za-z0-9+/]*={0,2}$/),
      mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { transcribeImage, RateLimitError } = await import("./ai.server");
    try {
      const result = await transcribeImage({ data: data.imageBase64, mime: data.mime });
      return { ...result, rateLimitedFor: 0, rateLimitReason: "" };
    } catch (e) {
      if (e instanceof RateLimitError)
        return {
          text: "",
          legible: "no" as const,
          model: "",
          rateLimitedFor: e.retryAfterSeconds,
          rateLimitReason: e.reason,
        };
      throw e;
    }
  });

// ---------------------------------------------------------------------------
// Extract one section with AI, check it, and save drafts
// ---------------------------------------------------------------------------

export const aiExtractChunk = createServerFn({ method: "POST" })
  .validator(
    z.object({
      uploadId: z.string().uuid(),
      chunkIndex: z.number().int().min(0).max(500),
      // This section's pages as a PDF, or the image it came from (base64),
      // for an AI that reads files. Optional: without it the AI reads the
      // saved text instead.
      fileBase64: z
        .string()
        .max(20_000_000)
        .regex(/^[A-Za-z0-9+/]*={0,2}$/)
        .optional(),
      fileMime: z.enum(FILE_MIMES).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const {
      chunkText,
      checkCourseDraft,
      checkBursaryDraft,
      withVerifier,
      normalise,
      parsePageRange,
      pageChunks,
      textOfPages,
      scannedPages,
      listPages,
    } = await import("./shared");
    const { extractDrafts, verifyDrafts, aiModel, aiInfo, RateLimitError } =
      await import("./ai.server");

    const { data: upload, error } = await db
      .from("prospectus_uploads")
      .select(
        "id, content_type, source_kind, source_text, page_range, chunk_pages, chunks_done, error_message, university_id, universities(name)",
      )
      .eq("id", data.uploadId)
      .single();
    if (error || !upload) throw new Error("Import not found.");
    if (!upload.source_text) throw new Error("This import has no text to read.");

    // Sections are runs of pages when the AI reads the PDF itself, otherwise
    // fixed-size pieces of text.
    const range = upload.chunk_pages ? parsePageRange(upload.page_range) : null;
    const pageRuns = range ? pageChunks(range[0], range[1], upload.chunk_pages!) : null;
    const chunkCount = pageRuns ? pageRuns.length : chunkText(upload.source_text).length;
    if (data.chunkIndex >= chunkCount) throw new Error("No such section.");
    const pages = pageRuns?.[data.chunkIndex];
    const sectionText = pages
      ? textOfPages(upload.source_text, pages.from, pages.to)
      : chunkText(upload.source_text)[data.chunkIndex];
    // Scanned pages have no text: the AI can only read them from the PDF, and
    // quotes from them can't be checked against the text.
    const scanned = pages ? scannedPages(sectionText) : [];
    const fromImage = upload.source_kind === "image";
    const file = data.fileBase64
      ? { data: data.fileBase64, mime: data.fileMime ?? "application/pdf" }
      : undefined;
    const aiSeesPdf = Boolean(file) && aiInfo().readsPdf;
    const unit = fromImage ? "Image" : "Page";
    const scannedLabel = `${unit}${scanned.length === 1 ? "" : "s"} ${listPages(scanned)}`;
    // Notices that stay on the import (pages that couldn't be read), one per
    // section and replaced when the section is read again. Other stored
    // messages are errors that a successful section clears.
    const sectionTag = `Not read (section ${data.chunkIndex + 1}): `;
    const notices = new Set(
      (upload.error_message ?? "")
        .split("\n")
        .filter((line) => line.startsWith("Not read (") && !line.startsWith(sectionTag)),
    );
    if (fromImage && scanned.length) {
      notices.add(
        `${sectionTag}No readable text was found in ${scannedLabel.toLowerCase()}. Take a clearer, closer photo, or use Paste text.`,
      );
    } else if (scanned.length && !aiSeesPdf) {
      notices.add(
        `${sectionTag}${scannedLabel} ${scanned.length === 1 ? "is a scanned image" : "are scanned images"} and the PDF wasn't sent to the AI. Choose the same PDF below so the AI can read ${scanned.length === 1 ? "it" : "them"}.`,
      );
    }
    const finishSection = async () => {
      // Sections normally run in order; re-reading an earlier one (e.g. skipped
      // scanned pages) mustn't make a finished import look unfinished.
      const done = Math.max(upload.chunks_done ?? 0, data.chunkIndex + 1);
      await db
        .from("prospectus_uploads")
        .update({
          chunks_done: done,
          status: done >= chunkCount ? "extracted" : "extracting",
          error_message: notices.size ? [...notices].join("\n").slice(0, 2000) : null,
        })
        .eq("id", upload.id);
    };
    if (pages && !aiSeesPdf && scanned.length === pages.to - pages.from + 1) {
      // Nothing readable in this section: record why and move on.
      await finishSection();
      return { rateLimitedFor: 0, created: 0, passed: 0, attention: 0 };
    }
    const contentType = upload.content_type as "courses" | "bursaries";
    const universityName = (upload.universities as { name: string } | null)?.name;

    // Existing names, for duplicate warnings.
    let existingNames: string[] = [];
    if (contentType === "courses" && upload.university_id) {
      const { data: rows } = await db
        .from("courses")
        .select("name, faculties!inner(university_id)")
        .eq("faculties.university_id", upload.university_id);
      existingNames = (rows ?? []).map((r) => r.name);
    } else if (contentType === "bursaries") {
      const { data: rows } = await db.from("bursaries").select("name");
      existingNames = (rows ?? []).map((r) => r.name);
    }
    const { data: subjects } = await db.from("subjects").select("code, name");

    await db
      .from("prospectus_uploads")
      .update({ status: "extracting", ai_model: aiModel() })
      .eq("id", upload.id);

    let drafts: Awaited<ReturnType<typeof extractDrafts>>["drafts"];
    let verdicts: Awaited<ReturnType<typeof verifyDrafts>>["verdicts"];
    let modelsUsed: string;
    try {
      const extracted = await extractDrafts(contentType, sectionText, {
        universityName,
        chunkNumber: data.chunkIndex + 1,
        chunkCount,
        file,
        fromImage,
        pages,
      });
      drafts = extracted.drafts;
      let checkedBy: string | null = null;
      const unchecked = () => drafts.map(() => undefined);
      try {
        ({ verdicts, model: checkedBy } = await verifyDrafts(drafts, extracted.model));
      } catch (e) {
        // Don't redo the extraction just because the double-check hit a
        // short limit: wait once, then fall back to "double-check didn't run"
        // (which sends every draft to a human).
        if (e instanceof RateLimitError && e.retryAfterSeconds <= 30) {
          await new Promise((r) => setTimeout(r, e.retryAfterSeconds * 1000));
          ({ verdicts, model: checkedBy } = await verifyDrafts(drafts, extracted.model).catch(
            () => ({ verdicts: unchecked(), model: null }),
          ));
        } else {
          verdicts = unchecked();
        }
      }
      modelsUsed =
        checkedBy && checkedBy !== extracted.model
          ? `${extracted.model}, checked by ${checkedBy}`
          : extracted.model;
    } catch (e) {
      if (e instanceof RateLimitError)
        return {
          rateLimitedFor: e.retryAfterSeconds,
          rateLimitReason: e.reason,
          created: 0,
          passed: 0,
          attention: 0,
        };
      const message = e instanceof Error ? e.message : "AI request failed";
      await db
        .from("prospectus_uploads")
        .update({
          status: "failed",
          error_message: [...notices, message.slice(0, 500)].join("\n").slice(0, 2000),
        })
        .eq("id", upload.id);
      throw new Error(message);
    }

    // Retrying a section replaces its drafts; courses repeated in the overlap
    // between sections are saved once.
    await db
      .from("draft_extractions")
      .delete()
      .eq("upload_id", upload.id)
      .eq("chunk_index", data.chunkIndex)
      .eq("state", "pending");
    const { data: others } = await db
      .from("draft_extractions")
      .select("payload")
      .eq("upload_id", upload.id);
    const seen = new Set(
      (others ?? []).map((o) =>
        normalise(
          String(
            (o.payload as { draft?: { name?: { value?: string } } })?.draft?.name?.value ?? "",
          ),
        ),
      ),
    );

    const rows = [];
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const key = normalise(d.name.value ?? "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const base =
        contentType === "courses"
          ? checkCourseDraft(d as never, upload.source_text, subjects ?? [], existingNames)
          : checkBursaryDraft(d as never, upload.source_text, existingNames);
      const checks = withVerifier(base, verdicts[i]);
      if (fromImage) {
        // The text came from an AI transcription, so matching quotes proves
        // less than it does for a PDF text layer: a human always checks.
        checks.status = "attention";
        checks.issues.unshift({
          field: "notes",
          severity: "high",
          message: `From image ${data.chunkIndex + 1}: its text was read by AI. Check every value against the picture yourself.`,
        });
      } else if (scanned.length) {
        checks.status = "attention";
        checks.issues.unshift({
          field: "notes",
          severity: "high",
          message: aiSeesPdf
            ? `${scannedLabel} in this section ${scanned.length === 1 ? "is a scanned image" : "are scanned images"}, so quotes from ${scanned.length === 1 ? "it" : "them"} couldn't be checked automatically. Check every value against the PDF yourself.`
            : `${scannedLabel} in this section ${scanned.length === 1 ? "is a scanned image" : "are scanned images"} the AI couldn't read. Check the PDF for anything missing from this draft.`,
        });
      }
      rows.push({
        upload_id: upload.id,
        target_table: contentType,
        chunk_index: data.chunkIndex,
        payload: { draft: d, university_id: upload.university_id },
        checks,
        confidence:
          checks.status === "passed"
            ? 1
            : checks.issues.some((x) => x.severity === "high")
              ? 0.3
              : 0.6,
        state: "pending" as const,
      });
    }
    if (rows.length) {
      const { error: insertError } = await db.from("draft_extractions").insert(rows as never);
      if (insertError) throw new Error(insertError.message);
    }

    await db.from("prospectus_uploads").update({ ai_model: modelsUsed }).eq("id", upload.id);
    await finishSection();

    return {
      rateLimitedFor: 0,
      created: rows.length,
      passed: rows.filter((r) => r.checks.status === "passed").length,
      attention: rows.filter((r) => r.checks.status !== "passed").length,
    };
  });
