import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/site/placeholder-page";

export const Route = createFileRoute("/bursaries")({
  head: () => ({ meta: [{ title: "Bursaries — Zenzele Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="We're checking every deadline"
      title="The bursary directory is coming"
      description="A verified list of national bursaries — who they're for, what they cover, and when they close — so you never miss one."
      points={[
        "Filter by field of study, province, and your profile.",
        "See closing dates up front, sorted by what's due soonest.",
        "Direct apply links — Zenzele Guide never charges you a cent.",
      ]}
    />
  ),
});
