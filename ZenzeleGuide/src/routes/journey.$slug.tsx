import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/site/placeholder-page";

type Info = { label: string; title: string; description: string; points: string[] };

const journeys: Record<string, Info> = {
  "grade-12": {
    label: "Grade 12 → University",
    title: "Your Grade 12 journey is almost here",
    description:
      "We're putting the finishing touches on the APS calculator and the university matcher so the answers you get are the real ones.",
    points: [
      "Enter your 7 subject marks once — no account needed.",
      "We compute your APS the way each university actually does it (UCT's FPS, Wits' composite, and more).",
      "See the universities, courses, bursaries, and TVETs you qualify for — with the reasons why.",
    ],
  },
  nsfas: {
    label: "NSFAS eligibility",
    title: "The NSFAS check is on its way",
    description:
      "We're finalising the official NSFAS rules so you get a straight answer about funding — not a guess.",
    points: [
      "Answer a few questions about citizenship and household income.",
      "Get a clear funded / not-funded answer, with the reason behind it.",
      "A checklist of exactly what to prepare for your application.",
    ],
  },
  bursary: {
    label: "Bursary finder",
    title: "The bursary finder is coming",
    description:
      "We're verifying bursaries and their closing dates so you never miss one you qualify for.",
    points: [
      "Filter by field of study, province, and your own profile.",
      "See what you qualify for before the deadline closes.",
      "Direct links to apply — no middlemen, no fees.",
    ],
  },
  tvet: {
    label: "TVET pathway",
    title: "The TVET pathway is coming",
    description:
      "We're loading NC(V) and Report 191 programmes from public TVET colleges across the country.",
    points: [
      "Find programmes that match your grade and subjects.",
      "See colleges in your province first.",
      "Clear entry requirements — no guesswork.",
    ],
  },
};

export const Route = createFileRoute("/journey/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${journeys[params.slug]?.label ?? "Your journey"} — Zenzele Guide` }],
  }),
  component: JourneyPage,
});

function JourneyPage() {
  const { slug } = Route.useParams();
  const info =
    journeys[slug] ?? {
      label: "Your journey",
      title: "This journey is coming soon",
      description:
        "We're building this path step by step. In the meantime, start with one of the journeys that's ready.",
      points: [],
    };

  return (
    <PlaceholderPage
      eyebrow="We're building this — launching for the 2027 intake"
      title={info.title}
      description={info.description}
      points={info.points}
    />
  );
}
