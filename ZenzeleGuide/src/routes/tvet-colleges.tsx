import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/site/placeholder-page";

export const Route = createFileRoute("/tvet-colleges")({
  head: () => ({ meta: [{ title: "TVET colleges — Zenzele Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="We're loading the programmes"
      title="TVET college pages are coming"
      description="A page for every public TVET college and its programmes — NC(V) and Report 191 — with the real entry requirements."
      points={[
        "Programmes matched to your grade and subjects.",
        "Colleges in your province surfaced first.",
        "Honest entry requirements, verified from official sources.",
      ]}
    />
  ),
});
