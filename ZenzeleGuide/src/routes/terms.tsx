import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/site/article-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Zenzele Guide" },
      { name: "description", content: "The terms of using Zenzele Guide." },
    ],
  }),
  component: () => (
    <ArticlePage
      title="Terms of use"
      intro="The short version: Zenzele Guide is a free guidance tool. Use it to plan, but always confirm the important details with the institution before you apply."
      updated="June 2026"
    >
      <h2>What Zenzele Guide is</h2>
      <p>
        Zenzele Guide helps you understand what you may qualify for after matric. It is a
        guidance tool, not an official application service and not affiliated with any
        university, college, or funder unless clearly stated.
      </p>

      <h2>Always verify before you apply</h2>
      <p>
        We work hard to keep our data accurate and show you where it came from and when it
        was last checked. Even so, requirements, fees, and deadlines change. Always confirm
        the details on the institution's or bursary's official website before you rely on
        them.
      </p>

      <h2>Free to use</h2>
      <p>
        Zenzele Guide is free for learners. We will never charge you to check your options
        or to apply, and we will never ask you to pay a third party on our behalf.
      </p>

      <h2>Fair use</h2>
      <ul>
        <li>Use the site for your own genuine guidance.</li>
        <li>Don't scrape, resell, or misrepresent our content.</li>
        <li>Don't try to break, overload, or abuse the service.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:support@zenzeleguide.co.za">support@zenzeleguide.co.za</a>. These terms
        will be expanded into a full version before public launch.
      </p>
    </ArticlePage>
  ),
});
