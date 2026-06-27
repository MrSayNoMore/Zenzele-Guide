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
  "grade-11": {
    label: "Grade 11",
    title: "Grade 11 — set yourself up now",
    description:
      "The marks you lock in this year shape what you can do after matric. We're building a tool to show you where your current marks point, and how to lift your APS in time.",
    points: [
      "See the universities and courses your current marks reach.",
      "Find out exactly how many points you still need.",
      "Keep the most doors open before final exams.",
    ],
  },
  "grade-10": {
    label: "Grade 10",
    title: "Grade 10 — choose subjects with the end in mind",
    description:
      "Subject choice quietly decides which careers stay open to you. We're building a guide that works backwards — from the career you want to the subjects you should take.",
    points: [
      "Pick a career and see the subjects it needs.",
      "Avoid closing doors by accident.",
      "Plan for the APS your dream course asks for.",
    ],
  },
  "gap-year": {
    label: "Gap year",
    title: "Taking a gap year — make it count",
    description:
      "A gap year can be a launchpad, not a detour. We're gathering learnerships, short courses, and other paths so your year off still moves you forward.",
    points: [
      "Find learnerships and skills programmes.",
      "Short courses that build toward your goal.",
      "Plan your application for the next intake.",
    ],
  },
  learnership: {
    label: "Learnership",
    title: "Learnerships — earn while you learn",
    description:
      "We're collecting SETA-accredited learnerships across South Africa, so you can find a paid, practical path to a real qualification.",
    points: [
      "Search learnerships by field and province.",
      "See stipends and entry requirements up front.",
      "Apply directly — no fees, ever.",
    ],
  },
  graduate: {
    label: "Graduate",
    title: "Just graduated — what's next",
    description:
      "Finished your qualification? We're building a hub for graduate programmes, internships, and first jobs so your next step is as clear as your first one was.",
    points: [
      "Graduate programmes and internships.",
      "Entry-level roles that match your field.",
      "Tips for your first real applications.",
    ],
  },
  university: {
    label: "At university",
    title: "At university — fund the next step",
    description:
      "Already studying? We're adding postgraduate funding and career planning so your journey doesn't stop at first year.",
    points: [
      "Postgrad bursaries and funding.",
      "Plan from your degree to a career.",
      "Stay ahead of funding deadlines.",
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
