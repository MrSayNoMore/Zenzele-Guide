import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { DirectoryShell, LoadError } from "@/components/site/directory";
import { OpportunityFinder } from "@/components/site/opportunity-finder";
import { listOpportunities } from "@/lib/opportunities";

export const Route = createFileRoute("/journey/learnership")({
  head: () => ({
    meta: [
      { title: "Find a learnership or apprenticeship — Zenzele Guide" },
      {
        name: "description",
        content:
          "Tell us your highest qualification and where you live to see verified learnerships and apprenticeships you can apply for, open ones first.",
      },
    ],
  }),
  loader: async () => {
    try {
      return {
        opportunities: await listOpportunities(["learnership", "apprenticeship"]),
        failed: false,
      };
    } catch (e) {
      console.error("Failed to load learnerships", e);
      return { opportunities: [], failed: true };
    }
  },
  component: LearnershipPage,
});

const EDUCATION = ["none", "grade_9", "grade_10", "grade_11", "grade_12", "nqf_4", "certificate", "diploma", "degree"];

function LearnershipPage() {
  const { opportunities, failed } = Route.useLoaderData();
  return (
    <DirectoryShell
      eyebrow="Learnerships"
      title="Earn while you learn"
      description="A learnership or apprenticeship pays you a monthly stipend while you train on the job and work towards a recognised qualification. Tell us about yourself to see the ones you can apply for."
    >
      {failed ? (
        <LoadError />
      ) : (
        <div className="space-y-8">
          <OpportunityFinder
            opportunities={opportunities}
            educationChoices={EDUCATION}
            defaultEducation="grade_12"
            noun="learnerships"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <section className="flex gap-3 rounded-lg border border-border bg-muted/40 p-5 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Stay safe</p>
                <p className="mt-1 text-muted-foreground">
                  Real learnerships never charge you to apply or to get a place. Apply only through
                  the company's official link, and never pay anyone who promises you a spot.
                </p>
              </div>
            </section>
            <section className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
              <p className="font-medium">Other paths</p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <Link
                    to="/journey/tvet"
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    Study a trade at a TVET college <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/opportunities"
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    Browse internships and short courses too <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </DirectoryShell>
  );
}
