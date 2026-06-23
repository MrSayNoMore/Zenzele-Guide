import React from "react";
import AppLayout from "@/components/layout-wrapper";
import { Shield } from "lucide-react";

const LAST_UPDATED = "15 June 2026";
const CONTACT_EMAIL = "hello@zenzeleguide.co.za";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Who we are",
      body: [
        "Zenzele Guide (\"we\", \"us\", \"our\") is a South African platform that helps students, matriculants and youth calculate their APS score and find universities, courses, bursaries, jobs and learnerships. This policy explains what information we collect and how we use it, in line with South Africa's Protection of Personal Information Act (POPIA).",
      ],
    },
    {
      title: "2. Information we collect",
      body: [
        "We are built to work without an account. The information involved is:",
      ],
      list: [
        "Marks & preferences you enter — the subject marks, interests, province and funding preferences you type into the APS calculator. These are used to generate your matches and are not tied to your name.",
        "Items you save — if you shortlist jobs or bursaries, these are stored only in your own browser (local storage), not on our servers.",
        "Basic usage data — pages visited and general device/browser information, collected automatically to keep the site running and improve it.",
      ],
    },
    {
      title: "3. Cookies & advertising",
      body: [
        "We use cookies and similar technologies to run the site and to show advertising that helps keep Zenzele Guide free.",
        "Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the internet.",
        "You can opt out of personalised advertising by visiting Google's Ads Settings (google.com/settings/ads), and you can opt out of some third-party vendors' use of cookies for personalised advertising via aboutads.info/choices. You can also block or delete cookies in your browser settings.",
      ],
    },
    {
      title: "4. How we use your information",
      list: [
        "To calculate your APS and match you with courses, bursaries and opportunities.",
        "To operate, maintain, secure and improve the platform.",
        "To display advertising that funds the free service.",
      ],
    },
    {
      title: "5. Sharing your information",
      body: [
        "We do not sell your personal information. When you choose to apply for a job or bursary, you leave our site and are subject to that provider's own privacy practices. Advertising and analytics partners (such as Google) process limited data as described above.",
      ],
    },
    {
      title: "6. Your rights under POPIA",
      body: [
        "You have the right to know what personal information we hold, to ask us to correct or delete it, and to object to certain processing. Because our core tools work without an account, most data never leaves your device. To make a request, email us at the address below.",
      ],
    },
    {
      title: "7. Children & students",
      body: [
        "Our audience includes learners under 18. We collect as little information as possible and never require identifying details to use the APS calculator. If you are under 18, please use Zenzele Guide with the awareness of a parent or guardian.",
      ],
    },
    {
      title: "8. Changes to this policy",
      body: [
        "We may update this policy from time to time. The date below shows when it was last revised. Significant changes will be highlighted on this page.",
      ],
    },
    {
      title: "9. Contact us",
      body: [
        `Questions about this policy or your data? Email us at ${CONTACT_EMAIL}.`,
      ],
    },
  ];

  return (
    <AppLayout>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #063B30 0%, #085041 60%, #1D9E75 130%)" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #1D9E75, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Shield className="text-brand-mint" size={24} />
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-brand-mint">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="mb-10 text-lg leading-relaxed text-[#475569]">
          Your privacy matters. This policy explains, in plain language, what
          Zenzele Guide collects, how we use cookies and advertising, and the
          rights you have under South African law.
        </p>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-3 text-xl font-extrabold text-brand-deep">
                {section.title}
              </h2>
              {section.body?.map((p, j) => (
                <p key={j} className="mb-3 leading-relaxed text-[#475569]">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="mt-2 space-y-2.5">
                  {section.list.map((item, j) => (
                    <li key={j} className="flex gap-3 leading-relaxed text-[#475569]">
                      <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-green" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[#E8E7E3] bg-brand-cream p-6">
          <p className="text-sm leading-relaxed text-[#475569]">
            This is a general privacy policy provided to support transparency and
            advertising requirements. For binding legal advice specific to your
            business, consult a qualified attorney.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
