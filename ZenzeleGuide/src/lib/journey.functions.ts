// Server functions for journey computation.
// Safe to import anywhere - build process handles environment shaking.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  computeAps,
  classifyCourse,
  sortMatches,
  countByStatus,
  evaluateNsfas,
  matchBursaries,
  sortBursaryMatches,
  matchTvetProgrammes,
  countTvetMatches,
} from "@/engine";
import { LearnerProfile } from "@/engine/schemas";
import type { Grade12Result, NsfasResult, BursaryResult, TvetResult } from "@/engine/types";
import { createClock } from "@/engine/shared/clock";
import { ENGINE_VERSION } from "@/engine/version";

// Schemas for server function inputs
const Grade12InputSchema = z.object({
  profile: z.any(), // LearnerProfile validated at runtime by the engine
  anonId: z.string().nullable(),
  userId: z.string().nullable().optional(), // ignored; see resolveUserId
});

const NsfasInputSchema = z.object({
  profile: z.any(),
  anonId: z.string().nullable(),
  userId: z.string().nullable().optional(), // ignored; see resolveUserId
});

const BursaryInputSchema = z.object({
  profile: z.any(),
  anonId: z.string().nullable(),
  userId: z.string().nullable().optional(), // ignored; see resolveUserId
});

const TvetInputSchema = z.object({
  profile: z.any(),
  anonId: z.string().nullable(),
  userId: z.string().nullable().optional(), // ignored; see resolveUserId
});

const GetResultInputSchema = z.object({
  idOrSlug: z.string().min(1),
  anonId: z.string().nullable().optional(),
});

const MigrateAnonInputSchema = z.object({
  anonId: z.string().min(8).max(64),
});

const ClaimResultInputSchema = z.object({
  resultId: z.string().uuid(),
  anonId: z.string().min(8).max(64),
});

const ResultIdSchema = z.object({ resultId: z.string().uuid() });

const ToggleSavedInputSchema = z.object({
  kind: z.enum(["course", "bursary", "tvet_program"]),
  refId: z.string().uuid(),
});

/**
 * Computes and persists Grade 12 university matching results.
 */
export const computeGrade12Match = createServerFn({ method: "POST" })
  .validator(Grade12InputSchema)
  .handler(async ({ data }) => {
    const { fetchAllApsRules, fetchPublishedCourses, persistResult } = await import(
      "./journey.server"
    );

    const profile = data.profile as LearnerProfile;

    // Load all rules and courses
    const [apsRules, courses] = await Promise.all([
      fetchAllApsRules(),
      fetchPublishedCourses(),
    ]);

    if (apsRules.size === 0) {
      throw new Error("No APS rules configured");
    }

    if (courses.length === 0) {
      throw new Error("We're still adding verified university courses. Please check back soon.");
    }

    // Use the first/default APS rule for now
    const defaultRule = apsRules.values().next().value;
    if (!defaultRule) {
      throw new Error("No default APS rule available");
    }

    // Compute APS
    const aps = computeAps(profile, defaultRule);

    // Classify all courses
    const matches = courses
      .filter((course) => course.min_aps != null)
      .map((course) => ({
        ...classifyCourse(
          aps,
          {
            ...course,
            min_aps: course.min_aps ?? 0,
            required_subjects: course.required_subjects.map((s) => ({
              code: s.code as any,
              min_level: s.min_level,
            })),
          },
          profile,
          defaultRule
        ),
        course_name: course.course_name,
        university_name: course.university_name,
        faculty_name: course.faculty_name,
      }));

    // Sort matches by status bucket
    const sortedMatches = sortMatches(matches);

    // Count by status
    const counts = countByStatus(sortedMatches);

    // Build result
    const result: Grade12Result = {
      engine_version: ENGINE_VERSION,
      aps_computations: { default: aps },
      course_matches: sortedMatches,
      aps_rule_version_ids: [defaultRule.rule_id],
      learner_summary: {
        total_aps_avg: aps.total_aps,
        best_aps: aps.total_aps,
        qualifies_count: counts.qualifies,
        borderline_count: counts.borderline,
        below_count: counts.below,
        missing_info_count: counts.missing_info,
      },
    };

    // Persist to database. The owner comes from the verified session token,
    // never from the request body.
    const { resolveUserId } = await import("./journey.server");
    const userId = await resolveUserId();
    const { id, share_slug } = await persistResult(
      "grade_12",
      profile,
      result,
      ENGINE_VERSION,
      [defaultRule.rule_id],
      null,
      userId,
      userId ? null : data.anonId ?? null
    );

    // Store in memory for demo retrieval if database unavailable
    const { storeDemoResult } = await import("./journey.server");
    storeDemoResult(id, {
      id,
      journey: "grade_12",
      inputs: profile,
      output: result,
      engine_version: ENGINE_VERSION,
      aps_rule_version_ids: [defaultRule.rule_id],
      nsfas_rule_version_id: null,
      created_at: new Date().toISOString(),
      share_slug,
    });

    return {
      resultId: id,
      shareSlug: share_slug,
      result,
    };
  });

/**
 * Computes and persists NSFAS eligibility results.
 */
export const computeNsfasCheck = createServerFn({ method: "POST" })
  .validator(NsfasInputSchema)
  .handler(async ({ data }) => {
    const { fetchNsfasRule, persistResult } = await import("./journey.server");

    const profile = data.profile as LearnerProfile;

    const rule = await fetchNsfasRule();
    if (!rule) {
      throw new Error("No NSFAS rule configured");
    }

    // Evaluate NSFAS eligibility
    const outcome = evaluateNsfas(profile, rule);

    // Build result
    const result: NsfasResult = {
      engine_version: ENGINE_VERSION,
      outcome,
      rule_version_id: rule.rule_id,
    };

    // Persist to database. The owner comes from the verified session token,
    // never from the request body.
    const { resolveUserId } = await import("./journey.server");
    const userId = await resolveUserId();
    const { id, share_slug } = await persistResult(
      "nsfas",
      profile,
      result,
      ENGINE_VERSION,
      [],
      rule.rule_id,
      userId,
      userId ? null : data.anonId ?? null
    );

    return {
      resultId: id,
      shareSlug: share_slug,
      result,
    };
  });

/**
 * Computes and persists bursary matching results.
 */
export const computeBursaryMatch = createServerFn({ method: "POST" })
  .validator(BursaryInputSchema)
  .handler(async ({ data }) => {
    const { fetchPublishedBursaries, persistResult } = await import("./journey.server");

    const profile = data.profile as LearnerProfile;

    const bursaries = await fetchPublishedBursaries();
    if (bursaries.length === 0) {
      throw new Error("We're still adding verified bursaries. Please check back soon.");
    }

    // Use current date as reference
    const clock = createClock(new Date().toISOString());

    // Match bursaries
    const matches = matchBursaries(bursaries, profile, clock);

    // Sort by deadline proximity
    const sortedMatches = sortBursaryMatches(matches);

    // Count by status
    const eligible = sortedMatches.filter((m) => m.status === "eligible").length;
    const partiallyEligible = sortedMatches.filter((m) => m.status === "partially_eligible").length;
    const closingSoon = sortedMatches.filter(
      (m) => (m.days_to_close ?? 999) <= 30 && m.status === "eligible"
    ).length;

    // Build result
    const result: BursaryResult = {
      engine_version: ENGINE_VERSION,
      matches: sortedMatches,
      eligible_count: eligible,
      partially_eligible_count: partiallyEligible,
      closing_soon_count: closingSoon,
    };

    // Persist to database. The owner comes from the verified session token,
    // never from the request body.
    const { resolveUserId } = await import("./journey.server");
    const userId = await resolveUserId();
    const { id, share_slug } = await persistResult(
      "bursary",
      profile,
      result,
      ENGINE_VERSION,
      [],
      null,
      userId,
      userId ? null : data.anonId ?? null
    );

    return {
      resultId: id,
      shareSlug: share_slug,
      result,
    };
  });

/**
 * Computes and persists TVET programme matching results.
 */
export const computeTvetMatch = createServerFn({ method: "POST" })
  .validator(TvetInputSchema)
  .handler(async ({ data }) => {
    const { fetchPublishedTvetProgrammes, persistResult } = await import("./journey.server");

    const profile = data.profile as LearnerProfile;

    const programmes = await fetchPublishedTvetProgrammes();
    if (programmes.length === 0) {
      throw new Error("We're still adding verified TVET programmes. Please check back soon.");
    }

    // Match TVET programmes
    const matches = matchTvetProgrammes(programmes, profile);

    // Count by status
    const counts = countTvetMatches(matches);

    // Build result
    const result: TvetResult = {
      engine_version: ENGINE_VERSION,
      matches,
      same_province_count: counts.same_province_count,
      qualifies_count: counts.qualifies,
      borderline_count: counts.borderline,
      below_count: counts.below,
    };

    // Persist to database. The owner comes from the verified session token,
    // never from the request body.
    const { resolveUserId } = await import("./journey.server");
    const userId = await resolveUserId();
    const { id, share_slug } = await persistResult(
      "tvet",
      profile,
      result,
      ENGINE_VERSION,
      [],
      null,
      userId,
      userId ? null : data.anonId ?? null
    );

    return {
      resultId: id,
      shareSlug: share_slug,
      result,
    };
  });

/**
 * Fetches a previously computed result by ID or share slug, plus what the
 * current viewer may do with it (never the raw owner ids).
 */
export const getResult = createServerFn({ method: "GET" })
  .validator(GetResultInputSchema)
  .handler(async ({ data }) => {
    const { fetchResult, fetchResultOwnership, resolveUserId } = await import("./journey.server");

    const result = await fetchResult(data.idOrSlug);
    if (!result) {
      throw new Error("Result not found");
    }

    const [ownership, userId] = await Promise.all([
      fetchResultOwnership(data.idOrSlug),
      resolveUserId(),
    ]);
    const savedToAccount = !!ownership?.user_id && ownership.user_id === userId;
    const createdOnThisDevice =
      !!ownership && !ownership.user_id && !!data.anonId && ownership.anon_id === data.anonId;

    return { ...result, viewer: { savedToAccount, canSave: createdOnThisDevice } };
  });

/**
 * Moves every result created on this device into the signed-in user's account.
 */
export const migrateAnonymousSession = createServerFn({ method: "POST" })
  .validator(MigrateAnonInputSchema)
  .handler(async ({ data }) => {
    const { migrateAnonymousResults, requireUserId } = await import("./journey.server");
    const userId = await requireUserId();
    const count = await migrateAnonymousResults(data.anonId, userId);
    return { migratedCount: count };
  });

/** Saves one result (created on this device) to the signed-in user's account. */
export const claimResult = createServerFn({ method: "POST" })
  .validator(ClaimResultInputSchema)
  .handler(async ({ data }) => {
    const { claimResultForUser, requireUserId } = await import("./journey.server");
    const userId = await requireUserId();
    const ok = await claimResultForUser(data.resultId, data.anonId, userId);
    if (!ok) throw new Error("This result can't be saved to your account.");
    return { ok };
  });

export const listMyResults = createServerFn({ method: "GET" }).handler(async () => {
  const { listResultsForUser, requireUserId } = await import("./journey.server");
  return listResultsForUser(await requireUserId());
});

export const deleteMyResult = createServerFn({ method: "POST" })
  .validator(ResultIdSchema)
  .handler(async ({ data }) => {
    const { deleteResultForUser, requireUserId } = await import("./journey.server");
    await deleteResultForUser(data.resultId, await requireUserId());
    return { ok: true };
  });

export const listMySavedItems = createServerFn({ method: "GET" }).handler(async () => {
  const { listSavedItemsForUser, requireUserId } = await import("./journey.server");
  return listSavedItemsForUser(await requireUserId());
});

/** Ids of everything the signed-in user has saved; empty when signed out. */
export const listMySavedIds = createServerFn({ method: "GET" }).handler(async () => {
  const { listSavedRefIds, resolveUserId } = await import("./journey.server");
  const userId = await resolveUserId();
  return userId ? listSavedRefIds(userId) : ([] as string[]);
});

export const toggleSavedItem = createServerFn({ method: "POST" })
  .validator(ToggleSavedInputSchema)
  .handler(async ({ data }) => {
    const { toggleSavedItemForUser, requireUserId } = await import("./journey.server");
    const saved = await toggleSavedItemForUser(await requireUserId(), data.kind, data.refId);
    return { saved };
  });
