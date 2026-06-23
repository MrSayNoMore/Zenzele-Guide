import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
  ADS_ENABLED,
  AD_NETWORK,
  ADSENSE_CLIENT,
  AD_FORMATS,
  isProtectedRoute,
} from "./ad-config";
import { useAdStore } from "./ad-store";

/**
 * Inject Google's AdSense loader script once, the first time a real ad unit
 * needs it. Kept here (not in the create.xyz-managed document head) so the
 * integration survives tooling that rewrites root files.
 */
function ensureAdSenseScript(client) {
  if (typeof document === "undefined" || !client) return;
  if (document.querySelector("script[data-adsense-loader]")) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  s.crossOrigin = "anonymous";
  s.setAttribute("data-adsense-loader", "true");
  document.head.appendChild(s);
}

/**
 * AdSlot — the only way ads enter the UI.
 *
 * Guarantees:
 *  • Never renders on a PROTECTED_ROUTE (APS flow, bursaries) or in focus mode.
 *  • Reserves its height up-front → zero layout shift when an ad loads.
 *  • Lazy-loads (IntersectionObserver) → doesn't slow the page or burn data
 *    until it's actually near the viewport. Important for SA mobile users.
 *  • Always carries an "Advertisement" label and is wrapped in <aside>.
 *  • No pop-ups, no interstitials, no autoplay — it can only sit in the page flow.
 */
export default function AdSlot({
  format = "rectangle",
  slotId,
  label = "Advertisement",
  className = "",
}) {
  const location = useLocation();
  const pathname = location?.pathname || "/";
  const focusMode = useAdStore((s) => s.focusMode);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  const fmt = AD_FORMATS[format] || AD_FORMATS.rectangle;
  const shouldRender =
    ADS_ENABLED && !isProtectedRoute(pathname) && !focusMode;

  // Lazy activation: only "load" the slot once it scrolls near the viewport.
  useEffect(() => {
    if (!shouldRender || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldRender]);

  // When using AdSense, load the script (once) and request a fill for this
  // unit as soon as it scrolls on screen.
  useEffect(() => {
    if (visible && AD_NETWORK === "adsense" && ADSENSE_CLIENT) {
      ensureAdSenseScript(ADSENSE_CLIENT);
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        /* AdSense not ready yet — safe to ignore */
      }
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <aside
      ref={ref}
      aria-label={label}
      className={`w-full overflow-hidden rounded-2xl border border-dashed border-[#E8E7E3] bg-white ${className}`}
      style={{ minHeight: fmt.minHeight }}
    >
      <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#B8B8B3]">
        {label}
      </p>
      <div
        className="flex items-center justify-center px-3 pb-3"
        style={{ minHeight: fmt.minHeight - 26 }}
      >
        {visible ? (
          AD_NETWORK === "adsense" && ADSENSE_CLIENT ? (
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: "100%" }}
              data-ad-client={ADSENSE_CLIENT}
              data-ad-slot={fmt.adsenseSlot || slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          ) : (
            // Placeholder until a real ad partner is wired (AD_NETWORK='adsense').
            <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xl bg-brand-cream py-6 text-center">
              <span className="text-sm font-bold text-[#9CA3AF]">Ad space</span>
              <span className="text-[11px] text-[#C4C4BF]">
                {fmt.label}
                {slotId ? ` · ${slotId}` : ""}
              </span>
            </div>
          )
        ) : null}
      </div>
    </aside>
  );
}
