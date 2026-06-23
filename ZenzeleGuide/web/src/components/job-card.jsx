import React from "react";
import { MapPin, Clock, ArrowUpRight, Star } from "lucide-react";

const TYPE_COLORS = {
  internship: { bg: "#E1F5EE", text: "#085041", dot: "#1D9E75" },
  learnership: { bg: "#FFF7E6", text: "#7A4F00", dot: "#FAC775" },
  graduate: { bg: "#EEF2FF", text: "#3730A3", dot: "#6366F1" },
  fulltime: { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  bursary: { bg: "#FDF2F8", text: "#86198F", dot: "#D946EF" },
};

const JobCard = ({ job }) => {
  const isClosingSoon =
    job.closing_date &&
    new Date(job.closing_date) - new Date() < 7 * 24 * 60 * 60 * 1000;

  const typeStyle = TYPE_COLORS[job.type] || TYPE_COLORS.internship;
  const initial = (job.company || "?")[0].toUpperCase();
  const accentColor = job.is_featured ? "#FAC775" : "#1D9E75";

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col group transition-all hover:-translate-y-0.5"
      style={{
        border: "1.5px solid #E8E7E3",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        "&:hover": { boxShadow: "0 8px 24px rgba(8,80,65,0.10)" },
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Company avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0"
            style={{ backgroundColor: "#085041" }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#555555] mb-0.5 truncate">
                  {job.company}
                </p>
                <h3 className="font-black text-[#085041] leading-snug text-base line-clamp-2 group-hover:text-[#1D9E75] transition-colors">
                  {job.title}
                </h3>
              </div>
              {job.is_featured && (
                <span className="flex-shrink-0 flex items-center gap-1 bg-[#FAC775] text-[#085041] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Star size={9} fill="#085041" /> Featured
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Type badge + location */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
            style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: typeStyle.dot }}
            />
            {job.type}
          </span>
          <span className="flex items-center gap-1 text-xs text-[#555555]">
            <MapPin size={11} />
            {job.location || job.province}
          </span>
        </div>

        {/* Stipend */}
        {job.stipend && (
          <p className="text-sm font-black text-[#085041] mb-3">
            {job.stipend}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F3F2EF] mt-3">
          {job.closing_date ? (
            <span
              className={`text-xs font-semibold flex items-center gap-1 ${isClosingSoon ? "text-red-600" : "text-[#888]"}`}
            >
              <Clock size={11} />
              {isClosingSoon ? "Closing soon · " : ""}
              {new Date(job.closing_date).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
              })}
            </span>
          ) : (
            <span className="text-xs text-[#888]">Rolling applications</span>
          )}
          <a
            href={`/jobs/${job.id}`}
            className="flex items-center gap-1 text-xs font-bold text-[#1D9E75] hover:text-[#085041] transition-colors"
          >
            View <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
