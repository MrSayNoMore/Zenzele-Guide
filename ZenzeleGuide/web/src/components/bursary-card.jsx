import React from "react";
import {
  Calendar,
  Award,
  ArrowUpRight,
  Flame,
  CheckCircle,
} from "lucide-react";

const BursaryCard = ({ bursary }) => {
  const closingDate = bursary.closing_date
    ? new Date(bursary.closing_date)
    : null;
  const now = new Date();
  const daysLeft = closingDate
    ? Math.ceil((closingDate - now) / (1000 * 60 * 60 * 24))
    : null;
  const isClosingSoon = daysLeft !== null && daysLeft <= 14 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col group transition-all hover:-translate-y-0.5"
      style={{
        border: "1.5px solid #E8E7E3",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Colored header */}
      <div
        className="px-6 pt-5 pb-4 relative"
        style={{
          background: bursary.is_nsfas
            ? "linear-gradient(135deg, #085041 0%, #1D9E75 100%)"
            : "linear-gradient(135deg, #1C1C1C 0%, #085041 100%)",
        }}
      >
        {isClosingSoon && !isExpired && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
            <Flame size={9} /> {daysLeft}d left
          </div>
        )}
        {bursary.is_nsfas && (
          <div className="absolute top-4 right-4 bg-[#FAC775] text-[#085041] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            NSFAS
          </div>
        )}
        <p className="text-[#9FE1CB] text-xs font-bold uppercase tracking-widest mb-1">
          {bursary.provider}
        </p>
        <h3 className="text-white font-black text-lg leading-snug line-clamp-2 pr-16">
          {bursary.name}
        </h3>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Amount */}
        <div className="bg-[#E1F5EE] rounded-xl px-4 py-2.5 mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1D9E75] mb-0.5">
            Covers
          </p>
          <p className="text-sm font-bold text-[#085041] leading-snug">
            {bursary.amount_description}
          </p>
        </div>

        {/* Fields of study */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(bursary.fields_of_study || []).slice(0, 3).map((field, idx) => (
            <span
              key={idx}
              className="text-[11px] font-semibold bg-[#EFEFEB] text-[#555555] px-2.5 py-1 rounded-full"
            >
              {field}
            </span>
          ))}
          {(bursary.fields_of_study || []).length > 3 && (
            <span className="text-[11px] font-bold text-[#1D9E75] px-2 py-1">
              +{bursary.fields_of_study.length - 3} more
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-[#555555]">
            <Award size={13} className="text-[#FAC775]" />
            Min APS:{" "}
            <strong className="text-[#085041]">
              {bursary.min_aps || "Any"}
            </strong>
          </span>
          {closingDate && !isExpired && (
            <span
              className={`flex items-center gap-1.5 font-semibold ${isClosingSoon ? "text-red-600" : "text-[#555555]"}`}
            >
              <Calendar size={13} />
              {closingDate.toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* CTA */}
        <a
          href={bursary.application_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#085041] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0c6b57] transition-all group-hover:shadow-lg group-hover:shadow-[#085041]/20"
        >
          Apply Now <ArrowUpRight size={15} />
        </a>
      </div>
    </div>
  );
};

export default BursaryCard;
