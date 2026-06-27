import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import logoLight from "@/assets/ZenzeleGuide-Primary-Light.svg";
import logoDark from "@/assets/ZenzeleGuide-Primary-Dark.svg";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Zenzele Guide — home">
          <img src={logoLight} alt="Zenzele Guide" width={380} height={110} className="h-8 w-auto dark:hidden" />
          <img src={logoDark} alt="" aria-hidden="true" width={380} height={110} className="hidden h-8 w-auto dark:block" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="/#journeys" className="text-muted-foreground hover:text-foreground transition">Journeys</a>
          <a href="/universities" className="text-muted-foreground hover:text-foreground transition">Universities</a>
          <a href="/tvet-colleges" className="text-muted-foreground hover:text-foreground transition">TVETs</a>
          <a href="/bursaries" className="text-muted-foreground hover:text-foreground transition">Bursaries</a>
          <a href="/careers" className="text-muted-foreground hover:text-foreground transition">Careers</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/auth" className="hidden md:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition">Sign in</a>
          <a href="#journeys" className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">Start</a>
          <button className="md:hidden p-2 text-muted-foreground" aria-label="Menu"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
    </header>
  );
}
