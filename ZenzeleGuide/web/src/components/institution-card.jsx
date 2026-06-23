import React from "react";
import { MapPin, ArrowUpRight, BookOpen, Clock } from "lucide-react";

const InstitutionCard = ({ recommendation }) => {
  const score = recommendation.match_score || 0;
  const scoreColor =
    score >= 80 ? "#1D9E75" : score >= 60 ? "#FAC775" : "#F87171";
  const scoreBg = score >= 80 ? "#E1F5EE" : score >= 60 ? "#FFF7E6" : "#FEF2F2";

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden group transition-all hover:-translate-y-0.5"
      style={{
        border: "1.5px solid #E8E7E3",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top bar with institution name */}
      <div className="bg-[#085041] px-5 py-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[#9FE1CB] text-[10px] font-black uppercase tracking-widest mb-0.5">
            {recommendation.institution_name || recommendation.short_name}
          </p>
          <h3 className="text-white font-black text-base leading-snug line-clamp-2 pr-2">
            {recommendation.course_name}
          </h3>
        </div>
        {/* Match score badge */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ml-3"
          style={{ backgroundColor: scoreBg }}
        >
          <span
            className="font-black text-xl leading-none"
            style={{ color: scoreColor }}
          >
            {score}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wide"
            style={{ color: scoreColor }}
          >
            match
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Reason */}
        {recommendation.reason && (
          <p className="text-sm text-[#555555] leading-relaxed mb-4 line-clamp-3 italic">
            "{recommendation.reason}"
          </p>
        )}

        {/* Meta tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {recommendation.short_name && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-[#EFEFEB] text-[#555555] px-2.5 py-1 rounded-full">
              <MapPin size={11} /> {recommendation.short_name}
            </span>
          )}
          {recommendation.aps_minimum && (
            <span className="flex items-center gap-1 text-xs font-bold bg-[#E1F5EE] text-[#085041] px-2.5 py-1 rounded-full">
              Min APS: {recommendation.aps_minimum}
            </span>
          )}
          {recommendation.duration_years && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-[#EFEFEB] text-[#555555] px-2.5 py-1 rounded-full">
              <Clock size={11} /> {recommendation.duration_years} years
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/portal/checklist?id=${recommendation.course_id}`}
            className="flex items-center justify-center gap-1.5 text-sm font-bold bg-[#E1F5EE] text-[#085041] py-2.5 rounded-xl hover:bg-[#1D9E75] hover:text-white transition-all"
          >
            <BookOpen size={14} /> Checklist
          </a>
          <a
            href="#"
            className="flex items-center justify-center gap-1.5 text-sm font-bold border border-[#E8E7E3] text-[#085041] py-2.5 rounded-xl hover:bg-[#085041] hover:text-white hover:border-[#085041] transition-all"
          >
            Website <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default InstitutionCard;
