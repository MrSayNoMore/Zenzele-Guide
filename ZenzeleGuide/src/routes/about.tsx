import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/site/article-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our mission — Zenzele Guide" },
      {
        name: "description",
        content:
          "Why Zenzele Guide exists: free, honest, mobile-first guidance for every South African learner deciding what comes after matric.",
      },
    ],
  }),
  component: () => (
    <ArticlePage
      title="Do it yourself — but not alone"
      intro="Every year hundreds of thousands of South African learners reach the end of matric with no clear idea of what they qualify for. Most have never met a guidance counsellor. We're changing that."
    >
      <p>
        <em>Zenzele</em> means "do it yourself" in isiZulu and isiXhosa — one of the
        most empowering words in our languages. Paired with <em>Guide</em>, it's the
        whole idea: you take charge of your future, but you never have to figure it out
        alone.
      </p>

      <h2>What we believe</h2>
      <ul>
        <li>
          <strong>Guidance should be free.</strong> Deciding your future shouldn't depend
          on whether your school had a counsellor or your family could pay for one.
        </li>
        <li>
          <strong>Answers must be honest.</strong> We compute your APS the way each
          institution actually does, and we tell you <em>why</em> you qualify or don't —
          no false hope, no made-up numbers.
        </li>
        <li>
          <strong>It must work on any phone.</strong> Built to be fast and light on data,
          for a budget Android on a slow connection — because that's the reality for most
          of the learners we're here for.
        </li>
        <li>
          <strong>Ubuntu.</strong> Your success lifts your family and your community. When
          one of us rises, we all rise.
        </li>
      </ul>

      <h2>Who it's for</h2>
      <p>
        For the first-generation student whose parents never went to university. For the
        learner in a rural school with no counsellor. For anyone staring at their marks
        and wondering, "what now?" This is for you — and it always will be free.
      </p>
    </ArticlePage>
  ),
});
