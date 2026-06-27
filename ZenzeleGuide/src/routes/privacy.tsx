import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/site/article-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy (POPIA) — Zenzele Guide" },
      {
        name: "description",
        content:
          "How Zenzele Guide handles your information under the Protection of Personal Information Act (POPIA).",
      },
    ],
  }),
  component: () => (
    <ArticlePage
      title="Privacy notice (POPIA)"
      intro="Plain-language summary of how we handle your information. We collect as little as possible, and you stay in control."
      updated="June 2026"
    >
      <h2>You can use Zenzele Guide without an account</h2>
      <p>
        You don't have to sign up or give us your name to use any journey. When you use the
        site anonymously, your answers are kept on your own device, linked only to a random
        ID that isn't tied to your identity.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your inputs</strong> (like subject marks or income band) — used only to
          compute your results, and stored against an anonymous ID or, if you sign up, your
          account.
        </li>
        <li>
          <strong>If you create an account</strong> — your email address, so you can save
          results across devices and opt in to deadline reminders.
        </li>
        <li>
          <strong>Anonymous usage events</strong> — to understand which journeys help, so we
          can improve them. These are not used to identify you.
        </li>
      </ul>

      <h2>What we don't do</h2>
      <ul>
        <li>We never sell your personal information.</li>
        <li>We don't put your name or email in any shareable link.</li>
        <li>We don't ask for an account before showing you value.</li>
      </ul>

      <h2>Where your data lives</h2>
      <p>
        Your data is stored with our managed database provider in the EU-West region. Pages
        are served from the edge for speed.
      </p>

      <h2>Your rights under POPIA</h2>
      <p>
        You have the right to access, correct, and delete your personal information, and to
        withdraw consent for reminder emails at any time. If you have an account, you can
        delete it and all associated data from your account settings. To make any other
        request, contact us at{" "}
        <a href="mailto:hello@zenzeleguide.co.za">hello@zenzeleguide.co.za</a>.
      </p>

      <h2>Minors</h2>
      <p>
        Many of our users are under 18. We collect only what's needed to help, and we
        encourage learners under 18 to involve a parent or guardian in big decisions.
      </p>

      <p>
        This is a plain-language summary and will be expanded into a full notice before
        public launch.
      </p>
    </ArticlePage>
  ),
});
