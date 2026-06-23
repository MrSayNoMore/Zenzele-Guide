import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout-wrapper";
import BursaryCard from "@/components/bursary-card";
import {
  MapPin,
  GraduationCap,
  Loader2,
  SlidersHorizontal,
  X,
  ArrowRight,
  CheckCircle2,
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
const CATEGORIES = [
  "All",
  "NSFAS",
  "Engineering",
  "Medicine",
  "Business",
  "Teaching",
  "Science",
  "Law",
  "Arts",
];

export default function BursariesPage() {
  const [bursaries, setBursaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [province, setProvince] = useState("Nationwide");

  const fetchBursaries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ province, category });
      const res = await fetch(`/api/bursaries?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBursaries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [province, category]);

  useEffect(() => {
    fetchBursaries();
  }, [province, category]);

  const hasFilters = category !== "All" || province !== "Nationwide";

  return (
    <AppLayout>
      {/* Hero */}
      <div className="bg-[#1D9E75] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#E1F5EE]/80 mb-4">
              Student Funding
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
              Bursaries &<br />
              Financial Aid
            </h1>
            <p className="text-lg text-[#E1F5EE] mb-8 leading-relaxed">
              Don't let money stop you from studying. We've indexed 150+
              bursaries — filtered by your APS score, field of study, and
              province.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "150+ Bursaries indexed" },
                { label: "85+ cover full tuition" },
                { label: "NSFAS guidance included" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 text-sm font-semibold text-white"
                >
                  <CheckCircle2 size={14} className="text-[#FAC775]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-12 -right-12 opacity-[0.06] select-none pointer-events-none">
          <GraduationCap size={320} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
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
                      setCategory("All");
                      setProvince("Nationwide");
                    }}
                    className="text-xs text-[#1D9E75] font-bold flex items-center gap-1 hover:text-[#085041]"
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-3">
                  Category
                </p>
                <div className="flex flex-col gap-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className="text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor:
                          category === c ? "#1D9E75" : "transparent",
                        color: category === c ? "#ffffff" : "#555555",
                      }}
                    >
                      {c}
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
                  className="text-[#1D9E75] mb-3"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <p className="text-sm text-[#555] font-medium">
                  Scanning for opportunities...
                </p>
                <style
                  jsx
                  global
                >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : bursaries.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-[#555]">
                    <strong className="text-[#085041]">
                      {bursaries.length}
                    </strong>{" "}
                    bursaries available
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {bursaries.map((bursary) => (
                    <BursaryCard key={bursary.id} bursary={bursary} />
                  ))}
                </div>
              </>
            ) : (
              <div
                className="text-center py-20 bg-white rounded-2xl"
                style={{ border: "1.5px dashed #E8E7E3" }}
              >
                <GraduationCap
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: "#E8E7E3" }}
                />
                <h3 className="text-xl font-black text-[#085041] mb-2">
                  No bursaries found
                </h3>
                <p className="text-sm text-[#555] mb-6 max-w-xs mx-auto">
                  Try broadening your search criteria.
                </p>
                <button
                  onClick={() => {
                    setCategory("All");
                    setProvince("Nationwide");
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

      {/* NSFAS Section */}
      <section className="py-16 bg-[#EFEFEB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-5"
            style={{ border: "1.5px solid #E8E7E3" }}
          >
            <div className="md:col-span-3 bg-white p-10 md:p-12">
              <span className="inline-flex items-center gap-2 bg-[#FAC775] text-[#085041] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-6">
                Most Popular
              </span>
              <h2 className="text-3xl font-black text-[#085041] mb-4 leading-snug">
                Everything you need to know about NSFAS
              </h2>
              <p className="text-[#555555] leading-relaxed mb-6">
                The National Student Financial Aid Scheme (NSFAS) covers
                tuition, accommodation, books, and a monthly living allowance at
                all public universities and TVET colleges.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  "Full tuition covered",
                  "Monthly food allowance",
                  "Accommodation funding",
                  "Books & stationery",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-[#085041] font-semibold"
                  >
                    <CheckCircle2
                      size={16}
                      className="text-[#1D9E75] flex-shrink-0"
                    />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/blog/how-to-apply-nsfas-2026"
                  className="inline-flex items-center gap-2 bg-[#085041] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0c6b57] transition-all"
                >
                  Read the full guide <ArrowRight size={16} />
                </a>
                <a
                  href="https://www.nsfas.org.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#E8E7E3] text-[#085041] px-6 py-3 rounded-xl font-bold text-sm hover:border-[#085041] transition-all"
                >
                  Official NSFAS portal ↗
                </a>
              </div>
            </div>
            <div
              className="md:col-span-2 p-10 flex flex-col justify-center"
              style={{
                background: "linear-gradient(135deg, #085041 0%, #1D9E75 100%)",
              }}
            >
              <p className="text-[#9FE1CB] text-xs font-black uppercase tracking-widest mb-6">
                NSFAS 2026
              </p>
              {[
                { label: "Max annual value", val: "R134,400+" },
                { label: "Monthly allowance", val: "R1,500" },
                { label: "Eligible institutions", val: "50+ public" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="mb-4 pb-4 border-b border-white/10 last:border-0 last:mb-0 last:pb-0"
                >
                  <p className="text-white/60 text-xs font-medium mb-1">
                    {item.label}
                  </p>
                  <p className="text-white font-black text-xl">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
