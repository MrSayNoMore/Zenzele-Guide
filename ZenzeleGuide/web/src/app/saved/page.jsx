import React from "react";
import AppLayout from "@/components/layout-wrapper";
import JobCard from "@/components/job-card";
import BursaryCard from "@/components/bursary-card";
import { useSaved } from "@/utils/useSaved";
import { Heart, Briefcase, GraduationCap, ArrowRight } from "lucide-react";

export default function SavedPage() {
  // Select the raw maps (stable references) and derive arrays outside the
  // selector to avoid re-render loops.
  const jobsMap = useSaved((s) => s.jobs);
  const bursariesMap = useSaved((s) => s.bursaries);
  const jobs = Object.values(jobsMap);
  const bursaries = Object.values(bursariesMap);
  const total = jobs.length + bursaries.length;

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
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Heart className="text-brand-mint" size={24} fill="#9FE1CB" />
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Your shortlist
          </h1>
          <p className="mt-3 max-w-xl text-brand-mint">
            {total > 0
              ? `${total} saved item${total === 1 ? "" : "s"}, kept on this device — no account needed.`
              : "Tap the heart on any job or bursary to keep it here for later."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {total === 0 ? (
          <div
            className="rounded-2xl bg-white py-20 text-center"
            style={{ border: "1.5px dashed #E8E7E3" }}
          >
            <Heart size={48} className="mx-auto mb-4" style={{ color: "#E8E7E3" }} />
            <h3 className="mb-2 text-xl font-extrabold text-brand-deep">
              Nothing saved yet
            </h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-[#475569]">
              Browse jobs and bursaries and tap the heart to build your shortlist.
              It stays here even after you close the page.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-deep px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0c6b57]"
              >
                Browse jobs <ArrowRight size={15} />
              </a>
              <a
                href="/bursaries"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E7E3] px-6 py-3 text-sm font-bold text-brand-deep transition-colors hover:border-brand-green hover:text-brand-green"
              >
                Browse bursaries
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Saved jobs */}
            {jobs.length > 0 && (
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-deep text-white">
                    <Briefcase size={18} />
                  </div>
                  <h2 className="text-lg font-extrabold uppercase tracking-wider text-brand-deep">
                    Saved jobs ({jobs.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* Saved bursaries */}
            {bursaries.length > 0 && (
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold text-brand-deep">
                    <GraduationCap size={18} />
                  </div>
                  <h2 className="text-lg font-extrabold uppercase tracking-wider text-brand-deep">
                    Saved bursaries ({bursaries.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {bursaries.map((bursary) => (
                    <BursaryCard key={bursary.id} bursary={bursary} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
