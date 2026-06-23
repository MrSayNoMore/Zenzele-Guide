import React from "react";

const SplitZLogo = ({ size = "md", showWordmark = false, light = false }) => {
  const sizes = {
    sm: { z: 28, wordmark: "text-base", guide: "text-xs" },
    md: { z: 38, wordmark: "text-xl", guide: "text-sm" },
    lg: { z: 54, wordmark: "text-3xl", guide: "text-xl" },
  };
  const s = sizes[size] || sizes.md;
  const deepColor = light ? "#FFFFFF" : "#085041";
  const greenColor = light ? "#9FE1CB" : "#1D9E75";
  const splitLine = light ? "#085041" : "#EFEFEB";
  const uid = `z-${size}-${light ? "l" : "d"}`;

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={s.z}
        height={s.z}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={`top-${uid}`}>
            <rect x="0" y="0" width="100" height="50" />
          </clipPath>
          <clipPath id={`bot-${uid}`}>
            <rect x="0" y="50" width="100" height="50" />
          </clipPath>
        </defs>
        {/* Z letterform clipped to top half — green */}
        <path
          d="M12 12 H88 V26 L32 74 H88 V88 H12 V74 L68 26 H12 Z"
          fill="#1D9E75"
          clipPath={`url(#top-${uid})`}
        />
        {/* Z letterform clipped to bottom half — gold */}
        <path
          d="M12 12 H88 V26 L32 74 H88 V88 H12 V74 L68 26 H12 Z"
          fill="#FAC775"
          clipPath={`url(#bot-${uid})`}
        />
        {/* Clean split line */}
        <rect x="0" y="47" width="100" height="6" fill={splitLine} />
      </svg>

      {showWordmark && (
        <div className="flex items-baseline gap-1 leading-none">
          <span
            className={`font-black ${s.wordmark}`}
            style={{ color: deepColor, letterSpacing: "-0.5px" }}
          >
            Zenzele
          </span>
          <span
            className={`font-extralight tracking-[0.18em] uppercase ${s.guide}`}
            style={{ color: greenColor }}
          >
            GUIDE
          </span>
        </div>
      )}
    </div>
  );
};

export default SplitZLogo;
