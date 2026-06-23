import React from "react";
import AppLayout from "@/components/layout-wrapper";
import { FileText } from "lucide-react";

const LAST_UPDATED = "15 June 2026";
const CONTACT_EMAIL = "hello@zenzeleguide.co.za";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of these terms",
      body: [
        "By using Zenzele Guide you agree to these terms. If you do not agree, please do not use the platform. These terms are governed by the laws of the Republic of South Africa.",
      ],
    },
    {
      title: "2. What Zenzele Guide is",
      body: [
        "Zenzele Guide is a free guidance tool. We help you estimate your APS score and discover universities, courses, bursaries, jobs and learnerships that may suit you. We are an independent platform and are not affiliated with NSFAS, any university, college, or government department unless explicitly stated.",
      ],
    },
    {
      title: "3. Guidance, not a guarantee",
      body: [
        "Our APS calculations, matches and recommendations are estimates to help you plan. They do not guarantee admission, funding, or employment. Admission requirements, APS scoring, bursary criteria and closing dates are set by the relevant institutions and can change at any time. Always confirm details directly with the official institution before applying or relying on them.",
      ],
    },
    {
      title: "4. Your responsibilities",
      list: [
        "Provide accurate marks and information so your matches are meaningful.",
        "Verify all requirements, amounts and deadlines with the official provider.",
        "Use the platform lawfully and not attempt to disrupt or misuse it.",
      ],
    },
    {
      title: "5. Third-party links and listings",
      body: [
        "Jobs, bursaries and other opportunities often link to third-party websites. We are not responsible for the content, accuracy, or practices of those sites, and your dealings with them are solely between you and that third party.",
      ],
    },
    {
      title: "6. Advertising",
      body: [
        "Zenzele Guide is funded by advertising, which lets us keep the core tools free. Ads are clearly labelled and are never shown during the APS calculator or bursary-matching flows.",
      ],
    },
    {
      title: "7. Intellectual property",
      body: [
        "The Zenzele Guide name, logo, design and original content belong to us. You may use the platform for your personal study and career planning but may not copy or resell our content without permission.",
      ],
    },
    {
      title: "8. Limitation of liability",
      body: [
        "To the extent permitted by law, Zenzele Guide is provided \"as is\" and we are not liable for any loss arising from your use of the platform or reliance on its guidance. Decisions about your studies, funding and career are your own.",
      ],
    },
    {
      title: "9. Changes & contact",
      body: [
        `We may update these terms from time to time; the date below reflects the latest version. Questions? Email us at ${CONTACT_EMAIL}.`,
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
            <FileText className="text-brand-mint" size={24} />
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-brand-mint">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="mb-10 text-lg leading-relaxed text-[#475569]">
          These terms keep things fair and clear. In short: Zenzele Guide is a
          free planning tool whose guidance is helpful but not a guarantee —
          always confirm the important details with the official institution.
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
            This is a general template to support transparency. For terms tailored
            to your business and fully compliant with your obligations, consult a
            qualified attorney.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
