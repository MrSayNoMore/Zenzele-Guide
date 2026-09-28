// Server-only: calls the AI that drafts imports. Two providers:
// - Gemini (preferred): reads PDF pages directly, including tables and scans.
//   Secret: GEMINI_API_KEY. Optional: GEMINI_MODEL, GEMINI_BASE_URL.
// - Groq: text only. Secret: GROQ_API_KEY. Optional: GROQ_MODEL, GROQ_BASE_URL.
// AI_PROVIDER ("gemini" | "groq") picks one; otherwise Gemini is used when its
// key is set.
import type { BursaryDraft, ContentType, CourseDraft, VerifierVerdict } from "./shared";
import { serverEnv } from "@/lib/server-env";

const GEMINI_DEFAULT_MODEL = "gemini-flash-latest";
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

export function aiInfo() {
  const p = provider();
  return {
    provider: p,
    model: aiModel(),
    readsPdf: p === "gemini",
    configured: Boolean(p === "gemini" ? serverEnv("GEMINI_API_KEY") : serverEnv("GROQ_API_KEY")),
  };
}

export function aiModel(): string {
  return provider() === "gemini"
    ? serverEnv("GEMINI_MODEL") || GEMINI_DEFAULT_MODEL
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

/** One AI call that must return JSON. `pdfBase64` is only read by Gemini. */
async function chatJson(
  system: string,
  user: string,
  maxTokens: number,
  pdfBase64?: string,
): Promise<unknown> {
  return provider() === "gemini"
    ? geminiJson(system, user, maxTokens, pdfBase64)
    : groqJson(system, user, maxTokens);
}

async function geminiJson(
  system: string,
  user: string,
  maxTokens: number,
  pdfBase64?: string,
): Promise<unknown> {
  const key = serverEnv("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY isn't set. Add it as a Worker secret in Cloudflare.");
  const base = serverEnv("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta";

  const parts: Record<string, unknown>[] = [];
  if (pdfBase64) parts.push({ inline_data: { mime_type: "application/pdf", data: pdfBase64 } });
  parts.push({ text: user });

  const res = await fetch(`${base}/models/${encodeURIComponent(aiModel())}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0,
        // Generous: newer models spend part of this budget thinking.
        maxOutputTokens: Math.max(maxTokens * 4, 16_000),
        responseMimeType: "application/json",
      },
    }),
  });

  if (res.status === 429 || res.status === 503) {
    const body = (await res.json().catch(() => null)) as GeminiError | null;
    throw geminiLimitError(res.status, body);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
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
  if (!text) {
    const reason = data.promptFeedback?.blockReason ?? candidate?.finishReason ?? "no answer";
    throw new Error(
      reason === "MAX_TOKENS"
        ? "This section had too much for the AI to answer in one go. Import fewer pages at a time."
        : `The AI didn't answer (${reason}). Try this section again, or use Paste text.`,
    );
  }
  if (candidate?.finishReason === "MAX_TOKENS")
    throw new Error(
      "This section had too much for the AI to answer in one go. Import fewer pages at a time.",
    );
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

/**
 * Turns a Gemini 429/503 into either a wait-and-retry (per-minute limits, busy
 * servers) or a clear error that retrying won't fix (daily limit used up, or
 * no free quota for this model on this key).
 */
export function geminiLimitError(status: number, body: GeminiError | null): Error {
  const model = aiModel();
  const details = body?.error?.details ?? [];
  const message = (body?.error?.message ?? "").split("\n")[0].slice(0, 200);
  const violations = details.flatMap((d) => d.violations ?? []);
  const delay = details.find((d) => d.retryDelay)?.retryDelay;

  if (status === 429) {
    const noQuota =
      violations.some((v) => v.quotaValue === "0") ||
      /\blimit: 0\b/.test(body?.error?.message ?? "");
    if (noQuota) {
      return new Error(
        `Your Gemini key has no free quota for ${model}. In Cloudflare, set GEMINI_MODEL to a model that's free for your key (e.g. gemini-2.5-flash), or turn on billing in Google AI Studio.`,
      );
    }
    if (violations.some((v) => /PerDay/i.test(`${v.quotaId ?? ""} ${v.quotaMetric ?? ""}`))) {
      return new Error(
        `Gemini's free daily limit for ${model} is used up. It resets at midnight Pacific time (about 09:00 in South Africa): open this import then and use Retry. Or set GEMINI_MODEL in Cloudflare to another Gemini model, which has its own daily limit.`,
      );
    }
  }
  return new RateLimitError(
    clampRetry(delay ? parseFloat(delay) : status === 503 ? 20 : 30),
    status === 503 ? "Gemini is busy right now" : message || "Gemini's per-minute limit",
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
    /** The same pages as a PDF, for an AI that reads PDFs (Gemini). */
    pdfBase64?: string;
    pages?: { from: number; to: number };
  },
): Promise<(CourseDraft | BursaryDraft)[]> {
  const header =
    contentType === "courses"
      ? `University: ${context.universityName ?? "unknown"}. Extract every undergraduate programme in this section that has entry requirements.`
      : "Extract the bursary (or bursaries) described in this text.";
  const where = context.pages
    ? `This is pages ${context.pages.from}-${context.pages.to} (section ${context.chunkNumber} of ${context.chunkCount}); programmes may continue from or onto other pages — skip any you can't see fully.`
    : `This is section ${context.chunkNumber} of ${context.chunkCount}; programmes may be cut off at the edges — skip any you can't see fully.`;
  const withPdf = Boolean(context.pdfBase64) && provider() === "gemini";
  const user = withPdf
    ? `${header}\n${where}\n\nThe attached PDF is the document: read it carefully, including tables. Below is the text layer extracted from the same pages. For every "quote", copy the words EXACTLY as they appear in this text layer whenever they are there, so they can be checked automatically. If the text layer is empty or garbled (e.g. a scanned page), copy the words exactly as printed in the PDF.\n\n<text_layer>\n${chunk}\n</text_layer>`
    : `${header}\n${where}\n\n<document>\n${chunk}\n</document>`;
  const raw = await chatJson(
    contentType === "courses" ? COURSE_SYSTEM : BURSARY_SYSTEM,
    user,
    4000,
    withPdf ? context.pdfBase64 : undefined,
  );
  const items = asItems(raw);
  return contentType === "courses" ? items.map(toCourse) : items.map(toBursary);
}

/** Second, independent pass: does each value match its own quote? */
export async function verifyDrafts(
  drafts: (CourseDraft | BursaryDraft)[],
): Promise<(VerifierVerdict | undefined)[]> {
  if (!drafts.length) return [];
  const records = drafts.map((d, index) => ({ index, ...d }));
  const raw = (await chatJson(VERIFIER_SYSTEM, JSON.stringify({ records }), 2000)) as {
    results?: unknown;
  };
  const results = Array.isArray(raw?.results) ? raw.results : [];
  return drafts.map((_, index) => {
    const r = results.find((x) => (x as { index?: unknown })?.index === index) as
      Record<string, unknown> | undefined;
    const verdict = r?.verdict;
    if (verdict !== "supported" && verdict !== "not_supported" && verdict !== "unsure")
      return undefined;
    return { verdict, problems: strList(r?.problems).slice(0, 5) };
  });
}
