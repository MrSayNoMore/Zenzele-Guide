import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/site/placeholder-page";

export const Route = createFileRoute("/universities")({
  head: () => ({ meta: [{ title: "Universities — Zenzele Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="We're verifying the data"
      title="University pages are on the way"
      description="We're building a page for every university and course — with real APS rules, requirements, fees, and dates, each one checked by a human."
      points={[
        "Starting with UCT, Wits, UP, UJ, Stellenbosch, and UKZN.",
        "Per-course requirements, not a generic listing.",
        "Every record shows its source and the date it was last verified.",
      ]}
    />
  ),
});
