import React from "react";
import AppLayout from "@/components/layout-wrapper";
import {
  School,
  GraduationCap,
  Briefcase,
  Users,
  ArrowRight,
  Zap,
  Target,
  BookOpen,
  MapPin,
  CheckCircle2,
  Star,
  ChevronRight,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function HomePage() {
  const stats = [
    {
      value: "26",
      label: "Universities indexed",
      icon: School,
      color: "#1D9E75",
    },
    {
      value: "150+",
      label: "Active bursaries",
      icon: GraduationCap,
      color: "#085041",
    },
    {
      value: "450+",
      label: "Jobs & learnerships",
      icon: Briefcase,
      color: "#FAC775",
    },
    { value: "12k+", label: "Students guided", icon: Users, color: "#9FE1CB" },
  ];

  const steps = [
    {
      num: "01",
      title: "Enter your marks",
      desc: "Enter your grade 11 or matric subject marks. Our calculator works out your APS score live.",
      color: "#1D9E75",
    },
    {
      num: "02",
      title: "Pick your interests",
      desc: "Select your study fields, preferred province, and funding needs.",
      color: "#085041",
    },
    {
      num: "03",
      title: "AI analyses",
      desc: "Our engine cross-references your APS against every institution's admission requirements.",
      color: "#FAC775",
    },
    {
      num: "04",
      title: "Get your matches",
      desc: "Receive a ranked list of courses, bursaries, and jobs matched to your profile.",
      color: "#1D9E75",
    },
  ];

  const testimonials = [
    {
      quote:
        "I had no idea I qualified for a Wits engineering programme. Zenzele showed me the requirements and helped me find a Sasol bursary that covered my fees.",
      name: "Thabo M.",
      location: "Soweto, Gauteng",
      rating: 5,
      initial: "T",
      bg: "#1D9E75",
    },
    {
      quote:
        "Found a Transnet learnership through the jobs board while I was still in Grade 12. The application process was straightforward and the guidance was spot on.",
      name: "Lerato N.",
      location: "Pretoria, Gauteng",
      rating: 5,
      initial: "L",
      bg: "#085041",
    },
  ];

  return (
    <AppLayout>
      {/* ── HERO ── */}
      <section className="relative bg-[#EFEFEB] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[88vh] items-center py-20">
            {/* Left copy */}
            <div className="pr-0 lg:pr-16 z-10">
              <div
                className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: "#E1F5EE", color: "#085041" }}
              >
                <Zap size={12} strokeWidth={2.5} />
                AI-powered guidance for SA students
              </div>

              <h1
                className="font-black leading-[1.05] mb-6"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                  color: "#085041",
                  letterSpacing: "-1px",
                }}
              >
                Find the right <span style={{ color: "#1D9E75" }}>varsity</span>
                , <span style={{ color: "#1D9E75" }}>bursary</span> and career
                path — instantly
              </h1>

              <p className="text-lg text-[#555555] leading-relaxed mb-8 max-w-xl">
                Enter your matric marks, tell us your interests, and our AI
                matches you with universities, bursaries and jobs that fit your
                APS score and goals.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <a
                  href="/portal"
                  className="inline-flex items-center justify-center gap-2 bg-[#085041] text-white px-7 py-4 rounded-xl font-bold text-base hover:bg-[#0c6b57] transition-all active:scale-95"
                  style={{ boxShadow: "0 4px 16px rgba(8,80,65,0.30)" }}
                >
                  Check my options <ArrowRight size={18} />
                </a>
                <a
                  href="/jobs"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#085041] px-7 py-4 rounded-xl font-bold text-base border border-[#E8E7E3] hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
                >
                  Browse jobs & bursaries
                </a>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["T", "L", "M", "S"].map((l, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-white"
                      style={{
                        backgroundColor: [
                          "#1D9E75",
                          "#085041",
                          "#FAC775",
                          "#1D9E75",
                        ][i],
                      }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#555555]">
                  <strong className="text-[#085041]">12,000+</strong> students
                  guided this year
                </p>
              </div>
            </div>

            {/* Right: mock dashboard card */}
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Big background Z */}
              <div
                className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
                style={{
                  fontSize: "40vw",
                  lineHeight: 1,
                  color: "#1D9E75",
                  opacity: 0.03,
                  fontWeight: 900,
                }}
              >
                Z
              </div>

              <div className="relative w-full max-w-md">
                {/* APS score card */}
                <div
                  className="bg-white rounded-3xl p-6 mb-4 relative"
                  style={{
                    border: "1.5px solid #E8E7E3",
                    boxShadow: "0 8px 40px rgba(8,80,65,0.12)",
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-[#1D9E75] mb-1">
                        Your APS Score
                      </p>
                      <h2 className="text-5xl font-black text-[#085041]">34</h2>
                    </div>
                    <div
                      className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #1D9E75, #085041)",
                      }}
                    >
                      <span className="text-white font-black text-2xl">A</span>
                      <span className="text-[#9FE1CB] text-[10px] font-bold uppercase tracking-wider">
                        Grade
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { subj: "Mathematics", mark: 78, aps: 5 },
                      { subj: "Physical Sciences", mark: 72, aps: 5 },
                      { subj: "English HL", mark: 65, aps: 4 },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 bg-[#EFEFEB] rounded-lg px-3 py-2 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[#085041]">
                            {r.subj}
                          </span>
                          <span className="text-xs font-black text-[#085041]">
                            {r.mark}%
                          </span>
                        </div>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                          style={{ backgroundColor: "#1D9E75" }}
                        >
                          {r.aps}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match results preview */}
                <div
                  className="bg-[#085041] rounded-2xl p-5"
                  style={{ boxShadow: "0 8px 30px rgba(8,80,65,0.20)" }}
                >
                  <p className="text-[#9FE1CB] text-xs font-black uppercase tracking-widest mb-4">
                    Top matches for you
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        name: "BSc Engineering",
                        uni: "Wits University",
                        score: 92,
                      },
                      {
                        name: "BEng (Civil)",
                        uni: "University of Pretoria",
                        score: 88,
                      },
                    ].map((m, i) => (
                      <div
                        key={i}
                        className="bg-white/10 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-bold text-sm">
                            {m.name}
                          </p>
                          <p className="text-[#9FE1CB] text-xs">{m.uni}</p>
                        </div>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                          style={{ backgroundColor: "#1D9E75" }}
                        >
                          {m.score}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#085041] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-[#085041] px-8 py-8 text-center hover:bg-[#0c6b57] transition-colors"
              >
                <p className="text-4xl font-black text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-[#9FE1CB] font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start gap-20">
            <div className="md:w-1/3 md:sticky md:top-28">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1D9E75] mb-3">
                How it works
              </p>
              <h2 className="text-4xl font-black text-[#085041] mb-6 leading-tight">
                Your path to varsity in 4 steps
              </h2>
              <p className="text-[#555555] leading-relaxed mb-8">
                From your matric marks to a personalised study-and-career plan —
                in under 3 minutes. No login, no forms, no guesswork.
              </p>
              <a
                href="/portal"
                className="inline-flex items-center gap-2 bg-[#1D9E75] text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-[#085041] transition-all"
              >
                Start now — free <ArrowRight size={16} />
              </a>
            </div>

            <div className="md:w-2/3 space-y-4">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-5 p-6 rounded-2xl bg-[#EFEFEB] hover:bg-[#E1F5EE] transition-colors group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-black text-[#085041] text-lg mb-1 group-hover:text-[#1D9E75] transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-[#555555] text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-[#EFEFEB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1D9E75] mb-3">
              Why Zenzele Guide
            </p>
            <h2 className="text-4xl font-black text-[#085041]">
              Everything you need in one place
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "APS-smart matching",
                desc: "We cross-reference your marks against the exact admission requirements from every major SA institution — so you only see courses you actually qualify for.",
                accent: "#1D9E75",
                bg: "#E1F5EE",
              },
              {
                icon: Briefcase,
                title: "Jobs & learnerships",
                desc: "University isn't the only path. Browse hundreds of paid internships, learnerships, and graduate programmes — sorted by province and qualification type.",
                accent: "#FAC775",
                bg: "#FFF7E6",
              },
              {
                icon: Shield,
                title: "Bursary matching",
                desc: "Our system filters bursaries by your APS, province, and field of study — so you only see funding you're eligible for. NSFAS guidance included.",
                accent: "#085041",
                bg: "#E1F5EE",
              },
              {
                icon: MapPin,
                title: "Accommodation near campus",
                desc: "Find student housing near your top-choice institutions — on-campus residences, private studios, and shared apartments.",
                accent: "#1D9E75",
                bg: "#E1F5EE",
              },
              {
                icon: BookOpen,
                title: "Step-by-step guides",
                desc: "Detailed guides on applying to NSFAS, calculating APS, appealing rejections, and navigating the entire application process.",
                accent: "#085041",
                bg: "#E1F5EE",
              },
              {
                icon: TrendingUp,
                title: "Track closing dates",
                desc: "We flag applications that close within 14 days so you never miss a deadline. Filter by urgency across jobs, bursaries, and university applications.",
                accent: "#FAC775",
                bg: "#FFF7E6",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 hover:-translate-y-1 transition-all group"
                style={{
                  border: "1.5px solid #E8E7E3",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon size={22} style={{ color: feature.accent }} />
                </div>
                <h3 className="font-black text-[#085041] text-lg mb-2 group-hover:text-[#1D9E75] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[#555555] text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-[#085041]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9FE1CB] mb-3">
              Student stories
            </p>
            <h2 className="text-4xl font-black text-white">
              Real students. Real results.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-8 flex flex-col justify-between"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div className="flex mb-4 gap-0.5">
                  {Array(t.rating)
                    .fill(0)
                    .map((_, j) => (
                      <Star key={j} size={14} fill="#FAC775" color="#FAC775" />
                    ))}
                </div>
                <p className="text-[#E1F5EE] text-lg leading-relaxed mb-8 flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0"
                    style={{
                      backgroundColor:
                        t.bg === "#085041" ? "#1D9E75" : "#085041",
                    }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">{t.name}</p>
                    <p className="text-[#9FE1CB] text-xs">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-24 bg-[#EFEFEB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="rounded-3xl px-8 py-16"
            style={{
              background: "linear-gradient(135deg, #085041 0%, #1D9E75 100%)",
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9FE1CB] mb-4">
              Do it yourself — but not alone
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Ready to find your path?
            </h2>
            <p className="text-[#9FE1CB] text-lg mb-10 max-w-xl mx-auto">
              Takes less than 3 minutes. No account needed. 100% free for South
              African students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/portal"
                className="inline-flex items-center justify-center gap-2 bg-[#FAC775] text-[#085041] px-8 py-4 rounded-xl font-black text-lg hover:scale-105 transition-all"
                style={{ boxShadow: "0 4px 20px rgba(250,199,117,0.40)" }}
              >
                Start now — it's free <ArrowRight size={20} />
              </a>
              <a
                href="/bursaries"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg border border-white/20 hover:bg-white/20 transition-all"
              >
                View all bursaries
              </a>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
