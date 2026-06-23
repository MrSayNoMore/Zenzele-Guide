import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout-wrapper";
import { calculateAPS, markToAPS } from "@/lib/aps";
import InstitutionCard from "@/components/institution-card";
import BursaryCard from "@/components/bursary-card";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  Target,
  Download,
  School,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";

const SUBJECTS = [
  "Mathematics",
  "Mathematical Literacy",
  "English Home Language",
  "English First Additional Language",
  "Physical Sciences",
  "Life Sciences",
  "Accounting",
  "Business Studies",
  "Economics",
  "History",
  "Geography",
  "Life Orientation",
  "Computer Applications Technology",
  "Information Technology",
  "Visual Arts",
];

const INTERESTS = [
  "Engineering",
  "Medicine",
  "Computer Science",
  "Business",
  "Law",
  "Education",
  "Architecture",
  "Accounting",
  "Design",
  "Social Work",
  "Nursing",
  "Agriculture",
  "Technology",
  "Arts & Humanities",
  "Teaching",
];

const PROVINCES = [
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

const STEP_LABELS = ["Your Marks", "Interests", "Analysing", "Results"];

export default function PortalPage() {
  const [step, setStep] = useState(1);
  const [results, setResults] = useState([
    { subject: "English Home Language", percentage: 0 },
  ]);
  const [interests, setInterests] = useState([]);
  const [province, setProvince] = useState("Gauteng");
  const [funding, setFunding] = useState("Bursary");
  const [institutionType, setInstitutionType] = useState("University");
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [bursaries, setBursaries] = useState([]);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const apsTotal = useMemo(() => calculateAPS(results), [results]);

  const loadingMessages = [
    "Calculating your APS score...",
    "Matching university requirements...",
    "Finding qualifying bursaries...",
    "Checking accommodation options...",
  ];

  useEffect(() => {
    if (!isAnalysing) return;
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 900);
    const timeout = setTimeout(() => {
      handleAnalysis();
    }, 4000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isAnalysing]);

  const handleAnalysis = async () => {
    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aps_score: apsTotal,
          interests,
          province,
          funding,
          institution_type: institutionType,
        }),
      });
      const data = await response.json();
      setRecommendations(data);
      const bRes = await fetch(`/api/bursaries?aps=${apsTotal}`);
      const bData = await bRes.json();
      setBursaries(bData);
      setIsAnalysing(false);
      setStep(4);
    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalysing(false);
    }
  };

  const addSubject = () => {
    if (results.length < 7) {
      setResults([...results, { subject: "Mathematics", percentage: 0 }]);
    }
  };

  const removeSubject = (index) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    const newResults = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  return (
    <AppLayout>
      {/* Page header */}
      <div className="bg-[#085041] py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9FE1CB] mb-2">
            Student Portal
          </p>
          <h1 className="text-3xl font-black text-white mb-1">
            Find your perfect match
          </h1>
          <p className="text-[#9FE1CB] text-sm">
            Takes about 3 minutes · No account needed · 100% free
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center mb-10">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm mb-1.5 transition-all"
                    style={{
                      backgroundColor: isCompleted
                        ? "#1D9E75"
                        : isActive
                          ? "#085041"
                          : "#E8E7E3",
                      color: isCompleted || isActive ? "#ffffff" : "#999",
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : stepNum}
                  </div>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider hidden sm:block"
                    style={{ color: isActive ? "#085041" : "#999" }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 mt-[-14px]"
                    style={{
                      backgroundColor: step > stepNum ? "#1D9E75" : "#E8E7E3",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              border: "1.5px solid #E8E7E3",
              boxShadow: "0 4px 24px rgba(8,80,65,0.07)",
            }}
          >
            <div className="bg-[#EFEFEB] px-7 py-5 border-b border-[#E8E7E3]">
              <h2 className="text-xl font-black text-[#085041]">
                Enter your subject marks
              </h2>
              <p className="text-sm text-[#555] mt-1">
                Add at least 4 subjects to continue. Your APS updates live.
              </p>
            </div>

            <div className="p-7">
              <div className="space-y-3 mb-6">
                {results.map((res, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={res.subject}
                      onChange={(e) =>
                        updateSubject(idx, "subject", e.target.value)
                      }
                      className="flex-1 bg-[#EFEFEB] border-none rounded-xl px-4 py-3 text-sm font-semibold text-[#085041] focus:ring-2 ring-[#1D9E75]"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={res.percentage || ""}
                      placeholder="%"
                      onChange={(e) =>
                        updateSubject(
                          idx,
                          "percentage",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-20 bg-[#EFEFEB] border-none rounded-xl px-3 py-3 font-black text-center text-[#085041] focus:ring-2 ring-[#1D9E75] text-sm"
                      min="0"
                      max="100"
                    />
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[#085041] font-black text-sm flex-shrink-0"
                      style={{ backgroundColor: "#E1F5EE", minWidth: "36px" }}
                    >
                      {markToAPS(res.percentage)}
                    </div>
                    {results.length > 1 && (
                      <button
                        onClick={() => removeSubject(idx)}
                        className="text-[#ccc] hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {results.length < 7 && (
                <button
                  onClick={addSubject}
                  className="flex items-center gap-2 text-sm font-bold text-[#1D9E75] hover:text-[#085041] transition-colors mb-7"
                >
                  <Plus size={15} /> Add another subject
                </button>
              )}

              {/* APS display */}
              <div
                className="rounded-2xl p-5 mb-7 flex items-center justify-between"
                style={{
                  background:
                    "linear-gradient(135deg, #085041 0%, #1D9E75 100%)",
                }}
              >
                <div>
                  <p className="text-[#9FE1CB] text-xs font-black uppercase tracking-widest mb-1">
                    Total APS Score
                  </p>
                  <p className="text-white font-black text-5xl leading-none">
                    {apsTotal}
                  </p>
                  <p className="text-[#9FE1CB] text-xs mt-1">
                    Based on {results.length} subject
                    {results.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs mb-1">Points to reach</p>
                  <p className="text-white font-black text-lg">Wits Eng: 32</p>
                  <p className="text-[#9FE1CB] text-xs">UCT BSc: 30</p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={results.filter((r) => r.percentage > 0).length < 4}
                className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#085041", color: "#ffffff" }}
              >
                Continue: Pick Interests <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              border: "1.5px solid #E8E7E3",
              boxShadow: "0 4px 24px rgba(8,80,65,0.07)",
            }}
          >
            <div className="bg-[#EFEFEB] px-7 py-5 border-b border-[#E8E7E3]">
              <h2 className="text-xl font-black text-[#085041]">
                What do you want to study?
              </h2>
              <p className="text-sm text-[#555] mt-1">
                Select all fields that interest you. Pick as many as you like.
              </p>
            </div>
            <div className="p-7">
              <p className="text-xs font-black uppercase tracking-widest text-[#085041] mb-3">
                Fields of interest
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                    style={{
                      backgroundColor: interests.includes(interest)
                        ? "#085041"
                        : "#EFEFEB",
                      color: interests.includes(interest)
                        ? "#ffffff"
                        : "#555555",
                      border: interests.includes(interest)
                        ? "none"
                        : "1.5px solid transparent",
                    }}
                  >
                    {interests.includes(interest) && (
                      <CheckCircle2 size={12} className="inline mr-1.5" />
                    )}
                    {interest}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#085041] mb-2">
                    Province
                  </p>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-[#EFEFEB] border-none rounded-xl px-4 py-3 text-sm font-semibold text-[#085041] focus:ring-2 ring-[#1D9E75]"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#085041] mb-2">
                    Funding
                  </p>
                  <select
                    value={funding}
                    onChange={(e) => setFunding(e.target.value)}
                    className="w-full bg-[#EFEFEB] border-none rounded-xl px-4 py-3 text-sm font-semibold text-[#085041] focus:ring-2 ring-[#1D9E75]"
                  >
                    <option>Bursary</option>
                    <option>Self-funded</option>
                    <option>NSFAS</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#085041] mb-2">
                    Institution type
                  </p>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full bg-[#EFEFEB] border-none rounded-xl px-4 py-3 text-sm font-semibold text-[#085041] focus:ring-2 ring-[#1D9E75]"
                  >
                    <option>University</option>
                    <option>TVET College</option>
                    <option>Private College</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border border-[#E8E7E3] text-[#085041] hover:border-[#085041] transition-all"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => {
                    setStep(3);
                    setIsAnalysing(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-base transition-all"
                  style={{
                    background: "linear-gradient(135deg, #1D9E75, #085041)",
                    color: "#ffffff",
                  }}
                >
                  <Zap size={18} /> Analyse my options
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Loading */}
        {step === 3 && (
          <div className="text-center py-20">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #085041, #1D9E75)",
              }}
            >
              <Zap size={40} color="#FAC775" />
            </div>
            <h2 className="text-2xl font-black text-[#085041] mb-3">
              {loadingMessages[loadingMessageIdx]}
            </h2>
            <p className="text-sm text-[#888] mb-8">
              Comparing against {26} institutions and 150+ bursaries...
            </p>
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: ["#1D9E75", "#FAC775", "#085041"][i],
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <style jsx global>
              {`
                @keyframes bounce {
                  0%, 100% {
                    transform: translateY(0);
                  }
                  50% {
                    transform: translateY(-10px);
                  }
                }
              `}
            </style>
          </div>
        )}

        {/* Step 4 — Results */}
        {step === 4 && (
          <div>
            {/* Results header */}
            <div
              className="rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              style={{
                background: "linear-gradient(135deg, #085041, #1D9E75)",
              }}
            >
              <div>
                <p className="text-[#9FE1CB] text-xs font-black uppercase tracking-widest mb-1">
                  Your Results
                </p>
                <h2 className="text-2xl font-black text-white mb-1">
                  APS Score: {apsTotal}
                </h2>
                <p className="text-[#9FE1CB] text-sm">
                  {interests.length > 0
                    ? `Matched to ${interests.slice(0, 2).join(", ")}`
                    : "All fields"}
                  {province ? ` · ${province}` : ""}
                </p>
              </div>
              <button className="flex items-center gap-2 bg-white/15 text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/20 hover:bg-white/25 transition-all">
                <Download size={16} /> Download Checklist
              </button>
            </div>

            {/* Matched courses */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-[#085041] text-white rounded-lg flex items-center justify-center">
                  <School size={18} />
                </div>
                <h3 className="text-lg font-black text-[#085041] uppercase tracking-wider">
                  Recommended Courses
                </h3>
              </div>
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec, idx) => (
                    <InstitutionCard key={idx} recommendation={rec} />
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-10 bg-white rounded-2xl"
                  style={{ border: "1.5px solid #E8E7E3" }}
                >
                  <p className="text-[#555] text-sm">
                    No matches found — try adjusting your subjects or interests.
                  </p>
                </div>
              )}
            </div>

            {/* Bursaries */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-[#FAC775] text-[#085041] rounded-lg flex items-center justify-center">
                  <Target size={18} />
                </div>
                <h3 className="text-lg font-black text-[#085041] uppercase tracking-wider">
                  Bursaries You Qualify For
                </h3>
              </div>
              {bursaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bursaries.map((bur, idx) => (
                    <BursaryCard key={idx} bursary={bur} />
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-10 bg-white rounded-2xl"
                  style={{ border: "1.5px solid #E8E7E3" }}
                >
                  <p className="text-[#555] text-sm">
                    No matching bursaries found for your APS and preferences.
                  </p>
                </div>
              )}
            </div>

            {/* Reset CTA */}
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "linear-gradient(135deg, #1D9E75, #085041)",
              }}
            >
              <p className="text-[#9FE1CB] text-sm font-bold mb-2">
                Want to explore more options?
              </p>
              <h4 className="text-xl font-black text-white mb-5">
                Adjust your inputs and see new matches
              </h4>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 bg-[#FAC775] text-[#085041] px-7 py-3.5 rounded-xl font-black text-sm hover:scale-105 transition-all"
              >
                <ChevronLeft size={16} /> Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
