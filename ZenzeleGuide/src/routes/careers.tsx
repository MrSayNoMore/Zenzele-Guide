import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/site/placeholder-page";

export const Route = createFileRoute("/careers")({
  head: () => ({ meta: [{ title: "Careers — Zenzele Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="We're mapping the paths"
      title="Career guides are coming"
      description="Pick a career and we'll show you the subjects, the courses, and the bursaries that lead there — backwards from the job you want."
      points={[
        "See which Grade 10–12 subjects open each door.",
        "Find the university and TVET courses that lead to it.",
        "Discover bursaries tied to that field.",
      ]}
    />
  ),
});
