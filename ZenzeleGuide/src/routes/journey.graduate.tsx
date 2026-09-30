import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DirectoryShell, LoadError } from "@/components/site/directory";
import { OpportunityFinder } from "@/components/site/opportunity-finder";
import { listOpportunities } from "@/lib/opportunities";

export const Route = createFileRoute("/journey/graduate")({
  head: () => ({
    meta: [
      { title: "Graduate programmes and internships — Zenzele Guide" },
      {
        name: "description",
        content:
          "Just finished your diploma or degree? See verified graduate programmes and internships in your field, open ones first.",
      },
    ],
  }),
  loader: async () => {
    try {
      return {
        opportunities: await listOpportunities(["graduate_programme", "internship"]),
        failed: false,
      };
    } catch (e) {
      console.error("Failed to load graduate programmes", e);
      return { opportunities: [], failed: true };
    }
  },
  component: GraduatePage,
});

const EDUCATION = ["nqf_4", "certificate", "diploma", "degree", "postgraduate"];

function GraduatePage() {
  const { opportunities, failed } = Route.useLoaderData();
  return (
    <DirectoryShell
      eyebrow="Graduates"
      title="Your first step after graduating"
      description="Graduate programmes and internships give you paid work experience, training and a mentor. Tell us your qualification and field to see the ones you can apply for."
    >
      {failed ? (
        <LoadError />
      ) : (
        <div className="space-y-8">
          <OpportunityFinder
            opportunities={opportunities}
            educationChoices={EDUCATION}
            defaultEducation="degree"
            noun="graduate programmes and internships"
          />
          <section className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
            <p className="font-medium">Thinking about more study?</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link
                  to="/journey/university"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  Find postgraduate bursaries <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  Explore careers in your field <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </section>
        </div>
      )}
    </DirectoryShell>
  );
}
