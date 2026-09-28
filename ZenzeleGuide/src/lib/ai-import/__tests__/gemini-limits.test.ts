import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  classifyGeminiFailure,
  extractDrafts,
  RateLimitError,
  resetGeminiModelState,
  verifyDrafts,
} from "../ai.server";

const quota = (quotaId: string, quotaValue: string, retryDelay?: string) => ({
  error: {
    code: 429,
    message: `You exceeded your current quota. Quota exceeded for metric: generate_content_free_tier_requests, limit: ${quotaValue}\nPlease retry in 30s.`,
    details: [
      {
        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
        violations: [{ quotaId, quotaMetric: "generate_content_free_tier_requests", quotaValue }],
      },
      ...(retryDelay ? [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay }] : []),
    ],
  },
});
const DAILY = quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier", "20");
const MINUTE = quota("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", "10", "12s");

describe("classifyGeminiFailure", () => {
  it("tells daily, no-quota, per-minute, busy and missing apart", () => {
    expect(classifyGeminiFailure("m", 429, DAILY).kind).toBe("daily");
    expect(
      classifyGeminiFailure(
        "m",
        429,
        quota("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", "0"),
      ).kind,
    ).toBe("no_quota");
    expect(classifyGeminiFailure("m", 429, MINUTE)).toMatchObject({
      kind: "minute",
      waitSeconds: 12,
    });
    expect(classifyGeminiFailure("m", 503, null).kind).toBe("busy");
    expect(classifyGeminiFailure("m", 404, null).kind).toBe("missing");
  });
});

describe("Gemini model fallback", () => {
  const answer = (payload: unknown) =>
    new Response(
      JSON.stringify({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(payload) }] }, finishReason: "STOP" },
        ],
      }),
      { status: 200 },
    );
  const limited = (body: unknown, status = 429) => new Response(JSON.stringify(body), { status });
  let calls: string[];

  beforeEach(() => {
    resetGeminiModelState();
    calls = [];
    process.env.GEMINI_API_KEY = "test";
    process.env.GEMINI_MODELS = "model-a, model-b, model-c";
    delete process.env.AI_PROVIDER;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODELS;
  });

  function stubGemini(responder: (model: string, n: number) => Response) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const model = decodeURIComponent(/models\/([^:]+):/.exec(url)![1]);
        calls.push(model);
        return responder(model, calls.length);
      }),
    );
  }
  const ctx = { chunkNumber: 1, chunkCount: 1 };

  it("moves to the next model when one's daily limit is used up, and skips it afterwards", async () => {
    stubGemini((model) => (model === "model-a" ? limited(DAILY) : answer({ items: [] })));
    const first = await extractDrafts("bursaries", "text", ctx);
    expect(first.model).toBe("model-b");
    await extractDrafts("bursaries", "text", ctx);
    expect(calls).toEqual(["model-a", "model-b", "model-b"]); // model-a not retried
  });

  it("switches models on a per-minute limit or busy server instead of waiting", async () => {
    stubGemini((model) =>
      model === "model-a"
        ? limited(MINUTE)
        : model === "model-b"
          ? limited({}, 503)
          : answer({ items: [] }),
    );
    expect((await extractDrafts("bursaries", "text", ctx)).model).toBe("model-c");
  });

  it("double-checks with a different model from the one that extracted", async () => {
    stubGemini(() => answer({ results: [{ index: 0, verdict: "supported", problems: [] }] }));
    const draft = { name: { value: "x", quote: "x" } } as never;
    const { model, verdicts } = await verifyDrafts([draft], "model-a");
    expect(model).toBe("model-b");
    expect(verdicts[0]?.verdict).toBe("supported");
  });

  it("waits when every model is only at its per-minute limit", async () => {
    stubGemini(() => limited(MINUTE));
    const e = await extractDrafts("bursaries", "text", ctx).catch((err) => err);
    expect(e).toBeInstanceOf(RateLimitError);
    expect(e.retryAfterSeconds).toBe(12);
  });

  it("stops with the list of models when all are out for the day", async () => {
    stubGemini((model) => (model === "model-c" ? limited({}, 404) : limited(DAILY)));
    const e = await extractDrafts("bursaries", "text", ctx).catch((err) => err);
    expect(e).not.toBeInstanceOf(RateLimitError);
    expect(e.message).toMatch(
      /model-a \(daily limit used up\), model-b \(daily limit used up\), model-c \(not available\)/,
    );
  });
});

describe("groqLimitError", () => {
  it("stops on a used-up daily token budget", async () => {
    const { groqLimitError } = await import("../ai.server");
    const e = groqLimitError(
      429,
      420,
      "Rate limit reached for model `llama-3.3-70b-versatile` on tokens per day (TPD): Limit 100000, Used 99650, Requested 3000. Please try again in 7m12.5s.",
    );
    expect(e).not.toBeInstanceOf(RateLimitError);
    expect(e.message).toMatch(/daily limit .* used up \(Groq says try again in 7m12.5s\)/);
  });

  it("waits on a per-minute limit", async () => {
    const { groqLimitError } = await import("../ai.server");
    const e = groqLimitError(
      429,
      8,
      "Rate limit reached for model `llama-3.3-70b-versatile` on tokens per minute (TPM): Limit 12000. Please try again in 7.9s.",
    );
    expect(e).toBeInstanceOf(RateLimitError);
    expect((e as RateLimitError).retryAfterSeconds).toBe(8);
  });
});
