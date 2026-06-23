import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout-wrapper";
import JobCard from "@/components/job-card";
import {
  Search,
  MapPin,
  Briefcase,
  Loader2,
  SlidersHorizontal,
  X,
  ArrowRight,
} from "lucide-react";

const PROVINCES = [
  "Nationwide",
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];
const JOB_TYPES = [
  "All",
  "Internship",
  "Learnership",
  "Graduate",
  "Bursary",
  "Full-time",
];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("Nationwide");
  const [type, setType] = useState("All");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ province, type, search });
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [province, type, search]);

  useEffect(() => {
    fetchJobs();
  }, [province, type]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const hasFilters = type !== "All" || province !== "Nationwide" || search;

  return (
    <AppLayout>
      {/* Hero */}
      <div className="bg-[#085041] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9FE1CB] mb-4">
              Careers & Opportunities
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
              Jobs built for
              <br />
              SA students
            </h1>
            <p className="text-lg text-[#9FE1CB] mb-8 leading-relaxed">
              Internships, learnerships, graduate programmes and full-time roles
              — all verified and updated daily.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                <Search size={18} className="text-[#999] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search job title, company or skill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-[#085041] font-medium w-full text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-[#FAC775] text-[#085041] px-6 py-3 rounded-xl font-black text-sm hover:bg-yellow-300 transition-all flex-shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        <div className="absolute -bottom-12 -right-12 opacity-[0.06] select-none pointer-events-none">
          <Briefcase size={320} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-white border-b border-[#E8E7E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 divide-x divide-[#E8E7E3]">
            {[
              { label: "Live listings", value: loading ? "—" : jobs.length },
              { label: "New this week", value: "12" },
              { label: "Closing ≤7 days", value: "8" },
              { label: "Featured", value: "5" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-4 flex-1 text-center">
                <p className="text-2xl font-black text-[#085041]">{s.value}</p>
                <p className="text-xs text-[#888] font-medium mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-56 flex-shrink-0">
            <div
              className="bg-white rounded-2xl p-5 sticky top-24"
              style={{ border: "1.5px solid #E8E7E3" }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="flex items-center gap-2 text-sm font-black text-[#085041]">
                  <SlidersHorizontal size={15} /> Filters
                </span>
                {hasFilters && (
                  <button
                    onClick={() => {
                      setType("All");
                      setProvince("Nationwide");
                      setSearch("");
                    }}
                    className="text-xs text-[#1D9E75] font-bold flex items-center gap-1 hover:text-[#085041]"
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-3">
                  Type
                </p>
                <div className="flex flex-col gap-1">
                  {JOB_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: type === t ? "#085041" : "transparent",
                        color: type === t ? "#ffffff" : "#555555",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-3">
                  Province
                </p>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-[#EFEFEB] border-none rounded-xl px-3 py-2.5 text-sm font-semibold text-[#085041] focus:ring-2 ring-[#1D9E75]"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2
                  size={36}
                  className="text-[#1D9E75] animate-spin mb-3"
                />
                <p className="text-sm text-[#555] font-medium">
                  Loading opportunities...
                </p>
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-[#555]">
                    <strong className="text-[#085041]">{jobs.length}</strong>{" "}
                    opportunities found
                  </p>
                  {type !== "All" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-[#E1F5EE] text-[#085041] px-3 py-1 rounded-full">
                      {type}{" "}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-[#1D9E75]"
                        onClick={() => setType("All")}
                      />
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </>
            ) : (
              <div
                className="text-center py-20 bg-white rounded-2xl"
                style={{ border: "1.5px dashed #E8E7E3" }}
              >
                <Search
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: "#E8E7E3" }}
                />
                <h3 className="text-xl font-black text-[#085041] mb-2">
                  No results found
                </h3>
                <p className="text-sm text-[#555] mb-6 max-w-xs mx-auto">
                  Try broadening your search or clearing the filters.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setProvince("Nationwide");
                    setType("All");
                  }}
                  className="bg-[#1D9E75] text-white px-6 py-2.5 rounded-xl font-bold text-sm"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employer CTA */}
      <section className="py-16 bg-[#EFEFEB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="rounded-3xl px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ backgroundColor: "#FAC775" }}
          >
            <div className="text-left">
              <h3 className="text-2xl font-black text-[#085041] mb-2">
                Hiring? Reach SA's top students.
              </h3>
              <p className="text-[#085041]/80 text-sm">
                Post internships, learnerships and grad roles from R950.
              </p>
            </div>
            <a
              href="/admin"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-[#085041] text-white px-7 py-3.5 rounded-xl font-black text-sm hover:bg-[#0c6b57] transition-all"
            >
              Post a listing <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
