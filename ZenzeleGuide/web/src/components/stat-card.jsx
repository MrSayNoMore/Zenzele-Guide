import React from "react";

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "#1D9E75",
  suffix = "",
}) => {
  return (
    <div
      className="bg-white rounded-2xl p-6 flex flex-col gap-1 relative overflow-hidden group hover:-translate-y-0.5 transition-all"
      style={{
        border: "1.5px solid #E8E7E3",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: color }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
        style={{ backgroundColor: `${color}18` }}
      >
        {Icon && <Icon size={20} style={{ color }} />}
      </div>
      <h4
        className="text-3xl font-black leading-none mt-1"
        style={{ color: "#085041" }}
      >
        {value}
        {suffix}
      </h4>
      <p className="text-sm text-[#555555] font-medium mt-0.5">{label}</p>
    </div>
  );
};

export default StatCard;
