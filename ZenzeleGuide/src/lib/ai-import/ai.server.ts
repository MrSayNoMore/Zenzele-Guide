// Server-only: calls the AI that drafts imports. Two providers:
// - Gemini (preferred): reads PDF pages directly, including tables and scans.
//   Secret: GEMINI_API_KEY. Optional: GEMINI_MODELS (comma-separated, tried in
//   order; each model has its own free limits), GEMINI_MODEL, GEMINI_BASE_URL.
// - Groq: text only. Secret: GROQ_API_KEY. Optional: GROQ_MODEL, GROQ_BASE_URL.
// AI_PROVIDER ("gemini" | "groq") picks one; otherwise Gemini is used when its
// key is set.
import type { BursaryDraft, ContentType, CourseDraft, VerifierVerdict } from "./shared";
import { serverEnv } from "@/lib/server-env";

// Tried in order. When one hits its limit (or is busy/unavailable) the next is
// used, and the double-check prefers a different model from the extraction.
const GEMINI_DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

/** A short-term limit (per minute, or the AI is busy): wait and try again. */
export class RateLimitError extends Error {
  constructor(
    public retryAfterSeconds: number,
    public reason = "",
  ) {
    super(`RATE_LIMIT:${retryAfterSeconds}`);
  }
}

type Provider = "gemini" | "groq";

function provider(): Provider {
  const chosen = serverEnv("AI_PROVIDER")?.trim().toLowerCase();
  if (chosen === "gemini" || chosen === "groq") return chosen;
  return serverEnv("GEMINI_API_KEY") || !serverEnv("GROQ_API_KEY") ? "gemini" : "groq";
}

export function geminiModels(): string[] {
  const list = serverEnv("GEMINI_MODELS") || serverEnv("GEMINI_MODEL");
  const models = list
    ? list
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
    : GEMINI_DEFAULT_MODELS;
  return [...new Set(models)].slice(0, 10);
}

export function aiInfo() {
  const p = provider();
  return {
    provider: p,
    model: aiModel(),
    models: p === "gemini" ? geminiModels() : [aiModel()],
    readsPdf: p === "gemini",
    configured: Boolean(p === "gemini" ? serverEnv("GEMINI_API_KEY") : serverEnv("GROQ_API_KEY")),
  };
}

export function aiModel(): string {
  return provider() === "gemini"
    ? geminiModels()[0]
    : serverEnv("GROQ_MODEL") || GROQ_DEFAULT_MODEL;
}

const clampRetry = (seconds: number) => Math.min(Math.max(Math.ceil(seconds), 2), 120);

function parseJson(content: string): unknown {
  // Tolerate a model that wraps its JSON in a code fence.
  const cleaned = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("The AI returned something that wasn't valid JSON. Try this section again.");
  }
}

type AiResult = { data: unknown; model: string };

/** A PDF or image sent with the prompt (base64), read by Gemini. */
export type AttachedFile = { data: string; mime: string };

/**
 * One AI call that must return JSON. `file` (a PDF or image) is only read by Gemini.
 * `avoidModel`: prefer a different model (used for the independent double-check).
 */
async function chatJson(
  system: string,
  user: string,
  maxTokens: number,
  file?: AttachedFile,
  avoidModel?: string,
): Promise<AiResult> {
  return provider() === "gemini"
    ? geminiJson(system, user, maxTokens, file, avoidModel)
    : { data: await groqJson(system, user, maxTokens), model: aiModel() };
}

type GeminiFailure = {
  model: string;
  kind: "daily" | "no_quota" | "minute" | "busy" | "missing";
  waitSeconds: number;
  message: string;
};

// Models that recently failed, and until when to skip them. Kept per Worker
// instance, so it only saves wasted calls; correctness doesn't depend on it.
const skipUntil = new Map<string, { until: number; kind: GeminiFailure["kind"] }>();

/** For tests. */
export function resetGeminiModelState() {
  skipUntil.clear();
}

async function geminiJson(
  system: string,
  user: string,
  maxTokens: number,
  file?: AttachedFile,
  avoidModel?: string,
): Promise<AiResult> {
  const key = serverEnv("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY isn't set. Add it as a Worker secret in Cloudflare.");
  const base = serverEnv("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta";

  const parts: Record<string, unknown>[] = [];
  if (file) parts.push({ inline_data: { mime_type: file.mime, data: file.data } });
  parts.push({ text: user });
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0,
      // Generous: newer models spend part of this budget thinking.
      maxOutputTokens: Math.max(maxTokens * 4, 16_000),
      responseMimeType: "application/json",
    },
  });

  const models = geminiModels();
  const ordered = [
    ...models.filter((m) => m !== avoidModel),
    ...models.filter((m) => m === avoidModel),
  ];
  const failures: GeminiFailure[] = [];

  for (const model of ordered) {
    if ((skipUntil.get(model)?.until ?? 0) > Date.now()) continue;
    const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body,
    });

    if (res.status === 429 || res.status === 404 || res.status >= 500) {
      const errorBody = (await res.json().catch(() => null)) as GeminiError | null;
      const failure = classifyGeminiFailure(model, res.status, errorBody);
      failures.push(failure);
      const hours = failure.kind === "missing" ? 24 : 6;
      skipUntil.set(model, {
        kind: failure.kind,
        until:
          Date.now() +
          (failure.kind === "minute" || failure.kind === "busy"
            ? failure.waitSeconds * 1000
            : hours * 3_600_000),
      });
      continue; // try the next model
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status} (${model}): ${text.slice(0, 300)}`);
    }
    skipUntil.delete(model);
    return { data: parseGeminiAnswer(await res.json()), model };
  }

  throw allModelsFailedError(models, failures);
}

function parseGeminiAnswer(json: unknown): unknown {
  const data = json as {
    candidates?: {
      content?: { parts?: { text?: string; thought?: boolean }[] };
      finishReason?: string;
    }[];
    promptFeedback?: { blockReason?: string };
  };
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  if (!text || candidate?.finishReason === "MAX_TOKENS") {
    const reason = data.promptFeedback?.blockReason ?? candidate?.finishReason ?? "no answer";
    throw new Error(
      reason === "MAX_TOKENS"
        ? "This section had too much for the AI to answer in one go. Import fewer pages at a time."
        : `The AI didn't answer (${reason}). Try this section again, or use Paste text.`,
    );
  }
  return parseJson(text);
}

type GeminiError = {
  error?: {
    message?: string;
    details?: {
      retryDelay?: string;
      violations?: { quotaId?: string; quotaMetric?: string; quotaValue?: string }[];
    }[];
  };
};

/** Why a Gemini model couldn't answer, and whether waiting would help. */
export function classifyGeminiFailure(
  model: string,
  status: number,
  body: GeminiError | null,
): GeminiFailure {
  const details = body?.error?.details ?? [];
  const fullMessage = body?.error?.message ?? "";
  const message = fullMessage.split("\n")[0].slice(0, 200);
  const violations = details.flatMap((d) => d.violations ?? []);
  const delay = details.find((d) => d.retryDelay)?.retryDelay;
  const waitSeconds = clampRetry(delay ? parseFloat(delay) : status === 429 ? 30 : 20);

  if (status === 404) return { model, kind: "missing", waitSeconds: 0, message };
  if (status === 429) {
    if (violations.some((v) => v.quotaValue === "0") || /\blimit: 0\b/.test(fullMessage))
      return { model, kind: "no_quota", waitSeconds: 0, message };
    if (violations.some((v) => /PerDay/i.test(`${v.quotaId ?? ""} ${v.quotaMetric ?? ""}`)))
      return { model, kind: "daily", waitSeconds: 0, message };
    return { model, kind: "minute", waitSeconds, message };
  }
  return { model, kind: "busy", waitSeconds, message };
}

const FAILURE_LABEL: Record<GeminiFailure["kind"], string> = {
  daily: "daily limit used up",
  no_quota: "no free quota on this key",
  minute: "per-minute limit",
  busy: "busy",
  missing: "not available",
};

/**
 * Every model failed (or is being skipped). If any of them only needs a short
 * wait, wait and retry; otherwise explain which models are out for the day.
 */
export function allModelsFailedError(models: string[], failures: GeminiFailure[]): Error {
  const now = Date.now();
  const status = models.map((model) => {
    const failure = failures.find((f) => f.model === model);
    if (failure) return failure;
    const skipped = skipUntil.get(model);
    return {
      model,
      kind: skipped?.kind ?? "busy",
      waitSeconds: skipped ? Math.max(1, (skipped.until - now) / 1000) : 20,
      message: "",
    } satisfies GeminiFailure;
  });
  const waitable = status.filter((f) => f.kind === "minute" || f.kind === "busy");
  if (waitable.length) {
    return new RateLimitError(
      clampRetry(Math.min(...waitable.map((f) => f.waitSeconds))),
      `all ${models.length} Gemini models are at their limit right now`,
    );
  }
  const list = status.map((f) => `${f.model} (${FAILURE_LABEL[f.kind]})`).join(", ");
  return new Error(
    `None of the Gemini models can take more requests today: ${list}. Free limits reset at midnight Pacific time (about 09:00 in South Africa): open this import then and use Retry. You can also add more models in Cloudflare with GEMINI_MODELS.`,
  );
}

/**
 * Groq 429/503: a used-up daily token/request budget stops with a clear
 * message; per-minute limits and busy servers wait and retry.
 */
export function groqLimitError(status: number, retryAfter: number, message = ""): Error {
  const firstLine = message.split("\n")[0].slice(0, 200);
  if (status === 429 && /per day|\(TPD\)|\(RPD\)/i.test(message)) {
    const wait = /try again in ([\dhms.]+)/i.exec(message)?.[1]?.replace(/\.$/, "");
    return new Error(
      `Groq's free daily limit for ${aiModel()} is used up${wait ? ` (Groq says try again in ${wait})` : ""}. Open this import later and use Retry, or set GROQ_MODEL in Cloudflare to another Groq model, which has its own daily limit.`,
    );
  }
  return new RateLimitError(
    clampRetry(retryAfter || 20),
    status === 503 ? "Groq is busy right now" : firstLine || "Groq's per-minute limit",
  );
}

async function groqJson(system: string, user: string, maxTokens: number): Promise<unknown> {
  const key = serverEnv("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY isn't set. Add it as a Worker secret in Cloudflare.");
  const base = serverEnv("GROQ_BASE_URL") || "https://api.groq.com/openai/v1";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: aiModel(),
      temperature: 0,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (res.status === 429 || res.status === 503) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw groqLimitError(res.status, Number(res.headers.get("retry-after")), body?.error?.message);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parseJson(data.choices?.[0]?.message?.content ?? "");
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const RULES = `
STRICT RULES — accuracy matters more than completeness. Learners make real decisions from this data.
1. Use ONLY the document text you are given. Never use outside knowledge, memory, or "typical" values.
2. For every value, give "quote": an EXACT excerpt copied character-for-character from the document that states the value. Keep quotes short (one line or sentence).
3. If a value is not clearly stated in the document, set "value" to null and "quote" to null. Never guess, estimate, round, convert units, or fill gaps.
4. If the document is ambiguous, contradicts itself, gives several values (e.g. different APS for different streams or years), or you are not sure, set "uncertain": true and explain briefly in "notes".
5. Do not invent items. If the text contains none, return an empty list.
6. Output JSON only, exactly in the requested shape.`;

const COURSE_SYSTEM = `You extract South African university programme entry requirements from prospectus text.
${RULES}

Return: {"items": [COURSE, ...]} where COURSE is:
{
  "name": {"value": string|null, "quote": string|null},              // programme name exactly as written
  "faculty": {"value": string|null, "quote": string|null},
  "qualification_type": {"value": string|null, "quote": string|null}, // e.g. "Bachelor's degree", "Diploma", "Higher Certificate"
  "duration_years": {"value": number|null, "quote": string|null},
  "min_aps": {"value": number|null, "quote": string|null},           // minimum APS / admission point score
  "field_of_study": one of "health","engineering","commerce","humanities","law","education","science","it","arts","agriculture" or null,
  "requires_nbt": {"value": boolean|null, "quote": string|null},
  "requirements": [                                                    // NSC subject minimums for this programme
    {"subject": string, "min_level": number|null, "min_percentage": number|null, "quote": string|null}
  ],
  "uncertain": boolean,
  "notes": string|null
}
For requirements: copy the subject name as written. Use "min_level" only if an NSC level (1-7) is written; use "min_percentage" only if a percentage is written. Never convert between them.`;

const BURSARY_SYSTEM = `You extract South African bursary details from a web page or document.
${RULES}

Return: {"items": [BURSARY, ...]} (usually one) where BURSARY is:
{
  "name": {"value": string|null, "quote": string|null},
  "provider": {"value": string|null, "quote": string|null},            // company or organisation offering it
  "website_url": {"value": string|null, "quote": string|null},         // application link, only if written in the text
  "value_description": {"value": string|null, "quote": string|null},  // what it covers
  "fields": [ subset of "health","engineering","commerce","humanities","law","education","science","it","arts","agriculture" ] — only fields the text names,
  "citizenship": [ subset of "sa_citizen","sa_permanent_resident" ] — only if the text restricts citizenship,
  "provinces": [ subset of "EC","FS","GP","KZN","LP","MP","NC","NW","WC" ] — only if the text restricts provinces,
  "min_percentage_avg": {"value": number|null, "quote": string|null},
  "household_income_max": {"value": number|null, "quote": string|null}, // annual Rand amount, as a plain number
  "disability_only": {"value": boolean|null, "quote": string|null},
  "opens_at": {"value": "YYYY-MM-DD"|null, "quote": string|null},
  "closes_at": {"value": "YYYY-MM-DD"|null, "quote": string|null},
  "cycle_year": {"value": number|null, "quote": string|null},           // the study year the bursary is for
  "uncertain": boolean,
  "notes": string|null
}
Only give a date if the full day, month and year are written or the year is unambiguous from the same sentence.`;

const VERIFIER_SYSTEM = `You are a strict fact-checker. You receive extracted records. Each value comes with the quote it was supposedly taken from.
For each record, check EVERY value against ITS OWN quote only:
- "supported": every value is stated by its quote exactly (no rounding, no inference, correct field).
- "not_supported": at least one value is contradicted by, or not stated in, its quote.
- "unsure": the quotes are too short, ambiguous, or could refer to something else.
Do not use outside knowledge. Be sceptical: when in doubt, answer "unsure".
Return JSON: {"results": [{"index": number, "verdict": "supported"|"not_supported"|"unsure", "problems": [string]}]} with one result per record, in order.`;

// ---------------------------------------------------------------------------
// Coercion: AI output is untrusted; reshape it defensively.
// ---------------------------------------------------------------------------

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const strList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .slice(0, 20)
    : [];

function quoted<T>(raw: unknown, conv: (v: unknown) => T | null) {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const value = conv(o.value);
  return { value, quote: value === null ? null : str(o.quote) };
}

function asItems(raw: unknown): Record<string, unknown>[] {
  const items = (raw as { items?: unknown })?.items;
  return Array.isArray(items)
    ? items.filter((i): i is Record<string, unknown> => !!i && typeof i === "object").slice(0, 60)
    : [];
}

function toCourse(i: Record<string, unknown>): CourseDraft {
  const reqs = Array.isArray(i.requirements) ? i.requirements : [];
  return {
    name: quoted(i.name, str),
    faculty: quoted(i.faculty, str),
    qualification_type: quoted(i.qualification_type, str),
    duration_years: quoted(i.duration_years, num),
    min_aps: quoted(i.min_aps, num),
    field_of_study: str(i.field_of_study),
    requires_nbt: quoted(i.requires_nbt, bool),
    requirements: reqs
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .slice(0, 15)
      .map((r) => ({
        subject: str(r.subject) ?? "",
        min_level: num(r.min_level),
        min_percentage: num(r.min_percentage),
        quote: str(r.quote),
      }))
      .filter((r) => r.subject),
    uncertain: i.uncertain === true,
    notes: str(i.notes),
  };
}

function toBursary(i: Record<string, unknown>): BursaryDraft {
  return {
    name: quoted(i.name, str),
    provider: quoted(i.provider, str),
    website_url: quoted(i.website_url, str),
    value_description: quoted(i.value_description, str),
    fields: strList(i.fields),
    citizenship: strList(i.citizenship),
    provinces: strList(i.provinces).map((p) => p.toUpperCase()),
    min_percentage_avg: quoted(i.min_percentage_avg, num),
    household_income_max: quoted(i.household_income_max, num),
    disability_only: quoted(i.disability_only, bool),
    opens_at: quoted(i.opens_at, str),
    closes_at: quoted(i.closes_at, str),
    cycle_year: quoted(i.cycle_year, num),
    uncertain: i.uncertain === true,
    notes: str(i.notes),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function extractDrafts(
  contentType: ContentType,
  chunk: string,
  context: {
    universityName?: string;
    chunkNumber: number;
    chunkCount: number;
    /** The same pages as a PDF, or the photo/screenshot, for an AI that reads files (Gemini). */
    file?: AttachedFile;
    /** The text below is an AI transcription of an image, not a PDF text layer. */
    fromImage?: boolean;
    pages?: { from: number; to: number };
  },
): Promise<{ drafts: (CourseDraft | BursaryDraft)[]; model: string }> {
  const header =
    contentType === "courses"
      ? `University: ${context.universityName ?? "unknown"}. Extract every undergraduate programme in this section that has entry requirements.`
      : "Extract the bursary (or bursaries) described in this text.";
  const where = context.fromImage
    ? `This is image ${context.chunkNumber} of ${context.chunkCount} (a photo or screenshot); skip anything cut off at the edges.`
    : context.pages
      ? `This is pages ${context.pages.from}-${context.pages.to} (section ${context.chunkNumber} of ${context.chunkCount}); programmes may continue from or onto other pages — skip any you can't see fully.`
      : `This is section ${context.chunkNumber} of ${context.chunkCount}; programmes may be cut off at the edges — skip any you can't see fully.`;
  const withFile = Boolean(context.file) && provider() === "gemini";
  const user =
    withFile && context.fromImage
      ? `${header}\n${where}\n\nThe attached image is the document: read it carefully, including tables. Below is a word-for-word transcription of the same image. For every "quote", copy the words EXACTLY as they appear in this transcription whenever they are there, so they can be checked automatically.\n\n<transcription>\n${chunk}\n</transcription>`
      : withFile
        ? `${header}\n${where}\n\nThe attached PDF is the document: read it carefully, including tables. Below is the text layer extracted from the same pages. For every "quote", copy the words EXACTLY as they appear in this text layer whenever they are there, so they can be checked automatically. If the text layer is empty or garbled (e.g. a scanned page), copy the words exactly as printed in the PDF.\n\n<text_layer>\n${chunk}\n</text_layer>`
        : `${header}\n${where}\n\n<document>\n${chunk}\n</document>`;
  const { data: raw, model } = await chatJson(
    contentType === "courses" ? COURSE_SYSTEM : BURSARY_SYSTEM,
    user,
    4000,
    withFile ? context.file : undefined,
  );
  const items = asItems(raw);
  return {
    drafts: contentType === "courses" ? items.map(toCourse) : items.map(toBursary),
    model,
  };
}

const TRANSCRIBE_SYSTEM = `You transcribe images of official documents (prospectus pages, bursary posters, notices) word for word.
Rules:
1. Copy ALL visible text exactly as written: same spelling, numbers, symbols and capitalisation. Top to bottom, left to right.
2. Keep line breaks. Write each table row on one line with " | " between cells.
3. Never summarise, correct, translate, explain or add anything.
4. If some text is unreadable, write [unreadable] in its place. Never guess.
Return JSON: {"text": string, "legible": "yes" | "partly" | "no"}`;

/** Word-for-word text of an image, so drafts from it can be quote-checked. */
export async function transcribeImage(
  file: AttachedFile,
): Promise<{ text: string; legible: "yes" | "partly" | "no"; model: string }> {
  if (provider() !== "gemini")
    throw new Error(
      "Reading images needs Gemini. Set GEMINI_API_KEY (and don't set AI_PROVIDER=groq).",
    );
  const { data, model } = await chatJson(TRANSCRIBE_SYSTEM, "Transcribe this image.", 8000, file);
  const raw = data as { text?: unknown; legible?: unknown };
  const text = typeof raw?.text === "string" ? raw.text.slice(0, 60_000) : "";
  const legible = raw?.legible === "yes" || raw?.legible === "partly" ? raw.legible : "no";
  return { text, legible: text.trim() ? legible : "no", model };
}

/** Second, independent pass: does each value match its own quote? */
export async function verifyDrafts(
  drafts: (CourseDraft | BursaryDraft)[],
  /** The model that extracted the drafts; a different one checks them when possible. */
  extractedBy?: string,
): Promise<{ verdicts: (VerifierVerdict | undefined)[]; model: string | null }> {
  if (!drafts.length) return { verdicts: [], model: null };
  const records = drafts.map((d, index) => ({ index, ...d }));
  const { data, model } = await chatJson(
    VERIFIER_SYSTEM,
    JSON.stringify({ records }),
    2000,
    undefined,
    extractedBy,
  );
  const raw = data as { results?: unknown };
  const results = Array.isArray(raw?.results) ? raw.results : [];
  const verdicts = drafts.map((_, index) => {
    const r = results.find((x) => (x as { index?: unknown })?.index === index) as
      Record<string, unknown> | undefined;
    const verdict = r?.verdict;
    if (verdict !== "supported" && verdict !== "not_supported" && verdict !== "unsure")
      return undefined;
    return { verdict, problems: strList(r?.problems).slice(0, 5) } as VerifierVerdict;
  });
  return { verdicts, model };
}
