export function BrandMark({
  className = "h-9 w-9",
  curve = "#085041",
}: {
  className?: string;
  curve?: string;
}) {
  return (
    <svg viewBox="2 2 28 26" className={className} fill="none" aria-hidden="true">
      <circle cx="11" cy="17" r="3.5" fill="#9FE1CB" />
      <circle cx="16" cy="9.2" r="4.5" fill="#FAC775" />
      <circle cx="21" cy="17" r="3.5" fill="#1D9E75" />
      <path
        d="M7.5 23.5 Q16 14.2 24.5 23.5"
        stroke={curve}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ onDark = false }: { onDark?: boolean }) {
  const text = onDark ? "#ffffff" : "#063c30";
  const accent = onDark ? "#9FE1CB" : "#1D9E75";
  const curve = onDark ? "#ffffff" : "#085041";
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark className="h-9 w-9 shrink-0" curve={curve} />
      <span
        className="text-[1.35rem] font-extrabold leading-none tracking-tight"
        style={{ color: text }}
      >
        Zenzele <span style={{ color: accent }}>Guide</span>
      </span>
    </span>
  );
}
