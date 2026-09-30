import { Logo } from "@/components/site/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-[var(--brand-umhlaba)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo onDark />
          <p className="mt-3 text-sm text-white/70 max-w-sm">
            Do it yourself — but not alone. South Africa's free guidance platform for learners moving from Grade 10 to their first job.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><a href="/universities" className="hover:text-white">Universities</a></li>
            <li><a href="/tvet-colleges" className="hover:text-white">TVET colleges</a></li>
            <li><a href="/bursaries" className="hover:text-white">Bursaries</a></li>
            <li><a href="/careers" className="hover:text-white">Careers</a></li>
            <li><a href="/opportunities" className="hover:text-white">Learnerships &amp; internships</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">About</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><a href="/about" className="hover:text-white">Our mission</a></li>
            <li><a href="/privacy" className="hover:text-white">Privacy (POPIA)</a></li>
            <li><a href="/terms" className="hover:text-white">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Zenzele Guide. Proudly South African.</span>
          <span>Built for learners. Free, always.</span>
        </div>
      </div>
    </footer>
  );
}
