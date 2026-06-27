import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/site/placeholder-page";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Zenzele Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="No login needed"
      title="You don't need an account to start"
      description="Zenzele Guide is free and works with no sign-up. Accounts — to save your results across devices and get bursary deadline reminders — are coming soon."
      points={[
        "Use every journey right now, no login.",
        "Soon: save your shortlist and sync it across your phone and a library PC.",
        "Soon: opt in to reminders before a bursary closes.",
      ]}
    />
  ),
});
