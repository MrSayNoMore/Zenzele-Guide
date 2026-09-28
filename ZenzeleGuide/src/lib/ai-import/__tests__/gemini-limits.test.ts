import { afterEach, describe, expect, it } from "vitest";
import { geminiLimitError, RateLimitError } from "../ai.server";

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

describe("geminiLimitError", () => {
  afterEach(() => {
    delete process.env.GEMINI_MODEL;
  });

  it("waits and retries on a per-minute limit, with Google's reason", () => {
    const e = geminiLimitError(
      429,
      quota("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", "10", "34s"),
    );
    expect(e).toBeInstanceOf(RateLimitError);
    expect((e as RateLimitError).retryAfterSeconds).toBe(34);
    expect((e as RateLimitError).reason).toMatch(/exceeded your current quota/);
  });

  it("stops with a clear message when the daily limit is used up", () => {
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    const e = geminiLimitError(
      429,
      quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier", "20", "20s"),
    );
    expect(e).not.toBeInstanceOf(RateLimitError);
    expect(e.message).toMatch(/free daily limit for gemini-3.8-flash is used up/);
  });

  it("stops when the key has no free quota for the model", () => {
    const e = geminiLimitError(
      429,
      quota("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", "0"),
    );
    expect(e).not.toBeInstanceOf(RateLimitError);
    expect(e.message).toMatch(/no free quota/);
  });

  it("treats 503 as busy and retries", () => {
    const e = geminiLimitError(503, null);
    expect(e).toBeInstanceOf(RateLimitError);
    expect((e as RateLimitError).reason).toBe("Gemini is busy right now");
  });
});
