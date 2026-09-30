// What a learner can add to their shortlist (saved_items.kind).
export const SAVED_KINDS = ["course", "bursary", "tvet_program", "opportunity"] as const;
export type SavedKind = (typeof SAVED_KINDS)[number];
