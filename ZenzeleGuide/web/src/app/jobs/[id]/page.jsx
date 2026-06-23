import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout-wrapper";
import JobCard from "@/components/job-card";
import {
  MapPin,
  Clock,
  Share2,
  Heart,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
  Briefcase,
} from "lucide-react";

export default function JobDetailPage(props) {
  const id = props.params?.id;
  const [job, setJob] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const currentJob = Array.isArray(data)
        ? data.find((j) => j.id === id)
        : null;
      setJob(currentJob);
      if (currentJob) {
        const simRes = await fetch(`/api/jobs?type=${currentJob.type}`);
        if (simRes.ok) {
          const simData = await simRes.json();
          setSimilarJobs(simData.filter((j) => j.id !== id).slice(0, 3));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-24 flex justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-t-transparent"
            style={{
              borderColor: "#E8E7E3",
              borderTopColor: "#1D9E75",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style
            jsx
            global
          >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <Briefcase
            size={56}
            className="mx-auto mb-4"
            style={{ color: "#E8E7E3" }}
          />
          <h1 className="text-3xl font-black text-[#085041] mb-3">
            Job not found
          </h1>
          <a href="/jobs" className="text-[#1D9E75] font-bold text-sm">
            ← Back to jobs board
          </a>
        </div>
      </AppLayout>
    );
  }

  const isClosingSoon =
    job.closing_date &&
    new Date(job.closing_date) - new Date() < 7 * 24 * 60 * 60 * 1000;

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8E7E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#888]">
            <a href="/" className="hover:text-[#085041] transition-colors">
              Home
            </a>
            <ChevronRight size={12} />
            <a href="/jobs" className="hover:text-[#085041] transition-colors">
              Jobs
            </a>
            <ChevronRight size={12} />
            <span className="text-[#085041] truncate max-w-xs">
              {job.title}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div
              className="bg-white rounded-2xl overflow-hidden mb-8"
              style={{ border: "1.5px solid #E8E7E3" }}
            >
              {/* Job header */}
              <div
                className="px-8 py-8"
                style={{
                  background:
                    "linear-gradient(135deg, #085041 0%, #167d5c 100%)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                    {(job.company || "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-1 leading-snug">
                      {job.title}
                    </h1>
                    <p className="text-[#9FE1CB] font-semibold text-base mb-3">
                      {job.company}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full">
                        <MapPin size={11} /> {job.location || job.province}
                      </span>
                      {isClosingSoon && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Closing soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-8 py-8">
                {job.description && (
                  <div className="mb-8">
                    <h3 className="text-lg font-black text-[#085041] mb-4">
                      About this opportunity
                    </h3>
                    <p className="text-[#555] leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>
                )}

                {job.requirements && (
                  <div>
                    <h3 className="text-lg font-black text-[#085041] mb-4">
                      Requirements
                    </h3>
                    <div className="space-y-3">
                      {job.requirements
                        .split("\n")
                        .filter((r) => r.trim())
                        .map((req, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2
                              size={18}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: "#1D9E75" }}
                            />
                            <span className="text-[#555] leading-relaxed text-sm">
                              {req}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Similar jobs */}
            {similarJobs.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-[#085041] uppercase tracking-widest mb-4">
                  Similar Opportunities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similarJobs.map((sj) => (
                    <JobCard key={sj.id} job={sj} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky apply card */}
          <div className="lg:col-span-1">
            <div
              className="sticky top-24 bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1.5px solid #E8E7E3",
                boxShadow: "0 4px 24px rgba(8,80,65,0.10)",
              }}
            >
              <div className="p-6 border-b border-[#EFEFEB]">
                {job.stipend && (
                  <div className="mb-5">
                    <p className="text-xs font-black uppercase tracking-widest text-[#888] mb-1">
                      Stipend / Salary
                    </p>
                    <p className="text-2xl font-black text-[#085041]">
                      {job.stipend}
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {job.closing_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#EFEFEB] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock
                          size={16}
                          style={{
                            color: isClosingSoon ? "#EF4444" : "#085041",
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#888]">
                          Closing Date
                        </p>
                        <p
                          className={`font-bold text-sm ${isClosingSoon ? "text-red-500" : "text-[#085041]"}`}
                        >
                          {new Date(job.closing_date).toLocaleDateString(
                            "en-ZA",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#EFEFEB] rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} style={{ color: "#085041" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#888]">
                        Province
                      </p>
                      <p className="font-bold text-sm text-[#085041]">
                        {job.province}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <a
                  href={job.application_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#1D9E75] text-white py-4 rounded-xl font-black text-base hover:bg-[#085041] transition-all mb-3"
                >
                  Apply now <ArrowUpRight size={18} />
                </a>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm border transition-all"
                    style={{
                      backgroundColor: isSaved ? "#FFF7E6" : "#EFEFEB",
                      borderColor: isSaved ? "#FAC775" : "transparent",
                      color: isSaved ? "#085041" : "#555555",
                    }}
                  >
                    <Heart
                      size={16}
                      fill={isSaved ? "#FAC775" : "none"}
                      color={isSaved ? "#FAC775" : "#555"}
                    />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm border border-[#E8E7E3] text-[#555] hover:border-[#085041] hover:text-[#085041] transition-all"
                  >
                    <Share2 size={16} />
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6">
                <p className="text-xs text-center text-[#999]">
                  Mention{" "}
                  <strong className="text-[#085041]">Zenzele Guide</strong> when
                  applying 🙏
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
